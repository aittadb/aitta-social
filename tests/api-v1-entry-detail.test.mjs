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
import { errorDocument } from "./helpers/error-document-contract.mjs";
import { assertApiJson } from "./helpers/api-v1-json-response.mjs";
import { rfc6570PathSegment } from "../lib/rfc6570-path-segment.ts";

const canonicalUrl = "https://canonical.example/aitta";
const canaries = [
  "OWNER_PRIVATE_CANARY@example.test",
  "DRAFT_PRIVATE_CANARY",
  "ROW_PRIVATE_CANARY",
  "HUB_PRIVATE_CANARY",
  "IDENTITY_PRIVATE_CANARY@example.test",
  "COOKIE_PRIVATE_CANARY",
  "HOST_PRIVATE_CANARY.example",
  "STORAGE_PRIVATE_CANARY",
  "AUTHORIZATION_PRIVATE_CANARY",
];

test("v1 entry detail allowlists all four published kinds and optional omissions", async () => {
  const entries = [
    entryRow({
      id: "note-id",
      kind: "note",
      title: null,
      destination_url: null,
      published_at: null,
      private_canary: canaries[2],
    }),
    entryRow({
      id: "article-id",
      kind: "article",
      title: "Article title",
      destination_url: null,
    }),
    entryRow({
      id: "link id?#%opaque!()*'id",
      kind: "link",
      title: "Link title",
      destination_url: "https://public.example/resource",
    }),
    entryRow({
      id: "announcement-id",
      kind: "announcement",
      title: "Announcement title",
      destination_url: null,
    }),
  ];
  const db = new FakeD1({ entries });
  const env = makeEnv({ db, canonicalUrl: "https://CANONICAL.example/aitta///" });

  for (const entry of entries) {
    const response = await fetchApp(
      `/api/v1/entries/${encodeURIComponent(entry.id)}`,
      { env },
    );
    assertApiJson(response, 200, "public, max-age=60");
    const body = await responseJson(response);
    assert.deepEqual(body, detailDocument(entry));
    assert.deepEqual(body.actions, []);
    assert.equal("state" in body.data.attributes, false);
    assertNoCanary({ body, headers: Object.fromEntries(response.headers.entries()) });
    if (entry === entries[2]) {
      assert.equal(
        body.links[0].href,
        `${canonicalUrl}/api/v1/entries/link%20id%3F%23%25opaque%21%28%29%2A%27id`,
      );
      assert.equal(
        body.links[3].href,
        `${canonicalUrl}/entries/link%20id%3F%23%25opaque%21%28%29%2A%27id`,
      );
    }
  }

  assert.equal("title" in detailDocument(entries[0]).data.attributes, false);
  assert.equal("destinationUrl" in detailDocument(entries[0]).data.attributes, false);
  assert.equal("publishedAt" in detailDocument(entries[0]).data.attributes, false);
  assert.equal("destinationUrl" in detailDocument(entries[1]).data.attributes, false);
  assert.equal(detailDocument(entries[2]).data.attributes.destinationUrl,
    "https://public.example/resource");
  assertPublishedOnlyDetailQueries(db, entries.map(({ id }) => id));
});

test("v1 entry detail keeps draft, deleted, malformed, and unknown identifiers identical", async () => {
  const draft = entryRow({
    id: "private-draft",
    state: "draft",
    published_at: null,
    title: canaries[1],
    body: canaries[1],
  });
  const db = new FakeD1({ entries: [draft] });
  const env = makeEnv({ db, canonicalUrl });
  const ids = [draft.id, "deleted-entry", "not-a-valid-entry-id", "unknown-entry"];
  const observations = [];

  for (const id of ids) {
    const response = await fetchApp(`/api/v1/entries/${encodeURIComponent(id)}`, { env });
    assertApiJson(response, 404, "no-store");
    observations.push({
      body: await responseJson(response),
      headers: Object.fromEntries(response.headers.entries()),
    });
  }

  assert(observations.every(({ body }) =>
    JSON.stringify(body) === JSON.stringify(errorDocument(
      "entry_not_found",
      "Published entry not found.",
    ))));
  assert(observations.every(({ headers }) =>
    JSON.stringify(headers) === JSON.stringify(observations[0].headers)));
  assertNoCanary(observations);
  assertPublishedOnlyDetailQueries(db, ids);
});

test("v1 entry detail negotiates before D1 and has exact method and HEAD behavior", async () => {
  for (const accept of [
    "text/html",
    "application/json;q=0",
    "application/json,",
    `${Array.from({ length: 16 }, () => "text/plain").join(",")},application/json`,
  ]) {
    const db = new FakeD1();
    const response = await fetchApp("/api/v1/entries/entry-1", {
      env: makeEnv({ db, canonicalUrl }),
      headers: { accept },
    });
    assertApiJson(response, 406, "no-store");
    assert.deepEqual(await responseJson(response), errorDocument(
      "not_acceptable",
      "This API route returns application/json.",
    ));
    assert.deepEqual(db.queries, []);
  }

  const env = makeEnv({ canonicalUrl, db: new FakeD1({ entries: [entryRow()] }) });
  const get = await fetchApp("/api/v1/entries/entry-1", { env });
  const head = await fetchApp("/api/v1/entries/entry-1", { env, method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assertMatchingHeaders(head, get);

  const rejectedHead = await fetchApp("/api/v1/entries/entry-1", {
    env,
    method: "HEAD",
    headers: { accept: "text/html" },
  });
  assertApiJson(rejectedHead, 406, "no-store");
  assert.equal(await rejectedHead.text(), "");

  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await fetchApp("/api/v1/entries/entry-1", { env, method });
    assertApiJson(response, 405, "no-store");
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assert.deepEqual(await responseJson(response), errorDocument(
      "method_not_allowed",
      "The request method is not supported for this API resource.",
    ));
  }
});

test("v1 entry detail preserves setup order and bounds storage failure", async () => {
  const absentDb = new FakeD1({ profile: null, entries: [entryRow()] });
  const absent = await fetchApp("/api/v1/entries/entry-1", {
    env: makeEnv({ db: absentDb, canonicalUrl }),
  });
  assertApiJson(absent, 404, "no-store");
  assert.deepEqual(await responseJson(absent), errorDocument(
    "profile_not_configured",
    "The Aitta profile has not been configured.",
  ));
  assert.deepEqual(absentDb.queries.map(({ operation }) => operation), ["first"]);

  const invalidDb = new FakeD1({
    profile: profileRow({ canonical_url: "not a URL" }),
    entries: [entryRow()],
  });
  const invalid = await fetchApp("/api/v1/entries/entry-1", {
    env: makeEnv({ db: invalidDb, canonicalUrl: "http://invalid.example" }),
  });
  assertApiJson(invalid, 503, "no-store");
  assert.deepEqual(await responseJson(invalid), errorDocument(
    "canonical_url_unconfigured",
    "Canonical URL is not configured.",
  ));
  assert.deepEqual(invalidDb.queries.map(({ operation }) => operation), ["first"]);

  const backingDb = new FakeD1({ entries: [entryRow()] });
  const failingDb = {
    prepare(sql) {
      if (/from entries/iu.test(sql)) throw new Error(canaries[7]);
      return backingDb.prepare(sql);
    },
  };
  const failure = await fetchApp("/api/v1/entries/entry-1", {
    env: makeEnv({ db: failingDb, canonicalUrl }),
  });
  assertApiJson(failure, 500, "no-store");
  const failureBody = await responseJson(failure);
  assert.deepEqual(failureBody, errorDocument(
    "internal_error",
    "The API request could not be completed.",
  ));
  assertNoCanary(failureBody);
});

test("v1 entry detail ignores request authority, owner identity, Hub state, and credentials", async () => {
  const published = entryRow({ id: "public-entry", private_canary: canaries[2] });
  const draft = entryRow({
    id: "private-draft",
    state: "draft",
    published_at: null,
    body: canaries[1],
  });
  const env = makeEnv({
    db: new FakeD1({ entries: [published, draft] }),
    canonicalUrl: "https://CANONICAL.example/aitta///",
    ownerEmail: canaries[0],
    hubChallenge: canaries[3],
  });
  const response = await fetchApp("/api/v1/entries/public-entry?format=html", {
    env,
    origin: `https://${canaries[6]}`,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${canaries[8]}`,
      cookie: `session=${canaries[5]}`,
      host: canaries[6],
      "x-forwarded-host": canaries[6],
      "oai-authenticated-user-email": canaries[4],
      "user-agent": "HTML_BROWSER_PRIVATE_CANARY",
    },
  });
  assertApiJson(response, 200, "public, max-age=60");
  const body = await responseJson(response);
  assert.deepEqual(body, detailDocument(published));
  assert.deepEqual(body.actions, []);
  assertNoCanary({ body, headers: Object.fromEntries(response.headers.entries()) });
});

function detailDocument(entry) {
  const encodedId = rfc6570PathSegment(entry.id);
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
      jsonLink("self", `${canonicalUrl}/api/v1/entries/${encodedId}`),
      jsonLink("collection", `${canonicalUrl}/api/v1/entries`),
      jsonLink("profile", `${canonicalUrl}/api/v1/schema`),
      {
        rel: "alternate",
        href: `${canonicalUrl}/entries/${encodedId}`,
        mediaType: "text/html",
      },
    ],
    actions: [],
  };
}

function jsonLink(rel, href) {
  return { rel, href, mediaType: "application/json" };
}


function assertMatchingHeaders(head, get) {
  for (const name of ["content-type", "cache-control", "vary", "allow", "location"]) {
    assert.equal(head.headers.get(name), get.headers.get(name), name);
  }
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
  for (const canary of canaries) {
    assert.doesNotMatch(serialized, new RegExp(canary, "iu"));
  }
}
