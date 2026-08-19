import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { Miniflare } from "miniflare";

import { escapeRegExp } from "./helpers/regular-expression-literal.mjs";
import { migrationInventory } from "./helpers/migration-inventory.mjs";

import {
  APP_ORIGIN,
  D1_DATABASE_ID,
  D1_DATABASE_NAME,
  DIST_SERVER_ROOT,
  REPOSITORY_ROOT,
  applyFixtureSql,
  applyMigrationSql,
  compiledWorkerModules,
  readRepositoryFile,
  sha256,
} from "./helpers/local-d1-upgrade.mjs";

const acceptedBase = "20082d06e20981cf1fc3954deca1e3f24d3c0690";
const historicalMigration = "drizzle/0000_closed_talos.sql";

const sourceDigests = {
  "db/schema.ts": "8917fdac637f7a5ae4c96df0ecbed770ca881c218136e6067196fc3216bc1b67",
  "docs/protocol.md": "810aeefedf93c0740a2a0a6e254794b90f6f38b813b2b2107e793339e7f20488",
  [historicalMigration]: "95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a",
  "package-lock.json": "822d92df7b5b294a7095c396ca2b1214ee0fb62161f3388720ab495dcf5bd5b5",
  "tests/fixtures/poc-upgrade-v0.sql":
    "bde6241fd75d84b729a0b84401ffe671df2e505fc7f42c6e23e7d4fbd5755ac9",
  "tests/helpers/local-d1-upgrade.mjs":
    "89e2fc30bfe9609ba4e77d0af7ccfafc320ccb782683cb32fab6e74a323e1bc5",
};

const ownerCanary = "owner-setting-private-canary@example.test";
const identityEmailCanary = "identity-email-private-canary@example.test";
const identityIdCanary = "IDENTITY_ID_PRIVATE_CANARY";
const identityNameCanary = "IDENTITY_NAME_PRIVATE_CANARY";
const credentialCanary = "DEPLOYMENT_CREDENTIAL_PRIVATE_CANARY";
const hubUrlCanary = "https://hub-setting-private-canary.example";
const profileCreatedCanary = "PROFILE_CREATED_ROW_PRIVATE_CANARY";
const profileUpdatedCanary = "PROFILE_UPDATED_ROW_PRIVATE_CANARY";
const draftTitleCanary = "POC_V0_DRAFT_TITLE_PRIVATE_CANARY";
const draftBodyCanary = "POC_V0_DRAFT_BODY_PRIVATE_CANARY";
const draftCreatedCanary = "DRAFT_CREATED_ROW_PRIVATE_CANARY";
const draftUpdatedCanary = "DRAFT_UPDATED_ROW_PRIVATE_CANARY";

const hostileRequestHost = "request-host-private-canary.example";
const hostileRequestOrigin = `https://${hostileRequestHost}`;
const hostileHost = "host-header-private-canary.example";
const hostileForwardedHost = "forwarded-host-private-canary.example";
const runtimeWithoutProfileHost = "RUNTIME-WITHOUT-PROFILE-PRIVATE-CANARY.example";
const runtimeWithoutProfile = `https://${runtimeWithoutProfileHost}///`;
const invalidStoredCanonical = "INVALID_STORED_CANONICAL_PRIVATE_CANARY";
const freshStoredCanonical = "https://fresh-stored-private-canary.example/presence";
const freshRuntimeCanonical = "https://FRESH-RUNTIME.example/presence///";
const freshCanonical = "https://fresh-runtime.example/presence";
const upgradedStoredCanonical = "https://LEGACY-PERSON.example/presence///";
const upgradedCanonical = "https://legacy-person.example/presence";

const publishedId = "poc-v0-published-update";
const draftId = "poc-v0-draft-private";
const unknownId = "not-present";
const publishedTitle = "A preserved public update";
const publishedBody = "POC_V0_PUBLISHED_BODY_CANARY";

const commonEntries = [
  {
    id: "matrix-newest",
    kind: "announcement",
    title: "Newest public announcement",
    body: "The newest bounded public update.",
    destinationUrl: null,
    state: "published",
    publishedAt: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-09-01T09:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "tie-charlie",
    kind: "article",
    title: "Charlie tie-break update",
    body: "Published at the shared tie-break timestamp.",
    destinationUrl: null,
    state: "published",
    publishedAt: "2026-08-01T10:00:00.000Z",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "tie-bravo",
    kind: "note",
    title: "Bravo tie-break update",
    body: "Published at the shared tie-break timestamp.",
    destinationUrl: null,
    state: "published",
    publishedAt: "2026-08-01T10:00:00.000Z",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "tie-alpha",
    kind: "link",
    title: "Alpha tie-break update",
    body: "Published at the shared tie-break timestamp.",
    destinationUrl: "https://public-destination.example/tie-alpha",
    state: "published",
    publishedAt: "2026-08-01T10:00:00.000Z",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: publishedId,
    kind: "link",
    title: publishedTitle,
    body: publishedBody,
    destinationUrl: "https://legacy-person.example/resource",
    state: "published",
    publishedAt: "2026-04-05T06:07:08.000Z",
    createdAt: "2026-04-04T05:06:07.000Z",
    updatedAt: "2026-04-06T07:08:09.000Z",
  },
  {
    id: "matrix-oldest",
    kind: "note",
    title: null,
    body: "Oldest public note",
    destinationUrl: null,
    state: "published",
    publishedAt: "2026-01-01T10:00:00.000Z",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  },
  {
    id: draftId,
    kind: "article",
    title: draftTitleCanary,
    body: draftBodyCanary,
    destinationUrl: null,
    state: "draft",
    publishedAt: null,
    createdAt: draftCreatedCanary,
    updatedAt: draftUpdatedCanary,
  },
];

const publishedOrder = [
  "matrix-newest",
  "tie-charlie",
  "tie-bravo",
  "tie-alpha",
  publishedId,
  "matrix-oldest",
];

const matrixCases = [
  {
    id: "fresh-configured",
    lineage: "fresh",
    readiness: "configured",
    runtimeCanonical: freshRuntimeCanonical,
    canonical: freshCanonical,
  },
  {
    id: "upgraded-configured",
    lineage: "upgraded",
    readiness: "configured",
    runtimeCanonical: null,
    canonical: upgradedCanonical,
  },
  {
    id: "fresh-profile-absent",
    lineage: "fresh",
    readiness: "profile-absent",
    runtimeCanonical: runtimeWithoutProfile,
    canonical: null,
  },
  {
    id: "upgraded-profile-absent",
    lineage: "upgraded",
    readiness: "profile-absent",
    runtimeCanonical: runtimeWithoutProfile,
    canonical: null,
  },
  {
    id: "fresh-canonical-absent",
    lineage: "fresh",
    readiness: "canonical-absent",
    runtimeCanonical: null,
    canonical: null,
  },
  {
    id: "upgraded-canonical-absent",
    lineage: "upgraded",
    readiness: "canonical-absent",
    runtimeCanonical: null,
    canonical: null,
  },
];

test("fresh and upgraded Sites expose only the exact public presence contract", {
  timeout: 180_000,
}, async (t) => {
  assert.match(acceptedBase, /^[0-9a-f]{40}$/u);
  await assertSourceProvenance();

  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-task136-"));
  const liveWorkers = new Set();

  t.after(async () => {
    await Promise.all([...liveWorkers].map((worker) => worker.dispose()));
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  for (const matrixCase of matrixCases) {
    await t.test(matrixCase.id, async () => {
      const worker = await createMatrixWorker({
        persistPath: path.join(temporaryRoot, matrixCase.id),
        canonicalUrl: matrixCase.runtimeCanonical,
      });
      liveWorkers.add(worker);
      await prepareFixture(worker.db, matrixCase);

      await assertPublicMatrix(worker, matrixCase);

      liveWorkers.delete(worker);
      await worker.dispose();
    });
  }
});

async function assertSourceProvenance() {
  for (const [relativePath, digest] of Object.entries(sourceDigests)) {
    assert.equal(await sha256(relativePath), digest, `${relativePath} must remain reviewed`);
  }

  const migrations = await migrationInventory(REPOSITORY_ROOT);
  assert.deepEqual(migrations, [historicalMigration]);
}

async function createMatrixWorker({ persistPath, canonicalUrl }) {
  const packagedConfig = JSON.parse(
    await readRepositoryFile("dist/server/wrangler.json"),
  );
  assert.equal(packagedConfig.main, "index.js");
  assert.deepEqual(packagedConfig.d1_databases, [
    {
      binding: "DB",
      database_name: D1_DATABASE_NAME,
      database_id: D1_DATABASE_ID,
    },
  ]);

  const bindings = {
    AITTA_SOCIAL_OWNER_EMAIL: ownerCanary,
    AITTA_SOCIAL_HUB_URL: hubUrlCanary,
    AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL: credentialCanary,
  };
  if (canonicalUrl !== null) bindings.AITTA_SOCIAL_CANONICAL_URL = canonicalUrl;

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
  });

  return {
    db: await miniflare.getD1Database("DB"),
    fetch: (pathname, init = {}) =>
      miniflare.dispatchFetch(new URL(pathname, APP_ORIGIN), init),
    dispose: () => miniflare.dispose(),
  };
}

async function prepareFixture(db, matrixCase) {
  const migrations = await migrationInventory(REPOSITORY_ROOT);
  if (matrixCase.lineage === "fresh") {
    for (const migration of migrations) {
      await applyMigrationSql(db, await readRepositoryFile(migration));
    }
    await insertFreshProfile(db);
    await insertEntries(db, commonEntries);
  } else {
    await applyMigrationSql(db, await readRepositoryFile(historicalMigration));
    await applyFixtureSql(
      db,
      await readRepositoryFile("tests/fixtures/poc-upgrade-v0.sql"),
    );
    for (const migration of migrations.slice(1)) {
      await applyMigrationSql(db, await readRepositoryFile(migration));
    }
    await db.prepare(`UPDATE profiles
      SET canonical_url = ?, created_at = ?, updated_at = ?
      WHERE id = 1`)
      .bind(upgradedStoredCanonical, profileCreatedCanary, profileUpdatedCanary)
      .run();
    await db.prepare(`UPDATE entries
      SET created_at = ?, updated_at = ?
      WHERE id = ?`)
      .bind(draftCreatedCanary, draftUpdatedCanary, draftId)
      .run();
    await insertEntries(
      db,
      commonEntries.filter(({ id }) => id !== publishedId && id !== draftId),
    );
  }

  if (matrixCase.readiness === "profile-absent") {
    await db.prepare("DELETE FROM profiles WHERE id = ?").bind(1).run();
  } else if (matrixCase.readiness === "canonical-absent") {
    await db.prepare("UPDATE profiles SET canonical_url = ? WHERE id = ?")
      .bind(invalidStoredCanonical, 1)
      .run();
  }
}

async function insertFreshProfile(db) {
  const result = await db.prepare(`INSERT INTO profiles (
      id, display_name, account_type, short_description, introduction, location,
      website, external_links_json, canonical_url, accent_color, density,
      hide_powered_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      1,
      "Fresh Public Presence",
      "other",
      "A fresh deployment-owned public profile.",
      "A fresh presence used to prove the current public contract.",
      "Tampere",
      "https://fresh-public.example/about",
      JSON.stringify([
        { label: "Documentation", url: "https://fresh-public.example/docs" },
        { label: "Contact", url: "https://fresh-public.example/contact" },
      ]),
      freshStoredCanonical,
      "#31554d",
      "comfortable",
      0,
      profileCreatedCanary,
      profileUpdatedCanary,
    )
    .run();
  assert.equal(result.success, true);
}

async function insertEntries(db, entries) {
  const results = await db.batch(entries.map((entry) =>
    db.prepare(`INSERT INTO entries (
        id, kind, title, body, destination_url, state, published_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        entry.id,
        entry.kind,
        entry.title,
        entry.body,
        entry.destinationUrl,
        entry.state,
        entry.publishedAt,
        entry.createdAt,
        entry.updatedAt,
      )));
  assert.equal(results.length, entries.length);
  for (const result of results) assert.equal(result.success, true);
}

async function assertPublicMatrix(worker, matrixCase) {
  const expectedProfile = profileFor(matrixCase.lineage);
  const home = await observeHtml(worker, "/");
  assertHtmlHeaders(home, 200);
  assertHomeHtml(home.body, matrixCase, expectedProfile);

  const publishedPermalink = await observeHtml(worker, `/entries/${publishedId}`);
  assertHtmlHeaders(publishedPermalink, 200);
  assertPublishedPermalink(
    publishedPermalink.body,
    matrixCase,
    expectedProfile,
  );

  const draftPermalink = await observeHtml(worker, `/entries/${draftId}`);
  const unknownPermalink = await observeHtml(worker, `/entries/${unknownId}`);
  assertUnavailablePermalinks(draftPermalink, unknownPermalink);

  const setupError = setupErrorFor(matrixCase.readiness);
  const manifest = await observeJson(worker, "/.well-known/aitta-social.json");
  const site = await observeJson(worker, "/api/v1/site");

  if (setupError) {
    assertJson(manifest, setupError);
    assertJson(site, profileSetupError(setupError));
  } else {
    assertJson(manifest, {
      status: 200,
      cacheControl: "public, max-age=60",
      body: expectedManifest(matrixCase.canonical, expectedProfile.accountType),
    });
    assertJson(site, {
      status: 200,
      cacheControl: "public, max-age=60",
      body: expectedSite(matrixCase.canonical, expectedProfile),
    });
  }

  await assertCollectionPages(worker, matrixCase, setupError);
  await assertEntryDetails(worker, matrixCase, setupError);
}

async function assertCollectionPages(worker, matrixCase, setupError) {
  const observations = [];
  for (const page of [1, 2, 3, 4]) {
    observations.push(await observeJson(
      worker,
      `/api/v1/entries?page=${page}&pageSize=2`,
    ));
  }
  const repeatedFirst = await observeJson(
    worker,
    "/api/v1/entries?page=1&pageSize=2",
  );

  if (setupError) {
    for (const observation of [...observations, repeatedFirst]) {
      assertJson(observation, profileSetupError(setupError));
    }
  } else {
    for (const [index, observation] of observations.entries()) {
      assertJson(observation, {
        status: 200,
        cacheControl: "public, max-age=30",
        body: expectedCollectionPage(matrixCase.canonical, index + 1, 2),
      });
    }
    assert.deepEqual(repeatedFirst, observations[0]);
  }

  const invalid = await observeJson(worker, "/api/v1/entries?page=0&pageSize=2");
  assertJson(invalid, {
    status: 400,
    cacheControl: "no-store",
    body: {
      data: null,
      error: {
        code: "invalid_pagination",
        message: "page must be at least 1 and pageSize must be between 1 and 50.",
      },
      links: [],
    },
  });
}

async function assertEntryDetails(worker, matrixCase, setupError) {
  const published = await observeJson(worker, `/api/v1/entries/${publishedId}`);
  const draft = await observeJson(worker, `/api/v1/entries/${draftId}`);
  const unknown = await observeJson(worker, `/api/v1/entries/${unknownId}`);

  if (setupError) {
    for (const observation of [published, draft, unknown]) {
      assertJson(observation, profileSetupError(setupError));
    }
  } else {
    assertJson(published, {
      status: 200,
      cacheControl: "public, max-age=60",
      body: expectedEntryDetail(entryById(publishedId), matrixCase.canonical),
    });
    const notFound = {
      status: 404,
      cacheControl: "no-store",
      body: {
        data: null,
        error: {
          code: "entry_not_found",
          message: "Published entry not found.",
        },
        links: [],
      },
    };
    assertJson(draft, notFound);
    assertJson(unknown, notFound);
    assert.deepEqual(draft, unknown);
  }
}

function assertHomeHtml(html, matrixCase, profile) {
  assertPublishedHtmlOrder(html);
  assert.match(html, new RegExp(escapeRegExp(publishedTitle), "u"));
  assert.doesNotMatch(html, new RegExp(`${draftTitleCanary}|${draftBodyCanary}`, "u"));

  if (matrixCase.readiness === "profile-absent") {
    assert.match(html, /<title>Aitta setup in progress<\/title>/iu);
    assert.match(
      html,
      /<meta name="description" content="This Aitta(?:&#x27;|&apos;|')s optional outward profile is not configured yet\."\s*\/?>/iu,
    );
    assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/iu);
    assert.match(html, /Set up your own Aitta/iu);
    assert.match(html, /An Aitta is your independently controlled AittaSocial application/iu);
    assert.match(html, /optional outward identity presentation/iu);
    assert.match(html, /no current Hub connection/iu);
    assertNoCanonicalMetadata(html);
    return;
  }

  assert.match(html, new RegExp(`<title>${escapeRegExp(profile.displayName)}</title>`, "iu"));
  assert.match(
    html,
    new RegExp(
      `<meta name="description" content="${escapeRegExp(profile.shortDescription)}"\\s*\\/?>`,
      "iu",
    ),
  );

  if (matrixCase.readiness === "configured") {
    assert.match(html, /<meta name="robots" content="index, follow"\s*\/?>/iu);
    assertCanonicalMetadata(html, matrixCase.canonical);
  } else {
    assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/iu);
    assertNoCanonicalMetadata(html);
  }
}

function assertPublishedPermalink(html, matrixCase, profile) {
  const presenceTitle = matrixCase.readiness === "profile-absent"
    ? "Independent Aitta"
    : profile.displayName;
  assert.match(
    html,
    new RegExp(
      `<title>${escapeRegExp(publishedTitle)} · ${escapeRegExp(presenceTitle)}</title>`,
      "iu",
    ),
  );
  assert.match(
    html,
    new RegExp(`<meta name="description" content="${publishedBody}"\\s*\\/?>`, "iu"),
  );
  assert.match(html, new RegExp(escapeRegExp(publishedTitle), "u"));
  assert.match(html, new RegExp(escapeRegExp(publishedBody), "u"));

  if (matrixCase.readiness === "configured") {
    assert.match(html, /<meta name="robots" content="index, follow"\s*\/?>/iu);
    assertCanonicalMetadata(html, `${matrixCase.canonical}/entries/${publishedId}`);
  } else {
    assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/iu);
    assertNoCanonicalMetadata(html);
  }
}

function assertUnavailablePermalinks(draft, unknown) {
  assertHtmlHeaders(draft, 404);
  assertHtmlHeaders(unknown, 404);
  for (const observation of [draft, unknown]) {
    assert.match(observation.body, /<title>Independent Aitta<\/title>/iu);
    assert.match(
      observation.body,
      /<meta name="description" content="An independently controlled AittaSocial app\."\s*\/?>/iu,
    );
    assert.match(observation.body, /<meta name="robots" content="noindex, nofollow"\s*\/?>/iu);
    assert.match(observation.body, /This update is not public/iu);
    assert.match(observation.body, />Return to Aitta<\/a>/iu);
    assertNoCanonicalMetadata(observation.body);
  }
  assert.deepEqual(draft.headers, unknown.headers);
  assert.equal(
    normalizeUnavailableHtml(draft.body, draftId),
    normalizeUnavailableHtml(unknown.body, unknownId),
  );
}

function normalizeUnavailableHtml(html, requestedId) {
  return html
    .replaceAll(encodeURIComponent(requestedId), "__REQUESTED_ENTRY_ID__")
    .replaceAll(requestedId, "__REQUESTED_ENTRY_ID__");
}

function assertPublishedHtmlOrder(html) {
  const labels = publishedOrder.map((id) => {
    const entry = entryById(id);
    return entry.title ?? entry.body;
  });
  let previous = -1;
  for (const label of labels) {
    const index = html.indexOf(label, previous + 1);
    assert(index > previous, `${label} must follow the previous published update`);
    previous = index;
  }
}

function assertCanonicalMetadata(html, canonicalUrl) {
  assert.match(
    html,
    new RegExp(`<link rel="canonical" href="${escapeRegExp(canonicalUrl)}"\\s*\\/?>`, "iu"),
  );
  assert.match(
    html,
    new RegExp(`<meta property="og:url" content="${escapeRegExp(canonicalUrl)}"\\s*\\/?>`, "iu"),
  );
}

function assertNoCanonicalMetadata(html) {
  assert.doesNotMatch(html, /<link rel="canonical"|<meta property="og:url"/iu);
}

function profileFor(lineage) {
  return lineage === "fresh"
    ? {
        displayName: "Fresh Public Presence",
        accountType: "other",
        shortDescription: "A fresh deployment-owned public profile.",
        introduction: "A fresh presence used to prove the current public contract.",
        location: "Tampere",
        website: "https://fresh-public.example/about",
        externalLinks: [
          { label: "Documentation", url: "https://fresh-public.example/docs" },
          { label: "Contact", url: "https://fresh-public.example/contact" },
        ],
        presentation: {
          accentColor: "#31554d",
          density: "comfortable",
          showPoweredBy: true,
        },
      }
    : {
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
        presentation: {
          accentColor: "#6a4b35",
          density: "compact",
          showPoweredBy: false,
        },
      };
}

function expectedManifest(canonicalUrl, accountType) {
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
    accountType,
  };
}

function expectedSite(canonicalUrl, profile) {
  return {
    data: {
      id: "profile",
      type: "profile",
      attributes: {
        displayName: profile.displayName,
        accountType: profile.accountType,
        shortDescription: profile.shortDescription,
        introduction: profile.introduction,
        location: profile.location,
        website: profile.website,
        externalLinks: profile.externalLinks,
        canonicalUrl,
        presentation: profile.presentation,
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

function expectedCollectionPage(canonicalUrl, page, pageSize) {
  const offset = (page - 1) * pageSize;
  const pageIds = publishedOrder.slice(offset, offset + pageSize);
  const lastPage = Math.max(1, Math.ceil(publishedOrder.length / pageSize));
  const collection = `${canonicalUrl}/api/v1/entries`;
  const pageUrl = (targetPage) =>
    `${collection}?page=${targetPage}&pageSize=${pageSize}`;
  return {
    data: pageIds.map((id) => expectedV1EntryResource(entryById(id))),
    pagination: { page, pageSize },
    links: [
      { rel: "self", href: pageUrl(page), mediaType: "application/json" },
      { rel: "first", href: pageUrl(1), mediaType: "application/json" },
      ...(page > 1
        ? [{ rel: "previous", href: pageUrl(page - 1), mediaType: "application/json" }]
        : []),
      ...(page < lastPage
        ? [{ rel: "next", href: pageUrl(page + 1), mediaType: "application/json" }]
        : []),
      { rel: "last", href: pageUrl(lastPage), mediaType: "application/json" },
      ...pageIds.map((id) => ({
        rel: "item",
        href: `${collection}/${encodeURIComponent(id)}`,
        mediaType: "application/json",
      })),
      { rel: "profile", href: `${canonicalUrl}/api/v1/schema`, mediaType: "application/json" },
      { rel: "social.aitta.profile", href: `${canonicalUrl}/api/v1/site`, mediaType: "application/json" },
    ],
    actions: [],
  };
}

function expectedV1EntryResource(entry) {
  return {
    id: entry.id,
    type: "entry",
    attributes: {
      kind: entry.kind,
      ...(entry.title ? { title: entry.title } : {}),
      body: entry.body,
      ...(entry.destinationUrl ? { destinationUrl: entry.destinationUrl } : {}),
      ...(entry.publishedAt ? { publishedAt: entry.publishedAt } : {}),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    },
  };
}

function expectedEntryDetail(entry, canonicalUrl) {
  const encodedId = encodeURIComponent(entry.id);
  return {
    data: expectedV1EntryResource(entry),
    links: [
      {
        rel: "self",
        href: `${canonicalUrl}/api/v1/entries/${encodedId}`,
        mediaType: "application/json",
      },
      {
        rel: "collection",
        href: `${canonicalUrl}/api/v1/entries`,
        mediaType: "application/json",
      },
      {
        rel: "profile",
        href: `${canonicalUrl}/api/v1/schema`,
        mediaType: "application/json",
      },
      {
        rel: "alternate",
        href: `${canonicalUrl}/entries/${encodedId}`,
        mediaType: "text/html",
      },
    ],
    actions: [],
  };
}

function entryById(id) {
  const entry = commonEntries.find((candidate) => candidate.id === id);
  assert(entry, `Missing matrix entry ${id}`);
  return entry;
}

function setupErrorFor(readiness) {
  if (readiness === "profile-absent") {
    return {
      status: 404,
      cacheControl: "no-store",
      body: {
        error: {
          code: "profile_not_configured",
          message: "The account profile has not been configured.",
        },
      },
    };
  }
  if (readiness === "canonical-absent") {
    return {
      status: 503,
      cacheControl: "no-store",
      body: {
        error: {
          code: "canonical_url_unconfigured",
          message: "Canonical URL is not configured.",
        },
      },
    };
  }
  return null;
}

function profileSetupError(setupError) {
  const { code, message } = setupError.body.error;
  return {
    ...setupError,
    body: {
      data: null,
      error: {
        code,
        message: code === "profile_not_configured"
          ? "The Aitta profile has not been configured."
          : message,
      },
      links: [],
    },
  };
}

async function observeHtml(worker, pathname) {
  return observe(
    await worker.fetch(new URL(pathname, hostileRequestOrigin), {
      headers: publicRequestHeaders("text/html"),
    }),
  );
}

async function observeJson(worker, pathname) {
  const observation = await observe(
    await worker.fetch(new URL(pathname, hostileRequestOrigin), {
      headers: publicRequestHeaders("application/json"),
    }),
  );
  return {
    ...observation,
    json: JSON.parse(observation.body),
  };
}

async function observe(response) {
  const body = await response.text();
  const headers = Object.fromEntries(response.headers.entries());
  assertNoPrivateCanary(JSON.stringify({ headers, body }));
  return { status: response.status, headers, body };
}

function publicRequestHeaders(accept) {
  return {
    accept,
    forwarded: `for=192.0.2.1;host=${hostileForwardedHost};proto=http`,
    host: hostileHost,
    "oai-authenticated-user-email": identityEmailCanary,
    "oai-authenticated-user-full-name": identityNameCanary,
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    "oai-authenticated-user-id": identityIdCanary,
    "x-forwarded-host": hostileForwardedHost,
    "x-forwarded-proto": "http",
  };
}

function assertHtmlHeaders(observation, status) {
  assert.equal(observation.status, status);
  assert.deepEqual(contractHeaders(observation.headers), {
    cacheControl: "no-store, must-revalidate",
    contentType: "text/html; charset=utf-8",
    location: null,
  });
}

function assertJson(observation, expected) {
  assert.equal(observation.status, expected.status);
  assert.deepEqual(contractHeaders(observation.headers), {
    cacheControl: expected.cacheControl,
    contentType: "application/json",
    location: null,
  });
  assert.deepEqual(observation.json, expected.body);
}

function contractHeaders(headers) {
  return {
    cacheControl: headers["cache-control"] ?? null,
    contentType: headers["content-type"] ?? null,
    location: headers.location ?? null,
  };
}

function assertNoPrivateCanary(value) {
  const forbidden = [
    ownerCanary,
    identityEmailCanary,
    identityIdCanary,
    identityNameCanary,
    credentialCanary,
    hubUrlCanary,
    profileCreatedCanary,
    profileUpdatedCanary,
    draftTitleCanary,
    draftBodyCanary,
    draftCreatedCanary,
    draftUpdatedCanary,
    hostileRequestOrigin,
    hostileRequestHost,
    hostileHost,
    hostileForwardedHost,
    runtimeWithoutProfile,
    runtimeWithoutProfileHost,
    invalidStoredCanonical,
    freshStoredCanonical,
  ];
  assert.doesNotMatch(
    value,
    new RegExp(forbidden.map(escapeRegExp).join("|"), "iu"),
  );
  assert.doesNotMatch(
    value,
    /FRESH-RUNTIME\.example|LEGACY-PERSON\.example|\/presence\/\/\//u,
  );
}
