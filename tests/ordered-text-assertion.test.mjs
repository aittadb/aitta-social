import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { assertOrdered } from "./helpers/ordered-text-assertion.mjs";

const consumers = [
  "tests/public-hierarchy.test.mjs",
  "tests/empty-heading-hierarchy.test.mjs",
];

test("assertOrdered accepts ordered, repeated, and empty needles", () => {
  assert.doesNotThrow(() => assertOrdered("alpha beta gamma", "alpha", "beta", "gamma"));
  assert.doesNotThrow(() => assertOrdered("a-a-a", "a", "a", "a"));
  assert.doesNotThrow(() => assertOrdered("abc", ""));
});

test("assertOrdered rejects missing and reversed needles with the existing message", () => {
  assert.throws(
    () => assertOrdered("alpha beta", "alpha", "missing"),
    { message: "missing must follow the preceding semantic element" },
  );
  assert.throws(
    () => assertOrdered("alpha beta", "beta", "alpha"),
    { message: "alpha must follow the preceding semantic element" },
  );
});

test("assertOrdered has one canonical declaration and both consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/ordered-text-assertion.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function assertOrdered\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /^function assertOrdered\(/mu, consumer);
    assert.match(source, /from ["'][^"']*ordered-text-assertion(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects assertOrdered declarations outside its canonical helper", async () => {
  const eslint = new ESLint();
  const duplicateSources = [
    "function assertOrdered() {}",
    "export function assertOrdered() {}",
    "export default function assertOrdered() {}",
    "export default (function assertOrdered() {});",
    "class assertOrdered {}",
    "export class assertOrdered {}",
    "export default class assertOrdered {}",
    "export default (class assertOrdered {});",
    "const assertOrdered = () => {};",
    "export const assertOrdered = () => {};",
    "const assertOrdered = function () {};",
    "export const assertOrdered = function () {};",
    "const assertOrdered = class {};",
    "export const assertOrdered = class {};",
  ];
  const results = await Promise.all(duplicateSources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function assertOrdered(source, ...needles) { return source.length + needles.length; }",
    { filePath: "tests/helpers/ordered-text-assertion.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicateSources.length);
  assert.equal(canonical.errorCount, 0);
});
