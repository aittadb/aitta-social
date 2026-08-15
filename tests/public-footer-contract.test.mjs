import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { publicFooter } from "./helpers/public-footer-contract.mjs";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const consumers = [
  "tests/technical-page.test.mjs",
  "tests/privacy-page.test.mjs",
  "tests/accessibility-contract.test.mjs",
  "tests/public-frame.test.mjs",
];

test("public footer extraction preserves the shared contract", () => {
  const first = '<footer class="public-footer">First</footer>';
  const second = '<footer class="public-footer">Second</footer>';
  assert.equal(publicFooter(`before ${first} between ${second} after`), first);
  assert.equal(publicFooter('<FOOTER CLASS="PUBLIC-FOOTER">Case-insensitive</FOOTER>'), '<FOOTER CLASS="PUBLIC-FOOTER">Case-insensitive</FOOTER>');
  assert.equal(publicFooter("<footer class=\"other\">No match</footer>"), "");
  assert.equal(publicFooter("no footer"), "");
});

test("public footer has one canonical declaration and consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/public-footer-contract.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function publicFooter\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /function publicFooter\(/u, consumer);
    assert.match(source, /from ["'][^"']*public-footer-contract(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects duplicate public footer declarations and retains canonical allowances", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "function publicFooter(value) { return value; }",
    "export function publicFooter(value) { return value; }",
    "export default function publicFooter(value) { return value; }",
    "export default (function publicFooter(value) { return value; });",
    "const publicFooter = () => '';",
    "export const publicFooter = () => '';",
    "const publicFooter = function () { return ''; };",
    "export const publicFooter = function () { return ''; };",
    "class publicFooter {}",
    "export class publicFooter {}",
    "export default class publicFooter {}",
    "export default (class publicFooter {});",
    "const publicFooter = class publicFooter {};",
    "export const publicFooter = class publicFooter {};",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function publicFooter(value) { return value; }",
    { filePath: "tests/helpers/public-footer-contract.mjs" },
  );
  const [recordShapeCanonical] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "tests/helpers/public-footer-contract.mjs" },
  );
  assert.equal(
    restrictedSyntaxErrorCount(...results),
    duplicates.length,
  );
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(recordShapeCanonical), 1);
});
