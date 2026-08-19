import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  profileRow,
  responseJson,
  validEntryInput,
} from "./helpers/worker-harness.mjs";
import {
  compileRecordShapeAwareTypeScriptModule,
  importRecordShapeAwareTypeScriptModule,
} from "./helpers/record-shape-esm-compiler.mjs";
import { assertPrivateJson } from "./helpers/private-json-response.mjs";
import { throwingD1 } from "./helpers/throwing-d1.mjs";

const ownerEmail = "owner@example.com";
const canonicalUrl = "https://canonical.example/aitta";
const privateCanaries = [
  "OWNER_EMAIL_PRIVATE_CANARY@example.test",
  "STORAGE_PRIVATE_CANARY",
  "HOST_PRIVATE_CANARY",
  "PROFILE_ROW_PRIVATE_CANARY",
];

test("authorized draft creation returns one allowlisted owner-entry document", async () => {
  const db = new FakeD1({
    profile: profileRow({ private_canary: privateCanaries[3] }),
  });
  const input = validEntryInput({
    kind: "link",
    title: "Owner link",
    body: "Private body returned only to the verified owner.",
    destinationUrl: "https://example.com/private-draft-reference",
  });
  const response = await fetchApp("/api/private/entries", {
    env: makeEnv({ db, ownerEmail, canonicalUrl: `${canonicalUrl}///` }),
    origin: `https://${privateCanaries[2]}.example`,
    method: "POST",
    headers: {
      ...ownerHeaders(ownerEmail),
      origin: `https://${privateCanaries[2]}.example`,
      accept: "application/json",
      "content-type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      ...input,
      id: "ATTACKER_SELECTED_ID",
      state: "published",
      publishedAt: "2020-01-01T00:00:00.000Z",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    }),
  });

  assertPrivateJson(response, 201);
  const document = await responseJson(response);
  const { id, attributes } = document.data;
  const self = `/api/private/entries/${encodeURIComponent(id)}`;
  assert.match(id, /^[0-9a-f-]{36}$/iu);
  assert.deepEqual(attributes, {
    kind: input.kind,
    title: input.title,
    body: input.body,
    destinationUrl: input.destinationUrl,
    state: "draft",
    publishedAt: null,
    createdAt: attributes.createdAt,
    updatedAt: attributes.updatedAt,
  });
  assert.match(attributes.createdAt, /^\d{4}-\d{2}-\d{2}T/iu);
  assert.equal(attributes.updatedAt, attributes.createdAt);
  assert.deepEqual(document.links, [
    { rel: "self", href: self, mediaType: "application/json" },
    { rel: "alternate", href: `/owner/entries/${encodeURIComponent(id)}`, mediaType: "text/html" },
  ]);
  assert.deepEqual(document.actions, [
    { rel: "edit", method: "PUT", href: self, requestMediaType: "application/json" },
    { rel: "publish", method: "PUT", href: `${self}/state`, requestMediaType: "application/json" },
    { rel: "delete", method: "DELETE", href: self },
  ]);
  assert.equal(db.mutations.length, 1);
  assert.equal(db.entries[0].state, "draft");
  assert.equal(db.entries[0].published_at, null);
  assertNoCanary(document);
});

test("all four update kinds retain exact accepted values and stay private", async () => {
  const db = new FakeD1();
  const env = makeEnv({ db, ownerEmail, canonicalUrl });
  const fixtures = [
    validEntryInput({ kind: "note", title: null, body: "Private note.", destinationUrl: null }),
    validEntryInput({ kind: "article", title: "Article", body: "Private article.", destinationUrl: null }),
    validEntryInput({ kind: "announcement", title: "Announcement", body: "Private announcement.", destinationUrl: null }),
    validEntryInput({ kind: "link", title: null, body: "Private link.", destinationUrl: "https://example.com/resource" }),
  ];

  for (const fixture of fixtures) {
    const response = await createWith({ db, body: JSON.stringify(fixture) });
    assertPrivateJson(response, 201);
    const document = await responseJson(response);
    assert.deepEqual(
      {
        kind: document.data.attributes.kind,
        title: document.data.attributes.title,
        body: document.data.attributes.body,
        destinationUrl: document.data.attributes.destinationUrl,
      },
      fixture,
    );
    assert.equal(document.data.attributes.state, "draft");

    const id = document.data.id;
    const [home, permalink, detail, collection] = await Promise.all([
      fetchApp("/", { env, headers: { accept: "text/html" } }),
      fetchApp(`/entries/${id}`, { env, headers: { accept: "text/html" } }),
      fetchApp(`/api/v1/entries/${id}`, { env }),
      fetchApp("/api/v1/entries", { env }),
    ]);
    assert.equal(permalink.status, 404);
    assert.equal(detail.status, 404);
    const publicProjection = `${await home.text()}\n${await permalink.text()}\n${JSON.stringify(await responseJson(detail))}\n${JSON.stringify(await responseJson(collection))}`;
    assert.doesNotMatch(publicProjection, new RegExp(fixture.body, "iu"));
  }
});

test("draft-create JSON negotiation is bounded and defaults to JSON", async () => {
  for (const accept of [
    undefined,
    "*/*",
    "application/*",
    "application/json",
    "text/html, application/json;q=0.5",
  ]) {
    const response = await createWith({
      headers: accept === undefined ? {} : { accept },
    });
    assertPrivateJson(response, 201);
  }

  for (const accept of [
    "text/html",
    "application/json;q=0",
    "application/json;q=0, */*;q=1",
    "application/json,",
    "application/json;q=2",
    `application/json;note=${"x".repeat(4096)}`,
  ]) {
    const db = throwingD1(privateCanaries[1]);
    const response = await createWith({ db, headers: { accept } });
    assertPrivateJson(response, 406);
    assert.equal((await responseJson(response)).error.code, "not_acceptable");
  }
});

test("media, syntax, size, and domain failures have distinct JSON statuses", async (t) => {
  for (const [label, contentType] of [
    ["missing", null],
    ["unsupported", "text/plain"],
    ["non-UTF-8 charset", "application/json; charset=iso-8859-1"],
    ["unknown parameter", "application/json; profile=private"],
    ["excessive header", `application/json;${"x".repeat(1024)}`],
  ]) {
    await t.test(`${label} media type`, async () => {
      const db = new FakeD1();
      const headers = mutationHeaders(ownerEmail);
      if (contentType === null) delete headers["content-type"];
      else headers["content-type"] = contentType;
      const response = await fetchApp("/api/private/entries", {
        env: makeEnv({ db, ownerEmail, canonicalUrl }),
        method: "POST",
        headers,
        body: JSON.stringify(validEntryInput()),
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
      const db = new FakeD1();
      const response = await createWith({ db, body });
      assertPrivateJson(response, 400);
      assert.equal((await responseJson(response)).error.code, code);
      assert.equal(db.mutations.length, 0);
    });
  }

  await t.test("invalid UTF-8 JSON", async () => {
    const db = new FakeD1();
    const response = await fetchApp("/api/private/entries", {
      env: makeEnv({ db, ownerEmail, canonicalUrl }),
      method: "POST",
      headers: mutationHeaders(ownerEmail),
      body: new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]),
    });
    assertPrivateJson(response, 400);
    assert.equal((await responseJson(response)).error.code, "invalid_json");
    assert.equal(db.mutations.length, 0);
  });

  await t.test("valid JSON with invalid update values", async () => {
    const db = new FakeD1();
    const response = await createWith({
      db,
      body: JSON.stringify(validEntryInput({
        kind: "not-a-kind",
        body: " ",
        destinationUrl: "javascript:BODY_PRIVATE_CANARY",
      })),
    });
    assertPrivateJson(response, 422);
    const body = await responseJson(response);
    assert.equal(body.error.code, "validation_failed");
    assert.deepEqual(body.error.fields.map(({ name, code }) => ({ name, code })), [
      { name: "kind", code: "invalid" },
      { name: "body", code: "invalid" },
      { name: "destinationUrl", code: "invalid" },
    ]);
    assert.equal(db.mutations.length, 0);
    assertNoCanary(body);
  });
});

test("same-origin and owner denials precede Accept, media, body, and D1", async () => {
  const cases = [
    {
      label: "cross origin",
      env: makeEnv({ db: throwingD1(privateCanaries[1]), ownerEmail }),
      headers: { ...ownerHeaders(ownerEmail), origin: "https://attacker.example" },
      status: 403,
      code: "authorization_denied",
    },
    {
      label: "signed out",
      env: makeEnv({ db: throwingD1(privateCanaries[1]), ownerEmail }),
      headers: { origin: "https://account.example" },
      status: 401,
      code: "authentication_required",
    },
    {
      label: "machine bearer without browser identity",
      env: makeEnv({ db: throwingD1(privateCanaries[1]), ownerEmail }),
      headers: {
        origin: "https://account.example",
        authorization: "Bearer MACHINE_PRIVATE_CANARY",
        cookie: "owner=OWNER_EMAIL_PRIVATE_CANARY@example.test",
      },
      status: 401,
      code: "authentication_required",
    },
    {
      label: "non-owner",
      env: makeEnv({ db: throwingD1(privateCanaries[1]), ownerEmail }),
      headers: { ...ownerHeaders("other@example.com"), origin: "https://account.example" },
      status: 403,
      code: "authorization_denied",
    },
    {
      label: "missing owner",
      env: makeEnv({ db: throwingD1(privateCanaries[1]) }),
      headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example" },
      status: 503,
      code: "owner_unavailable",
    },
  ];

  for (const fixture of cases) {
    const response = await fetchApp("/api/private/entries", {
      env: fixture.env,
      method: "POST",
      headers: { ...fixture.headers, accept: "text/html", "content-type": "text/plain" },
      body: "BODY_PRIVATE_CANARY",
    });
    assertPrivateJson(response, fixture.status);
    const document = await responseJson(response);
    assert.equal(document.error.code, fixture.code, fixture.label);
    assertNoCanary(document);
  }

  let bodyPulls = 0;
  const unreadBody = new ReadableStream({
    pull(controller) {
      bodyPulls += 1;
      controller.enqueue(new TextEncoder().encode("BODY_PRIVATE_CANARY"));
      controller.close();
    },
  }, { highWaterMark: 0 });
  globalThis[Symbol.for("aitta-social.test.cloudflare-env")] = makeEnv({
    db: throwingD1(privateCanaries[1]),
    ownerEmail,
  });
  const route = await compiledPrivateEntryCreateRoute();
  const denied = await route.POST(new Request("https://account.example/api/private/entries", {
    method: "POST",
    headers: {
      ...ownerHeaders(ownerEmail),
      origin: "https://attacker.example",
      accept: "application/json",
      "content-type": "application/json",
    },
    body: unreadBody,
    duplex: "half",
  }));
  assertPrivateJson(denied, 403);
  assert.equal(bodyPulls, 0, "authorization denial must not pull the request body stream");
});

test("creation needs no profile or canonical setup and failures remain safe", async (t) => {
  const locallyUsable = new FakeD1({ profile: null });
  const localResponse = await fetchApp("/api/private/entries", {
    env: makeEnv({ db: locallyUsable, ownerEmail }),
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput()),
  });
  assertPrivateJson(localResponse, 201);
  const localDocument = await responseJson(localResponse);
  assert.match(localDocument.links[0].href, /^\/api\/private\/entries\//u);
  assert.match(localDocument.links[1].href, /^\/owner\/entries\//u);
  assert.equal(locallyUsable.mutations.length, 1);
  assert.equal(
    locallyUsable.queries.some(({ sql }) => /from\s+profiles/iu.test(sql)),
    false,
    "draft creation must not query profile setup before inserting",
  );

  for (const method of ["GET", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    for (const accept of [undefined, "application/json", "text/html", "application/json;q=0", "application/json,"]) {
      await t.test(`${method} with ${accept ?? "missing Accept"}`, async () => {
        const response = await fetchApp("/api/private/entries", {
          env: makeEnv({ db: throwingD1(privateCanaries[1]), ownerEmail }),
          method,
          headers: accept === undefined ? {} : { accept },
        });
        assertPrivateJson(response, 405);
        assert.equal(response.headers.get("allow"), "POST");
        assert.equal((await responseJson(response)).error.code, "method_not_allowed");
      });
    }
  }

  for (const accept of [undefined, "application/json", "text/html", "application/json;q=0", "application/json,"]) {
    const head = await fetchApp("/api/private/entries", {
      env: makeEnv({ db: throwingD1(privateCanaries[1]), ownerEmail }),
      method: "HEAD",
      headers: accept === undefined ? {} : { accept },
    });
    assertPrivateJson(head, 405);
    assert.equal(head.headers.get("allow"), "POST");
  }

  const response = await createWith({ db: throwingD1(privateCanaries[1]) });
  assertPrivateJson(response, 500);
  const document = await responseJson(response);
  assert.equal(document.error.code, "create_failed");
  assertNoCanary(document);
});

test("unexpected authorization-setting failure is safe JSON before D1", async () => {
  const env = makeEnv({ db: throwingD1(privateCanaries[1]), ownerEmail });
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
    const response = await fetchApp("/api/private/entries", {
      env,
      method: "POST",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validEntryInput()),
    });
    assertPrivateJson(response, 500);
    assert.deepEqual(await responseJson(response), {
      data: null,
      error: {
        code: "create_failed",
        message: "The private draft creation result could not be confirmed.",
      },
      links: [],
    });
    assert.equal(logged.length, 0);
  } finally {
    console.error = originalConsoleError;
  }
});

test("new-draft client confirms only the exact 201 private-draft document", async () => {
  const privateEntryErrorFieldNameUrl = await compileRecordShapeAwareTypeScriptModule(
    new URL("../app/owner/entries/private-entry-error-field-name.ts", import.meta.url),
  );
  const { readDraftCreateResponse } = await importRecordShapeAwareTypeScriptModule(
    new URL("../app/owner/entries/draft-create-response.ts", import.meta.url),
    { "./private-entry-error-field-name": privateEntryErrorFieldNameUrl },
  );
  const document = draftDocument();
  assert.deepEqual(
    await readDraftCreateResponse(Response.json(document, { status: 201 })),
    { outcome: "success", id: "11111111-1111-4111-8111-111111111111" },
  );
  const longDestination = `https://example.com/${"a".repeat(5000)}`;
  assert.deepEqual(
    await readDraftCreateResponse(Response.json({
      ...document,
      data: {
        ...document.data,
        attributes: {
          ...document.data.attributes,
          destinationUrl: longDestination,
        },
      },
    }, { status: 201 })),
    { outcome: "success", id: "11111111-1111-4111-8111-111111111111" },
  );
  for (const response of [
    new Response(null, { status: 204 }),
    new Response("not JSON", { status: 201 }),
    Response.json({ ...document, data: { ...document.data, ownerEmail: "PRIVATE_CANARY" } }, { status: 201 }),
    Response.json({ ...document, actions: [] }, { status: 201 }),
    Response.json({ ...document, data: { ...document.data, attributes: { ...document.data.attributes, body: "" } } }, { status: 201 }),
    Response.json({ ...document, data: { ...document.data, attributes: { ...document.data.attributes, title: "x".repeat(201) } } }, { status: 201 }),
    Response.json({ ...document, data: { ...document.data, attributes: { ...document.data.attributes, destinationUrl: "javascript:PRIVATE_CANARY" } } }, { status: 201 }),
    Response.json({ ...document, data: { ...document.data, attributes: { ...document.data.attributes, createdAt: "2026-02-30T10:00:00.000Z" } } }, { status: 201 }),
    Response.json({ error: "PRIVATE_CANARY" }, { status: 500 }),
    Response.json({ data: null, error: { code: "redirected", message: "Not definitive." }, links: [] }, { status: 302 }),
    new Response("not JSON", { status: 404, headers: { "content-type": "text/plain" } }),
    Response.json({ error: { message: "Wrong shape." } }, { status: 422 }),
  ]) {
    assert.deepEqual(await readDraftCreateResponse(response), { outcome: "unconfirmed" });
  }

  let responsePulls = 0;
  const oversized = new Response(new ReadableStream({
    pull(controller) {
      responsePulls += 1;
      if (responsePulls > 100) return controller.close();
      controller.enqueue(new Uint8Array(16 * 1024));
    },
  }, { highWaterMark: 0 }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
  assert.deepEqual(await readDraftCreateResponse(oversized), { outcome: "unconfirmed" });
  assert.ok(responsePulls <= 6, `response body was not cancelled at its bound: ${responsePulls} pulls`);
  assert.deepEqual(
    await readDraftCreateResponse(Response.json({
      data: null,
      error: {
        code: "validation_failed",
        message: "The submitted update values are invalid.",
        fields: [
          { name: "entryKind", code: "invalid", message: "Choose a kind." },
          { name: "unknown", code: "invalid", message: "Do not expose this field." },
          { name: "kind", code: "invalid", message: "Second kind message." },
        ],
      },
      links: [],
    }, { status: 422 })),
    {
      outcome: "definitive-error",
      message: "Update was not saved. Correct the highlighted fields and try again.",
      fieldErrors: { kind: "Choose a kind." },
    },
  );
  assert.deepEqual(
    await readDraftCreateResponse(Response.json({
      data: null,
      error: {
        code: "validation_failed",
        message: "The submitted update values are invalid.",
        fields: [{ name: "destinationUrl", code: "invalid", message: "x".repeat(241) }],
      },
      links: [],
    }, { status: 422 })),
    { outcome: "unconfirmed" },
  );
});

test("EntryForm keeps the strict create parser alongside strict edit response handling", async () => {
  const source = await readFile(
    new URL("../app/owner/entries/EntryForm.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /import \{ readDraftCreateResponse \} from "\.\/draft-create-response"/u);
  assert.match(source, /import \{ createEntryRequest, editEntryRequest \} from "\.\/entry-mutation-requests"/u);
  assert.doesNotMatch(source, /\bfetch\s*\(/u);
  assert.match(source, /if \(!entry\) \{[\s\S]*readDraftCreateResponse\(response\)[\s\S]*result\.outcome === "success"[\s\S]*window\.location\.assign\(`\/owner\/entries\/\$\{encodeURIComponent\(result\.id\)\}`\)/u);
  assert.match(source, /if \(result\.outcome === "unconfirmed"\) \{[\s\S]*showUnconfirmedSave\(\)/u);
  assert.match(source, /setFieldErrors\(result\.fieldErrors\)[\s\S]*focusFirstInvalidField\(formElement, result\.fieldErrors\)/u);
  assert.match(source, /const result = await readEntryEditResponse\(response/u);
  assert.doesNotMatch(source, /as \{ data: Entry \}/u);
});

async function createWith({
  db = new FakeD1(),
  canonicalUrl: configuredCanonical = canonicalUrl,
  headers = {},
  body,
} = {}) {
  return fetchApp("/api/private/entries", {
    env: makeEnv({ db, ownerEmail, canonicalUrl: configuredCanonical }),
    method: "POST",
    headers: { ...mutationHeaders(ownerEmail), ...headers },
    body: body ?? JSON.stringify(validEntryInput()),
  });
}

function draftDocument() {
  const id = "11111111-1111-4111-8111-111111111111";
  const self = `/api/private/entries/${id}`;
  return {
    data: {
      id,
      type: "owner-entry",
      attributes: {
        kind: "note",
        title: null,
        body: "Draft body.",
        destinationUrl: null,
        state: "draft",
        publishedAt: null,
        createdAt: "2026-08-13T10:00:00.000Z",
        updatedAt: "2026-08-13T10:00:00.000Z",
      },
    },
    links: [
      { rel: "self", href: self, mediaType: "application/json" },
      { rel: "alternate", href: `/owner/entries/${id}`, mediaType: "text/html" },
    ],
    actions: [
      { rel: "edit", method: "PUT", href: self, requestMediaType: "application/json" },
      { rel: "publish", method: "PUT", href: `${self}/state`, requestMediaType: "application/json" },
      { rel: "delete", method: "DELETE", href: self },
    ],
  };
}

function assertNoCanary(value) {
  const source = JSON.stringify(value);
  for (const canary of privateCanaries) assert.doesNotMatch(source, new RegExp(canary, "iu"));
  assert.doesNotMatch(source, /BODY_PRIVATE_CANARY|AUTH_RUNTIME_PRIVATE_CANARY|MACHINE_PRIVATE_CANARY/iu);
}


async function compiledPrivateEntryCreateRoute() {
  const directory = new URL("../dist/server/_next/static/", import.meta.url);
  for (const name of await readdir(directory)) {
    if (!/^route-.+\.js$/u.test(name)) continue;
    const url = new URL(name, directory);
    const source = await readFile(url, "utf8");
    if (source.includes("The private draft creation result could not be confirmed.")) {
      return import(`${url.href}?task194-body-sentinel`);
    }
  }
  throw new Error("Compiled TASK-194 private entry create route was not found.");
}
