import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { assertApiJson } from "./helpers/api-v1-json-response.mjs";

const consumers = [
  "tests/api-v1-profile.test.mjs",
  "tests/api-v1-root.test.mjs",
  "tests/api-v1-entry-detail.test.mjs",
];

function apiResponse({
  status = 200,
  contentType = "application/json",
  cacheControl = "public, max-age=60",
  location,
  vary = "Origin, Accept",
} = {}) {
  const headers = { "content-type": contentType, "cache-control": cacheControl, vary };
  if (location !== undefined) headers.location = location;
  return new Response("{}", { status, headers });
}

test("API v1 JSON assertion preserves its exact response contract", () => {
  assert.doesNotThrow(() => assertApiJson(apiResponse({
    contentType: "Application/JSON; charset=UTF-8",
    vary: "origin, ACCEPT",
  }), 200, "public, max-age=60"));
  assert.throws(() => assertApiJson(apiResponse({ status: 201 }), 200, "public, max-age=60"));
  assert.throws(() => assertApiJson(apiResponse({ contentType: "text/json" }), 200, "public, max-age=60"));
  assert.throws(() => assertApiJson(apiResponse({ cacheControl: "no-store" }), 200, "public, max-age=60"));
  assert.throws(() => assertApiJson(apiResponse({ location: "/elsewhere" }), 200, "public, max-age=60"));
  assert.throws(() => assertApiJson(apiResponse({ vary: "Origin" }), 200, "public, max-age=60"));
  assert.throws(() => assertApiJson(apiResponse({ vary: "Origin, Accept-Encoding" }), 200, "public, max-age=60"));
});

test("API v1 JSON assertion has one canonical declaration and consumer imports", async () => {
  const canonical = await readFile(new URL("./helpers/api-v1-json-response.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function assertApiJson\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /function assertApiJson\(/u, consumer);
    assert.match(source, /from ["'][^"']*api-v1-json-response(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects duplicate API v1 JSON assertions and retains canonical allowances", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "function assertApiJson() {}",
    "export function assertApiJson() {}",
    "export default function assertApiJson() {}",
    "export default (function assertApiJson() {});",
    "const assertApiJson = () => {};",
    "export const assertApiJson = () => {};",
    "const assertApiJson = function () {};",
    "export const assertApiJson = function () {};",
    "class assertApiJson {}",
    "export class assertApiJson {}",
    "export default class assertApiJson {}",
    "export default (class assertApiJson {});",
    "const assertApiJson = class assertApiJson {};",
    "export const assertApiJson = class assertApiJson {};",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function assertApiJson() {}",
    { filePath: "tests/helpers/api-v1-json-response.mjs" },
  );
  const [recordShapeCanonicalDuplicate] = await eslint.lintText(
    "function assertApiJson() {}",
    { filePath: "lib/record-shape.ts" },
  );
  const [apiV1RecordShapeDuplicate] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "tests/helpers/api-v1-json-response.mjs" },
  );
  const [apiV1PrivateJsonDuplicate] = await eslint.lintText(
    "function assertPrivateJson() {}",
    { filePath: "tests/helpers/api-v1-json-response.mjs" },
  );
  assert.equal(restrictedSyntaxErrors(results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrors([recordShapeCanonicalDuplicate]), 1);
  assert.equal(restrictedSyntaxErrors([apiV1RecordShapeDuplicate]), 1);
  assert.equal(restrictedSyntaxErrors([apiV1PrivateJsonDuplicate]), 1);
});

function restrictedSyntaxErrors(results) {
  return results.flatMap(({ messages }) => messages).filter(({ ruleId }) => ruleId === "no-restricted-syntax").length;
}
