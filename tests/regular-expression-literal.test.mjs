import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { escapeRegExp } from "./helpers/regular-expression-literal.mjs";

const consumers = [
  "tests/technical-page.test.mjs",
  "tests/upgrade-preservation.test.mjs",
  "tests/public-contract-privacy-matrix.test.mjs",
  "tests/presence-functional-matrix.test.mjs",
  "tests/assisted-runtime-journey.test.mjs",
  "tests/clean-source-reproducibility.test.mjs",
  "tests/template-deployment-prompt.test.mjs",
  "tests/update-composer.test.mjs",
];

test("regular-expression literal escaping preserves literal matching", () => {
  assert.equal(escapeRegExp(".*+?^${}()|[]\\"), "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
  assert.equal(escapeRegExp("forward/slash"), "forward/slash");
  assert.equal(escapeRegExp("ordinary text"), "ordinary text");
  assert.equal(escapeRegExp("Aitta äly ✨"), "Aitta äly ✨");
  assert.match("Aitta äly ✨", new RegExp(escapeRegExp("Aitta äly ✨"), "u"));
});

test("regular-expression escaping has one canonical declaration and consumer imports", async () => {
  const canonical = await readFile(new URL("./helpers/regular-expression-literal.mjs", import.meta.url), "utf8");
  const files = await Promise.all(consumers.map(async (consumer) => [
    consumer,
    await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8"),
  ]));

  assert.equal((canonical.match(/export function escapeRegExp\(/gu) ?? []).length, 1);
  for (const [consumer, source] of files) {
    assert.doesNotMatch(source, /(?:function|const)\s+escapeReg(?:Exp|ex)\b/u, consumer);
    assert.match(source, /from ["'][^"']*regular-expression-literal(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects duplicate escape helpers and retains canonical allowances", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "function escapeRegExp(value) { return value; }",
    "function escapeRegex(value) { return value; }",
    "export function escapeRegExp(value) { return value; }",
    "export function escapeRegex(value) { return value; }",
    "export default function escapeRegExp(value) { return value; }",
    "export default function escapeRegex(value) { return value; }",
    "export default (function escapeRegExp() { return ''; });",
    "export default (function escapeRegex() { return ''; });",
    "const escapeRegExp = () => '';",
    "const escapeRegex = () => '';",
    "export const escapeRegExp = () => '';",
    "export const escapeRegex = () => '';",
    "const escapeRegExp = function () { return ''; };",
    "const escapeRegex = function () { return ''; };",
    "export const escapeRegExp = function () { return ''; };",
    "export const escapeRegex = function () { return ''; };",
    "function isRecord(value) { return Boolean(value); }",
    "const hasExactKeys = () => true;",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [canonicalEscape] = await eslint.lintText(
    "export function escapeRegExp(value) { return value; }",
    { filePath: "tests/helpers/regular-expression-literal.mjs" },
  );
  const [canonicalRecordShape] = await eslint.lintText(
    "export function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value); }",
    { filePath: "lib/record-shape.ts" },
  );
  const [escapeCanonicalRecordShapeDuplicate] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "tests/helpers/regular-expression-literal.mjs" },
  );
  const [escapeCanonicalExactKeysDuplicate] = await eslint.lintText(
    "function hasExactKeys(value) { return Boolean(value); }",
    { filePath: "tests/helpers/regular-expression-literal.mjs" },
  );
  const [recordShapeCanonicalEscapeDuplicate] = await eslint.lintText(
    "function escapeRegExp(value) { return value; }",
    { filePath: "lib/record-shape.ts" },
  );
  const [recordShapeCanonicalLegacyEscapeDuplicate] = await eslint.lintText(
    "function escapeRegex(value) { return value; }",
    { filePath: "lib/record-shape.ts" },
  );

  assert.equal(
    results.flatMap(({ messages }) => messages).filter(({ ruleId }) => ruleId === "no-restricted-syntax").length,
    duplicates.length,
  );
  assert.equal(canonicalEscape.errorCount, 0);
  assert.equal(canonicalRecordShape.errorCount, 0);
  assert.equal(restrictedSyntaxErrors(escapeCanonicalRecordShapeDuplicate), 1);
  assert.equal(restrictedSyntaxErrors(escapeCanonicalExactKeysDuplicate), 1);
  assert.equal(restrictedSyntaxErrors(recordShapeCanonicalEscapeDuplicate), 1);
  assert.equal(restrictedSyntaxErrors(recordShapeCanonicalLegacyEscapeDuplicate), 1);
});

function restrictedSyntaxErrors(result) {
  return result.messages.filter(({ ruleId }) => ruleId === "no-restricted-syntax").length;
}
