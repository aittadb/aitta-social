import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { countMatches } from "./helpers/regular-expression-match-count.mjs";

const consumers = [
  "tests/assisted-runtime-journey.test.mjs",
  "tests/update-composer.test.mjs",
  "tests/first-update-journey.test.mjs",
];

test("countMatches counts global, case-insensitive, and zero-width matches", () => {
  assert.equal(countMatches("nothing", /z/g), 0);
  assert.equal(countMatches("one two one", /one/g), 2);
  assert.equal(countMatches("A a a", /a/gi), 3);
  assert.equal(countMatches("aba", /(?=a)/g), 2);
});

test("countMatches preserves matchAll rejection for non-global patterns", () => {
  assert.throws(() => countMatches("one", /one/), TypeError);
});

test("countMatches has one canonical declaration and all consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/regular-expression-match-count.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function countMatches\(/gu) ?? []).length, 1);
  assert.match(canonical, /return \[\.\.\.value\.matchAll\(pattern\)\]\.length;/u);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /^function countMatches\(/mu, consumer);
    assert.match(source, /from ["'][^"']*regular-expression-match-count(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects duplicate countMatches declarations outside the canonical helper", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "function countMatches() {}",
    "export function countMatches() {}",
    "export default function countMatches() {}",
    "export default (function countMatches() {});",
    "class countMatches {}",
    "export class countMatches {}",
    "export default class countMatches {}",
    "export default (class countMatches {});",
    "const countMatches = () => {};",
    "export const countMatches = () => {};",
    "const countMatches = function () {};",
    "export const countMatches = function () {};",
    "const countMatches = class {};",
    "export const countMatches = class {};",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function countMatches(value, pattern) { return [...value.matchAll(pattern)].length; }",
    { filePath: "tests/helpers/regular-expression-match-count.mjs" },
  );
  const [countMatchesAtClampPixels] = await eslint.lintText(
    "function countMatches() {}",
    { filePath: "tests/helpers/css-clamp-pixels.mjs" },
  );
  const [clampPixelsAtCountMatches] = await eslint.lintText(
    "function clampPixels() {}",
    { filePath: "tests/helpers/regular-expression-match-count.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(countMatchesAtClampPixels), 1);
  assert.equal(restrictedSyntaxErrorCount(clampPixelsAtCountMatches), 1);
});
