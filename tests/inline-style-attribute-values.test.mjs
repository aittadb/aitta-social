import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { inlineStyleAttributeValues } from "./helpers/inline-style-attribute-values.mjs";
import { readRepositorySource } from "./helpers/repository-source.mjs";

const consumers = [
  "tests/identity-appearance.test.mjs",
  "tests/presentation-accent.test.mjs",
];

test("inlineStyleAttributeValues extracts only double-quoted style attributes", () => {
  assert.deepEqual(inlineStyleAttributeValues("<p>plain</p>"), []);
  assert.deepEqual(
    inlineStyleAttributeValues('<p style="--one:1" style="--two:2" STYLE="--three:3"></p>'),
    ["--one:1", "--two:2", "--three:3"],
  );
  assert.deepEqual(inlineStyleAttributeValues('<p style=""></p>'), [""]);
  assert.deepEqual(inlineStyleAttributeValues('<p data-style="no" style=\'single\'></p>'), []);
});

test("inline style helper has one canonical declaration and both consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/inline-style-attribute-values.mjs", import.meta.url), "utf8");
  assert.match(await readRepositorySource("tests/helpers/repository-source.mjs"), /export function readRepositorySource\(/u);
  assert.equal((canonical.match(/export function inlineStyleAttributeValues\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /(?:function|const)\s+styleAttributes\b/u, consumer);
    assert.match(source, /from ["'][^"']*inline-style-attribute-values(?:\.mjs)?["']/u, consumer);
    assert.match(source, /\binlineStyleAttributeValues\(/u, consumer);
  }
});

test("lint rejects inline style helper declarations and preserves cross-family restrictions", async () => {
  const eslint = new ESLint();
  const forms = (name) => [
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
  const duplicateSources = [...forms("inlineStyleAttributeValues"), ...forms("styleAttributes")];
  const results = await Promise.all(duplicateSources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function inlineStyleAttributeValues(html) { return [...html.matchAll(/\\sstyle=\"([^\"]*)\"/gi)].map((match) => match[1]); }",
    { filePath: "tests/helpers/inline-style-attribute-values.mjs" },
  );
  const [legacyInCanonical] = await eslint.lintText(
    "function styleAttributes() {}",
    { filePath: "tests/helpers/inline-style-attribute-values.mjs" },
  );
  const [repositorySourceInCanonical] = await eslint.lintText(
    "function readRepositorySource() {}",
    { filePath: "tests/helpers/inline-style-attribute-values.mjs" },
  );
  const [inlineStyleInRepositorySource] = await eslint.lintText(
    "function inlineStyleAttributeValues() {}",
    { filePath: "tests/helpers/repository-source.mjs" },
  );
  const [priorRestriction] = await eslint.lintText(
    "function isRecord() {}",
    { filePath: "tests/helpers/inline-style-attribute-values.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicateSources.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(legacyInCanonical), 1);
  assert.equal(restrictedSyntaxErrorCount(repositorySourceInCanonical), 1);
  assert.equal(restrictedSyntaxErrorCount(inlineStyleInRepositorySource), 1);
  assert.equal(restrictedSyntaxErrorCount(priorRestriction), 1);
});
