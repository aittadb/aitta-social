import assert from "node:assert/strict";
import test from "node:test";

import {
  FakeD1,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  responseJson,
  validProfileInput,
} from "./helpers/worker-harness.mjs";
import { importRecordShapeAwareTypeScriptModule } from "./helpers/record-shape-esm-compiler.mjs";

const ownerEmail = "owner@example.com";
const canonicalUrl = "https://canonical.example/aitta";
const privateCanaries = [
  "OWNER_PROFILE_PRIVATE_CANARY",
  "OWNER_EMAIL_PRIVATE_CANARY@example.test",
  "STORAGE_PRIVATE_CANARY",
  "HOST_PRIVATE_CANARY",
];

test("authorized profile save returns one allowlisted owner hypermedia resource", async () => {
  const db = new FakeD1({ profile: null });
  const input = validProfileInput({
    accountType: privateCanaries[0],
    displayName: "Saved Identity",
    canonicalUrl: "https://stored.example/fallback///",
  });
  const response = await fetchApp("/api/private/profile", {
    env: makeEnv({ db, ownerEmail, canonicalUrl: `${canonicalUrl}///` }),
    origin: `https://${privateCanaries[3]}.example`,
    method: "PUT",
    headers: {
      ...ownerHeaders(ownerEmail),
      origin: `https://${privateCanaries[3]}.example`,
      accept: "application/json",
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(input),
  });

  assertPrivateJson(response, 200);
  const document = await responseJson(response);
  assert.deepEqual(document, {
    data: {
      id: "profile",
      type: "owner-profile",
      attributes: {
        displayName: "Saved Identity",
        shortDescription: input.shortDescription,
        introduction: input.introduction,
        location: input.location,
        website: input.website,
        externalLinks: input.externalLinks,
        canonicalUrl: "https://stored.example/fallback",
        accentColor: input.accentColor,
        density: input.density,
        hidePoweredBy: input.hidePoweredBy,
      },
    },
    links: [
      { rel: "self", href: `${canonicalUrl}/api/private/profile`, mediaType: "application/json" },
      { rel: "alternate", href: `${canonicalUrl}/owner/profile`, mediaType: "text/html" },
      { rel: "public-profile", href: canonicalUrl, mediaType: "text/html" },
    ],
    actions: [{
      rel: "edit",
      method: "PUT",
      href: `${canonicalUrl}/api/private/profile`,
      requestMediaType: "application/json",
    }],
  });
  assert.equal(db.mutations.length, 1);
  assert.equal(db.profile.account_type, "other");
  assertNoCanary(document);
});

test("profile JSON negotiation is bounded and defaults to JSON", async () => {
  const accepted = [
    undefined,
    "*/*",
    "application/*",
    "application/json",
    "text/html, application/json;q=0.5",
  ];
  for (const accept of accepted) {
    const response = await saveWith({
      headers: accept === undefined ? {} : { accept },
    });
    assertPrivateJson(response, 200);
  }

  const rejected = [
    "text/html",
    "application/json;q=0",
    "application/json;q=0, */*;q=1",
    "application/json,",
    "application/json;q=2",
    `application/json;note=${"x".repeat(4096)}`,
  ];
  for (const accept of rejected) {
    const db = new FakeD1({ profile: null });
    const response = await saveWith({ db, headers: { accept } });
    assertPrivateJson(response, 406);
    assert.equal((await responseJson(response)).error.code, "not_acceptable");
    assert.equal(db.mutations.length, 0);
  }
});

test("profile media, syntax, size, and domain failures have distinct JSON statuses", async (t) => {
  for (const [label, contentType] of [
    ["missing", null],
    ["unsupported", "text/plain"],
    ["non-UTF-8 charset", "application/json; charset=iso-8859-1"],
    ["unknown parameter", "application/json; profile=private"],
    ["excessive header", `application/json;${"x".repeat(1024)}`],
  ]) {
    await t.test(`${label} media type`, async () => {
      const db = new FakeD1({ profile: null });
      const headers = mutationHeaders(ownerEmail);
      if (contentType === null) delete headers["content-type"];
      else headers["content-type"] = contentType;
      const response = await fetchApp("/api/private/profile", {
        env: makeEnv({ db, ownerEmail }),
        method: "PUT",
        headers,
        body: JSON.stringify(validProfileInput()),
      });
      assertPrivateJson(response, 415);
      assert.equal((await responseJson(response)).error.code, "unsupported_media_type");
      assert.equal(db.mutations.length, 0);
    });
  }

  for (const [label, body, code] of [
    ["malformed", "{", "invalid_json"],
    ["empty", "", "invalid_json"],
    ["oversized", JSON.stringify({ value: "x".repeat(64 * 1024) }), "request_too_large"],
  ]) {
    await t.test(`${label} JSON`, async () => {
      const db = new FakeD1({ profile: null });
      const response = await saveWith({ db, body });
      assertPrivateJson(response, 400);
      assert.equal((await responseJson(response)).error.code, code);
      assert.equal(db.mutations.length, 0);
    });
  }

  await t.test("valid JSON with invalid profile values", async () => {
    const db = new FakeD1({ profile: null });
    const response = await saveWith({
      db,
      body: JSON.stringify(validProfileInput({
        displayName: "",
        website: "javascript:PRIVATE_CANARY",
      })),
    });
    assertPrivateJson(response, 422);
    const body = await responseJson(response);
    assert.equal(body.error.code, "validation_failed");
    assert.deepEqual(body.error.fields.map(({ name, code }) => ({ name, code })), [
      { name: "displayName", code: "invalid" },
      { name: "website", code: "invalid" },
    ]);
    assert.equal(db.mutations.length, 0);
    assertNoCanary(body);
  });
});

test("same-origin and owner denials precede media, body, and D1", async () => {
  const cases = [
    {
      label: "cross origin",
      env: makeEnv({ db: throwingD1(), ownerEmail }),
      headers: { ...ownerHeaders(ownerEmail), origin: "https://attacker.example" },
      status: 403,
      code: "authorization_denied",
    },
    {
      label: "signed out",
      env: makeEnv({ db: throwingD1(), ownerEmail }),
      headers: { origin: "https://account.example" },
      status: 401,
      code: "authentication_required",
    },
    {
      label: "non-owner",
      env: makeEnv({ db: throwingD1(), ownerEmail }),
      headers: { ...ownerHeaders("other@example.com"), origin: "https://account.example" },
      status: 403,
      code: "authorization_denied",
    },
    {
      label: "missing owner",
      env: makeEnv({ db: throwingD1() }),
      headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example" },
      status: 503,
      code: "owner_unavailable",
    },
  ];

  for (const fixture of cases) {
    const response = await fetchApp("/api/private/profile", {
      env: fixture.env,
      method: "PUT",
      headers: { ...fixture.headers, accept: "text/html", "content-type": "text/plain" },
      body: "BODY_PRIVATE_CANARY",
    });
    assertPrivateJson(response, fixture.status);
    assert.equal((await responseJson(response)).error.code, fixture.code, fixture.label);
  }
});

test("unsupported methods and storage failures remain structured and safe", async (t) => {
  for (const method of ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]) {
    await t.test(method, async () => {
      const response = await fetchApp("/api/private/profile", {
        env: makeEnv({ db: throwingD1(), ownerEmail }),
        method,
        headers: { accept: "application/json" },
      });
      assertPrivateJson(response, 405);
      assert.equal(response.headers.get("allow"), "PUT");
      assert.equal((await responseJson(response)).error.code, "method_not_allowed");
    });
  }

  const head = await fetchApp("/api/private/profile", {
    env: makeEnv({ db: throwingD1(), ownerEmail }),
    method: "HEAD",
    headers: { accept: "application/json" },
  });
  assertPrivateJson(head, 405);
  assert.equal(head.headers.get("allow"), "PUT");
  assert.equal((await responseJson(head)).error.code, "method_not_allowed");

  const response = await saveWith({ db: throwingD1() });
  assertPrivateJson(response, 500);
  const document = await responseJson(response);
  assert.equal(document.error.code, "save_failed");
  assertNoCanary(document);
});

test("unexpected authorization-setting failure is safe JSON before D1", async () => {
  const env = makeEnv({ db: throwingD1(), ownerEmail });
  Object.defineProperty(env, "AITTA_SOCIAL_OWNER_EMAIL", {
    enumerable: true,
    get() {
      throw new Error("AUTH_RUNTIME_PRIVATE_CANARY");
    },
  });
  const originalConsoleError = console.error;
  const logged = [];
  console.error = (...values) => logged.push(values.map(String).join(" "));
  try {
    const response = await fetchApp("/api/private/profile", {
      env,
      method: "PUT",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validProfileInput()),
    });
    assertPrivateJson(response, 500);
    assert.deepEqual(await responseJson(response), {
      data: null,
      error: {
        code: "save_failed",
        message: "The Identity save result could not be confirmed.",
      },
      links: [],
    });
    assert.equal(logged.length, 0);
  } finally {
    console.error = originalConsoleError;
  }
});

test("Identity client confirms only the exact JSON success document", async () => {
  const { readProfileSaveResponse } = await importRecordShapeAwareTypeScriptModule(
    new URL("../app/owner/profile/profile-save-response.ts", import.meta.url),
  );
  const successDocument = {
    data: {
      id: "profile",
      type: "owner-profile",
      attributes: {
        displayName: "Name",
        shortDescription: "Description",
        introduction: "Introduction",
        location: null,
        website: null,
        externalLinks: [],
        canonicalUrl: "https://account.example",
        accentColor: "#31554d",
        density: "comfortable",
        hidePoweredBy: false,
      },
    },
    links: [
      { rel: "self", href: "https://account.example/api/private/profile", mediaType: "application/json" },
      { rel: "alternate", href: "https://account.example/owner/profile", mediaType: "text/html" },
      { rel: "public-profile", href: "https://account.example", mediaType: "text/html" },
    ],
    actions: [{
      rel: "edit",
      method: "PUT",
      href: "https://account.example/api/private/profile",
      requestMediaType: "application/json",
    }],
  };
  assert.deepEqual(
    await readProfileSaveResponse(Response.json(successDocument)),
    { outcome: "success" },
  );
  assert.deepEqual(
    await readProfileSaveResponse(new Response(null, { status: 204 })),
    { outcome: "unconfirmed" },
  );
  assert.deepEqual(
    await readProfileSaveResponse(new Response("not JSON", { status: 200 })),
    { outcome: "unconfirmed" },
  );
  assert.deepEqual(
    await readProfileSaveResponse(Response.json({
      ...successDocument,
      data: { ...successDocument.data, ownerEmail: "PRIVATE_CANARY" },
    })),
    { outcome: "unconfirmed" },
  );
  assert.deepEqual(
    await readProfileSaveResponse(Response.json({ error: "PRIVATE_CANARY" }, { status: 500 })),
    { outcome: "unconfirmed" },
  );
  assert.deepEqual(
    await readProfileSaveResponse(Response.json({
      data: null,
      error: {
        code: "validation_failed",
        message: "The submitted profile values are invalid.",
        fields: [{ name: "externalLinks.0.url", code: "invalid", message: "Use a public URL." }],
      },
      links: [],
    }, { status: 422 })),
    {
      outcome: "definitive-error",
      message: "Identity was not saved. Correct the highlighted fields and try again.",
      fieldErrors: { externalLinks: "Use a public URL." },
    },
  );
});

async function saveWith({ db = new FakeD1({ profile: null }), headers = {}, body } = {}) {
  return fetchApp("/api/private/profile", {
    env: makeEnv({ db, ownerEmail, canonicalUrl }),
    method: "PUT",
    headers: { ...mutationHeaders(ownerEmail), ...headers },
    body: body ?? JSON.stringify(validProfileInput()),
  });
}

function assertPrivateJson(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok(
    (response.headers.get("vary") ?? "").split(",").map((value) => value.trim()).includes("Accept"),
  );
}

function assertNoCanary(value) {
  const source = JSON.stringify(value);
  for (const canary of privateCanaries) assert.doesNotMatch(source, new RegExp(canary, "iu"));
  assert.doesNotMatch(source, /BODY_PRIVATE_CANARY|javascript:PRIVATE_CANARY/iu);
}

function throwingD1() {
  return {
    prepare() {
      throw new Error(privateCanaries[2]);
    },
  };
}
