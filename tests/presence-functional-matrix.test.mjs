import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { Miniflare } from "miniflare";

import {
  APP_ORIGIN,
  D1_DATABASE_ID,
  D1_DATABASE_NAME,
  DIST_SERVER_ROOT,
  OWNER_EMAIL,
  REPOSITORY_ROOT,
  applyFixtureSql,
  applyMigrationSql,
  compiledWorkerModules,
  createCompiledWorker,
  readRepositoryFile,
  rows,
  sha256,
} from "./helpers/local-d1-upgrade.mjs";

const taskBaseCommit = "ac350fa6ac1acc3a61139b44b18e030f15f8aa53";
const candidateCanonical = "https://journey.example/presence";
const storedCanonical = "https://stored-journey.example/presence";
const historicalMigration = "drizzle/0000_closed_talos.sql";
const historicalFixture = "tests/fixtures/poc-upgrade-v0.sql";
const retiredHubOrigin = "https://retired-hub-outage.invalid";
const retiredHubCredentialCanary = "TASK060_RETIRED_HUB_CREDENTIAL_PRIVATE_CANARY";
const publicHubChallenge = "TASK060_PUBLIC_PROTOCOL_CHALLENGE";
const freshDraftCanary = "TASK060_FRESH_DRAFT_PRIVATE_CANARY";
const editedBody = "The edited update is durable and public only by explicit choice.";

const reviewedDigests = {
  "db/schema.ts": "8917fdac637f7a5ae4c96df0ecbed770ca881c218136e6067196fc3216bc1b67",
  [historicalMigration]:
    "95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a",
  [historicalFixture]:
    "bde6241fd75d84b729a0b84401ffe671df2e505fc7f42c6e23e7d4fbd5755ac9",
  "package-lock.json":
    "1fd75c48473016371545d02ae8599379031111e46fc960976fdc7e3cc18f3eb9",
};

test("TASK-060 provenance remains bound to the reviewed functional candidate", async () => {
  assert.match(taskBaseCommit, /^[0-9a-f]{40}$/u);
  for (const [relativePath, digest] of Object.entries(reviewedDigests)) {
    assert.equal(await sha256(relativePath), digest, `${relativePath} changed after review`);
  }

  const migrations = await migrationInventory();
  assert.equal(migrations[0], historicalMigration);
  assert(migrations.length > 0);
});

test("a fresh migrated presence completes the fork-free D1 functional journey", {
  timeout: 120_000,
}, async (t) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-task060-fresh-"));
  const persistPath = path.join(temporaryRoot, "fresh-d1");
  const liveWorkers = new Set();
  const openWorker = async (options = {}) => {
    const worker = await createCompiledWorker({
      persistPath,
      canonicalUrl: candidateCanonical,
      ...options,
    });
    liveWorkers.add(worker);
    return worker;
  };
  const closeWorker = async (worker) => {
    liveWorkers.delete(worker);
    await worker.dispose();
  };

  t.after(async () => {
    await Promise.all([...liveWorkers].map((worker) => worker.dispose()));
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  let worker = await openWorker();
  await applyCandidateMigrations(worker.db);
  assert.deepEqual(await tableCounts(worker.db), { profiles: 0, entries: 0 });

  const unconfiguredHome = await html(worker, "/");
  assertLeadingPrompt(unconfiguredHome);
  const freshOwner = await html(worker, "/owner", identityHeaders(OWNER_EMAIL));
  assert.match(freshOwner, /Complete your identity/i);
  assert.match(freshOwner, /href="\/owner\/profile"[^>]*>Set up identity/i);
  assertNativeAnchors(freshOwner, ["/owner", "/owner/profile", "/owner/entries/new", "/"]);
  assertNoRetiredHubSurface(freshOwner);

  const identity = {
    displayName: "Journey Field Notes",
    shortDescription: "One independently controlled test presence.",
    introduction: "This saved Identity and its restrained presentation survive every reload.",
    location: "Helsinki",
    website: "https://journey.example/about",
    externalLinks: [{ label: "Reference", url: "https://journey.example/reference" }],
    canonicalUrl: storedCanonical,
    accentColor: "#6a4b35",
    density: "compact",
    hidePoweredBy: true,
  };
  const saveIdentity = await worker.fetch("/api/private/profile", {
    method: "PUT",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify(identity),
  });
  assert.equal(saveIdentity.status, 204);
  assert.deepEqual(await rows(
    worker.db,
    `SELECT display_name, account_type, short_description, introduction,
            location, website, external_links_json, canonical_url,
            accent_color, density, hide_powered_by
     FROM profiles WHERE id = 1`,
  ), [{
    display_name: identity.displayName,
    account_type: "other",
    short_description: identity.shortDescription,
    introduction: identity.introduction,
    location: identity.location,
    website: identity.website,
    external_links_json: JSON.stringify(identity.externalLinks),
    canonical_url: storedCanonical,
    accent_color: identity.accentColor,
    density: identity.density,
    hide_powered_by: 1,
  }]);

  await closeWorker(worker);
  worker = await openWorker();
  const configuredHome = await html(worker, "/");
  assertConfiguredPresence(configuredHome);
  assertNoLeadingPrompt(configuredHome);
  const configuredOwner = await html(worker, "/owner", identityHeaders(OWNER_EMAIL));
  assert.match(configuredOwner, /Create your first update/i);
  assert.match(configuredOwner, /href="\/owner\/entries\/new"[^>]*>Create first draft/i);

  const createDraft = await worker.fetch("/api/private/entries", {
    method: "POST",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify({
      kind: "note",
      title: "A durable private draft",
      body: freshDraftCanary,
      destinationUrl: null,
    }),
  });
  assert.equal(createDraft.status, 201);
  const created = (await responseJson(createDraft)).data;
  assert.equal(created.state, "draft");
  assert.match(created.id, /^[0-9a-f-]{36}$/u);
  await assertEntryRow(worker.db, created.id, {
    kind: "note",
    title: "A durable private draft",
    body: freshDraftCanary,
    destination_url: null,
    state: "draft",
    published_at: null,
  });
  await assertPubliclyAbsent(worker, created.id, [freshDraftCanary]);

  await closeWorker(worker);
  worker = await openWorker();
  const resumedDraft = await html(worker, `/owner/entries/${created.id}`, identityHeaders(OWNER_EMAIL));
  assert.match(resumedDraft, /A durable private draft/i);
  assert.match(resumedDraft, new RegExp(freshDraftCanary));
  assertNativeAnchors(resumedDraft, ["/owner", "/owner/profile", "/owner/entries/new", "/"]);
  assertNoRetiredHubSurface(resumedDraft);

  const editDraft = await worker.fetch(`/api/private/entries/${created.id}`, {
    method: "PUT",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify({
      kind: "announcement",
      title: "A durable edited update",
      body: editedBody,
      destinationUrl: null,
    }),
  });
  assert.equal(editDraft.status, 200);
  assert.equal((await responseJson(editDraft)).data.state, "draft");
  await assertEntryRow(worker.db, created.id, {
    kind: "announcement",
    title: "A durable edited update",
    body: editedBody,
    destination_url: null,
    state: "draft",
    published_at: null,
  });

  const publish = await worker.fetch(`/api/private/entries/${created.id}/state`, {
    method: "PUT",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify({ state: "published" }),
  });
  assert.equal(publish.status, 200);
  assert.equal((await responseJson(publish)).data.state, "published");
  const publicHome = await html(worker, "/");
  assert.match(publicHome, /A durable edited update/i);
  assert.match(publicHome, new RegExp(escapeRegExp(editedBody)));
  assert.doesNotMatch(publicHome, new RegExp(freshDraftCanary));
  assertNativeAnchors(publicHome, ["#account", `/entries/${created.id}`]);
  const publicPermalink = await html(worker, `/entries/${created.id}`);
  assert.match(publicPermalink, /A durable edited update/i);
  assert.match(publicPermalink, new RegExp(escapeRegExp(editedBody)));

  await closeWorker(worker);
  worker = await openWorker();
  await assertEntryRow(worker.db, created.id, {
    kind: "announcement",
    title: "A durable edited update",
    body: editedBody,
    destination_url: null,
    state: "published",
    published_at: undefined,
  });
  assert.match(await html(worker, `/entries/${created.id}`), new RegExp(escapeRegExp(editedBody)));

  const unpublish = await worker.fetch(`/api/private/entries/${created.id}/state`, {
    method: "PUT",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify({ state: "draft" }),
  });
  assert.equal(unpublish.status, 200);
  assert.equal((await responseJson(unpublish)).data.state, "draft");
  await assertPubliclyAbsent(worker, created.id, [freshDraftCanary, editedBody]);

  await closeWorker(worker);
  worker = await openWorker();
  await assertEntryRow(worker.db, created.id, {
    kind: "announcement",
    title: "A durable edited update",
    body: editedBody,
    destination_url: null,
    state: "draft",
    published_at: undefined,
  });
  const remove = await worker.fetch(`/api/private/entries/${created.id}`, {
    method: "DELETE",
    headers: mutationHeaders(OWNER_EMAIL),
  });
  assert.equal(remove.status, 204);
  assert.deepEqual(await rows(worker.db, "SELECT id FROM entries WHERE id = ?", created.id), []);

  await closeWorker(worker);
  worker = await openWorker();
  assert.deepEqual(await tableCounts(worker.db), { profiles: 1, entries: 0 });
  assertConfiguredPresence(await html(worker, "/"));
  assertNoLeadingPrompt(await html(worker, "/"));
});

test("the hydrated upgrade stays populated, owner-confined, and independent of retired Hub inputs", {
  timeout: 120_000,
}, async (t) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-task060-upgraded-"));
  const persistPath = path.join(temporaryRoot, "upgraded-d1");
  const liveWorkers = new Set();
  const track = (worker) => {
    liveWorkers.add(worker);
    return worker;
  };
  const close = async (worker) => {
    liveWorkers.delete(worker);
    await worker.dispose();
  };

  t.after(async () => {
    await Promise.all([...liveWorkers].map((worker) => worker.dispose()));
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  let worker = track(await createCompiledWorker({
    persistPath,
    canonicalUrl: candidateCanonical,
  }));
  await applyMigrationSql(worker.db, await readRepositoryFile(historicalMigration));
  await applyFixtureSql(worker.db, await readRepositoryFile(historicalFixture));
  for (const migration of (await migrationInventory()).slice(1)) {
    await applyMigrationSql(worker.db, await readRepositoryFile(migration));
  }

  assert.deepEqual(await tableCounts(worker.db), { profiles: 1, entries: 2 });
  const upgradedHome = await html(worker, "/");
  assert.match(upgradedHome, /Legacy Person Presence/i);
  assert.match(upgradedHome, /A preserved public update/i);
  assert.doesNotMatch(upgradedHome, /POC_V0_DRAFT_(?:TITLE|BODY)_PRIVATE_CANARY/i);
  assertNoLeadingPrompt(upgradedHome);
  const ownerHome = await html(worker, "/owner", identityHeaders(OWNER_EMAIL));
  assert.match(ownerHome, /POC_V0_DRAFT_TITLE_PRIVATE_CANARY/i);
  assert.match(ownerHome, /A preserved public update/i);
  assertNativeAnchors(ownerHome, [
    "/owner",
    "/owner/profile",
    "/owner/entries/new",
    "/",
    "/owner/entries/poc-v0-draft-private",
    "/owner/entries/poc-v0-published-update",
  ]);
  assertNoRetiredHubSurface(ownerHome);
  const baseline = await contentSnapshot(worker.db);
  await close(worker);

  worker = track(await createCompiledWorker({
    persistPath,
    canonicalUrl: candidateCanonical,
  }));
  const nonOwnerPage = await html(worker, "/owner", identityHeaders("other@example.test"));
  assert.match(nonOwnerPage, /not yours to administer/i);
  assert.doesNotMatch(nonOwnerPage, /POC_V0_DRAFT_(?:TITLE|BODY)_PRIVATE_CANARY/i);
  const nonOwnerWrite = await worker.fetch("/api/private/profile", {
    method: "PUT",
    headers: mutationHeaders("other@example.test"),
    body: JSON.stringify(replacementIdentity()),
  });
  assert.equal(nonOwnerWrite.status, 403);
  assert.deepEqual(await contentSnapshot(worker.db), baseline);
  await close(worker);

  worker = track(await createCompiledWorker({
    persistPath,
    ownerEmail: null,
    canonicalUrl: candidateCanonical,
  }));
  const missingOwnerPage = await html(worker, "/owner", identityHeaders(OWNER_EMAIL));
  assert.match(missingOwnerPage, /Administration is safely disabled/i);
  assert.doesNotMatch(missingOwnerPage, /POC_V0_DRAFT_(?:TITLE|BODY)_PRIVATE_CANARY/i);
  const missingOwnerWrite = await worker.fetch("/api/private/profile", {
    method: "PUT",
    headers: mutationHeaders(OWNER_EMAIL),
    body: JSON.stringify(replacementIdentity()),
  });
  assert.equal(missingOwnerWrite.status, 503);
  assert.deepEqual(await contentSnapshot(worker.db), baseline);
  assert.match(await html(worker, "/"), /A preserved public update/i);
  await close(worker);

  worker = track(await createFunctionalWorker({
    persistPath,
    canonicalUrl: candidateCanonical,
  }));
  const beforeOutage = await contentSnapshot(worker.db);
  const [publicDuringOutage, siteDuringOutage, manifestDuringOutage, ownerDuringOutage] = await Promise.all([
    html(worker, "/"),
    worker.fetch("/api/v1/site"),
    worker.fetch("/.well-known/aitta-social.json"),
    html(worker, "/owner", identityHeaders(OWNER_EMAIL)),
  ]);
  assert.match(publicDuringOutage, /Legacy Person Presence/i);
  assert.equal(siteDuringOutage.status, 200);
  assert.equal(manifestDuringOutage.status, 200);
  assert.match(ownerDuringOutage, /Legacy Person Presence/i);
  assertNoProtectedHubValues(`${publicDuringOutage}\n${ownerDuringOutage}`);
  assert.doesNotMatch(await siteDuringOutage.text(), new RegExp(publicHubChallenge));
  assert.equal(
    (await responseJson(manifestDuringOutage)).hubVerificationChallenge,
    publicHubChallenge,
  );

  const retiredRouteRequests = [
    ["/owner/hub?destination=https%3A%2F%2Fattacker.example", "GET", identityHeaders(OWNER_EMAIL)],
    ["/api/private/hub/test?destination=https%3A%2F%2Fattacker.example", "POST", mutationHeaders(OWNER_EMAIL)],
    ["/api/private/hub/test?destination=https%3A%2F%2Fattacker.example", "POST", { origin: APP_ORIGIN, "content-type": "application/json" }],
  ];
  const retiredResponses = [];
  for (const [pathname, method, headers] of retiredRouteRequests) {
    const response = await worker.fetch(pathname, {
      method,
      headers,
      ...(method === "POST" ? { body: JSON.stringify({ destination: "https://attacker.example" }) } : {}),
    });
    retiredResponses.push({
      status: response.status,
      contentType: response.headers.get("content-type"),
      location: response.headers.get("location"),
      body: await response.text(),
    });
  }
  assert.deepEqual(retiredResponses.map(({ status }) => status), [404, 404, 404]);
  for (const projection of retiredResponses) {
    assert.equal(projection.location, null);
    assertNoProtectedHubValues(JSON.stringify(projection));
  }
  assert.deepEqual(retiredResponses[1], retiredResponses[2]);
  assert.equal(worker.outboundRequests.length, 0);
  assert.match(await html(worker, "/"), /A preserved public update/i);
  assert.equal((await worker.fetch("/api/v1/entries")).status, 200);
  assert.deepEqual(await contentSnapshot(worker.db), beforeOutage);
});

test("the setup prompt distinguishes an unconfigured Aitta from unavailable storage", {
  timeout: 120_000,
}, async (t) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-task060-prompt-"));
  const migratedPath = path.join(temporaryRoot, "migrated-empty");
  const unmigratedPath = path.join(temporaryRoot, "unmigrated");
  const liveWorkers = new Set();
  t.after(async () => {
    await Promise.all([...liveWorkers].map((worker) => worker.dispose()));
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  const migrated = await createCompiledWorker({
    persistPath: migratedPath,
    canonicalUrl: candidateCanonical,
  });
  liveWorkers.add(migrated);
  await applyCandidateMigrations(migrated.db);
  assertLeadingPrompt(await html(migrated, "/"));

  const unavailable = await createCompiledWorker({
    persistPath: unmigratedPath,
    canonicalUrl: candidateCanonical,
  });
  liveWorkers.add(unavailable);
  const unavailableHtml = await html(unavailable, "/");
  assert.match(unavailableHtml, /Aitta storage unavailable/i);
  assert.match(unavailableHtml, /This Aitta cannot be loaded right now/i);
  assertNoLeadingPrompt(unavailableHtml);
});

async function createFunctionalWorker({
  persistPath,
  ownerEmail = OWNER_EMAIL,
  canonicalUrl = candidateCanonical,
}) {
  const packagedConfig = JSON.parse(await readRepositoryFile("dist/server/wrangler.json"));
  const bindings = {
    AITTA_SOCIAL_OWNER_EMAIL: ownerEmail,
    AITTA_SOCIAL_CANONICAL_URL: canonicalUrl,
    AITTA_SOCIAL_HUB_CHALLENGE: publicHubChallenge,
    // Retired settings are hostile inert inputs, not supported configuration.
    AITTA_SOCIAL_HUB_URL: retiredHubOrigin,
    AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL: retiredHubCredentialCanary,
  };
  const outboundRequests = [];
  const miniflare = new Miniflare({
    modules: await compiledWorkerModules(),
    modulesRoot: DIST_SERVER_ROOT,
    compatibilityDate: packagedConfig.compatibility_date,
    compatibilityFlags: packagedConfig.compatibility_flags,
    bindings,
    d1Databases: { DB: D1_DATABASE_ID },
    d1Persist: persistPath,
    serviceBindings: {
      ASSETS: async () => new Response("Not found", { status: 404 }),
    },
    outboundService: async (request) => {
      outboundRequests.push({
        url: request.url,
        authorization: request.headers.get("authorization"),
      });
      return new Response("Deliberate local Hub outage fixture", { status: 503 });
    },
  });
  const db = await miniflare.getD1Database("DB");
  return {
    db,
    outboundRequests,
    fetch: (pathname, init = {}) =>
      miniflare.dispatchFetch(new URL(pathname, APP_ORIGIN), init),
    dispose: () => miniflare.dispose(),
  };
}

async function migrationInventory() {
  return (await readdir(path.join(REPOSITORY_ROOT, "drizzle"), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^\d+_.+\.sql$/u.test(entry.name))
    .map((entry) => `drizzle/${entry.name}`)
    .sort();
}

async function applyCandidateMigrations(db) {
  for (const migration of await migrationInventory()) {
    await applyMigrationSql(db, await readRepositoryFile(migration));
  }
}

async function tableCounts(db) {
  const [profiles, entries] = await Promise.all([
    rows(db, "SELECT COUNT(*) AS count FROM profiles"),
    rows(db, "SELECT COUNT(*) AS count FROM entries"),
  ]);
  return {
    profiles: profiles[0].count,
    entries: entries[0].count,
  };
}

async function contentSnapshot(db) {
  return {
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

async function assertEntryRow(db, id, expected) {
  const result = await rows(
    db,
    `SELECT kind, title, body, destination_url, state, published_at
     FROM entries WHERE id = ?`,
    id,
  );
  assert.equal(result.length, 1);
  for (const [key, value] of Object.entries(expected)) {
    if (key === "published_at" && value === undefined) {
      assert.match(result[0].published_at, /^\d{4}-\d{2}-\d{2}T/u);
    } else {
      assert.equal(result[0][key], value);
    }
  }
}

async function assertPubliclyAbsent(worker, id, canaries) {
  const [home, permalink, detail, collection] = await Promise.all([
    worker.fetch("/", { headers: { accept: "text/html" } }),
    worker.fetch(`/entries/${id}`, { headers: { accept: "text/html" } }),
    worker.fetch(`/api/v1/entries/${id}`),
    worker.fetch("/api/v1/entries"),
  ]);
  assert.equal(home.status, 200);
  assert.equal(permalink.status, 404);
  assert.equal(detail.status, 404);
  const source = [
    await home.text(),
    await permalink.text(),
    JSON.stringify(await responseJson(detail)),
    JSON.stringify(await responseJson(collection)),
  ].join("\n");
  for (const canary of canaries) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(canary), "iu"));
  }
}

async function html(worker, pathname, headers = {}) {
  const response = await worker.fetch(pathname, {
    headers: { accept: "text/html", ...headers },
  });
  assert.equal(response.status, 200, `${pathname} must render`);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/iu);
  return response.text();
}

async function responseJson(response) {
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  return JSON.parse(await response.text());
}

function assertLeadingPrompt(source) {
  assert.match(source, /Start with one prompt/i);
  assert.match(source, /Set up your own Aitta/i);
  assert.match(source, /An Aitta is your independently controlled AittaSocial application/i);
  assert.match(source, /optional outward identity presentation/i);
  assert.match(source, /no current Hub connection/i);
  assert.match(source, /Deploy AittaSocial from/i);
  assert.match(source, /@Sites/i);
}

function assertNoLeadingPrompt(source) {
  assert.doesNotMatch(source, /Start with one prompt|Set up your own Aitta|Deploy AittaSocial from|@Sites/i);
}

function assertConfiguredPresence(source) {
  assert.match(source, /Journey Field Notes/i);
  assert.match(source, /One independently controlled test presence/i);
  assert.match(source, /density-compact/i);
  assert.match(source, /--accent:#6a4b35/i);
  assert.doesNotMatch(source, /Powered by AittaSocial/i);
  assert.doesNotMatch(source, /owner@example\.test|TASK060_.*PRIVATE_CANARY/i);
}

function assertNativeAnchors(source, hrefs) {
  for (const href of hrefs) {
    assert.match(
      source,
      new RegExp(`<a[^>]+href="${escapeRegExp(href)}"`, "iu"),
      `${href} must be rendered as a native anchor`,
    );
  }
  assert.doesNotMatch(source, /next\/link|__nextRouter|data-nextjs-router/i);
}

function assertNoProtectedHubValues(source) {
  assert.doesNotMatch(
    source,
    new RegExp(`${escapeRegExp(retiredHubOrigin)}|${escapeRegExp(retiredHubCredentialCanary)}|${escapeRegExp(OWNER_EMAIL)}`, "iu"),
  );
}

function assertNoRetiredHubSurface(source) {
  assert.doesNotMatch(source, /\/owner\/hub|\/api\/private\/hub\/test|Provisional Hub setup|Hub probe/i);
}

function identityHeaders(email) {
  return {
    "oai-authenticated-user-id": `user:${email}`,
    "oai-authenticated-user-email": email,
    "oai-authenticated-user-full-name": encodeURIComponent("Task 060 Test Owner"),
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

function replacementIdentity() {
  return {
    displayName: "Unauthorized replacement",
    shortDescription: "This value must never be saved.",
    introduction: "This value must never replace the deployment-owned Identity.",
    location: null,
    website: null,
    externalLinks: [],
    canonicalUrl: storedCanonical,
    accentColor: "#31554d",
    density: "comfortable",
    hidePoweredBy: false,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

assert.equal(D1_DATABASE_NAME, "site-creator-d1");
