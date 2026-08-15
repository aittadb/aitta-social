import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { assertMatchingApiV1HeadHeaders } from "./helpers/api-v1-head-response.mjs";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const headerNames = ["content-type", "cache-control", "vary", "allow", "location"];
const consumers = [
  "tests/api-v1-collection.test.mjs",
  "tests/api-v1-entry-detail.test.mjs",
  "tests/api-v1-profile.test.mjs",
  "tests/api-v1-root.test.mjs",
];

function apiResponse(headers = {}) {
  return new Response("", {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      vary: "Accept",
      allow: "GET, HEAD",
      location: "",
      ...headers,
    },
  });
}

test("API v1 HEAD assertion compares exactly its five response headers", () => {
  const get = apiResponse();
  assert.doesNotThrow(() => assertMatchingApiV1HeadHeaders(apiResponse(), get));

  for (const name of headerNames) {
    assert.throws(
      () => assertMatchingApiV1HeadHeaders(apiResponse({ [name]: "different" }), get),
      new RegExp(name, "u"),
    );
  }
});

test("API v1 HEAD assertion has one canonical declaration and consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/api-v1-head-response.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function assertMatchingApiV1HeadHeaders\(/gu) ?? []).length, 1);

  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /function assertMatching(?:Headers|HeadHeaders)\(/u, consumer);
    assert.match(source, /from ["'][^"']*api-v1-head-response(?:\.mjs)?["']/u, consumer);
  }

  const publicEntryDocument = await readFile(new URL("./public-entry-document.test.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(publicEntryDocument, /function assertMatchingHeaders\(/u);
  assert.match(publicEntryDocument, /function assertMatchingEntryDocumentHeaders\(/u);
  assert.match(publicEntryDocument, /"content-security-policy"/u);
});

test("lint rejects duplicate API v1 HEAD assertions and retains canonical allowances", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "assertMatchingApiV1HeadHeaders",
    "assertMatchingHeaders",
    "assertMatchingHeadHeaders",
  ].flatMap((name) => [
    `function ${name}() {}`,
    `export function ${name}() {}`,
    `export default function ${name}() {}`,
    `export default (function ${name}() {});`,
    `const ${name} = () => {};`,
    `export const ${name} = () => {};`,
    `const ${name} = function () {};`,
    `export const ${name} = function () {};`,
    `class ${name} {}`,
    `export class ${name} {}`,
    `export default class ${name} {}`,
    `export default (class ${name} {});`,
    `const ${name} = class ${name} {};`,
    `export const ${name} = class ${name} {};`,
  ]);
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function assertMatchingApiV1HeadHeaders() {}",
    { filePath: "tests/helpers/api-v1-head-response.mjs" },
  );
  const legacyDuplicates = ["assertMatchingHeaders", "assertMatchingHeadHeaders"].flatMap((name) => [
    `function ${name}() {}`,
    `export function ${name}() {}`,
    `export default function ${name}() {}`,
    `export default (function ${name}() {});`,
    `const ${name} = () => {};`,
    `export const ${name} = () => {};`,
    `const ${name} = function () {};`,
    `export const ${name} = function () {};`,
    `class ${name} {}`,
    `export class ${name} {}`,
    `export default class ${name} {}`,
    `export default (class ${name} {});`,
    `const ${name} = class ${name} {};`,
    `export const ${name} = class ${name} {};`,
  ]);
  const legacyResults = await Promise.all(legacyDuplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/helpers/api-v1-head-response.mjs" })
  )[0]));
  const [recordShapeDuplicate] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "tests/helpers/api-v1-head-response.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(...legacyResults), legacyDuplicates.length);
  assert.equal(restrictedSyntaxErrorCount(recordShapeDuplicate), 1);
});
