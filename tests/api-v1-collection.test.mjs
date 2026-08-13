import assert from "node:assert/strict";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  profileRow,
  responseJson,
} from "./helpers/worker-harness.mjs";

const canonicalUrl = "https://canonical.example/aitta";
const canaries = [
  "OWNER_PRIVATE_CANARY@example.test",
  "DRAFT_PRIVATE_CANARY",
  "HUB_PRIVATE_CANARY",
  "IDENTITY_PRIVATE_CANARY@example.test",
  "COOKIE_PRIVATE_CANARY",
  "HOST_PRIVATE_CANARY.example",
  "STORAGE_PRIVATE_CANARY",
  "AUTHORIZATION_PRIVATE_CANARY",
];

test("v1 collection represents an empty or draft-only Aitta as one empty page", async () => {
  const empty = await collectionResponse([]);
  const draftOnly = await collectionResponse([
    entryRow({
      id: "private-draft",
      state: "draft",
      published_at: null,
      body: canaries[1],
    }),
  ]);

  const expected = {
    data: [],
    pagination: { page: 1, pageSize: 20 },
    links: [
      jsonLink("self", `${canonicalUrl}/api/v1/entries?page=1&pageSize=20`),
      jsonLink("first", `${canonicalUrl}/api/v1/entries?page=1&pageSize=20`),
      jsonLink("last", `${canonicalUrl}/api/v1/entries?page=1&pageSize=20`),
      jsonLink("profile", `${canonicalUrl}/api/v1/schema`),
      jsonLink("social.aitta.profile", `${canonicalUrl}/api/v1/site`),
    ],
    actions: [],
  };
  assert.deepEqual(empty.body, expected);
  assert.deepEqual(draftOnly.body, expected);
  assertPublishedOnlyQueries(empty.db);
  assertPublishedOnlyQueries(draftOnly.db);
  assertNoCanary(draftOnly.body);
});

test("v1 collection allowlists all four published entry kinds and optional omissions", async () => {
  const entries = [
    entryRow({
      id: "note-id",
      kind: "note",
      title: null,
      destination_url: null,
      published_at: "2026-08-04T00:00:00.000Z",
    }),
    entryRow({
      id: "article-id",
      kind: "article",
      title: "Article title",
      destination_url: null,
      published_at: "2026-08-03T00:00:00.000Z",
    }),
    entryRow({
      id: "link/id ?",
      kind: "link",
      title: "Link title",
      destination_url: "https://public.example/resource",
      published_at: "2026-08-02T00:00:00.000Z",
    }),
    entryRow({
      id: "announcement-id",
      kind: "announcement",
      title: "Announcement title",
      destination_url: null,
      published_at: "2026-08-01T00:00:00.000Z",
    }),
  ];
  const { body } = await collectionResponse(entries, "/api/v1/entries?pageSize=50");

  assert.deepEqual(body.data.map(({ id, type, attributes }) => ({ id, type, attributes })), [
    entryResource(entries[0]),
    entryResource(entries[1]),
    entryResource(entries[2]),
    entryResource(entries[3]),
  ]);
  assert.equal("title" in body.data[0].attributes, false);
  assert.equal("destinationUrl" in body.data[0].attributes, false);
  assert.equal("state" in body.data[0].attributes, false);
  assert.deepEqual(
    body.links.filter(({ rel }) => rel === "item"),
    entries.map(({ id }) =>
      jsonLink("item", `${canonicalUrl}/api/v1/entries/${encodeURIComponent(id)}`)
    ),
  );
  assert.deepEqual(body.actions, []);
});

test("v1 collection derives stable first, previous, next, and last links from published count", async () => {
  const published = Array.from({ length: 5 }, (_, index) =>
    entryRow({
      id: `published-${index}`,
      published_at: `2026-08-0${5 - index}T00:00:00.000Z`,
    })
  );
  const mixed = [
    ...published,
    ...Array.from({ length: 7 }, (_, index) =>
      entryRow({
        id: `draft-${index}`,
        state: "draft",
        published_at: null,
        body: `${canaries[1]}-${index}`,
      })
    ),
  ];

  const first = await collectionResponse(mixed, "/api/v1/entries?page=1&pageSize=2");
  const repeat = await collectionResponse(mixed, "/api/v1/entries?page=1&pageSize=2");
  const middle = await collectionResponse(mixed, "/api/v1/entries?page=2&pageSize=2");
  const last = await collectionResponse(mixed, "/api/v1/entries?page=3&pageSize=2");
  const beyond = await collectionResponse(mixed, "/api/v1/entries?page=4&pageSize=2");

  assert.deepEqual(first.body, repeat.body);
  assert.deepEqual(first.body.data.map(({ id }) => id), ["published-0", "published-1"]);
  assert.deepEqual(relations(first.body), [
    "self", "first", "next", "last", "item", "item", "profile", "social.aitta.profile",
  ]);
  assert.equal(link(first.body, "last"), pageUrl(3, 2));
  assert.equal(link(first.body, "next"), pageUrl(2, 2));

  assert.deepEqual(middle.body.data.map(({ id }) => id), ["published-2", "published-3"]);
  assert.equal(link(middle.body, "previous"), pageUrl(1, 2));
  assert.equal(link(middle.body, "next"), pageUrl(3, 2));
  assert.equal(link(middle.body, "last"), pageUrl(3, 2));

  assert.deepEqual(last.body.data.map(({ id }) => id), ["published-4"]);
  assert.equal(link(last.body, "previous"), pageUrl(2, 2));
  assert.equal(last.body.links.some(({ rel }) => rel === "next"), false);

  assert.deepEqual(beyond.body.data, []);
  assert.equal(link(beyond.body, "self"), pageUrl(4, 2));
  assert.equal(link(beyond.body, "previous"), pageUrl(3, 2));
  assert.equal(link(beyond.body, "last"), pageUrl(3, 2));
  assert.equal(beyond.body.links.some(({ rel }) => rel === "next"), false);
  for (const observation of [first, repeat, middle, last, beyond]) {
    assertPublishedOnlyQueries(observation.db);
    assertNoCanary(observation.body);
  }
});

test("v1 collection negotiates and validates before D1 and has exact method/HEAD behavior", async () => {
  for (const accept of ["text/html", "application/json;q=0", "application/json,"]) {
    const db = new FakeD1();
    const response = await fetchApp("/api/v1/entries", {
      env: makeEnv({ db, canonicalUrl }),
      headers: { accept },
    });
    assertCollectionJson(response, 406, "no-store");
    assert.deepEqual(
      await responseJson(response),
      errorDocument("not_acceptable", "This API route returns application/json."),
    );
    assert.deepEqual(db.queries, []);
  }

  for (const query of [
    "page=0",
    "page=-1",
    "page=1.5",
    "page=x",
    "pageSize=0",
    "pageSize=51",
    `page=${Number.MAX_SAFE_INTEGER + 1}`,
  ]) {
    const db = new FakeD1();
    const response = await fetchApp(`/api/v1/entries?${query}`, {
      env: makeEnv({ db, canonicalUrl }),
    });
    assertCollectionJson(response, 400, "no-store");
    assert.deepEqual(
      await responseJson(response),
      errorDocument(
        "invalid_pagination",
        "page must be at least 1 and pageSize must be between 1 and 50.",
      ),
    );
    assert.deepEqual(db.queries, []);
  }

  const env = makeEnv({ canonicalUrl, db: new FakeD1({ entries: [entryRow()] }) });
  const get = await fetchApp("/api/v1/entries", { env });
  const head = await fetchApp("/api/v1/entries", { env, method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assertMatchingHeaders(head, get);
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await fetchApp("/api/v1/entries", { env, method });
    assertCollectionJson(response, 405, "no-store");
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assert.deepEqual(
      await responseJson(response),
      errorDocument(
        "method_not_allowed",
        "The request method is not supported for this API resource.",
      ),
    );
  }
});

test("v1 collection preserves setup categories and bounds storage failure", async () => {
  const absentDb = new FakeD1({ profile: null, entries: [entryRow()] });
  const absent = await fetchApp("/api/v1/entries", {
    env: makeEnv({ db: absentDb, canonicalUrl }),
  });
  assertCollectionJson(absent, 404, "no-store");
  assert.deepEqual(
    await responseJson(absent),
    errorDocument(
      "profile_not_configured",
      "The Aitta profile has not been configured.",
    ),
  );
  assert.deepEqual(absentDb.queries.map(({ operation }) => operation), ["first"]);

  const invalidDb = new FakeD1({
    profile: profileRow({ canonical_url: "not a URL" }),
    entries: [entryRow()],
  });
  const invalidCanonical = await fetchApp("/api/v1/entries", {
    env: makeEnv({ db: invalidDb, canonicalUrl: "http://invalid.example" }),
  });
  assertCollectionJson(invalidCanonical, 503, "no-store");
  assert.deepEqual(
    await responseJson(invalidCanonical),
    errorDocument("canonical_url_unconfigured", "Canonical URL is not configured."),
  );
  assert.deepEqual(invalidDb.queries.map(({ operation }) => operation), ["first"]);

  const backingDb = new FakeD1({ entries: [entryRow()] });
  const failingDb = {
    prepare(sql) {
      if (/count\(\*\)/iu.test(sql)) throw new Error(canaries[6]);
      return backingDb.prepare(sql);
    },
  };
  const failure = await fetchApp("/api/v1/entries", {
    env: makeEnv({ db: failingDb, canonicalUrl }),
  });
  assertCollectionJson(failure, 500, "no-store");
  assert.deepEqual(
    await responseJson(failure),
    errorDocument("internal_error", "The API request could not be completed."),
  );
  assertNoCanary({
    body: await responseJson(await fetchApp("/api/v1/entries", {
      env: makeEnv({ db: failingDb, canonicalUrl }),
    })),
  });
});

test("v1 collection ignores request authority, owner identity, Hub state, and credentials", async () => {
  const entries = [
    entryRow({ id: "public-entry", private_canary: "ROW_PRIVATE_CANARY" }),
    entryRow({
      id: "private-draft",
      state: "draft",
      published_at: null,
      body: canaries[1],
    }),
  ];
  const env = makeEnv({
    db: new FakeD1({ entries }),
    canonicalUrl: "https://CANONICAL.example/aitta///",
    ownerEmail: canaries[0],
    hubChallenge: canaries[2],
  });
  const response = await fetchApp("/api/v1/entries?format=html", {
    env,
    origin: `https://${canaries[5]}`,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${canaries[7]}`,
      cookie: `session=${canaries[4]}`,
      host: canaries[5],
      "x-forwarded-host": canaries[5],
      "oai-authenticated-user-email": canaries[3],
      "user-agent": "HTML_BROWSER_PRIVATE_CANARY",
    },
  });
  assertCollectionJson(response, 200, "public, max-age=30");
  const body = await responseJson(response);
  assert.deepEqual(body.data.map(({ id }) => id), ["public-entry"]);
  assert.deepEqual(body.actions, []);
  assert.equal(link(body, "self"), `${canonicalUrl}/api/v1/entries?page=1&pageSize=20`);
  assertNoCanary({ body, headers: Object.fromEntries(response.headers.entries()) });
});

async function collectionResponse(entries, path = "/api/v1/entries") {
  const db = new FakeD1({ entries });
  const response = await fetchApp(path, { env: makeEnv({ db, canonicalUrl }) });
  assertCollectionJson(response, 200, "public, max-age=30");
  return { body: await responseJson(response), db };
}

function entryResource(entry) {
  return {
    id: entry.id,
    type: "entry",
    attributes: {
      kind: entry.kind,
      ...(entry.title ? { title: entry.title } : {}),
      body: entry.body,
      ...(entry.destination_url ? { destinationUrl: entry.destination_url } : {}),
      ...(entry.published_at ? { publishedAt: entry.published_at } : {}),
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    },
  };
}

function jsonLink(rel, href) {
  return { rel, href, mediaType: "application/json" };
}

function pageUrl(page, pageSize) {
  return `${canonicalUrl}/api/v1/entries?page=${page}&pageSize=${pageSize}`;
}

function relations(document) {
  return document.links.map(({ rel }) => rel);
}

function link(document, relation) {
  return document.links.find(({ rel }) => rel === relation)?.href;
}

function errorDocument(code, message) {
  return { data: null, error: { code, message }, links: [] };
}

function assertCollectionJson(response, status, cacheControl) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  assert.equal(response.headers.get("cache-control"), cacheControl);
  assert.equal(response.headers.get("location"), null);
  assert(hasVaryToken(response, "accept"));
  assert(hasVaryToken(response, "authorization"));
  assert.equal(varyTokens(response).filter((token) => token === "accept").length, 1);
  assert.equal(varyTokens(response).filter((token) => token === "authorization").length, 1);
}

function assertMatchingHeaders(head, get) {
  for (const name of ["content-type", "cache-control", "vary", "allow", "location"]) {
    assert.equal(head.headers.get(name), get.headers.get(name), name);
  }
}

function hasVaryToken(response, token) {
  return varyTokens(response).includes(token);
}

function varyTokens(response) {
  return (response.headers.get("vary") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase());
}

function assertPublishedOnlyQueries(db) {
  const entryQueries = db.queries.filter(({ sql }) => /from entries/iu.test(sql));
  assert.equal(entryQueries.length, 2);
  assert.deepEqual(entryQueries.map(({ values }) => values[0]), ["published", "published"]);
  assert(entryQueries.every(({ sql }) => /where state = \?/iu.test(sql)));
  assert.equal(entryQueries.filter(({ sql }) => /count\(\*\)/iu.test(sql)).length, 1);
}

function assertNoCanary(value) {
  const serialized = JSON.stringify(value);
  for (const canary of canaries) {
    assert.doesNotMatch(serialized, new RegExp(canary.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
  assert.doesNotMatch(serialized, /PRIVATE_CANARY/iu);
}
