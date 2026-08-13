import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  APP_ORIGIN,
  OWNER_EMAIL,
  REPOSITORY_ROOT,
  applyFixtureSql,
  applyMigrationSql,
  copyPersistedD1,
  createCompiledWorker,
  readRepositoryFile,
  rows,
  sha256,
} from "./helpers/local-d1-upgrade.mjs";

const historicalMigration = "drizzle/0000_closed_talos.sql";
const storedCanonical = "https://legacy-person.example/presence";
const runtimeCanonical = "https://canonical.example/presence";
const draftTitleCanary = "POC_V0_DRAFT_TITLE_PRIVATE_CANARY";
const draftBodyCanary = "POC_V0_DRAFT_BODY_PRIVATE_CANARY";
const publishedTitle = "A preserved public update";
const publishedBodyCanary = "POC_V0_PUBLISHED_BODY_CANARY";

const expectedHashes = {
  "db/schema.ts": "8917fdac637f7a5ae4c96df0ecbed770ca881c218136e6067196fc3216bc1b67",
  [historicalMigration]: "95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a",
  "drizzle/meta/0000_snapshot.json":
    "566a668cac9d30925aa02c6d9d3ba4821436242a0fb8d054890b967369282334",
  "drizzle/meta/_journal.json":
    "c33aa2fa53879e7d2a40e046684823d58381c3c19524e9f3de2555d1c4726244",
};

test("an in-place POC upgrade preserves real D1 state, authorization, and public behavior", {
  timeout: 120_000,
}, async (t) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-upgrade-"));
  const statePath = path.join(temporaryRoot, "candidate-state");
  const backupPath = path.join(temporaryRoot, "pre-upgrade-backup");
  const authorizationBeforePath = path.join(temporaryRoot, "authorization-before");
  const authorizationAfterPath = path.join(temporaryRoot, "authorization-after");
  const liveWorkers = new Set();
  const openWorker = async (options) => {
    const result = await createCompiledWorker(options);
    liveWorkers.add(result);
    return result;
  };
  const closeWorker = async (result) => {
    liveWorkers.delete(result);
    await result.dispose();
  };

  t.after(async () => {
    await Promise.all([...liveWorkers].map((result) => result.dispose()));
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  await assertReviewedMigrationProvenance();

  let worker = await openWorker({
    persistPath: statePath,
    canonicalUrl: runtimeCanonical,
  });
  await applyMigrationSql(worker.db, await readRepositoryFile(historicalMigration));
  await applyFixtureSql(
    worker.db,
    await readRepositoryFile("tests/fixtures/poc-upgrade-v0.sql"),
  );

  const before = await captureDatabase(worker.db);
  assertFixtureState(before);
  const behaviorBefore = await captureConfiguredBehavior(worker, runtimeCanonical);
  await closeWorker(worker);
  await assertPhysicalSqliteIntegrity(statePath);

  // A local file copy is deliberately taken only after workerd closes the
  // database. It models a disposable pre-migration backup, not an atomic
  // hosted D1 backup or a general rollback mechanism.
  await copyPersistedD1(statePath, backupPath);

  worker = await openWorker({
    persistPath: statePath,
    canonicalUrl: runtimeCanonical,
  });
  for (const migration of await candidateTailMigrations()) {
    await applyMigrationSql(worker.db, await readRepositoryFile(migration));
  }

  const after = await captureDatabase(worker.db);
  assert.deepEqual(after, before);
  const behaviorAfter = await captureConfiguredBehavior(worker, runtimeCanonical);
  assert.deepEqual(behaviorAfter, behaviorBefore);
  await closeWorker(worker);
  await assertPhysicalSqliteIntegrity(statePath);

  await copyPersistedD1(backupPath, authorizationBeforePath);
  await copyPersistedD1(statePath, authorizationAfterPath);
  assert.deepEqual(
    await captureAuthorizationMatrix(
      authorizationAfterPath,
      openWorker,
      closeWorker,
    ),
    await captureAuthorizationMatrix(
      authorizationBeforePath,
      openWorker,
      closeWorker,
    ),
  );

  const restored = await openWorker({
    persistPath: backupPath,
    canonicalUrl: runtimeCanonical,
  });
  assert.deepEqual(await captureDatabase(restored.db), before);
  assert.deepEqual(
    await captureConfiguredBehavior(restored, runtimeCanonical),
    behaviorBefore,
  );
  await closeWorker(restored);
  await assertPhysicalSqliteIntegrity(backupPath);

  await proveStoredCanonicalFallback(backupPath, openWorker, closeWorker);
  await proveUnconfiguredAndUnavailableStates(temporaryRoot, openWorker, closeWorker);
});

async function assertReviewedMigrationProvenance() {
  for (const [relativePath, expected] of Object.entries(expectedHashes)) {
    assert.equal(await sha256(relativePath), expected, `${relativePath} must remain reviewed`);
  }

  const migrationNames = (await readdir(path.join(REPOSITORY_ROOT, "drizzle"), {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/u.test(entry.name))
    .map((entry) => `drizzle/${entry.name}`)
    .sort();
  assert.equal(migrationNames[0], historicalMigration);

  const sourceInventory = await relativeFileInventory(
    path.join(REPOSITORY_ROOT, "drizzle"),
  );
  const packagedInventory = await relativeFileInventory(
    path.join(REPOSITORY_ROOT, "dist/.openai/drizzle"),
  );
  assert.deepEqual(packagedInventory, sourceInventory);
  for (const relativePath of sourceInventory) {
    assert.equal(
      await sha256(`dist/.openai/drizzle/${relativePath}`),
      await sha256(`drizzle/${relativePath}`),
      `packaged migration ${relativePath} must match reviewed source`,
    );
  }
}

async function assertPhysicalSqliteIntegrity(persistPath) {
  const sqliteFiles = [];
  await collectFiles(persistPath, sqliteFiles, (name) => name.endsWith(".sqlite"));
  assert(sqliteFiles.length > 0, "Miniflare must persist at least one SQLite file");

  for (const sqliteFile of sqliteFiles.sort()) {
    const database = new DatabaseSync(sqliteFile, { readOnly: true });
    try {
      assert.equal(
        database.prepare("PRAGMA integrity_check").get().integrity_check,
        "ok",
        `${path.relative(persistPath, sqliteFile)} must pass SQLite integrity_check`,
      );
      assert.deepEqual(
        database.prepare("PRAGMA foreign_key_check").all(),
        [],
        `${path.relative(persistPath, sqliteFile)} must pass foreign_key_check`,
      );
    } finally {
      database.close();
    }
  }
}

async function relativeFileInventory(directory) {
  const files = [];
  await collectFiles(directory, files, () => true);
  return files.map((file) => path.relative(directory, file)).sort();
}

async function collectFiles(directory, output, include) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(absolutePath, output, include);
    } else if (entry.isFile() && include(entry.name)) {
      output.push(absolutePath);
    }
  }
}

async function candidateTailMigrations() {
  return (await readdir(path.join(REPOSITORY_ROOT, "drizzle"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/u.test(entry.name))
    .map((entry) => `drizzle/${entry.name}`)
    .sort()
    .slice(1);
}

async function captureDatabase(db) {
  return {
    schema: await rows(
      db,
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE type IN ('table', 'index')
         AND name NOT LIKE 'sqlite_%'
         AND name NOT LIKE '_cf_%'
       ORDER BY type ASC, name ASC`,
    ),
    profileColumns: await rows(db, "PRAGMA table_info(profiles)"),
    entryColumns: await rows(db, "PRAGMA table_info(entries)"),
    entryIndexes: await rows(db, "PRAGMA index_list(entries)"),
    counts: {
      profiles: await rows(db, "SELECT COUNT(*) AS count FROM profiles"),
      entries: await rows(db, "SELECT COUNT(*) AS count FROM entries"),
    },
    profiles: await rows(
      db,
      `SELECT id, display_name, account_type, short_description, introduction,
              location, website, external_links_json, canonical_url,
              accent_color, density, hide_powered_by, created_at, updated_at
       FROM profiles ORDER BY id ASC`,
    ),
    entries: await rows(
      db,
      `SELECT id, kind, title, body, destination_url, state, published_at,
              created_at, updated_at
       FROM entries ORDER BY id ASC`,
    ),
  };
}

function assertFixtureState(snapshot) {
  assert.deepEqual(snapshot.counts, {
    profiles: [{ count: 1 }],
    entries: [{ count: 2 }],
  });
  assert.equal(snapshot.profiles[0].account_type, "person");
  assert.equal(snapshot.profiles[0].canonical_url, storedCanonical);
  assert.equal(snapshot.profiles[0].accent_color, "#6a4b35");
  assert.equal(snapshot.profiles[0].density, "compact");
  assert.equal(snapshot.profiles[0].hide_powered_by, 1);
  assert.equal(snapshot.entries[0].id, "poc-v0-draft-private");
  assert.equal(snapshot.entries[0].state, "draft");
  assert.equal(snapshot.entries[0].published_at, null);
  assert.equal(snapshot.entries[1].id, "poc-v0-published-update");
  assert.equal(snapshot.entries[1].state, "published");
  assert.equal(snapshot.entries[1].destination_url, "https://legacy-person.example/resource");
  assert(
    snapshot.schema.some(
      ({ name, sql }) => name === "profiles" && sql.includes("profiles_singleton_check"),
    ),
  );
  assert(snapshot.entryIndexes.some(({ name }) => name === "idx_entries_public_order"));
  assert(snapshot.entryIndexes.some(({ name }) => name === "idx_entries_updated_at"));
}

async function captureConfiguredBehavior(worker, canonicalUrl) {
  const publicHome = await worker.fetch("https://hostile-request.example/");
  assert.equal(publicHome.status, 200);
  assert.equal(publicHome.headers.get("cache-control"), "no-store, must-revalidate");
  assert.match(publicHome.headers.get("content-type") ?? "", /^text\/html\b/iu);
  assertPublicHeadersHaveNoPrivateCanary(publicHome);
  const homeHtml = await publicHome.text();
  assert.match(homeHtml, /Legacy Person Presence/);
  assert.match(homeHtml, new RegExp(escapeRegExp(publishedTitle)));
  assert.match(homeHtml, new RegExp(publishedBodyCanary));
  assert.match(homeHtml, new RegExp(escapeRegExp(canonicalUrl)));
  assertPresenceMetadata(homeHtml, canonicalUrl);
  assertNoPrivatePublicCanary(homeHtml);
  assert.doesNotMatch(homeHtml, /Deploy AittaSocial from|@Sites/);
  assert.doesNotMatch(homeHtml, /hostile-request\.example/);

  const siteResponse = await worker.fetch("https://hostile-request.example/api/v1/site");
  assert.equal(siteResponse.status, 200);
  assert.equal(siteResponse.headers.get("cache-control"), "public, max-age=60");
  assertPublicHeadersHaveNoPrivateCanary(siteResponse);
  const site = await responseJson(siteResponse);
  assert.deepEqual(site, expectedSiteResource(canonicalUrl));
  assertNoPrivatePublicCanary(JSON.stringify(site));
  assert.doesNotMatch(JSON.stringify(site), /hostile-request/);

  const manifestResponse = await worker.fetch("/.well-known/aitta-social.json");
  assert.equal(manifestResponse.status, 200);
  assert.equal(manifestResponse.headers.get("cache-control"), "public, max-age=60");
  assertPublicHeadersHaveNoPrivateCanary(manifestResponse);
  const manifest = await responseJson(manifestResponse);
  assert.deepEqual(manifest, expectedManifest(canonicalUrl));
  assertNoPrivatePublicCanary(JSON.stringify(manifest));

  const collectionResponse = await worker.fetch("/api/v1/entries?page=1&pageSize=20");
  assert.equal(collectionResponse.status, 200);
  assert.equal(collectionResponse.headers.get("cache-control"), "public, max-age=30");
  assertPublicHeadersHaveNoPrivateCanary(collectionResponse);
  const collection = await responseJson(collectionResponse);
  assert.deepEqual(collection, expectedCollection(canonicalUrl));
  assertNoPrivatePublicCanary(JSON.stringify(collection));

  const publishedResponse = await worker.fetch(
    "/api/v1/entries/poc-v0-published-update",
  );
  assert.equal(publishedResponse.status, 200);
  assert.equal(publishedResponse.headers.get("cache-control"), "public, max-age=60");
  assertPublicHeadersHaveNoPrivateCanary(publishedResponse);
  const published = await responseJson(publishedResponse);
  assert.deepEqual(published, expectedEntryDetail(canonicalUrl));
  assertNoPrivatePublicCanary(JSON.stringify(published));

  const publishedHtmlResponse = await worker.fetch(
    "/entries/poc-v0-published-update",
    { headers: { accept: "text/html" } },
  );
  assert.equal(publishedHtmlResponse.status, 200);
  assert.equal(
    publishedHtmlResponse.headers.get("cache-control"),
    "no-store, must-revalidate",
  );
  assertPublicHeadersHaveNoPrivateCanary(publishedHtmlResponse);
  const publishedHtml = await publishedHtmlResponse.text();
  assert.match(publishedHtml, new RegExp(escapeRegExp(publishedTitle)));
  assert.match(
    publishedHtml,
    new RegExp(`${escapeRegExp(canonicalUrl)}/entries/poc-v0-published-update`),
  );
  assertPublishedMetadata(publishedHtml, canonicalUrl);
  assertNoPrivatePublicCanary(publishedHtml);

  const draftApiResponse = await worker.fetch("/api/v1/entries/poc-v0-draft-private");
  assert.equal(draftApiResponse.status, 404);
  assertPublicHeadersHaveNoPrivateCanary(draftApiResponse);
  const draftApi = await responseJson(draftApiResponse);
  const missingApiResponse = await worker.fetch("/api/v1/entries/not-present");
  assert.equal(missingApiResponse.status, 404);
  assertPublicHeadersHaveNoPrivateCanary(missingApiResponse);
  const missingApi = await responseJson(missingApiResponse);
  assert.deepEqual(draftApi, missingApi);
  assert.doesNotMatch(JSON.stringify(draftApi), new RegExp(`${draftTitleCanary}|${draftBodyCanary}`));

  const draftHtmlResponse = await worker.fetch("/entries/poc-v0-draft-private", {
    headers: { accept: "text/html" },
  });
  assert.equal(draftHtmlResponse.status, 404);
  assertPublicHeadersHaveNoPrivateCanary(draftHtmlResponse);
  const draftHtml = await draftHtmlResponse.text();
  const missingHtmlResponse = await worker.fetch("/entries/not-present", {
    headers: { accept: "text/html" },
  });
  assert.equal(missingHtmlResponse.status, 404);
  assertPublicHeadersHaveNoPrivateCanary(missingHtmlResponse);
  const missingHtml = await missingHtmlResponse.text();
  for (const html of [draftHtml, missingHtml]) {
    assert.match(html, /This update is not public/);
    assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/iu);
    assert.doesNotMatch(html, /<link rel="canonical"|property="og:url"/iu);
    assertNoPrivatePublicCanary(html);
  }
  assert.deepEqual(
    publicHtmlSnapshot(draftHtmlResponse, draftHtml, "poc-v0-draft-private"),
    publicHtmlSnapshot(missingHtmlResponse, missingHtml, "not-present"),
  );

  const ownerResponse = await worker.fetch("/owner", {
    headers: { accept: "text/html", ...identityHeaders(OWNER_EMAIL) },
  });
  assert.equal(ownerResponse.status, 200);
  const ownerHtml = await ownerResponse.text();
  assert.match(ownerHtml, new RegExp(escapeRegExp(draftTitleCanary)));
  assert.match(ownerHtml, new RegExp(escapeRegExp(publishedTitle)));

  const otherResponse = await worker.fetch("/owner", {
    headers: { accept: "text/html", ...identityHeaders("other@example.test") },
  });
  assert.equal(otherResponse.status, 200);
  const otherHtml = await otherResponse.text();
  assert.match(otherHtml, /not yours to administer/i);
  assert.doesNotMatch(otherHtml, new RegExp(`${draftTitleCanary}|${draftBodyCanary}`));

  return {
    home: {
      status: 200,
      profile: homeHtml.includes("Legacy Person Presence"),
    published: homeHtml.includes(publishedBodyCanary),
      draftAbsent: !homeHtml.includes(draftBodyCanary),
      promptAbsent: !homeHtml.includes("Deploy AittaSocial from"),
    },
    site,
    manifest,
    collection,
    published,
    draftApi,
    missingApi,
    publicPermalinkStatus: publishedHtmlResponse.status,
    draftPermalinkStatus: draftHtmlResponse.status,
    missingPermalinkStatus: missingHtmlResponse.status,
    ownerStatus: ownerResponse.status,
    otherStatus: otherResponse.status,
  };
}

function expectedSiteResource(canonicalUrl) {
  return {
    data: {
      id: "profile",
      type: "profile",
      attributes: {
        displayName: "Legacy Person Presence",
        accountType: "person",
        shortDescription: "A preserved deployment-owned profile.",
        introduction:
          "This introduction, presentation, and content must survive an in-place upgrade.",
        location: "Helsinki",
        website: "https://legacy-person.example/about",
        externalLinks: [
          { label: "Work", url: "https://legacy-person.example/work" },
          { label: "Contact", url: "https://legacy-person.example/contact" },
        ],
        canonicalUrl,
        presentation: {
          accentColor: "#6a4b35",
          density: "compact",
          showPoweredBy: false,
        },
      },
    },
    links: [
      { rel: "self", href: `${canonicalUrl}/api/v1/site`, mediaType: "application/json" },
      { rel: "profile", href: `${canonicalUrl}/api/v1/schema`, mediaType: "application/json" },
      { rel: "social.aitta.profile", href: canonicalUrl, mediaType: "text/html" },
    ],
    actions: [],
  };
}

function expectedManifest(canonicalUrl) {
  return {
    protocol: "aitta-social",
    protocolVersion: "1.0",
    software: { name: "AittaSocial", version: "0.1.0" },
    canonicalUrl,
    endpoints: {
      api: `${canonicalUrl}/api/v1`,
      profile: `${canonicalUrl}/api/v1/site`,
      entries: `${canonicalUrl}/api/v1/entries`,
      entryTemplate: `${canonicalUrl}/api/v1/entries/{id}`,
    },
    accountType: "person",
  };
}

function expectedPublicEntry(canonicalUrl) {
  return {
    id: "poc-v0-published-update",
    kind: "link",
    title: publishedTitle,
    body: publishedBodyCanary,
    destinationUrl: "https://legacy-person.example/resource",
    publishedAt: "2026-04-05T06:07:08.000Z",
    createdAt: "2026-04-04T05:06:07.000Z",
    updatedAt: "2026-04-06T07:08:09.000Z",
    links: {
      self: `${canonicalUrl}/api/v1/entries/poc-v0-published-update`,
      html: `${canonicalUrl}/entries/poc-v0-published-update`,
    },
  };
}

function expectedEntryDetail(canonicalUrl) {
  const entry = expectedPublicEntry(canonicalUrl);
  return {
    data: {
      id: entry.id,
      type: "entry",
      attributes: {
        kind: entry.kind,
        title: entry.title,
        body: entry.body,
        destinationUrl: entry.destinationUrl,
        publishedAt: entry.publishedAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    },
    links: [
      { rel: "self", href: entry.links.self, mediaType: "application/json" },
      { rel: "collection", href: `${canonicalUrl}/api/v1/entries`, mediaType: "application/json" },
      { rel: "profile", href: `${canonicalUrl}/api/v1/schema`, mediaType: "application/json" },
      { rel: "alternate", href: entry.links.html, mediaType: "text/html" },
    ],
    actions: [],
  };
}

function expectedCollection(canonicalUrl) {
  const entry = expectedPublicEntry(canonicalUrl);
  return {
    data: [{
      id: entry.id,
      type: "entry",
      attributes: {
        kind: entry.kind,
        title: entry.title,
        body: entry.body,
        destinationUrl: entry.destinationUrl,
        publishedAt: entry.publishedAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    }],
    pagination: { page: 1, pageSize: 20 },
    links: [
      { rel: "self", href: `${canonicalUrl}/api/v1/entries?page=1&pageSize=20`, mediaType: "application/json" },
      { rel: "first", href: `${canonicalUrl}/api/v1/entries?page=1&pageSize=20`, mediaType: "application/json" },
      { rel: "last", href: `${canonicalUrl}/api/v1/entries?page=1&pageSize=20`, mediaType: "application/json" },
      { rel: "item", href: `${canonicalUrl}/api/v1/entries/poc-v0-published-update`, mediaType: "application/json" },
      { rel: "profile", href: `${canonicalUrl}/api/v1/schema`, mediaType: "application/json" },
      { rel: "social.aitta.profile", href: `${canonicalUrl}/api/v1/site`, mediaType: "application/json" },
    ],
    actions: [],
  };
}

function assertPresenceMetadata(html, canonicalUrl) {
  assert.match(html, /<title>Legacy Person Presence<\/title>/iu);
  assert.match(
    html,
    /<meta name="description" content="A preserved deployment-owned profile\."\s*\/?>/iu,
  );
  assert.match(html, /<meta name="robots" content="index, follow"\s*\/?>/iu);
  assert.match(
    html,
    new RegExp(`<link rel="canonical" href="${escapeRegExp(canonicalUrl)}"\\s*\\/?>`, "iu"),
  );
  assert.match(
    html,
    new RegExp(`<meta property="og:url" content="${escapeRegExp(canonicalUrl)}"\\s*\\/?>`, "iu"),
  );
  assert.match(html, /<meta property="og:type" content="website"\s*\/?>/iu);
}

function assertPublishedMetadata(html, canonicalUrl) {
  const permalink = `${canonicalUrl}/entries/poc-v0-published-update`;
  assert.match(
    html,
    /<title>A preserved public update · Legacy Person Presence<\/title>/iu,
  );
  assert.match(
    html,
    new RegExp(`<meta name="description" content="${publishedBodyCanary}"\\s*\\/?>`, "iu"),
  );
  assert.match(html, /<meta name="robots" content="index, follow"\s*\/?>/iu);
  assert.match(
    html,
    new RegExp(`<link rel="canonical" href="${escapeRegExp(permalink)}"\\s*\\/?>`, "iu"),
  );
  assert.match(
    html,
    new RegExp(`<meta property="og:url" content="${escapeRegExp(permalink)}"\\s*\\/?>`, "iu"),
  );
  assert.match(html, /<meta property="og:type" content="website"\s*\/?>/iu);
  assert.doesNotMatch(html, /property="article:(?:published|modified)_time"/iu);
}

function assertNoPrivatePublicCanary(value) {
  assert.doesNotMatch(
    value,
    new RegExp(
      [draftTitleCanary, draftBodyCanary, OWNER_EMAIL]
        .map((item) => escapeRegExp(item))
        .join("|"),
      "iu",
    ),
  );
}

function assertPublicHeadersHaveNoPrivateCanary(response) {
  assertNoPrivatePublicCanary(
    JSON.stringify(Object.fromEntries(response.headers.entries())),
  );
}

function publicHtmlSnapshot(response, html, requestedId) {
  return {
    status: response.status,
    headers: {
      cacheControl: response.headers.get("cache-control"),
      contentType: response.headers.get("content-type"),
      location: response.headers.get("location"),
    },
    body: html.replaceAll(requestedId, "__REQUESTED_ENTRY_ID__"),
  };
}

async function captureAuthorizationMatrix(
  persistPath,
  openWorker,
  closeWorker,
) {
  let worker = await openWorker({ persistPath, canonicalUrl: runtimeCanonical });
  const initial = await captureDatabase(worker.db);

  const ownerPage = await worker.fetch("/owner", {
    headers: { accept: "text/html", ...identityHeaders(OWNER_EMAIL) },
  });
  assert.equal(ownerPage.status, 200);
  const ownerHtml = await ownerPage.text();
  assert.match(ownerHtml, new RegExp(escapeRegExp(draftTitleCanary)));
  assert.match(ownerHtml, new RegExp(escapeRegExp(publishedTitle)));

  const nonOwner = await worker.fetch("/api/private/profile", {
    method: "PUT",
    headers: mutationHeaders("other@example.test"),
    body: JSON.stringify(profileInput({ shortDescription: "Must not be saved." })),
  });
  assert.equal(nonOwner.status, 403);
  await consumeResponse(nonOwner);
  assert.deepEqual(await captureDatabase(worker.db), initial);

  const owner = await worker.fetch("/api/private/profile", {
    method: "PUT",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify(profileInput({ shortDescription: "Saved by the upgrade matrix." })),
  });
  assert.equal(owner.status, 204);
  await consumeResponse(owner);
  const profile = await rows(
    worker.db,
    "SELECT account_type, short_description FROM profiles WHERE id = 1",
  );
  assert.deepEqual(profile, [{
    account_type: "person",
    short_description: "Saved by the upgrade matrix.",
  }]);
  await closeWorker(worker);

  worker = await openWorker({
    persistPath,
    ownerEmail: null,
    canonicalUrl: runtimeCanonical,
  });
  const beforeMissingOwner = await captureDatabase(worker.db);
  const missingOwner = await worker.fetch("/api/private/profile", {
    method: "PUT",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify(profileInput({ shortDescription: "Must not be saved." })),
  });
  assert.equal(missingOwner.status, 503);
  const source = await missingOwner.text();
  assert.match(source, /not configured/i);
  assert.doesNotMatch(source, new RegExp(escapeRegExp(OWNER_EMAIL), "i"));
  assert.deepEqual(await captureDatabase(worker.db), beforeMissingOwner);

  const missingOwnerPage = await worker.fetch("/owner", {
    headers: { accept: "text/html", ...identityHeaders(OWNER_EMAIL) },
  });
  assert.equal(missingOwnerPage.status, 200);
  const missingOwnerHtml = await missingOwnerPage.text();
  assert.match(missingOwnerHtml, /Administration is safely disabled/i);
  assert.doesNotMatch(missingOwnerHtml, new RegExp(`${draftTitleCanary}|${draftBodyCanary}`));
  const final = await captureDatabase(worker.db);
  await closeWorker(worker);

  return {
    ownerPageStatus: ownerPage.status,
    nonOwnerStatus: nonOwner.status,
    ownerWriteStatus: owner.status,
    missingOwnerStatus: missingOwner.status,
    missingOwnerPageStatus: missingOwnerPage.status,
    final: stableAuthorizationState(final),
  };
}

function stableAuthorizationState(snapshot) {
  return {
    counts: snapshot.counts,
    profiles: snapshot.profiles.map((profile) =>
      Object.fromEntries(
        Object.entries(profile).filter(([key]) => key !== "updated_at"),
      )),
    entries: snapshot.entries,
  };
}

async function proveStoredCanonicalFallback(persistPath, openWorker, closeWorker) {
  const worker = await openWorker({ persistPath, canonicalUrl: null });
  const siteResponse = await worker.fetch("https://hostile-fallback.example/api/v1/site");
  assert.equal(siteResponse.status, 200);
  const site = await responseJson(siteResponse);
  assert.equal(site.data.attributes.canonicalUrl, storedCanonical);
  assert.equal(
    site.links.find(({ rel }) => rel === "social.aitta.profile")?.href,
    storedCanonical,
  );
  assert.doesNotMatch(JSON.stringify(site), /hostile-fallback/);

  const home = await worker.fetch("https://hostile-fallback.example/", {
    headers: { accept: "text/html" },
  });
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, new RegExp(escapeRegExp(storedCanonical)));
  assert.doesNotMatch(html, /hostile-fallback/);
  await closeWorker(worker);
}

async function proveUnconfiguredAndUnavailableStates(temporaryRoot, openWorker, closeWorker) {
  const migratedPath = path.join(temporaryRoot, "migrated-empty");
  const migrated = await openWorker({ persistPath: migratedPath });
  for (const migration of [historicalMigration, ...(await candidateTailMigrations())]) {
    await applyMigrationSql(migrated.db, await readRepositoryFile(migration));
  }
  const setupResponse = await migrated.fetch("/", { headers: { accept: "text/html" } });
  assert.equal(setupResponse.status, 200);
  const setupHtml = await setupResponse.text();
  assert.match(setupHtml, /@Sites/);
  assert.match(setupHtml, /Deploy AittaSocial from/);
  assert.match(setupHtml, /Set up your own Aitta/i);
  assert.match(setupHtml, /An Aitta is your independently controlled AittaSocial application/i);
  assert.match(setupHtml, /optional outward identity presentation/i);
  assert.match(setupHtml, /no current Hub connection/i);
  assert.match(setupHtml, /<meta name="robots" content="noindex, nofollow"/i);
  assert.doesNotMatch(setupHtml, /<link rel="canonical"|<meta property="og:url"/i);
  await closeWorker(migrated);

  const unavailable = await openWorker({
    persistPath: path.join(temporaryRoot, "unmigrated"),
  });
  const unavailableResponse = await unavailable.fetch("/", {
    headers: { accept: "text/html" },
  });
  assert.equal(unavailableResponse.status, 200);
  const unavailableHtml = await unavailableResponse.text();
  assert.match(unavailableHtml, /Aitta storage unavailable/i);
  assert.match(unavailableHtml, /This Aitta cannot be loaded right now/i);
  assert.match(unavailableHtml, /<title>Aitta unavailable<\/title>/i);
  assert.match(unavailableHtml, /<meta name="robots" content="noindex, nofollow"/i);
  assert.doesNotMatch(unavailableHtml, /Deploy AittaSocial from|@Sites/);
  assert.doesNotMatch(unavailableHtml, /<link rel="canonical"|<meta property="og:url"/i);
  await closeWorker(unavailable);
}

function identityHeaders(email) {
  return {
    "oai-authenticated-user-id": `user:${email}`,
    "oai-authenticated-user-email": email,
    "oai-authenticated-user-full-name": encodeURIComponent("Upgrade Test Owner"),
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  };
}

function mutationHeaders(email) {
  return {
    ...identityHeaders(email),
    origin: APP_ORIGIN,
    "content-type": "application/json",
  };
}

function profileInput(overrides = {}) {
  return {
    displayName: "Legacy Person Presence",
    shortDescription: "A preserved deployment-owned profile.",
    introduction:
      "This introduction, presentation, and content must survive an in-place upgrade.",
    location: "Helsinki",
    website: "https://legacy-person.example/about",
    externalLinks: [
      { label: "Work", url: "https://legacy-person.example/work" },
      { label: "Contact", url: "https://legacy-person.example/contact" },
    ],
    canonicalUrl: storedCanonical,
    accentColor: "#6a4b35",
    density: "compact",
    hidePoweredBy: true,
    ...overrides,
  };
}

async function responseJson(response) {
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  return JSON.parse(await response.text());
}

async function consumeResponse(response) {
  await response.text();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
