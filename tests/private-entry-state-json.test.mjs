import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  responseJson,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";
const entryId = "19600000-0000-4000-8000-000000000001";
const privateCanaries = [
  "STATE_OWNER_PRIVATE_CANARY@example.test",
  "STATE_STORAGE_PRIVATE_CANARY",
  "STATE_ROW_PRIVATE_CANARY",
];

test("publication transitions return exact owner-entry resources and retain accepted timestamps", async () => {
  const row = entryRow({
    id: entryId,
    state: "draft",
    published_at: null,
    body: "Publication state body.",
    private_canary: privateCanaries[2],
  });
  const db = new FakeD1({ entries: [row] });
  const env = makeEnv({ db, ownerEmail });

  const publishedResponse = await stateWith(entryId, "published", { db });
  assertPrivateJson(publishedResponse, 200);
  const published = await responseJson(publishedResponse);
  assertOwnerEntryState(published, row, "published");
  assert.ok(published.data.attributes.publishedAt);
  const firstPublication = published.data.attributes.publishedAt;
  assert.match(db.mutations[0].sql, /published_at = COALESCE\(published_at, \?\)/u);
  assert.deepEqual(db.mutations[0].values.slice(-2), [published.data.attributes.updatedAt, entryId]);

  const publicDetail = await fetchApp(`/api/v1/entries/${entryId}`, { env });
  assert.equal(publicDetail.status, 200);
  assert.equal((await responseJson(publicDetail)).data.attributes.body, row.body);

  const draftResponse = await stateWith(entryId, "draft", { db });
  assertPrivateJson(draftResponse, 200);
  const draft = await responseJson(draftResponse);
  assertOwnerEntryState(draft, { ...row, published_at: firstPublication }, "draft");
  assert.equal(draft.data.attributes.publishedAt, firstPublication, "unpublish retains history");
  assert.match(db.mutations[1].sql, /UPDATE entries SET state = \?, updated_at = \? WHERE id = \?/u);

  const [hiddenHtml, hiddenJson, collection] = await Promise.all([
    fetchApp(`/entries/${entryId}`, { env, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${entryId}`, { env }),
    fetchApp("/api/v1/entries", { env }),
  ]);
  assert.equal(hiddenHtml.status, 404);
  assert.equal(hiddenJson.status, 404);
  const publicBytes = `${await hiddenHtml.text()}\n${JSON.stringify(await responseJson(hiddenJson))}\n${JSON.stringify(await responseJson(collection))}`;
  assert.doesNotMatch(publicBytes, new RegExp(row.body, "u"));
  assertNoCanary(published);
  assertNoCanary(draft);
});

test("same-state transitions remain accepted and do not invent a conflict", async () => {
  const publishedAt = "2026-08-13T10:00:00.000Z";
  const db = new FakeD1({ entries: [entryRow({ id: entryId, published_at: publishedAt })] });
  const response = await stateWith(entryId, "published", { db });
  assertPrivateJson(response, 200);
  const document = await responseJson(response);
  assert.equal(document.data.attributes.state, "published");
  assert.equal(document.data.attributes.publishedAt, publishedAt);
  assert.notEqual(response.status, 409);
});

test("state JSON negotiation defaults to JSON and precedes media and D1", async () => {
  for (const accept of [undefined, "*/*", "application/*", "application/json", "text/html, application/json;q=0.5"]) {
    const response = await stateWith(entryId, "published", {
      headers: accept === undefined ? {} : { accept },
    });
    assertPrivateJson(response, 200);
  }

  for (const accept of [
    "text/html",
    "application/json;q=0",
    "application/json;q=0, */*;q=1",
    "application/json,",
    "application/json;q=2",
    `application/json;note=${"x".repeat(4096)}`,
  ]) {
    const response = await stateWith(entryId, "published", {
      db: throwingD1(),
      headers: { accept, "content-type": "text/plain" },
    });
    assertPrivateJson(response, 406);
    assert.equal((await responseJson(response)).error.code, "not_acceptable");
  }
});

test("state media, JSON, and exact-domain failures use distinct statuses without D1", async (t) => {
  for (const [label, contentType] of [
    ["missing", null],
    ["unsupported", "text/plain"],
    ["non-UTF-8", "application/json; charset=iso-8859-1"],
    ["unknown parameter", "application/json; profile=private"],
    ["excessive header", `application/json;${"x".repeat(1024)}`],
  ]) {
    await t.test(`${label} media`, async () => {
      const db = stateDatabase();
      const headers = { ...mutationHeaders(ownerEmail), accept: "application/json" };
      if (contentType === null) delete headers["content-type"];
      else headers["content-type"] = contentType;
      const response = await fetchApp(`/api/private/entries/${entryId}/state`, {
        env: makeEnv({ db, ownerEmail }), method: "PUT", headers, body: JSON.stringify({ state: "published" }),
      });
      assertPrivateJson(response, 415);
      assert.equal((await responseJson(response)).error.code, "unsupported_media_type");
      assert.equal(db.mutations.length, 0);
    });
  }

  for (const [label, body, code] of [
    ["malformed", "{", "invalid_json"],
    ["empty", "", "invalid_json"],
    ["oversized", JSON.stringify({ state: "published", value: "x".repeat(64 * 1024) }), "request_too_large"],
  ]) {
    await t.test(`${label} JSON`, async () => {
      const db = stateDatabase();
      const response = await stateWith(entryId, "published", { db, body });
      assertPrivateJson(response, 400);
      assert.equal((await responseJson(response)).error.code, code);
      assert.equal(db.mutations.length, 0);
    });
  }

  await t.test("invalid UTF-8 JSON", async () => {
    const db = stateDatabase();
    const response = await fetchApp(`/api/private/entries/${entryId}/state`, {
      env: makeEnv({ db, ownerEmail }),
      method: "PUT",
      headers: { ...mutationHeaders(ownerEmail), accept: "application/json" },
      body: new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]),
    });
    assertPrivateJson(response, 400);
    assert.equal((await responseJson(response)).error.code, "invalid_json");
    assert.equal(db.mutations.length, 0);
  });

  for (const body of [{}, [], "published", null, { state: "scheduled" }, { state: "published", extra: true }]) {
    const db = stateDatabase();
    const response = await stateWith(entryId, "published", { db, body: JSON.stringify(body) });
    assertPrivateJson(response, 422);
    const document = await responseJson(response);
    assert.equal(document.error.code, "validation_failed");
    assert.deepEqual(document.error.fields.map(({ name, code }) => ({ name, code })), [
      { name: "state", code: "invalid" },
    ]);
    assert.equal(db.mutations.length, 0);
  }
});

test("same-origin and owner denials precede Accept, body, params, and D1", async () => {
  const cases = [
    ["cross origin", makeEnv({ db: throwingD1(), ownerEmail }), { ...ownerHeaders(ownerEmail), origin: "https://attacker.example" }, 403, "authorization_denied"],
    ["signed out", makeEnv({ db: throwingD1(), ownerEmail }), { origin: "https://account.example" }, 401, "authentication_required"],
    ["machine only", makeEnv({ db: throwingD1(), ownerEmail }), { origin: "https://account.example", authorization: "Bearer STATE_MACHINE_PRIVATE_CANARY", cookie: `owner=${privateCanaries[0]}` }, 401, "authentication_required"],
    ["non-owner", makeEnv({ db: throwingD1(), ownerEmail }), { ...ownerHeaders("other@example.com"), origin: "https://account.example" }, 403, "authorization_denied"],
    ["missing owner", makeEnv({ db: throwingD1() }), { ...ownerHeaders(ownerEmail), origin: "https://account.example" }, 503, "owner_unavailable"],
  ];
  for (const [label, env, headers, status, code] of cases) {
    const response = await fetchApp(`/api/private/entries/${entryId}/state`, {
      env, method: "PUT", headers: { ...headers, accept: "text/html", "content-type": "text/plain" }, body: "STATE_BODY_PRIVATE_CANARY",
    });
    assertPrivateJson(response, status);
    const document = await responseJson(response);
    assert.equal(document.error.code, code, label);
    assertNoCanary(document);
  }

  let bodyPulls = 0;
  let paramsReads = 0;
  const unreadBody = new ReadableStream({
    pull(controller) {
      bodyPulls += 1;
      controller.enqueue(new TextEncoder().encode("STATE_BODY_PRIVATE_CANARY"));
      controller.close();
    },
  }, { highWaterMark: 0 });
  globalThis[Symbol.for("aitta-social.test.cloudflare-env")] = makeEnv({ db: throwingD1(), ownerEmail });
  const route = await compiledPrivateEntryStateRoute();
  const denied = await route.PUT(new Request(`https://account.example/api/private/entries/${entryId}/state`, {
    method: "PUT",
    headers: { ...ownerHeaders(ownerEmail), origin: "https://attacker.example", accept: "application/json", "content-type": "application/json" },
    body: unreadBody,
    duplex: "half",
  }), { params: { then() { paramsReads += 1; } } });
  assertPrivateJson(denied, 403);
  assert.equal(bodyPulls, 0);
  assert.equal(paramsReads, 0);
});

test("unknown, storage, and authorization-setting failures are structured and safe", async () => {
  const missing = await stateWith("unknown-entry", "published", { db: stateDatabase() });
  assertPrivateJson(missing, 404);
  assert.deepEqual(await responseJson(missing), {
    data: null,
    error: { code: "entry_not_found", message: "Update not found." },
    links: [],
  });

  const failed = await stateWith(entryId, "published", { db: throwingD1() });
  assertPrivateJson(failed, 500);
  assert.deepEqual(await responseJson(failed), {
    data: null,
    error: { code: "state_change_failed", message: "The publication-state result could not be confirmed." },
    links: [],
  });

  const env = makeEnv({ db: throwingD1(), ownerEmail });
  Object.defineProperty(env, "AITTA_SOCIAL_OWNER_EMAIL", {
    enumerable: true,
    get() { throw new Error("STATE_AUTH_PRIVATE_CANARY"); },
  });
  const originalConsoleError = console.error;
  const logged = [];
  console.error = (...values) => logged.push(values.map(String).join(" "));
  try {
    const response = await fetchApp(`/api/private/entries/${entryId}/state`, {
      env, method: "PUT", headers: { ...mutationHeaders(ownerEmail), accept: "application/json" }, body: JSON.stringify({ state: "published" }),
    });
    assertPrivateJson(response, 500);
    assert.equal((await responseJson(response)).error.code, "state_change_failed");
    assert.equal(logged.length, 0);
  } finally {
    console.error = originalConsoleError;
  }
});

test("unsupported methods are exact 405 independent of Accept", async () => {
  for (const method of ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"]) {
    for (const accept of [undefined, "application/json", "text/html", "application/json;q=0", "application/json,"]) {
      const response = await fetchApp(`/api/private/entries/${entryId}/state`, {
        env: makeEnv({ db: throwingD1(), ownerEmail }), method,
        headers: accept === undefined ? {} : { accept },
      });
      assertPrivateJson(response, 405);
      assert.equal(response.headers.get("allow"), "PUT");
      if (method !== "HEAD") assert.equal((await responseJson(response)).error.code, "method_not_allowed");
    }
  }
});

test("publication client accepts only the exact bounded state document", async () => {
  const readPublicationStateResponse = await compiledStateResponseReader();
  const published = entryDocument(entryId, "published");
  assert.deepEqual(await readPublicationStateResponse(Response.json(published), { id: entryId, state: "published" }), { outcome: "success" });

  for (const response of [
    new Response(null, { status: 204 }),
    new Response("not JSON", { status: 200 }),
    new Response(JSON.stringify(published), { status: 200, headers: { "content-type": "application/json-seq" } }),
    Response.json({ ...published, data: { ...published.data, id: "wrong-entry" } }),
    Response.json({ ...published, data: { ...published.data, ownerEmail: privateCanaries[0] } }),
    Response.json({ ...published, actions: [] }),
    Response.json({ ...published, data: { ...published.data, attributes: { ...published.data.attributes, state: "draft" } } }),
    Response.json({ data: null, error: { code: "redirected", message: "Not definitive." }, links: [] }, { status: 302 }),
    Response.json({ error: "STATE_RESPONSE_PRIVATE_CANARY" }, { status: 500 }),
    new Response("not JSON", { status: 404, headers: { "content-type": "text/plain" } }),
    Response.json({ error: "legacy" }, { status: 404 }),
  ]) {
    assert.deepEqual(await readPublicationStateResponse(response, { id: entryId, state: "published" }), { outcome: "unconfirmed" });
  }

  assert.deepEqual(await readPublicationStateResponse(Response.json({
    data: null,
    error: { code: "validation_failed", message: "Choose draft or published." },
    links: [],
  }, { status: 422 }), { id: entryId, state: "published" }), {
    outcome: "definitive-error",
    message: "Choose draft or published.",
  });

  let pulls = 0;
  const oversized = new Response(new ReadableStream({
    pull(controller) {
      pulls += 1;
      if (pulls > 100) return controller.close();
      controller.enqueue(new Uint8Array(16 * 1024));
    },
  }, { highWaterMark: 0 }), { status: 200, headers: { "content-type": "application/json" } });
  assert.deepEqual(await readPublicationStateResponse(oversized, { id: entryId, state: "published" }), { outcome: "unconfirmed" });
  assert.ok(pulls <= 6);
});

test("EntryActions uses strict state recovery while deletion has its own strict JSON reader", async () => {
  const source = await readFile(new URL("../app/owner/_components/EntryActions.tsx", import.meta.url), "utf8");
  assert.match(source, /readPublicationStateResponse\(response, \{ id, state: nextState \}\)/u);
  assert.match(source, /headers: \{ Accept: "application\/json", "Content-Type": "application\/json" \}/u);
  assert.match(source, /result\.outcome === "success"[\s\S]*window\.location\.reload\(\)/u);
  assert.match(source, /result\.outcome === "unconfirmed"[\s\S]*showUnconfirmedLifecycleResult\(nextState\)/u);
  assert.match(source, /disabled=\{busy \|\| lifecycleRecoveryRequired\}/u);
  assert.doesNotMatch(source, /classifyOwnerMutationResponse\(response\)[\s\S]{0,350}location\.reload/u);
  assert.doesNotMatch(source, /setTimeout|setInterval|localStorage|sessionStorage|sendBeacon/u);
  assert.match(source, /readDeletionResponse\(response, id\)/u);
  assert.match(source, /headers: \{ Accept: "application\/json" \}/u);
  assert.match(source, /outcome\.outcome === "success"[\s\S]*window\.location\.assign\("\/owner"\)/u);
});

async function stateWith(id, state, { db = stateDatabase(id), headers = {}, body } = {}) {
  return fetchApp(`/api/private/entries/${encodeURIComponent(id)}/state`, {
    env: makeEnv({ db, ownerEmail }),
    method: "PUT",
    headers: { ...mutationHeaders(ownerEmail), accept: "application/json", ...headers },
    body: body ?? JSON.stringify({ state }),
  });
}

function stateDatabase(id = entryId) {
  return new FakeD1({ entries: [entryRow({ id, state: "draft", published_at: null, private_canary: privateCanaries[2] })] });
}

function entryDocument(id, state) {
  const self = `/api/private/entries/${encodeURIComponent(id)}`;
  return {
    data: {
      id,
      type: "owner-entry",
      attributes: {
        kind: "note", title: null, body: "Saved body.", destinationUrl: null, state,
        publishedAt: state === "published" ? "2026-08-13T10:00:00.000Z" : null,
        createdAt: "2026-08-13T08:00:00.000Z", updatedAt: "2026-08-13T10:00:00.000Z",
      },
    },
    links: [
      { rel: "self", href: self, mediaType: "application/json" },
      { rel: "alternate", href: `/owner/entries/${encodeURIComponent(id)}`, mediaType: "text/html" },
    ],
    actions: [
      { rel: "edit", method: "PUT", href: self, requestMediaType: "application/json" },
      { rel: state === "published" ? "unpublish" : "publish", method: "PUT", href: `${self}/state`, requestMediaType: "application/json" },
      { rel: "delete", method: "DELETE", href: self },
    ],
  };
}

function assertOwnerEntryState(document, row, state) {
  const self = `/api/private/entries/${encodeURIComponent(row.id)}`;
  assert.deepEqual(document.data, {
    id: row.id,
    type: "owner-entry",
    attributes: {
      kind: row.kind, title: row.title, body: row.body, destinationUrl: row.destination_url,
      state, publishedAt: document.data.attributes.publishedAt,
      createdAt: row.created_at, updatedAt: document.data.attributes.updatedAt,
    },
  });
  assert.deepEqual(document.links, [
    { rel: "self", href: self, mediaType: "application/json" },
    { rel: "alternate", href: `/owner/entries/${encodeURIComponent(row.id)}`, mediaType: "text/html" },
  ]);
  assert.deepEqual(document.actions, [
    { rel: "edit", method: "PUT", href: self, requestMediaType: "application/json" },
    { rel: state === "published" ? "unpublish" : "publish", method: "PUT", href: `${self}/state`, requestMediaType: "application/json" },
    { rel: "delete", method: "DELETE", href: self },
  ]);
}

function assertPrivateJson(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok((response.headers.get("vary") ?? "").split(",").map((value) => value.trim()).includes("Accept"));
}

function assertNoCanary(value) {
  const source = JSON.stringify(value);
  for (const canary of privateCanaries) assert.doesNotMatch(source, new RegExp(canary, "iu"));
  assert.doesNotMatch(source, /STATE_(?:BODY|AUTH|MACHINE|RESPONSE)_PRIVATE_CANARY/iu);
}

function throwingD1() {
  return { prepare() { throw new Error(privateCanaries[1]); } };
}

async function compiledStateResponseReader() {
  const draftSource = await readFile(new URL("../app/owner/entries/draft-create-response.ts", import.meta.url), "utf8");
  const draftCompiled = ts.transpileModule(draftSource, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const draftUrl = `data:text/javascript,${encodeURIComponent(draftCompiled)}`;
  const stateSource = (await readFile(new URL("../app/owner/entries/publication-state-response.ts", import.meta.url), "utf8"))
    .replace('from "./draft-create-response"', `from "${draftUrl}"`);
  const stateCompiled = ts.transpileModule(stateSource, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return (await import(`data:text/javascript,${encodeURIComponent(stateCompiled)}`)).readPublicationStateResponse;
}

async function compiledPrivateEntryStateRoute() {
  const directory = new URL("../dist/server/_next/static/", import.meta.url);
  for (const name of await readdir(directory)) {
    if (!/^route-.+\.js$/u.test(name)) continue;
    const url = new URL(name, directory);
    const source = await readFile(url, "utf8");
    if (source.includes("The publication-state result could not be confirmed.")) {
      return import(`${url.href}?task196-body-sentinel`);
    }
  }
  throw new Error("Compiled TASK-196 private entry state route was not found.");
}
