import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { rfc6570PathSegment } from "../lib/rfc6570-path-segment.ts";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const productionConsumers = [
  "lib/api-v1/entry-collection.ts",
  "lib/api-v1/entry-detail.ts",
  "lib/public-entry-document/representation.ts",
  "lib/private-entry/representation.ts",
];
const testConsumers = [
  "tests/api-v1-collection.test.mjs",
  "tests/api-v1-entry-detail.test.mjs",
  "tests/public-entry-document.test.mjs",
];
const legacyNames = ["apiV1EntryIdPathSegment", "privateEntryIdPathSegment"];

test("RFC 6570 path segments preserve the established opaque identifier encoding", () => {
  assert.equal(rfc6570PathSegment("AZaz09-._~"), "AZaz09-._~");
  assert.equal(rfc6570PathSegment("!'()*"), "%21%27%28%29%2A");
  assert.equal(
    rfc6570PathSegment(":/?#[]@!$&'()*+,;="),
    "%3A%2F%3F%23%5B%5D%40%21%24%26%27%28%29%2A%2B%2C%3B%3D",
  );
  assert.equal(rfc6570PathSegment("space% value"), "space%25%20value");
  assert.equal(rfc6570PathSegment("%2F"), "%252F");
  assert.equal(rfc6570PathSegment("\u00e4\u4e2d\u2728\ud83d\ude00\u0000\u001f\u007f"), "%C3%A4%E4%B8%AD%E2%9C%A8%F0%9F%98%80%00%1F%7F");
  assert.equal(rfc6570PathSegment(""), "");
  assert.throws(() => rfc6570PathSegment("\ud800"), URIError);
  assert.throws(() => rfc6570PathSegment("\udc00"), URIError);
});

test("RFC 6570 path segments have one canonical declaration and direct imports", async () => {
  const canonical = await readFile(new URL("../lib/rfc6570-path-segment.ts", import.meta.url), "utf8");
  const consumers = [...productionConsumers, ...testConsumers];
  const sources = await Promise.all(consumers.map(async (consumer) => [
    consumer,
    await readFile(new URL(`../${consumer}`, import.meta.url), "utf8"),
  ]));

  assert.equal((canonical.match(/export function rfc6570PathSegment\(/gu) ?? []).length, 1);
  for (const [consumer, source] of sources) {
    assert.doesNotMatch(source, /(?:function|class|const|let|var)\s+rfc6570PathSegment\b/u, consumer);
    for (const legacyName of legacyNames) {
      assert.doesNotMatch(source, new RegExp(`(?:function|class|const|let|var)\\s+${legacyName}\\b`, "u"), consumer);
    }
    assert.match(source, /from ["'][^"']*rfc6570-path-segment(?:\.ts)?["']/u, consumer);
  }
});

test("lint rejects duplicate RFC 6570 path-segment declarations and retains earlier leaves", async () => {
  const eslint = new ESLint();
  const names = ["rfc6570PathSegment", ...legacyNames];
  const duplicates = [
    ...names.flatMap(declarationForms),
    "function isRecord(value) { return Boolean(value); }",
    "function escapeRegExp(value) { return value; }",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function rfc6570PathSegment(value) { return value; }",
    { filePath: "lib/rfc6570-path-segment.ts" },
  );
  const [recordShapeInCanonical] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "lib/rfc6570-path-segment.ts" },
  );
  const [legacyInCanonical] = await eslint.lintText(
    "function apiV1EntryIdPathSegment(value) { return value; }",
    { filePath: "lib/rfc6570-path-segment.ts" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(restrictedSyntaxErrorCount(canonical), 0);
  assert.equal(restrictedSyntaxErrorCount(recordShapeInCanonical), 1);
  assert.equal(restrictedSyntaxErrorCount(legacyInCanonical), 0);
});

function declarationForms(name) {
  return [
    `function ${name}(value) { return value; }`,
    `export function ${name}(value) { return value; }`,
    `export default function ${name}(value) { return value; }`,
    `export default (function ${name}(value) { return value; });`,
    `class ${name} {}`,
    `export class ${name} {}`,
    `export default class ${name} {}`,
    `export default (class ${name} {})`,
    `const ${name} = () => null;`,
    `export const ${name} = () => null;`,
    `const ${name} = function () { return null; };`,
    `export const ${name} = function () { return null; };`,
    `const ${name} = class {};`,
    `export const ${name} = class {};`,
    `let ${name} = () => null;`,
    `export let ${name} = () => null;`,
    `var ${name} = () => null;`,
    `export var ${name} = () => null;`,
  ];
}
