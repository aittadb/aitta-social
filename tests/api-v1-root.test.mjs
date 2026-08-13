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
const privateCanaries = [
  "OWNER_EMAIL_PRIVATE_CANARY@example.test",
  "PROFILE_PRIVATE_CANARY",
  "ENTRY_PRIVATE_CANARY",
  "HUB_PRIVATE_CANARY",
  "IDENTITY_PRIVATE_CANARY",
  "THROWN_RUNTIME_PRIVATE_CANARY",
];

const rootDocument = {
  data: {
    id: "aitta-social-api",
    type: "api",
    attributes: { name: "AittaSocial", version: 1 },
  },
  links: [
    {
      rel: "self",
      href: `${canonicalUrl}/api/v1`,
      mediaType: "application/json",
    },
    {
      rel: "profile",
      href: `${canonicalUrl}/api/v1/schema`,
      mediaType: "application/json",
    },
    {
      rel: "social.aitta.profile",
      href: `${canonicalUrl}/api/v1/site`,
      mediaType: "application/json",
    },
    {
      rel: "collection",
      href: `${canonicalUrl}/api/v1/entries`,
      mediaType: "application/json",
    },
    {
      rel: "social.aitta.manifest",
      href: `${canonicalUrl}/.well-known/aitta-social.json`,
      mediaType: "application/json",
    },
  ],
  actions: [],
};

const schemaDocument = {
  data: {
    id: "aitta-social-api-profile",
    type: "api-profile",
    attributes: {
      version: 1,
      representation: "aitta-social-json-api-v1",
      relations: [
        "self",
        "profile",
        "collection",
        "item",
        "first",
        "previous",
        "next",
        "last",
        "social.aitta.profile",
        "social.aitta.manifest",
      ],
    },
  },
  links: [
    {
      rel: "self",
      href: `${canonicalUrl}/api/v1/schema`,
      mediaType: "application/json",
    },
    {
      rel: "collection",
      href: `${canonicalUrl}/api/v1`,
      mediaType: "application/json",
    },
  ],
  actions: [],
};

test("v1 root and schema use only protected canonical configuration and never D1", async () => {
  const db = new FakeD1({
    profile: profileRow({
      canonical_url: "https://stored-private-canary.example",
      private_canary: privateCanaries[1],
    }),
    entries: [entryRow({ private_canary: privateCanaries[2] })],
  });
  const env = makeEnv({
    db,
    canonicalUrl: "https://CANONICAL.example/aitta///",
    ownerEmail: privateCanaries[0],
    hubChallenge: privateCanaries[3],
  });
  const hostileHeaders = {
    accept: "application/json",
    host: "HOST_PRIVATE_CANARY.example",
    forwarded: "host=FORWARDED_PRIVATE_CANARY.example;proto=http",
    "x-forwarded-host": "X_FORWARDED_PRIVATE_CANARY.example",
    "oai-authenticated-user-email": privateCanaries[4],
  };

  const root = await fetchApp("/api/v1?format=html", {
    env,
    origin: "https://REQUEST_HOST_PRIVATE_CANARY.example",
    headers: { ...hostileHeaders, "user-agent": "HTML_BROWSER_PRIVATE_CANARY" },
  });
  const schema = await fetchApp("/api/v1/schema", { env, headers: hostileHeaders });

  assertApiJson(root, 200, "public, max-age=60");
  assertApiJson(schema, 200, "public, max-age=60");
  assert.deepEqual(await responseJson(root), rootDocument);
  assert.deepEqual(await responseJson(schema), schemaDocument);
  assert.deepEqual(db.queries, []);
  assertNoCanary(rootDocument);
  assertNoCanary(schemaDocument);
});

test("v1 root and schema never access owner or Hub runtime settings", async () => {
  const env = makeEnv({ canonicalUrl });
  for (const name of ["AITTA_SOCIAL_OWNER_EMAIL", "AITTA_SOCIAL_HUB_CHALLENGE"]) {
    Object.defineProperty(env, name, {
      enumerable: true,
      get() {
        throw new Error(`${name}_PRIVATE_CANARY`);
      },
    });
  }

  for (const [path, expected] of [
    ["/api/v1", rootDocument],
    ["/api/v1/schema", schemaDocument],
  ]) {
    const response = await fetchApp(path, { env });
    assertApiJson(response, 200, "public, max-age=60");
    assert.deepEqual(await responseJson(response), expected);
  }
  assert.deepEqual(env.DB.queries, []);
});

test("v1 root and schema accept bounded JSON-compatible media ranges", async () => {
  const accepted = [
    undefined,
    "*/*",
    "application/*",
    "application/json",
    "APPLICATION/JSON",
    "text/html, application/json;q=0.5",
    "text/html;q=1, application/json;q=1",
    'application/json; charset="utf-8"',
    `${Array.from({ length: 15 }, () => "text/plain").join(",")},application/json`,
  ];

  for (const accept of accepted) {
    const response = await fetchApp("/api/v1", {
      env: makeEnv({ canonicalUrl }),
      headers: accept === undefined ? {} : { accept },
    });
    assertApiJson(response, 200, "public, max-age=60");
    assert.deepEqual(await responseJson(response), rootDocument, accept);
  }
});

test("v1 root, schema, and unknown paths reject excluded, malformed, or excessive Accept", async () => {
  const rejected = [
    "text/html",
    "application/json;q=0",
    "application/json;q=0, */*;q=1",
    "application/*;q=0, */*;q=1",
    "application/json;q=2",
    "application/json;q=0.1234",
    "application/json;q=1;q=0",
    "application/json,",
    ",application/json",
    "application",
    "*/json",
    'application/json; profile="unterminated',
    `${Array.from({ length: 16 }, () => "text/plain").join(",")},application/json`,
    `application/json;note=${"x".repeat(4096)}`,
  ];
  const paths = ["/api/v1", "/api/v1/schema", "/api/v1/unknown/deep"];

  for (const path of paths) {
    for (const accept of rejected) {
      const response = await fetchApp(path, {
        env: makeEnv({ canonicalUrl }),
        headers: { accept },
      });
      assertApiJson(response, 406, "no-store");
      assert.deepEqual(await responseJson(response), errorDocument(
        "not_acceptable",
        "This API route returns application/json.",
      ));
    }
  }
});

test("known v1 discovery resources have exact methods, Allow, and HEAD behavior", async () => {
  const env = makeEnv({ canonicalUrl });
  for (const path of ["/api/v1", "/api/v1/schema"]) {
    const get = await fetchApp(path, { env });
    const getBody = await get.text();
    const head = await fetchApp(path, { env, method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assertMatchingHeadHeaders(head, get);
    assert.notEqual(getBody, "");

    for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
      const response = await fetchApp(path, { env, method });
      assertApiJson(response, 405, "no-store");
      assert.equal(response.headers.get("allow"), "GET, HEAD");
      assert.deepEqual(await responseJson(response), errorDocument(
        "method_not_allowed",
        "The request method is not supported for this API resource.",
      ));
    }

    const rejectedHead = await fetchApp(path, {
      env,
      method: "HEAD",
      headers: { accept: "text/html" },
    });
    assertApiJson(rejectedHead, 406, "no-store");
    assert.equal(await rejectedHead.text(), "");
  }
});

test("unknown v1 paths are bounded JSON 404s for every conventional method", async () => {
  const env = makeEnv({ canonicalUrl: undefined, db: new FakeD1() });
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
  for (const method of methods) {
    const response = await fetchApp("/api/v1/not-a-resource/deeper?format=html", {
      env,
      method,
      headers: { accept: "*/*", "user-agent": "Browser" },
    });
    assertApiJson(response, 404, "no-store");
    assert.equal(response.headers.get("allow"), null);
    assert.deepEqual(await responseJson(response), errorDocument(
      "not_found",
      "The requested API resource was not found.",
    ));
  }

  const get = await fetchApp("/api/v1/not-a-resource/deeper", { env });
  const head = await fetchApp("/api/v1/not-a-resource/deeper", { env, method: "HEAD" });
  assert.equal(head.status, 404);
  assert.equal(await head.text(), "");
  assertMatchingHeadHeaders(head, get);
  assert.deepEqual(env.DB.queries, []);
});

test("missing and invalid protected canonical configuration fail closed without stored fallback", async () => {
  for (const canonicalUrlValue of [undefined, "http://invalid-private-canary.example", "not a url"]) {
    const db = new FakeD1({
      profile: profileRow({ canonical_url: "https://stored-fallback-private-canary.example" }),
    });
    const env = makeEnv({ db, canonicalUrl: canonicalUrlValue });
    for (const path of ["/api/v1", "/api/v1/schema"]) {
      const response = await fetchApp(path, { env });
      assertApiJson(response, 503, "no-store");
      assert.deepEqual(await responseJson(response), errorDocument(
        "canonical_url_unconfigured",
        "Canonical URL is not configured.",
      ));
    }
    assert.deepEqual(db.queries, []);
  }
});

test("unexpected root and schema failures are safe bounded JSON", async () => {
  for (const path of ["/api/v1", "/api/v1/schema"]) {
    const env = makeEnv({ canonicalUrl });
    Object.defineProperty(env, "AITTA_SOCIAL_CANONICAL_URL", {
      enumerable: true,
      get() {
        throw new Error(privateCanaries[5]);
      },
    });
    const response = await fetchApp(path, { env });
    assertApiJson(response, 500, "no-store");
    const body = await responseJson(response);
    assert.deepEqual(body, errorDocument(
      "internal_error",
      "The API request could not be completed.",
    ));
    assertNoCanary({ body, headers: Object.fromEntries(response.headers.entries()) });
    assert.deepEqual(env.DB.queries, []);
  }
});

test("manifest and root discover the profile and published collection", async () => {
  const profile = profileRow();
  const entry = entryRow();
  const env = makeEnv({
    db: new FakeD1({ profile, entries: [entry] }),
    canonicalUrl: "https://CANONICAL.example/aitta///",
  });
  const manifestResponse = await fetchApp("/.well-known/aitta-social.json", { env });
  assert.equal(manifestResponse.status, 200);
  const manifest = await responseJson(manifestResponse);
  assert.deepEqual(manifest.endpoints, {
    api: `${canonicalUrl}/api/v1`,
    profile: `${canonicalUrl}/api/v1/site`,
    entries: `${canonicalUrl}/api/v1/entries`,
  });

  const siteResponse = await fetchApp("/api/v1/site", {
    env,
    headers: { accept: "application/json" },
  });
  const collectionResponse = await fetchApp("/api/v1/entries", {
    env,
    headers: { accept: "application/json" },
  });
  const detailResponse = await fetchApp(`/api/v1/entries/${entry.id}`, {
    env,
    headers: { accept: "text/html" },
  });
  assert.deepEqual(Object.keys(await responseJson(siteResponse)).sort(), [
    "actions",
    "data",
    "links",
  ]);
  assert.deepEqual(Object.keys(await responseJson(collectionResponse)).sort(), [
    "actions",
    "data",
    "links",
    "pagination",
  ]);
  assert.deepEqual(Object.keys(await responseJson(detailResponse)), ["data"]);

  const v2 = await fetchApp("/api/v2", { env, headers: { accept: "application/json" } });
  assert.equal(v2.status, 404);
  assert.doesNotMatch(v2.headers.get("content-type") ?? "", /^application\/json\b/iu);
});

function errorDocument(code, message) {
  return { data: null, error: { code, message }, links: [] };
}

function assertApiJson(response, status, cacheControl) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  assert.equal(response.headers.get("cache-control"), cacheControl);
  assert.equal(response.headers.get("location"), null);
  assert(hasVaryToken(response, "accept"));
}

function assertMatchingHeadHeaders(head, get) {
  for (const name of ["content-type", "cache-control", "vary", "allow", "location"]) {
    assert.equal(head.headers.get(name), get.headers.get(name), name);
  }
}

function hasVaryToken(response, token) {
  return (response.headers.get("vary") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .includes(token);
}

function assertNoCanary(value) {
  const serialized = JSON.stringify(value);
  for (const canary of privateCanaries) assert.doesNotMatch(serialized, new RegExp(canary, "iu"));
  assert.doesNotMatch(serialized, /(?:HOST|FORWARDED|REQUEST_HOST|HTML_BROWSER)_PRIVATE_CANARY/iu);
}
