import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { assertPrivateJson } from "./helpers/private-json-response.mjs";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const consumers = [
  "tests/private-profile-json.test.mjs",
  "tests/private-entry-create-json.test.mjs",
  "tests/private-entry-edit-json.test.mjs",
  "tests/private-entry-state-json.test.mjs",
  "tests/private-entry-delete-json.test.mjs",
  "tests/custom-page-preview.test.mjs",
  "tests/delete-lifecycle.test.mjs",
];

function privateJsonResponse(contentType = "application/json") {
  return privateJsonResponseWith({ contentType });
}

function privateJsonResponseWith({
  contentType = "application/json",
  cacheControl = "no-store",
  vary = "Origin, Accept",
} = {}) {
  return new Response("{}", {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": cacheControl,
      vary,
    },
  });
}

test("private JSON assertion preserves case-insensitive default and strict mode", () => {
  assert.doesNotThrow(() => assertPrivateJson(privateJsonResponse("Application/JSON; charset=UTF-8"), 200));
  assert.doesNotThrow(() => assertPrivateJson(privateJsonResponse("application/json; charset=UTF-8"), 200, {
    caseInsensitiveContentType: false,
  }));
  assert.throws(() => assertPrivateJson(privateJsonResponse("Application/JSON"), 200, {
    caseInsensitiveContentType: false,
  }));
  assert.throws(() => assertPrivateJson(privateJsonResponse("application/jsonx"), 200));
  assert.throws(() => assertPrivateJson(privateJsonResponse(), 201));
  assert.throws(() => assertPrivateJson(privateJsonResponseWith({ cacheControl: "private" }), 200));
  assert.throws(() => assertPrivateJson(privateJsonResponseWith({ cacheControl: "" }), 200));
  assert.throws(() => assertPrivateJson(privateJsonResponseWith({ vary: "Origin" }), 200));
  assert.throws(() => assertPrivateJson(privateJsonResponseWith({ vary: "Origin, accept" }), 200));
});

test("private JSON response assertion has one declaration and consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/private-json-response.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function assertPrivateJson\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /function assertPrivateJson\(/u, consumer);
    assert.match(source, /from ["'][^"']*private-json-response(?:\.mjs)?["']/u, consumer);
  }
  const preview = await readFile(new URL("./custom-page-preview.test.mjs", import.meta.url), "utf8");
  assert.match(preview, /assertPrivateJson\([^)]*,[^)]*, \{ caseInsensitiveContentType: false \}\)/u);
});

test("lint rejects duplicate private JSON assertions and retains canonical allowances", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "function assertPrivateJson() {}",
    "export function assertPrivateJson() {}",
    "export default function assertPrivateJson() {}",
    "export default (function assertPrivateJson() {});",
    "const assertPrivateJson = () => {};",
    "export const assertPrivateJson = () => {};",
    "const assertPrivateJson = function () {};",
    "export const assertPrivateJson = function () {};",
    "class assertPrivateJson {}",
    "export class assertPrivateJson {}",
    "export default class assertPrivateJson {}",
    "export default (class assertPrivateJson {});",
    "const assertPrivateJson = class assertPrivateJson {};",
    "export const assertPrivateJson = class assertPrivateJson {};",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function assertPrivateJson() {}",
    { filePath: "tests/helpers/private-json-response.mjs" },
  );
  const [recordShapeCanonicalDuplicate] = await eslint.lintText(
    "function assertPrivateJson() {}",
    { filePath: "lib/record-shape.ts" },
  );
  const [privateJsonRecordShapeDuplicate] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "tests/helpers/private-json-response.mjs" },
  );
  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(recordShapeCanonicalDuplicate), 1);
  assert.equal(restrictedSyntaxErrorCount(privateJsonRecordShapeDuplicate), 1);
});
