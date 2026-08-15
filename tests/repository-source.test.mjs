import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { readRepositorySource } from "./helpers/repository-source.mjs";

const consumers = [
  "tests/owner-browser-requests.test.mjs",
  "tests/update-composer.test.mjs",
  "tests/assisted-runtime-journey.test.mjs",
];

test("readRepositorySource reads root, nested, UTF-8, and dot-segment paths", async () => {
  assert.equal(
    await readRepositorySource("README.md"),
    await readFile(new URL("../README.md", import.meta.url), "utf8"),
  );
  assert.equal(
    await readRepositorySource("docs/../README.md"),
    await readRepositorySource("README.md"),
  );
  const utf8 = await readRepositorySource("docs/presentation.md");
  assert.match(utf8, /AittaSocial/u);
  assert.ok([...utf8].some((character) => character.codePointAt(0) > 0x7f));
  assert.match(await readRepositorySource("docs/../docs/presentation.md"), /AittaSocial/u);
});

test("readRepositorySource preserves missing-file rejection", async () => {
  await assert.rejects(
    readRepositorySource("does-not-exist/repository-source-fixture.txt"),
    { code: "ENOENT" },
  );
});

test("repository source has one canonical declaration and all consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/repository-source.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function readRepositorySource\(/gu) ?? []).length, 1);
  assert.match(canonical, /new URL\(`\.\.\/\.\.\/\$\{path\}`, import\.meta\.url\)/u);
  assert.match(canonical, /readFile\([\s\S]*, "utf8"\)/u);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\b(?:function\s+readSource|const\s+readSource\s*=|function\s+source)\b/u, consumer);
    assert.match(source, /from ["'][^"']*repository-source(?:\.mjs)?["']/u, consumer);
    assert.match(source, /\breadRepositorySource\(/u, consumer);
  }
  assert.doesNotMatch(
    await readFile(new URL("./assisted-runtime-journey.test.mjs", import.meta.url), "utf8"),
    /node:fs\/promises/u,
  );
});

test("lint protects repository source names and assisted legacy source only", async () => {
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
  const duplicateSources = [...forms("readRepositorySource"), ...forms("readSource")];
  const results = await Promise.all(duplicateSources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function readRepositorySource(path) { return path; }",
    { filePath: "tests/helpers/repository-source.mjs" },
  );
  const canonicalLegacySources = await Promise.all(forms("readSource").map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/helpers/repository-source.mjs" })
  )[0]));
  const [assistedLegacy] = await eslint.lintText(
    "function source() {}",
    { filePath: "tests/assisted-runtime-journey.test.mjs" },
  );
  const [unrelatedSource] = await eslint.lintText(
    "function source() {}",
    { filePath: "tests/example.test.mjs" },
  );
  const [priorRestriction] = await eslint.lintText(
    "function isRecord() {}",
    { filePath: "tests/assisted-runtime-journey.test.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicateSources.length);
  assert.equal(restrictedSyntaxErrorCount(canonical), 0);
  assert.equal(restrictedSyntaxErrorCount(...canonicalLegacySources), canonicalLegacySources.length);
  assert.equal(restrictedSyntaxErrorCount(assistedLegacy), 1);
  assert.equal(restrictedSyntaxErrorCount(unrelatedSource), 0);
  assert.equal(restrictedSyntaxErrorCount(priorRestriction), 1);
});
