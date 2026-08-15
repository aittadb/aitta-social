import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  ownerHeaders,
  responseJson,
} from "./helpers/worker-harness.mjs";
import { assertPrivateJson } from "./helpers/private-json-response.mjs";
import { errorDocument } from "./helpers/error-document-contract.mjs";

const ownerEmail = "owner@example.com";
const entryId = "19700000-0000-4000-8000-000000000001";
const privateCanaries = [
  "DELETE_OWNER_PRIVATE_CANARY@example.test",
  "DELETE_STORAGE_PRIVATE_CANARY",
  "DELETE_BODY_PRIVATE_CANARY",
];

test("DELETE returns the exact no-store deletion acknowledgement for draft and published updates", async () => {
  for (const state of ["draft", "published"]) {
    const db = database(entryId, { state, published_at: state === "published" ? "2026-08-13T10:00:00.000Z" : null });
    const response = await deleteWith(entryId, { db });
    assertPrivateJson(response, 200);
    assert.deepEqual(await responseJson(response), acknowledgement(entryId));
    assert.equal(db.entries.length, 0);

    const env = makeEnv({ db, ownerEmail });
    const unknownId = "19700000-0000-4000-8000-000000000099";
    const [deletedHtml, unknownHtml, deletedDocument, unknownDocument, deletedV1, unknownV1, collection] = await Promise.all([
      fetchApp(`/entries/${entryId}`, { env, headers: { accept: "text/html" } }),
      fetchApp(`/entries/${unknownId}`, { env, headers: { accept: "text/html" } }),
      fetchApp(`/entries/${entryId}`, { env, headers: { accept: "application/json" } }),
      fetchApp(`/entries/${unknownId}`, { env, headers: { accept: "application/json" } }),
      fetchApp(`/api/v1/entries/${entryId}`, { env }),
      fetchApp(`/api/v1/entries/${unknownId}`, { env }),
      fetchApp("/api/v1/entries", { env }),
    ]);
    for (const pair of [[deletedHtml, unknownHtml], [deletedDocument, unknownDocument], [deletedV1, unknownV1]]) {
      assert.equal(pair[0].status, 404);
      assert.equal(pair[1].status, 404);
      assert.equal(
        normalizePublicNotFound(await pair[0].text(), entryId),
        normalizePublicNotFound(await pair[1].text(), unknownId),
        "deleted resource must match arbitrary unknown apart from route bootstrap identity",
      );
    }
    const publicBytes = JSON.stringify(await responseJson(collection));
    assert.doesNotMatch(publicBytes, new RegExp(entryId, "u"));
    assert.doesNotMatch(publicBytes, /DELETE_(?:OWNER|STORAGE|BODY)_PRIVATE_CANARY/u);
  }
});

test("DELETE accepts bounded JSON-compatible Accept and rejects excluded, malformed, or oversized values before D1", async () => {
  for (const accept of [undefined, "*/*", "application/*", "application/json", "text/html, application/json;q=0.5"]) {
    const response = await deleteWith(entryId, { headers: accept === undefined ? {} : { accept } });
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
    const response = await deleteWith(entryId, { db: throwingD1(), headers: { accept } });
    assertPrivateJson(response, 406);
    assert.equal((await responseJson(response)).error.code, "not_acceptable");
  }
});

test("DELETE authorization is before Accept, params, D1, and every request-body read", async () => {
  const cases = [
    ["cross origin", makeEnv({ db: throwingD1(), ownerEmail }), { ...ownerHeaders(ownerEmail), origin: "https://attacker.example" }, 403, "authorization_denied"],
    ["signed out", makeEnv({ db: throwingD1(), ownerEmail }), { origin: "https://account.example" }, 401, "authentication_required"],
    ["non-owner", makeEnv({ db: throwingD1(), ownerEmail }), { ...ownerHeaders("other@example.com"), origin: "https://account.example" }, 403, "authorization_denied"],
    ["missing owner", makeEnv({ db: throwingD1() }), { ...ownerHeaders(ownerEmail), origin: "https://account.example" }, 503, "owner_unavailable"],
  ];
  for (const [label, env, headers, status, code] of cases) {
    const response = await fetchApp(`/api/private/entries/${entryId}`, {
      env, method: "DELETE", headers: { ...headers, accept: "text/html", "content-type": "text/plain" }, body: privateCanaries[2],
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
      controller.enqueue(new TextEncoder().encode(privateCanaries[2]));
      controller.close();
    },
  }, { highWaterMark: 0 });
  globalThis[Symbol.for("aitta-social.test.cloudflare-env")] = makeEnv({ db: throwingD1(), ownerEmail });
  const route = await compiledPrivateEntryDeleteRoute();
  const denied = await route.DELETE(new Request(`https://account.example/api/private/entries/${entryId}`, {
    method: "DELETE",
    headers: { ...ownerHeaders(ownerEmail), origin: "https://attacker.example", accept: "application/json" },
    body: unreadBody,
    duplex: "half",
  }), { params: { then() { paramsReads += 1; } } });
  assertPrivateJson(denied, 403);
  assert.equal(bodyPulls, 0);
  assert.equal(paramsReads, 0);
});

test("DELETE has no body parser or media requirement after authorization, and unknown/storage failures are safe", async () => {
  const response = await fetchApp(`/api/private/entries/${entryId}`, {
    env: makeEnv({ db: database(), ownerEmail }), method: "DELETE",
    headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example", accept: "application/json", "content-type": "text/plain" },
    body: privateCanaries[2],
  });
  assertPrivateJson(response, 200);
  const routeSource = await readFile(new URL("../app/api/private/entries/[id]/route.ts", import.meta.url), "utf8");
  const deleteSource = routeSource.slice(routeSource.indexOf("async function deletePrivateEntry"));
  assert.doesNotMatch(deleteSource, /readPrivateEntryJson|content-type|request\.body/u);

  const unknown = await deleteWith("unknown-entry", { db: database() });
  assertPrivateJson(unknown, 404);
  assert.deepEqual(await responseJson(unknown), errorDocument("entry_not_found", "Update not found."));

  const failed = await deleteWith(entryId, { db: throwingD1() });
  assertPrivateJson(failed, 500);
  assert.deepEqual(await responseJson(failed), errorDocument("delete_failed", "The deletion result could not be confirmed."));
});

test("unsupported methods are exact JSON 405 independent of authorization, Accept, params, or D1", async () => {
  for (const method of ["GET", "HEAD", "POST", "PATCH", "OPTIONS"]) {
    for (const accept of [undefined, "application/json", "text/html", "application/json;q=0", "application/json,"]) {
      const response = await fetchApp(`/api/private/entries/${entryId}`, {
        env: makeEnv({ db: throwingD1(), ownerEmail }), method,
        headers: accept === undefined ? {} : { accept },
      });
      assertPrivateJson(response, 405);
      assert.equal(response.headers.get("allow"), "PUT, DELETE");
      if (method !== "HEAD") assert.equal((await responseJson(response)).error.code, "method_not_allowed");
    }
  }
});

function deleteWith(id, { db = database(id), headers = {} } = {}) {
  return fetchApp(`/api/private/entries/${encodeURIComponent(id)}`, {
    env: makeEnv({ db, ownerEmail }), method: "DELETE",
    headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example", accept: "application/json", ...headers },
  });
}

function database(id = entryId, values = {}) {
  return new FakeD1({ entries: [entryRow({ id, private_canary: privateCanaries[1], ...values })] });
}

function throwingD1() {
  return { prepare() { throw new Error(privateCanaries[1]); } };
}

function acknowledgement(id) {
  return {
    data: { id, type: "owner-entry-deletion", attributes: { deleted: true } },
    links: [
      { rel: "collection", href: "/owner", mediaType: "text/html" },
      { rel: "recovery", href: "/owner", mediaType: "text/html" },
    ],
    actions: [],
  };
}

function assertNoCanary(value) {
  const source = JSON.stringify(value);
  for (const canary of privateCanaries) assert.doesNotMatch(source, new RegExp(canary, "iu"));
}

function normalizePublicNotFound(value, id) {
  return value.replaceAll(id, "{id}");
}

async function compiledPrivateEntryDeleteRoute() {
  const directory = new URL("../dist/server/_next/static/", import.meta.url);
  for (const name of await readdir(directory)) {
    if (!/^route-.+\.js$/u.test(name)) continue;
    const url = new URL(name, directory);
    const source = await readFile(url, "utf8");
    if (source.includes("The deletion result could not be confirmed.")) {
      return import(`${url.href}?task197-body-sentinel`);
    }
  }
  throw new Error("Compiled TASK-197 private entry delete route was not found.");
}
