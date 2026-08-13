import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
const privateCanaries = [
  "TASK193_DRAFT_PRIVATE_CANARY",
  "TASK193_PROFILE_ROW_PRIVATE_CANARY",
  "TASK193_OWNER_PRIVATE_CANARY@example.test",
  "TASK193_HUB_PRIVATE_CANARY",
  "TASK193_COOKIE_PRIVATE_CANARY",
  "TASK193_AUTHORIZATION_PRIVATE_CANARY",
  "TASK193_STORAGE_PRIVATE_CANARY",
  "TASK193_HOST_PRIVATE_CANARY.example",
];

test("unversioned entry document keeps HTML as default and selects JSON only when preferred", async () => {
  const env = publishedEnv();
  const htmlCases = [
    undefined,
    "*/*",
    "text/html",
    "application/json, text/html",
    "application/json;q=0.8, text/html;q=0.8",
    "text/html;q=0.7, application/json;q=0.7",
    "application/*;q=0.5, text/*;q=0.5",
    "application/json;q=0.2, application/json;q=0.9, text/html;q=0.5",
  ];
  for (const accept of htmlCases) {
    const response = await fetchApp("/entries/public-entry?format=json", {
      env,
      headers: accept === undefined
        ? { "user-agent": "TASK193_JSON_USER_AGENT_CANARY" }
        : { accept, "user-agent": "TASK193_JSON_USER_AGENT_CANARY" },
    });
    assertHtml(response, 200);
    const body = await response.text();
    assert.match(body, /Published title/);
    assert.match(body, /href="\/api\/v1\/entries\/public-entry"[^>]*>View as JSON<\/a>/i);
    assertNoCanary({ body, headers: Object.fromEntries(response.headers.entries()) });
  }

  const jsonCases = [
    "application/json",
    "application/*",
    "application/json;q=0.8, text/html;q=0.7",
    "text/html;q=0.2, application/json;q=0.9",
    "*/*;q=0.1, application/json;q=0.2",
    "text/*;q=0.3, application/*;q=0.4",
    "application/json;q=0.9, application/json;q=0.1, text/html;q=0.8",
    "text/html;q=0, */*;q=1",
  ];
  for (const accept of jsonCases) {
    const response = await fetchApp("/entries/public-entry?format=html", {
      origin: `https://${privateCanaries[7]}`,
      env,
      headers: hostileHeaders({ accept }),
    });
    assertJson(response, 200, "public, max-age=60");
    assert.deepEqual(await responseJson(response), currentDocument(entryRow({
      id: "public-entry",
      title: "Published title",
      private_canary: privateCanaries[1],
    })));
  }

  const htmlGet = await fetchApp("/entries/public-entry", {
    env,
    headers: { accept: "text/html" },
  });
  const htmlHead = await fetchApp("/entries/public-entry", {
    env,
    method: "HEAD",
    headers: { accept: "text/html" },
  });
  assertHtml(htmlHead, 200);
  assert.equal(await htmlHead.text(), "");
  assertMatchingHeaders(htmlHead, htmlGet);
});

test("unversioned entry document rejects malformed, excluded, and unsupported Accept before D1", async () => {
  const rejects = [
    "text/html;q=0, application/json;q=0",
    "application/xhtml+xml",
    "application/json,",
    "application/json;q=1.0000",
    "application/json;q=0.5;q=0.6",
    "*/json",
    "",
    `${Array.from({ length: 17 }, () => "text/plain").join(",")},application/json`,
    "a".repeat(4097),
  ];

  for (const accept of rejects) {
    const db = new FakeD1({ entries: [entryRow({ id: "public-entry" })] });
    const response = await fetchApp("/entries/public-entry", {
      env: makeEnv({ db, canonicalUrl }),
      headers: { accept },
    });
    assertJson(response, 406, "no-store");
    assert.deepEqual(await responseJson(response), errorDocument(
      "not_acceptable",
      "This document is available as text/html or application/json.",
    ));
    assert.deepEqual(db.queries, []);
  }

  const db = new FakeD1({ entries: [entryRow({ id: "public-entry" })] });
  const head = await fetchApp("/entries/public-entry", {
    env: makeEnv({ db, canonicalUrl }),
    method: "HEAD",
    headers: { accept: "application/json;q=0" },
  });
  assertJson(head, 406, "no-store");
  assert.equal(await head.text(), "");
  assert.deepEqual(db.queries, []);
});

test("unversioned JSON allowlists all four kinds, omissions, links, HEAD, and query independence", async () => {
  const entries = [
    entryRow({ id: "note-id", kind: "note", title: null, destination_url: null, published_at: null }),
    entryRow({ id: "article-id", kind: "article", title: "Article title", destination_url: null }),
    entryRow({
      id: "link id?#%opaque!()*'id",
      kind: "link",
      title: "Link title",
      destination_url: "https://public.example/resource",
    }),
    entryRow({ id: "announcement-id", kind: "announcement", title: "Announcement title" }),
  ];
  const db = new FakeD1({ entries });
  const env = makeEnv({ db, canonicalUrl: "https://CANONICAL.example/aitta///" });

  for (const entry of entries) {
    const response = await fetchApp(
      `/entries/${encodeURIComponent(entry.id)}?format=html&private=${privateCanaries[0]}`,
      { env, headers: { accept: "application/json" } },
    );
    assertJson(response, 200, "public, max-age=60");
    assert.deepEqual(await responseJson(response), currentDocument(entry));
  }

  assert.equal("title" in currentDocument(entries[0]).data.attributes, false);
  assert.equal("destinationUrl" in currentDocument(entries[0]).data.attributes, false);
  assert.equal("publishedAt" in currentDocument(entries[0]).data.attributes, false);

  const get = await fetchApp("/entries/article-id", {
    env,
    headers: { accept: "application/json" },
  });
  const head = await fetchApp("/entries/article-id", {
    env,
    method: "HEAD",
    headers: { accept: "application/json" },
  });
  assert.equal(head.status, get.status);
  assert.equal(await head.text(), "");
  assertMatchingHeaders(head, get);
  assertPublishedOnlyDetailQueries(db, [
    ...entries.map(({ id }) => id),
    "article-id",
    "article-id",
  ]);
});

test("unversioned JSON keeps draft, deleted, malformed, slash, and unknown identifiers private", async () => {
  const draft = entryRow({
    id: "private-draft",
    state: "draft",
    published_at: null,
    title: privateCanaries[0],
    body: privateCanaries[0],
  });
  const slash = entryRow({ id: "a/b", title: "ENCODED_SLASH_PRIVATE_CANARY" });
  const literal = entryRow({ id: "%2F", title: "Literal encoded identifier" });
  const db = new FakeD1({ entries: [draft, slash, literal] });
  const env = makeEnv({ db, canonicalUrl });
  const paths = [
    "/entries/private-draft",
    "/entries/deleted-entry",
    "/entries/not-a-valid-entry-id",
    "/entries/unknown-entry",
    "/entries/a%2Fb",
  ];
  const observations = [];

  for (const path of paths) {
    const before = db.queries.length;
    const response = await fetchApp(path, {
      env,
      headers: { accept: "application/json" },
    });
    assertJson(response, 404, "no-store");
    observations.push({
      body: await responseJson(response),
      headers: selectedHeaders(response),
    });
    if (path.endsWith("a%2Fb")) {
      assert.deepEqual(db.queries.slice(before), []);
    }
  }

  assert(observations.every(({ body }) => JSON.stringify(body) === JSON.stringify(
    errorDocument("entry_not_found", "Published entry not found."),
  )));
  assert(observations.every(({ headers }) =>
    JSON.stringify(headers) === JSON.stringify(observations[0].headers)));
  assertNoCanary(observations);

  const doubleEncoded = await fetchApp("/entries/%252F", {
    env,
    headers: { accept: "application/json" },
  });
  assertJson(doubleEncoded, 200, "public, max-age=60");
  const body = await responseJson(doubleEncoded);
  assert.equal(body.data.id, "%2F");
  assert.equal(body.links[0].href, `${canonicalUrl}/entries/%252F`);

  const malformedDb = new FakeD1({ entries: [literal] });
  const malformed = await fetchApp("/entries/%", {
    env: makeEnv({ db: malformedDb, canonicalUrl }),
    headers: { accept: "application/json" },
  });
  assert.equal(malformed.status, 400);
  assert.deepEqual(malformedDb.queries, []);
});

test("draft and unknown HTML remain the same safe public not-found class", async () => {
  const env = publishedEnv();
  const observations = [];
  for (const id of ["private-entry", "deleted-entry", "unknown-entry"]) {
    const response = await fetchApp(`/entries/${id}`, {
      env,
      headers: { accept: "text/html" },
    });
    assertHtml(response, 404);
    const body = await response.text();
    assert.match(body, /This update is not public/);
    assert.doesNotMatch(body, /Published title|TASK193_DRAFT/);
    observations.push(selectedHeaders(response));
  }
  assert(observations.every((headers) =>
    JSON.stringify(headers) === JSON.stringify(observations[0])));
});

test("unversioned JSON bounds setup, canonical, storage, host, identity, credential, and Hub inputs", async () => {
  const absentDb = new FakeD1({ profile: null, entries: [entryRow({ id: "public-entry" })] });
  const absent = await fetchApp("/entries/public-entry", {
    env: makeEnv({ db: absentDb, canonicalUrl }),
    headers: { accept: "application/json" },
  });
  assertJson(absent, 404, "no-store");
  assert.deepEqual(await responseJson(absent), errorDocument(
    "profile_not_configured",
    "The Aitta profile has not been configured.",
  ));
  assert.deepEqual(absentDb.queries.map(({ operation }) => operation), ["first"]);

  const invalidDb = new FakeD1({
    profile: profileRow({ canonical_url: "not a URL" }),
    entries: [entryRow({ id: "public-entry" })],
  });
  const invalid = await fetchApp("/entries/public-entry", {
    env: makeEnv({ db: invalidDb, canonicalUrl: "http://invalid.example" }),
    headers: { accept: "application/json" },
  });
  assertJson(invalid, 503, "no-store");
  assert.deepEqual(await responseJson(invalid), errorDocument(
    "canonical_url_unconfigured",
    "Canonical URL is not configured.",
  ));
  assert.deepEqual(invalidDb.queries.map(({ operation }) => operation), ["first"]);

  const backingDb = new FakeD1({ entries: [entryRow({ id: "public-entry" })] });
  const failingDb = {
    prepare(sql) {
      if (/from entries/iu.test(sql)) throw new Error(privateCanaries[6]);
      return backingDb.prepare(sql);
    },
  };
  const failed = await fetchApp("/entries/public-entry", {
    origin: `https://${privateCanaries[7]}`,
    env: makeEnv({
      db: failingDb,
      canonicalUrl,
      ownerEmail: privateCanaries[2],
      hubChallenge: privateCanaries[3],
    }),
    headers: hostileHeaders({ accept: "application/json" }),
  });
  assertJson(failed, 500, "no-store");
  const failedBody = await responseJson(failed);
  assert.deepEqual(failedBody, errorDocument(
    "internal_error",
    "The API request could not be completed.",
  ));
  assertNoCanary({ body: failedBody, headers: Object.fromEntries(failed.headers.entries()) });
});

test("internal namespace and marker cannot bypass Worker dispatch", async () => {
  const db = new FakeD1({ entries: [entryRow({ id: "public-entry" })] });
  const env = makeEnv({ db, canonicalUrl });
  for (const path of [
    "/aitta-internal",
    "/aitta-internal/",
    "/aitta-internal/entry-document/public-entry",
    "/aitta-internal/other",
  ]) {
    const response = await fetchApp(path, {
      env,
      headers: {
        accept: "application/json",
        "x-aitta-entry-document-dispatch": "worker-negotiated-json",
      },
    });
    assert.equal(response.status, 404);
    assert.equal(await response.text(), "");
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  for (const method of ["HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await fetchApp("/aitta-internal/entry-document/public-entry", {
      env,
      method,
      headers: { "x-aitta-entry-document-dispatch": "worker-negotiated-json" },
    });
    assert.equal(response.status, 404);
    assert.equal(await response.text(), "");
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.deepEqual(db.queries, []);

  const forgedOnPublic = await fetchApp("/entries/public-entry", {
    env,
    headers: {
      accept: "text/html",
      "x-aitta-entry-document-dispatch": "worker-negotiated-json",
    },
  });
  assertHtml(forgedOnPublic, 200);
});

test("entry negotiation excludes every other route family and external non-read method", async () => {
  const env = publishedEnv();
  const paths = [
    "/",
    "/entries/public-entry/more",
    "/api/v1/entries/public-entry",
    "/.well-known/aitta-social.json",
    "/owner",
    "/signin-with-chatgpt",
    "/signout-with-chatgpt",
    "/callback",
    "/privacy",
    "/technical",
    "/_next/static/missing-task193.css",
  ];
  for (const path of paths) {
    const base = await fetchApp(path, { env, headers: { accept: "application/json" } });
    const forged = await fetchApp(path, {
      env,
      headers: {
        accept: "application/json",
        "x-aitta-entry-document-dispatch": "worker-negotiated-json",
      },
    });
    assert.equal(forged.status, base.status, path);
    assert.equal(forged.headers.get("content-type"), base.headers.get("content-type"), path);
    assert.equal(await forged.text(), await base.text(), path);
  }

  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const base = await fetchApp("/entries/public-entry", {
      env,
      method,
      headers: { accept: "application/json" },
    });
    const forged = await fetchApp("/entries/public-entry", {
      env,
      method,
      headers: {
        accept: "application/json",
        "x-aitta-entry-document-dispatch": "worker-negotiated-json",
      },
    });
    assert.equal(forged.status, base.status, method);
    assert.equal(forged.headers.get("content-type"), base.headers.get("content-type"), method);
    assert.equal(await forged.text(), await base.text(), method);
  }
});

test("unversioned representation is feature-local while v1 detail stays byte-for-byte unchanged", async () => {
  const [representation, response, route, v1Route] = await Promise.all([
    readFile(new URL("../lib/public-entry-document/representation.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/public-entry-document/response.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/aitta-internal/entry-document/[id]/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/v1/entries/[id]/route.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(representation, /apiV1(?:Document|Link|JsonLink|Error|JsonResponse)/);
  assert.doesNotMatch(response, /apiV1/);
  assert.doesNotMatch(route, /@\/lib\/api-v1\/(?:representation|response|entry-detail)/);
  assert.match(representation, /apiV1EntryResource/);
  assert.match(representation, /apiV1EntryIdPathSegment/);
  assert.doesNotMatch(v1Route, /public-entry-document/);

  const entry = entryRow({ id: "public-entry" });
  const env = makeEnv({ db: new FakeD1({ entries: [entry] }), canonicalUrl });
  const baseline = await fetchApp("/api/v1/entries/public-entry?unchanged=true", {
    env,
    headers: { accept: "application/json" },
  });
  assertJson(baseline, 200, "public, max-age=60");
  const baselineBody = await baseline.text();
  const again = await fetchApp("/api/v1/entries/public-entry?format=html", {
    env,
    headers: { accept: "application/json" },
  });
  assert.equal(await again.text(), baselineBody);
  assertMatchingHeaders(again, baseline);

  for (const accept of ["text/html", "application/json;q=0", "application/json,"]) {
    const response = await fetchApp("/api/v1/entries/public-entry", {
      env,
      headers: { accept },
    });
    assertJson(response, 406, "no-store");
    assert.deepEqual(await responseJson(response), errorDocument(
      "not_acceptable",
      "This API route returns application/json.",
    ));
  }
});

function publishedEnv() {
  return makeEnv({
    db: new FakeD1({
      profile: profileRow({ private_canary: privateCanaries[1] }),
      entries: [
        entryRow({
          id: "public-entry",
          title: "Published title",
          private_canary: privateCanaries[1],
        }),
        entryRow({
          id: "private-entry",
          state: "draft",
          published_at: null,
          body: privateCanaries[0],
        }),
      ],
    }),
    canonicalUrl,
    ownerEmail: privateCanaries[2],
    hubChallenge: privateCanaries[3],
  });
}

function currentDocument(entry) {
  const encodedId = rfc6570PathSegment(entry.id);
  const documentHref = `${canonicalUrl}/entries/${encodedId}`;
  return {
    data: {
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
    },
    links: [
      { rel: "self", href: documentHref, mediaType: "application/json" },
      { rel: "collection", href: `${canonicalUrl}/api/v1/entries`, mediaType: "application/json" },
      { rel: "profile", href: `${canonicalUrl}/api/v1/schema`, mediaType: "application/json" },
      { rel: "alternate", href: documentHref, mediaType: "text/html" },
    ],
    actions: [],
  };
}

function hostileHeaders(overrides = {}) {
  return {
    authorization: `Bearer ${privateCanaries[5]}`,
    cookie: `session=${privateCanaries[4]}`,
    host: privateCanaries[7],
    "x-forwarded-host": privateCanaries[7],
    "oai-authenticated-user-email": privateCanaries[2],
    "user-agent": "TASK193_HTML_USER_AGENT_PRIVATE_CANARY",
    ...overrides,
  };
}

function errorDocument(code, message) {
  return { data: null, error: { code, message }, links: [] };
}

function rfc6570PathSegment(id) {
  return encodeURIComponent(id).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function assertHtml(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/iu);
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'none'/);
  assert(hasVaryToken(response, "accept"));
}

function assertJson(response, status, cacheControl) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  assert.equal(response.headers.get("cache-control"), cacheControl);
  assert.equal(response.headers.get("content-security-policy"), null);
  assert(hasVaryToken(response, "accept"));
}

function assertMatchingHeaders(left, right) {
  for (const name of [
    "content-type",
    "cache-control",
    "vary",
    "content-security-policy",
    "location",
  ]) {
    assert.equal(left.headers.get(name), right.headers.get(name), name);
  }
}

function selectedHeaders(response) {
  return Object.fromEntries([
    "content-type",
    "cache-control",
    "vary",
    "content-security-policy",
    "location",
  ].map((name) => [name, response.headers.get(name)]));
}

function hasVaryToken(response, token) {
  return (response.headers.get("vary") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .includes(token);
}

function assertPublishedOnlyDetailQueries(db, ids) {
  const entryQueries = db.queries.filter(({ sql }) => /from entries/iu.test(sql));
  assert.equal(entryQueries.length, ids.length);
  assert(entryQueries.every(({ sql }) => /where id = \? and state = \?/iu.test(sql)));
  assert.deepEqual(entryQueries.map(({ values }) => values),
    ids.map((id) => [id, "published"]));
}

function assertNoCanary(value) {
  const serialized = JSON.stringify(value);
  for (const canary of privateCanaries) {
    assert.doesNotMatch(serialized, new RegExp(canary, "iu"));
  }
}
