import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { clampPixels } from "./helpers/css-clamp-pixels.mjs";

const consumers = [
  "tests/empty-heading-hierarchy.test.mjs",
  "tests/headline-scale.test.mjs",
];

test("clampPixels applies minimum, fluid, and maximum pixel bounds", () => {
  assert.equal(clampPixels(1, 2, 3, 100), 16);
  assert.equal(clampPixels(1, 2, 3, 1_600), 32);
  assert.equal(clampPixels(1, 2, 3, 3_000), 48);
});

test("clampPixels keeps exact minimum and maximum boundaries", () => {
  assert.equal(clampPixels(1, 2, 3, 800), 16);
  assert.equal(clampPixels(1, 2, 3, 2_400), 48);
});

test("clampPixels has one canonical declaration and both consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/css-clamp-pixels.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function clampPixels\(/gu) ?? []).length, 1);
  assert.match(canonical, /maxRem \* 16, Math\.max\(minRem \* 16, width \* preferredVw \/ 100\)/u);

  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /^function clampPixels\(/mu, consumer);
    assert.match(source, /from ["'][^"']*css-clamp-pixels(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects clampPixels declarations outside its canonical helper", async () => {
  const eslint = new ESLint();
  const duplicateSources = [
    "function clampPixels() {}",
    "export function clampPixels() {}",
    "export default function clampPixels() {}",
    "export default (function clampPixels() {});",
    "class clampPixels {}",
    "export class clampPixels {}",
    "export default class clampPixels {}",
    "export default (class clampPixels {});",
    "const clampPixels = () => {};",
    "export const clampPixels = () => {};",
    "const clampPixels = function () {};",
    "export const clampPixels = function () {};",
    "const clampPixels = class {};",
    "export const clampPixels = class {};",
  ];
  const results = await Promise.all(duplicateSources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function clampPixels(minRem, preferredVw, maxRem, width) { return Math.min(maxRem * 16, Math.max(minRem * 16, width * preferredVw / 100)); }",
    { filePath: "tests/helpers/css-clamp-pixels.mjs" },
  );
  const [crossFamily] = await eslint.lintText(
    "function assertOrdered() {}",
    { filePath: "tests/helpers/css-clamp-pixels.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicateSources.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(crossFamily), 1);
});
