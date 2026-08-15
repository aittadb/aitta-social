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
import { expectedApiV1JsonLink } from "./helpers/api-v1-json-link.mjs";
import { assertMatchingApiV1HeadHeaders } from "./helpers/api-v1-head-response.mjs";

const canonicalUrl = "https://canonical.example/aitta";
const canaries = [
  "OWNER_PRIVATE_CANARY@example.test",
  "PROFILE_ROW_PRIVATE_CANARY",
  "DRAFT_PRIVATE_CANARY",
  "HUB_RUNTIME_PRIVATE_CANARY",
  "IDENTITY_HEADER_PRIVATE_CANARY@example.test",
  "COOKIE_PRIVATE_CANARY",
  "HOST_PRIVATE_CANARY.example",
  "STORAGE_PRIVATE_CANARY",
  "RUNTIME_PRIVATE_CANARY",
];

test("v1 profile returns the exact public singleton and canonical ordered relations", async () => {
  const profile = profileRow({
    display_name: "Northern Workshop",
    account_type: "company",
    short_description: "Public summary",
    introduction: "Public introduction",
    location: "Helsinki",
    website: "https://workshop.example/",
    external_links_json: JSON.stringify([
      { label: "Docs", url: "https://workshop.example/docs" },
    ]),
    canonical_url: "https://stored-private-canary.example",
    accent_color: "#123456",
    density: "compact",
    hide_powered_by: 1,
    private_canary: canaries[1],
    owner_email: canaries[0],
  });
  const db = new FakeD1({
    profile,
    entries: [entryRow({
      id: "draft-private",
      state: "draft",
      published_at: null,
      body: canaries[2],
    })],
  });
  const env = makeEnv({
    db,
    canonicalUrl: "https://CANONICAL.example/aitta///",
    ownerEmail: canaries[0],
    hubChallenge: canaries[3],
  });
  const response = await fetchApp("/api/v1/site?format=html", {
    env,
    origin: `https://${canaries[6]}`,
    headers: {
      accept: "application/json",
      authorization: "Bearer AUTHORIZATION_PRIVATE_CANARY",
      cookie: `session=${canaries[5]}`,
      host: canaries[6],
      "x-forwarded-host": canaries[6],
      "oai-authenticated-user-email": canaries[4],
      "user-agent": "HTML_BROWSER_PRIVATE_CANARY",
    },
  });

  assertApiJson(response, 200, "public, max-age=60");
  const body = await responseJson(response);
  assert.deepEqual(body, {
    data: {
      id: "profile",
      type: "profile",
      attributes: {
        displayName: "Northern Workshop",
        accountType: "company",
        shortDescription: "Public summary",
        introduction: "Public introduction",
        location: "Helsinki",
        website: "https://workshop.example/",
        externalLinks: [
          { label: "Docs", url: "https://workshop.example/docs" },
        ],
        canonicalUrl,
        presentation: {
          accentColor: "#123456",
          density: "compact",
          showPoweredBy: false,
        },
      },
    },
    links: [
      expectedApiV1JsonLink("self", `${canonicalUrl}/api/v1/site`),
      expectedApiV1JsonLink("profile", `${canonicalUrl}/api/v1/schema`),
      htmlLink("social.aitta.profile", canonicalUrl),
    ],
    actions: [],
  });
  assert.deepEqual(db.queries.map(({ operation }) => operation), ["first"]);
  assertNoCanary({ body, headers: Object.fromEntries(response.headers.entries()) });
});

test("v1 profile omits absent optional fields and retains stored canonical fallback", async () => {
  const db = new FakeD1({
    profile: profileRow({
      location: null,
      website: null,
      external_links_json: "[]",
      canonical_url: "https://STORED.example/profile///",
    }),
  });
  const response = await fetchApp("/api/v1/site", {
    env: makeEnv({ db }),
    origin: `https://${canaries[6]}`,
  });

  assertApiJson(response, 200, "public, max-age=60");
  const body = await responseJson(response);
  assert.equal(body.data.attributes.canonicalUrl, "https://stored.example/profile");
  assert.equal("location" in body.data.attributes, false);
  assert.equal("website" in body.data.attributes, false);
  assert.deepEqual(body.data.attributes.externalLinks, []);
  assert.deepEqual(body.links, [
    expectedApiV1JsonLink("self", "https://stored.example/profile/api/v1/site"),
    expectedApiV1JsonLink("profile", "https://stored.example/profile/api/v1/schema"),
    htmlLink("social.aitta.profile", "https://stored.example/profile"),
  ]);
  assert.doesNotMatch(JSON.stringify(body), /HOST_PRIVATE_CANARY/iu);
});

test("v1 profile reads no owner or Hub runtime setting", async () => {
  const env = makeEnv({ canonicalUrl });
  for (const name of ["AITTA_SOCIAL_OWNER_EMAIL", "AITTA_SOCIAL_HUB_CHALLENGE"]) {
    Object.defineProperty(env, name, {
      enumerable: true,
      get() {
        throw new Error(`${name}_${canaries[8]}`);
      },
    });
  }

  const response = await fetchApp("/api/v1/site", { env });
  assertApiJson(response, 200, "public, max-age=60");
  assert.equal((await responseJson(response)).data.id, "profile");
});

test("v1 profile applies bounded JSON-only Accept before D1", async () => {
  const accepted = [
    undefined,
    "*/*",
    "application/*",
    "application/json",
    "text/html, application/json;q=0.5",
    'application/json; charset="utf-8"',
  ];
  for (const accept of accepted) {
    const response = await fetchApp("/api/v1/site", {
      env: makeEnv({ canonicalUrl }),
      headers: accept === undefined ? {} : { accept },
    });
    assertApiJson(response, 200, "public, max-age=60");
  }

  const rejected = [
    "text/html",
    "application/json;q=0",
    "application/json;q=0, */*;q=1",
    "application/json;q=2",
    "application/json,",
    `${Array.from({ length: 16 }, () => "text/plain").join(",")},application/json`,
    `application/json;note=${"x".repeat(4096)}`,
  ];
  for (const accept of rejected) {
    const db = new FakeD1();
    const response = await fetchApp("/api/v1/site", {
      env: makeEnv({ db, canonicalUrl }),
      headers: { accept },
    });
    assertApiJson(response, 406, "no-store");
    assert.deepEqual(
      await responseJson(response),
      errorDocument(
        "not_acceptable",
        "This API route returns application/json.",
      ),
    );
    assert.deepEqual(db.queries, []);
  }
});

test("v1 profile has exact method, Allow, and HEAD behavior", async () => {
  const env = makeEnv({ canonicalUrl });
  const get = await fetchApp("/api/v1/site", { env });
  const head = await fetchApp("/api/v1/site", { env, method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assertMatchingApiV1HeadHeaders(head, get);

  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await fetchApp("/api/v1/site", { env, method });
    assertApiJson(response, 405, "no-store");
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assert.deepEqual(
      await responseJson(response),
      errorDocument(
        "method_not_allowed",
        "The request method is not supported for this API resource.",
      ),
    );
  }

  const rejectedHead = await fetchApp("/api/v1/site", {
    env,
    method: "HEAD",
    headers: { accept: "text/html" },
  });
  assertApiJson(rejectedHead, 406, "no-store");
  assert.equal(await rejectedHead.text(), "");
});

test("v1 profile preserves setup categories and bounds storage/runtime failures", async () => {
  const absent = await fetchApp("/api/v1/site", {
    env: makeEnv({ db: new FakeD1({ profile: null }), canonicalUrl }),
  });
  assertApiJson(absent, 404, "no-store");
  assert.deepEqual(
    await responseJson(absent),
    errorDocument(
      "profile_not_configured",
      "The Aitta profile has not been configured.",
    ),
  );

  const invalidCanonical = await fetchApp("/api/v1/site", {
    env: makeEnv({
      db: new FakeD1({ profile: profileRow({ canonical_url: "not a URL" }) }),
      canonicalUrl: "http://invalid.example",
    }),
  });
  assertApiJson(invalidCanonical, 503, "no-store");
  assert.deepEqual(
    await responseJson(invalidCanonical),
    errorDocument(
      "canonical_url_unconfigured",
      "Canonical URL is not configured.",
    ),
  );

  const storageFailure = await fetchApp("/api/v1/site", {
    env: makeEnv({
      db: {
        prepare() {
          throw new Error(canaries[7]);
        },
      },
      canonicalUrl,
    }),
  });
  assertApiJson(storageFailure, 500, "no-store");
  assert.deepEqual(
    await responseJson(storageFailure),
    errorDocument("internal_error", "The API request could not be completed."),
  );
  assertNoCanary(Object.fromEntries(storageFailure.headers.entries()));

  const runtime = makeEnv({ canonicalUrl });
  Object.defineProperty(runtime, "AITTA_SOCIAL_CANONICAL_URL", {
    enumerable: true,
    get() {
      throw new Error(canaries[8]);
    },
  });
  const runtimeFailure = await fetchApp("/api/v1/site", { env: runtime });
  assertApiJson(runtimeFailure, 500, "no-store");
  assert.deepEqual(
    await responseJson(runtimeFailure),
    errorDocument("internal_error", "The API request could not be completed."),
  );
});

test("v1 discovery advertises the profile and published collection", async () => {
  const env = makeEnv({
    canonicalUrl: "https://CANONICAL.example/aitta///",
    db: new FakeD1({ profile: profileRow({ account_type: "agent" }) }),
  });
  const root = await responseJson(await fetchApp("/api/v1", { env }));
  assert.deepEqual(root.links.map(({ rel, href }) => ({ rel, href })), [
    { rel: "self", href: `${canonicalUrl}/api/v1` },
    { rel: "profile", href: `${canonicalUrl}/api/v1/schema` },
    { rel: "social.aitta.profile", href: `${canonicalUrl}/api/v1/site` },
    { rel: "collection", href: `${canonicalUrl}/api/v1/entries` },
    { rel: "item", href: `${canonicalUrl}/api/v1/entries/{id}` },
    {
      rel: "social.aitta.manifest",
      href: `${canonicalUrl}/.well-known/aitta-social.json`,
    },
  ]);
  const schema = await responseJson(await fetchApp("/api/v1/schema", { env }));
  assert.deepEqual(schema.data.attributes.relations, [
    "self",
    "profile",
    "collection",
    "item",
    "alternate",
    "first",
    "previous",
    "next",
    "last",
    "social.aitta.profile",
    "social.aitta.manifest",
  ]);
  const manifest = await responseJson(
    await fetchApp("/.well-known/aitta-social.json", { env }),
  );
  assert.deepEqual(manifest.endpoints, {
    api: `${canonicalUrl}/api/v1`,
    profile: `${canonicalUrl}/api/v1/site`,
    entries: `${canonicalUrl}/api/v1/entries`,
    entryTemplate: `${canonicalUrl}/api/v1/entries/{id}`,
  });
  assert.equal(manifest.accountType, "agent");
});

function htmlLink(rel, href) {
  return { rel, href, mediaType: "text/html" };
}

function assertNoCanary(value) {
  const serialized = JSON.stringify(value);
  for (const canary of canaries) {
    assert.doesNotMatch(serialized, new RegExp(canary.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "iu"));
  }
  assert.doesNotMatch(serialized, /AUTHORIZATION_PRIVATE_CANARY|HTML_BROWSER_PRIVATE_CANARY/iu);
}
