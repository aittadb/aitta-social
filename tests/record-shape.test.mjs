import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

import {
  importRecordShapeAwareTypeScriptModule,
  rewriteTypeScriptImportSpecifiers,
} from "./helpers/record-shape-esm-compiler.mjs";

const consumers = [
  "app/owner/entries/deletion-response.ts",
  "app/owner/entries/draft-create-response.ts",
  "app/owner/pages/import/page-preview-response.ts",
  "app/owner/profile/profile-save-response.ts",
  "lib/custom-pages/html-fragment-compiler.ts",
  "lib/custom-pages/page-document.ts",
  "lib/custom-pages/preview-api.ts",
  "lib/private-entry/state-request-response.ts",
];

test("record-shape predicates retain JSON boundary semantics", async () => {
  const { hasExactKeys, isRecord } = await importRecordShapeAwareTypeScriptModule(
    new URL("../lib/record-shape.ts", import.meta.url),
  );
  const inherited = Object.create({ inherited: true });
  inherited.own = true;
  const nonEnumerable = { visible: true };
  Object.defineProperty(nonEnumerable, "hidden", { value: true });

  assert.equal(isRecord({}), true);
  assert.equal(isRecord(Object.create(null)), true);
  assert.equal(isRecord(inherited), true);
  assert.equal(isRecord(null), false);
  assert.equal(isRecord([]), false);
  assert.equal(isRecord("record"), false);
  assert.equal(hasExactKeys({ first: 1, second: 2 }, ["second", "first"]), true);
  assert.equal(hasExactKeys({ first: 1, second: 2 }, ["first"]), false);
  assert.equal(hasExactKeys({ first: 1 }, ["first", "first"]), false);
  assert.equal(hasExactKeys(inherited, ["own"]), true);
  assert.equal(hasExactKeys(inherited, ["inherited"]), false);
  assert.equal(hasExactKeys(nonEnumerable, ["visible"]), true);
  assert.equal(hasExactKeys(nonEnumerable, ["visible", "hidden"]), false);
});

test("exact record-shape predicates have one canonical declaration and consumer imports", async () => {
  const files = await Promise.all(consumers.map(async (consumer) => [
    consumer,
    await readFile(new URL(`../${consumer}`, import.meta.url), "utf8"),
  ]));
  const canonical = await readFile(new URL("../lib/record-shape.ts", import.meta.url), "utf8");

  assert.equal((canonical.match(/export function isRecord\(/gu) ?? []).length, 1);
  assert.equal((canonical.match(/export function hasExactKeys\(/gu) ?? []).length, 1);
  for (const [consumer, source] of files) {
    assert.doesNotMatch(source, /(?:function|const)\s+isRecord\b/u, consumer);
    assert.doesNotMatch(source, /(?:function|const)\s+hasExactKeys\b/u, consumer);
    assert.match(source, /from ["'][^"']*record-shape["']/u, consumer);
  }
});

test("lint rejects duplicate top-level record-shape predicate declarations", async () => {
  const eslint = new ESLint();
  const duplicates = await Promise.all([
    "function isRecord(value) { return Boolean(value); }",
    "function hasExactKeys(value) { return Boolean(value); }",
    "export function isRecord(value) { return Boolean(value); }",
    "export function hasExactKeys(value) { return Boolean(value); }",
    "export default function isRecord(value) { return Boolean(value); }",
    "export default function hasExactKeys(value) { return Boolean(value); }",
    "const isRecord = () => true;",
    "const hasExactKeys = () => true;",
    "export const isRecord = () => true;",
    "export const hasExactKeys = () => true;",
  ].map(async (source) => (await eslint.lintText(source, { filePath: "app/example.ts" }))[0]));
  const [canonical] = await eslint.lintText(
    "export function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value); }",
    { filePath: "lib/record-shape.ts" },
  );

  assert.equal(
    restrictedSyntaxErrorCount(...duplicates),
    10,
  );
  assert.equal(canonical.errorCount, 0);
});

test("record-shape test compiler rewrites imports without touching lookalikes", () => {
  const source = [
    '// from "@/lib/record-shape"',
    'const text = "from \\"@/lib/record-shape\\"";',
    'import { isRecord } from "@/lib/record-shape";',
  ].join("\n");
  const rewritten = rewriteTypeScriptImportSpecifiers(source, {
    "@/lib/record-shape": "data:text/javascript,record-shape",
  });

  assert.ok(rewritten.includes('// from "@/lib/record-shape"'));
  assert.ok(rewritten.includes('const text = "from \\"@/lib/record-shape\\"";'));
  assert.ok(rewritten.includes('from "data:text/javascript,record-shape"'));
  assert.equal(rewritten.includes('import { isRecord } from "@/lib/record-shape"'), false);
});
