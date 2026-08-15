import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  responseJson,
  validEntryInput,
} from "./helpers/worker-harness.mjs";
import {
  compileRecordShapeAwareTypeScriptModule,
  importRecordShapeAwareTypeScriptModule,
} from "./helpers/record-shape-esm-compiler.mjs";
import { assertPrivateJson } from "./helpers/private-json-response.mjs";

const ownerEmail = "owner@example.com";
const privateCanaries = [
  "EDIT_OWNER_PRIVATE_CANARY@example.test",
  "EDIT_STORAGE_PRIVATE_CANARY",
  "EDIT_HOST_PRIVATE_CANARY",
  "EDIT_ROW_PRIVATE_CANARY",
];

test("authorized editing returns an allowlisted owner-entry and preserves identity and state", async () => {
  const fixtures = [
    {
      row: entryRow({
        id: "historical-draft",
        state: "draft",
        published_at: "2026-05-01T00:00:00.000Z",
        private_canary: privateCanaries[3],
      }),
      input: validEntryInput({ kind: "note", title: null, body: "Edited note.", destinationUrl: null }),
    },
    {
      row: entryRow({ id: "article-draft", state: "draft", published_at: null }),
      input: validEntryInput({ kind: "article", title: "Edited article", body: "Article body.", destinationUrl: null }),
    },
    {
      row: entryRow({ id: "published-announcement" }),
      input: validEntryInput({ kind: "announcement", title: "Public notice", body: "Edited public notice.", destinationUrl: null }),
    },
    {
      row: entryRow({ id: "published-link" }),
      input: validEntryInput({ kind: "link", title: null, body: "Edited link.", destinationUrl: "https://example.com/resource" }),
    },
  ];

  for (const { row, input } of fixtures) {
    const db = new FakeD1({ entries: [row] });
    const response = await editWith(row.id, { db, body: JSON.stringify(input) });
    assertPrivateJson(response, 200);
    const document = await responseJson(response);
    const self = `/api/private/entries/${encodeURIComponent(row.id)}`;
    assert.deepEqual(document.data, {
      id: row.id,
      type: "owner-entry",
      attributes: {
        ...input,
        state: row.state,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: document.data.attributes.updatedAt,
      },
    });
    assert.match(document.data.attributes.updatedAt, /^\d{4}-\d{2}-\d{2}T/iu);
    assert.deepEqual(document.links, [
      { rel: "self", href: self, mediaType: "application/json" },
      { rel: "alternate", href: `/owner/entries/${encodeURIComponent(row.id)}`, mediaType: "text/html" },
    ]);
    assert.deepEqual(document.actions, [
      { rel: "edit", method: "PUT", href: self, requestMediaType: "application/json" },
      {
        rel: row.state === "published" ? "unpublish" : "publish",
        method: "PUT",
        href: `${self}/state`,
        requestMediaType: "application/json",
      },
      { rel: "delete", method: "DELETE", href: self },
    ]);
    assert.equal(db.mutations.length, 1);
    assert.match(db.mutations[0].sql, /UPDATE entries SET\s+kind = \?/u);
    assert.deepEqual(db.mutations[0].values.slice(0, 4), [
      input.kind,
      input.title,
      input.body,
      input.destinationUrl,
    ]);
    assert.equal(db.entries[0].state, row.state);
    assert.equal(db.entries[0].published_at, row.published_at);
    assert.equal(db.queries.some(({ sql }) => /from\s+profiles/iu.test(sql)), false);
    assertNoCanary(document);
  }
});

test("draft edits remain public-unknown while published edits replace only public content", async () => {
  const draftCanary = "EDITED_DRAFT_PRIVATE_CANARY";
  const oldPublicCanary = "OLD_PUBLIC_BODY_PRIVATE_CANARY";
  const draft = entryRow({ id: "private-draft", state: "draft", published_at: null, body: "Old draft." });
  const published = entryRow({ id: "public-entry", body: oldPublicCanary });
  const db = new FakeD1({ entries: [draft, published] });
  const env = makeEnv({ db, ownerEmail });

  assert.equal((await editWith(draft.id, {
    db,
    body: JSON.stringify(validEntryInput({ title: "Private edit", body: draftCanary })),
  })).status, 200);
  assert.equal((await editWith(published.id, {
    db,
    body: JSON.stringify(validEntryInput({ title: "Public edit", body: "Replacement public body." })),
  })).status, 200);

  const [home, draftHtml, draftJson, collection, publishedHtml, publishedJson] = await Promise.all([
    fetchApp("/", { env, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${draft.id}`, { env, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${draft.id}`, { env }),
    fetchApp("/api/v1/entries", { env }),
    fetchApp(`/entries/${published.id}`, { env, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${published.id}`, { env }),
  ]);
  assert.equal(draftHtml.status, 404);
  assert.equal(draftJson.status, 404);
  assert.equal(publishedHtml.status, 200);
  assert.equal(publishedJson.status, 200);
  const publicProjection = [
    await home.text(),
    await draftHtml.text(),
    JSON.stringify(await responseJson(draftJson)),
    JSON.stringify(await responseJson(collection)),
    await publishedHtml.text(),
    JSON.stringify(await responseJson(publishedJson)),
  ].join("\n");
  assert.doesNotMatch(publicProjection, new RegExp(draftCanary, "u"));
  assert.doesNotMatch(publicProjection, new RegExp(oldPublicCanary, "u"));
  assert.match(publicProjection, /Replacement public body\./u);
});

test("edit JSON negotiation is bounded, defaults to JSON, and runs before D1", async () => {
  for (const accept of [
    undefined,
    "*/*",
    "application/*",
    "application/json",
    "text/html, application/json;q=0.5",
  ]) {
    const response = await editWith("entry-1", {
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
    const response = await editWith("entry-1", {
      db: throwingD1(),
      headers: { accept },
    });
    assertPrivateJson(response, 406);
    assert.equal((await responseJson(response)).error.code, "not_acceptable");
  }
});

test("edit media, syntax, size, and domain failures use distinct JSON statuses", async (t) => {
  for (const [label, contentType] of [
    ["missing", null],
    ["unsupported", "text/plain"],
    ["non-UTF-8 charset", "application/json; charset=iso-8859-1"],
    ["unknown parameter", "application/json; profile=private"],
    ["excessive header", `application/json;${"x".repeat(1024)}`],
  ]) {
    await t.test(`${label} media type`, async () => {
      const db = editDatabase();
      const headers = mutationHeaders(ownerEmail);
      headers.accept = "application/json";
      if (contentType === null) delete headers["content-type"];
      else headers["content-type"] = contentType;
      const response = await fetchApp("/api/private/entries/entry-1", {
        env: makeEnv({ db, ownerEmail }),
        method: "PUT",
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
      const db = editDatabase();
      const response = await editWith("entry-1", { db, body });
      assertPrivateJson(response, 400);
      assert.equal((await responseJson(response)).error.code, code);
      assert.equal(db.mutations.length, 0);
    });
  }

  await t.test("invalid UTF-8 JSON", async () => {
    const db = editDatabase();
    const response = await fetchApp("/api/private/entries/entry-1", {
      env: makeEnv({ db, ownerEmail }),
      method: "PUT",
      headers: { ...mutationHeaders(ownerEmail), accept: "application/json" },
      body: new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0xff, 0x7d]),
    });
    assertPrivateJson(response, 400);
    assert.equal((await responseJson(response)).error.code, "invalid_json");
    assert.equal(db.mutations.length, 0);
  });

  await t.test("valid JSON with invalid update values", async () => {
    const db = editDatabase();
    const response = await editWith("entry-1", {
      db,
      body: JSON.stringify(validEntryInput({
        kind: "not-a-kind",
        body: " ",
        destinationUrl: "javascript:EDIT_BODY_PRIVATE_CANARY",
      })),
    });
    assertPrivateJson(response, 422);
    const document = await responseJson(response);
    assert.equal(document.error.code, "validation_failed");
    assert.deepEqual(document.error.fields.map(({ name, code }) => ({ name, code })), [
      { name: "kind", code: "invalid" },
      { name: "body", code: "invalid" },
      { name: "destinationUrl", code: "invalid" },
    ]);
    assert.equal(db.mutations.length, 0);
    assertNoCanary(document);
  });
});

test("same-origin and owner denials precede Accept, media, body, and D1", async () => {
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
      label: "machine bearer without browser identity",
      env: makeEnv({ db: throwingD1(), ownerEmail }),
      headers: {
        origin: "https://account.example",
        authorization: "Bearer EDIT_MACHINE_PRIVATE_CANARY",
        cookie: `owner=${privateCanaries[0]}`,
      },
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
    const response = await fetchApp("/api/private/entries/entry-1", {
      env: fixture.env,
      method: "PUT",
      headers: { ...fixture.headers, accept: "text/html", "content-type": "text/plain" },
      body: "EDIT_BODY_PRIVATE_CANARY",
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
      controller.enqueue(new TextEncoder().encode("EDIT_BODY_PRIVATE_CANARY"));
      controller.close();
    },
  }, { highWaterMark: 0 });
  globalThis[Symbol.for("aitta-social.test.cloudflare-env")] = makeEnv({
    db: throwingD1(),
    ownerEmail,
  });
  const route = await compiledPrivateEntryEditRoute();
  const denied = await route.PUT(new Request("https://account.example/api/private/entries/entry-1", {
    method: "PUT",
    headers: {
      ...ownerHeaders(ownerEmail),
      origin: "https://attacker.example",
      accept: "application/json",
      "content-type": "application/json",
    },
    body: unreadBody,
    duplex: "half",
  }), { params: Promise.resolve({ id: "entry-1" }) });
  assertPrivateJson(denied, 403);
  assert.equal(bodyPulls, 0, "authorization denial must not pull the request body stream");
});

test("unknown entries, storage failures, and authorization-setting failures remain safe", async () => {
  const missing = await editWith("unknown-entry", { db: editDatabase() });
  assertPrivateJson(missing, 404);
  assert.deepEqual(await responseJson(missing), {
    data: null,
    error: { code: "entry_not_found", message: "Update not found." },
    links: [],
  });

  const failed = await editWith("entry-1", { db: throwingD1() });
  assertPrivateJson(failed, 500);
  assert.deepEqual(await responseJson(failed), {
    data: null,
    error: { code: "save_failed", message: "The update save result could not be confirmed." },
    links: [],
  });

  const env = makeEnv({ db: throwingD1(), ownerEmail });
  Object.defineProperty(env, "AITTA_SOCIAL_OWNER_EMAIL", {
    enumerable: true,
    get() {
      throw new Error("EDIT_AUTH_PRIVATE_CANARY");
    },
  });
  const originalConsoleError = console.error;
  const logged = [];
  console.error = (...values) => logged.push(values.map(String).join(" "));
  try {
    const response = await fetchApp("/api/private/entries/entry-1", {
      env,
      method: "PUT",
      headers: { ...mutationHeaders(ownerEmail), accept: "application/json" },
      body: JSON.stringify(validEntryInput()),
    });
    assertPrivateJson(response, 500);
    assert.equal((await responseJson(response)).error.code, "save_failed");
    assert.equal(logged.length, 0);
  } finally {
    console.error = originalConsoleError;
  }
});

test("neighbor methods are JSON 405 while DELETE negotiates its own JSON acknowledgement", async (t) => {
  for (const method of ["GET", "POST", "PATCH", "OPTIONS"]) {
    await t.test(method, async () => {
      const response = await fetchApp("/api/private/entries/entry-1", {
        env: makeEnv({ db: throwingD1(), ownerEmail }),
        method,
        headers: { accept: "application/json" },
      });
      assertPrivateJson(response, 405);
      assert.equal(response.headers.get("allow"), "PUT, DELETE");
      assert.equal((await responseJson(response)).error.code, "method_not_allowed");
    });
  }

  const head = await fetchApp("/api/private/entries/entry-1", {
    env: makeEnv({ db: throwingD1(), ownerEmail }),
    method: "HEAD",
    headers: { accept: "application/json" },
  });
  assertPrivateJson(head, 405);
  assert.equal(head.headers.get("allow"), "PUT, DELETE");

  for (const accept of [undefined, "text/html", "application/json;q=0", "application/json,"]) {
    const unacceptable = await fetchApp("/api/private/entries/entry-1", {
      env: makeEnv({ db: throwingD1(), ownerEmail }),
      method: "GET",
      headers: accept === undefined ? {} : { accept },
    });
    assertPrivateJson(unacceptable, 405);
    assert.equal(unacceptable.headers.get("allow"), "PUT, DELETE");
    assert.equal((await responseJson(unacceptable)).error.code, "method_not_allowed");
  }

  for (const accept of [undefined, "*/*", "application/*", "application/json"]) {
    const existing = editDatabase();
    const deleted = await fetchApp("/api/private/entries/entry-1", {
      env: makeEnv({ db: existing, ownerEmail }), method: "DELETE",
      headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example", ...(accept === undefined ? {} : { accept }) },
    });
    assertPrivateJson(deleted, 200);
    assert.equal((await responseJson(deleted)).data.type, "owner-entry-deletion");
    assert.equal(existing.entries.length, 0);
  }

  const excluded = await fetchApp("/api/private/entries/entry-1", {
    env: makeEnv({ db: throwingD1(), ownerEmail }), method: "DELETE",
    headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example", accept: "text/html" },
  });
  assertPrivateJson(excluded, 406);
  assert.equal((await responseJson(excluded)).error.code, "not_acceptable");
});

test("edit client confirms only exact 200 owner-entry documents", async () => {
  const readEntryEditResponse = await compiledEditResponseReader();
  const draft = entryDocument({ id: "historical-draft", state: "draft", publishedAt: null });
  const published = entryDocument({
    id: "published-entry",
    state: "published",
    publishedAt: "2026-08-13T09:00:00.000Z",
  });
  const expectedDraft = expectedEdit(draft);
  const expectedPublished = expectedEdit(published);
  assert.deepEqual(
    await readEntryEditResponse(Response.json(draft), expectedDraft),
    { outcome: "success" },
  );
  assert.deepEqual(
    await readEntryEditResponse(Response.json(published), expectedPublished),
    { outcome: "success" },
  );

  for (const response of [
    new Response(null, { status: 204 }),
    new Response("not JSON", { status: 200 }),
    Response.json({ ...draft, data: { ...draft.data, id: "wrong-entry" } }),
    Response.json({ ...draft, data: { ...draft.data, ownerEmail: privateCanaries[0] } }),
    Response.json({ ...draft, actions: [] }),
    Response.json({ ...draft, data: { ...draft.data, attributes: { ...draft.data.attributes, state: "published" } } }),
    Response.json({ ...draft, data: { ...draft.data, attributes: { ...draft.data.attributes, body: "" } } }),
    Response.json({ ...draft, data: { ...draft.data, attributes: { ...draft.data.attributes, body: "Stale body." } } }),
    Response.json({ ...draft, data: { ...draft.data, attributes: { ...draft.data.attributes, title: "Stale title." } } }),
    Response.json({ ...draft, data: { ...draft.data, attributes: { ...draft.data.attributes, kind: "article" } } }),
    Response.json({ ...draft, data: { ...draft.data, attributes: { ...draft.data.attributes, destinationUrl: "https://example.com/stale" } } }),
    Response.json({ error: "EDIT_RESPONSE_PRIVATE_CANARY" }, { status: 500 }),
    Response.json({ data: null, error: { code: "redirected", message: "Not definitive." }, links: [] }, { status: 302 }),
    new Response("not JSON", { status: 404, headers: { "content-type": "text/plain" } }),
  ]) {
    assert.deepEqual(
      await readEntryEditResponse(response, expectedDraft),
      { outcome: "unconfirmed" },
    );
  }

  let pulls = 0;
  const oversized = new Response(new ReadableStream({
    pull(controller) {
      pulls += 1;
      if (pulls > 100) return controller.close();
      controller.enqueue(new Uint8Array(16 * 1024));
    },
  }, { highWaterMark: 0 }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
  assert.deepEqual(
    await readEntryEditResponse(oversized, expectedDraft),
    { outcome: "unconfirmed" },
  );
  assert.ok(pulls <= 6, `response body was not cancelled at its bound: ${pulls} pulls`);

  assert.deepEqual(
    await readEntryEditResponse(Response.json({
      data: null,
      error: {
        code: "validation_failed",
        message: "The submitted update values are invalid.",
        fields: [{ name: "destinationUrl", code: "invalid", message: "Use a public URL." }],
      },
      links: [],
    }, { status: 422 }), expectedDraft),
    {
      outcome: "definitive-error",
      message: "Update was not saved. Correct the highlighted fields and try again.",
      fieldErrors: { destinationUrl: "Use a public URL." },
    },
  );
  assert.deepEqual(
    await readEntryEditResponse(Response.json({
      data: null,
      error: { code: "entry_not_found", message: "Update not found." },
      links: [],
    }, { status: 404 }), expectedDraft),
    {
      outcome: "definitive-error",
      message: "Update was not saved. Update not found.",
      fieldErrors: {},
    },
  );
});

test("EntryForm sends JSON Accept and uses strict edit recovery without changing create", async () => {
  const source = await readFile(
    new URL("../app/owner/entries/EntryForm.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /import \{ readEntryEditResponse \} from "\.\/edit-save-response"/u);
  assert.match(source, /import \{ createEntryRequest, editEntryRequest \} from "\.\/entry-mutation-requests"/u);
  assert.doesNotMatch(source, /\bfetch\s*\(/u);
  assert.match(source, /if \(!entry\) \{[\s\S]*readDraftCreateResponse\(response\)/u);
  assert.match(source, /readEntryEditResponse\(response, \{[\s\S]*id: entry\.id,[\s\S]*state: entry\.state/u);
  assert.match(source, /kind,[\s\S]*title: formText\(form\.get\("title"\)\) \|\| null,[\s\S]*body: formText\(form\.get\("body"\)\),[\s\S]*destinationUrl: normalizedDestinationUrl/u);
  assert.match(source, /result\.outcome === "success"[\s\S]*Public update saved\.[\s\S]*Private draft saved\./u);
  assert.match(source, /result\.outcome === "unconfirmed"[\s\S]*showUnconfirmedSave\(\)/u);
  assert.match(source, /setFieldErrors\(result\.fieldErrors\)[\s\S]*focusFirstInvalidField\(formElement, result\.fieldErrors\)/u);
  assert.doesNotMatch(source, /classifyOwnerMutationResponse|definitiveFailure|response\.json\(/u);
  assert.match(source, /disabled=\{busy \|\| recoveryRequired\}/u);
  assert.doesNotMatch(source, /setTimeout|setInterval|localStorage|sessionStorage|sendBeacon/u);
});

async function editWith(id, {
  db = editDatabase(),
  headers = {},
  body,
} = {}) {
  return fetchApp(`/api/private/entries/${encodeURIComponent(id)}`, {
    env: makeEnv({ db, ownerEmail }),
    method: "PUT",
    headers: { ...mutationHeaders(ownerEmail), accept: "application/json", ...headers },
    body: body ?? JSON.stringify(validEntryInput()),
  });
}

function editDatabase() {
  return new FakeD1({ entries: [entryRow({ private_canary: privateCanaries[3] })] });
}

function entryDocument({ id, state, publishedAt }) {
  const self = `/api/private/entries/${encodeURIComponent(id)}`;
  return {
    data: {
      id,
      type: "owner-entry",
      attributes: {
        kind: "note",
        title: null,
        body: "Saved body.",
        destinationUrl: null,
        state,
        publishedAt,
        createdAt: "2026-08-13T08:00:00.000Z",
        updatedAt: "2026-08-13T10:00:00.000Z",
      },
    },
    links: [
      { rel: "self", href: self, mediaType: "application/json" },
      { rel: "alternate", href: `/owner/entries/${encodeURIComponent(id)}`, mediaType: "text/html" },
    ],
    actions: [
      { rel: "edit", method: "PUT", href: self, requestMediaType: "application/json" },
      {
        rel: state === "published" ? "unpublish" : "publish",
        method: "PUT",
        href: `${self}/state`,
        requestMediaType: "application/json",
      },
      { rel: "delete", method: "DELETE", href: self },
    ],
  };
}

function expectedEdit(document) {
  return {
    id: document.data.id,
    state: document.data.attributes.state,
    kind: document.data.attributes.kind,
    title: document.data.attributes.title,
    body: document.data.attributes.body,
    destinationUrl: document.data.attributes.destinationUrl,
  };
}

async function compiledEditResponseReader() {
  const draftUrl = await compileRecordShapeAwareTypeScriptModule(
    new URL("../app/owner/entries/draft-create-response.ts", import.meta.url),
  );
  const editModule = await importRecordShapeAwareTypeScriptModule(
    new URL("../app/owner/entries/edit-save-response.ts", import.meta.url),
    { "./draft-create-response": draftUrl },
  );
  return editModule.readEntryEditResponse;
}

function assertNoCanary(value) {
  const source = JSON.stringify(value);
  for (const canary of privateCanaries) assert.doesNotMatch(source, new RegExp(canary, "iu"));
  assert.doesNotMatch(source, /EDIT_(?:BODY|AUTH|MACHINE|RESPONSE)_PRIVATE_CANARY/iu);
}

function throwingD1() {
  return {
    prepare() {
      throw new Error(privateCanaries[1]);
    },
  };
}

async function compiledPrivateEntryEditRoute() {
  const directory = new URL("../dist/server/_next/static/", import.meta.url);
  for (const name of await readdir(directory)) {
    if (!/^route-.+\.js$/u.test(name)) continue;
    const url = new URL(name, directory);
    const source = await readFile(url, "utf8");
    if (source.includes("The update save result could not be confirmed.")) {
      return import(`${url.href}?task195-body-sentinel`);
    }
  }
  throw new Error("Compiled TASK-195 private entry edit route was not found.");
}
