import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { varyHeaderTokens } from "./helpers/vary-header-tokens.mjs";

const consumers = [
  "tests/helpers/api-v1-json-response.mjs",
  "tests/public-entry-document.test.mjs",
  "tests/api-v1-collection.test.mjs",
];

function responseWithVary(vary) {
  return { headers: new Headers(vary === undefined ? {} : { vary }) };
}

test("varyHeaderTokens preserves normalized order, repeats, empty segments, and missing headers", () => {
  assert.deepEqual(varyHeaderTokens(responseWithVary()), [""]);
  assert.deepEqual(
    varyHeaderTokens(responseWithVary(" Origin, ACCEPT , accept,, Authorization,  ")),
    ["origin", "accept", "accept", "", "authorization", ""],
  );
  assert(varyHeaderTokens(responseWithVary("Origin, Accept")).includes("accept"));
  assert(!varyHeaderTokens(responseWithVary("Origin, Accept")).includes("Accept"));
});

test("varyHeaderTokens has one canonical declaration and three imports", async () => {
  const canonical = await readFile(new URL("./helpers/vary-header-tokens.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function varyHeaderTokens\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(?:function|class) (?:hasVaryToken|varyTokens)\b/u, consumer);
    assert.match(source, /from ["'][^"']*vary-header-tokens(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects all vary token declarations outside the canonical helper", async () => {
  const declarationForms = (name) => [
    `function ${name}() {}`,
    `export function ${name}() {}`,
    `export default function ${name}() {}`,
    `export default (function ${name}() {});`,
    `class ${name} {}`,
    `export class ${name} {}`,
    `export default class ${name} {}`,
    `export default (class ${name} {});`,
    `const ${name} = () => {};`,
    `export const ${name} = () => {};`,
    `const ${name} = function () {};`,
    `export const ${name} = function () {};`,
    `const ${name} = class {};`,
    `export const ${name} = class {};`,
  ];
  const duplicateSources = ["varyHeaderTokens", "hasVaryToken", "varyTokens"]
    .flatMap((name) => declarationForms(name));
  const eslint = new ESLint();
  const results = await Promise.all(duplicateSources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function varyHeaderTokens(response) { return response.headers.get(\"vary\"); }",
    { filePath: "tests/helpers/vary-header-tokens.mjs" },
  );
  const [legacyInCanonical] = await eslint.lintText(
    "export function varyHeaderTokens(response) { return response.headers.get(\"vary\"); }\nfunction hasVaryToken() {}",
    { filePath: "tests/helpers/vary-header-tokens.mjs" },
  );
  const [olderFamilyInCanonical] = await eslint.lintText(
    "export function varyHeaderTokens(response) { return response.headers.get(\"vary\"); }\nfunction assertPublishedOnlyDetailQueries() {}",
    { filePath: "tests/helpers/vary-header-tokens.mjs" },
  );
  const [varyFamilyInOlderCanonical] = await eslint.lintText(
    "export function assertPublishedOnlyDetailQueries() {}\nfunction varyHeaderTokens() {}",
    { filePath: "tests/helpers/published-entry-detail-query-contract.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicateSources.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(legacyInCanonical), 1);
  assert.equal(restrictedSyntaxErrorCount(olderFamilyInCanonical), 1);
  assert.equal(restrictedSyntaxErrorCount(varyFamilyInOlderCanonical), 1);
});
