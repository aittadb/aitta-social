import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const consumers = [
  "tests/accept-media-ranges.test.mjs",
  "tests/api-v1-head-response.test.mjs",
  "tests/api-v1-json-response.test.mjs",
  "tests/deletion-acknowledgement.test.mjs",
  "tests/error-document-contract.test.mjs",
  "tests/page-text-boundaries.test.mjs",
  "tests/private-json-response.test.mjs",
  "tests/rfc6570-path-segment.test.mjs",
  "tests/public-footer-contract.test.mjs",
  "tests/record-shape.test.mjs",
  "tests/regular-expression-literal.test.mjs",
];

test("restricted-syntax diagnostic counting ignores other diagnostics", () => {
  const empty = { messages: [] };
  const mixed = {
    messages: [
      { ruleId: "no-unused-vars" },
      { ruleId: "no-restricted-syntax" },
      { ruleId: null },
    ],
  };
  const restricted = { messages: [{ ruleId: "no-restricted-syntax" }] };

  assert.equal(restrictedSyntaxErrorCount(empty), 0);
  assert.equal(restrictedSyntaxErrorCount(mixed), 1);
  assert.equal(restrictedSyntaxErrorCount(empty, mixed, restricted), 2);
});

test("restricted-syntax counting has one canonical declaration and consumer imports", async () => {
  const canonical = await readFile(new URL("./helpers/eslint-restricted-syntax.mjs", import.meta.url), "utf8");
  const files = await Promise.all(consumers.map(async (consumer) => [
    consumer,
    await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8"),
  ]));

  assert.equal((canonical.match(/export function restrictedSyntaxErrorCount\(/gu) ?? []).length, 1);
  for (const [consumer, source] of files) {
    assert.doesNotMatch(source, /\brestrictedSyntaxErrors\b/u, consumer);
    assert.match(source, /from ["'][^"']*eslint-restricted-syntax(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects duplicate restricted-syntax counter declarations and retains canonical allowance", async () => {
  const eslint = new ESLint();
  const names = ["restrictedSyntaxErrorCount", "restrictedSyntaxErrors"];
  const duplicates = names.flatMap((name) => [
    `function ${name}() { return 0; }`,
    `export function ${name}() { return 0; }`,
    `export default function ${name}() { return 0; }`,
    `export default (function ${name}() { return 0; });`,
    `const ${name} = () => 0;`,
    `export const ${name} = () => 0;`,
    `const ${name} = function () { return 0; };`,
    `export const ${name} = function () { return 0; };`,
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
    "export function restrictedSyntaxErrorCount(...results) { return results.length; }",
    { filePath: "tests/helpers/eslint-restricted-syntax.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
});
