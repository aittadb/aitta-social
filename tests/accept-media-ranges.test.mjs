import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { parseAcceptMediaRanges } from "../lib/accept-media-ranges.ts";

const consumers = [
  "lib/api-v1/accept.ts",
  "lib/public-entry-document/accept.ts",
];
const parserNames = [
  "parseAcceptMediaRanges",
  "parseMediaRange",
  "validParameterValue",
  "splitOutsideQuotes",
];
const parserConstantNames = [
  "MAX_ACCEPT_BYTES",
  "MAX_MEDIA_RANGES",
  "TOKEN",
  "Q_VALUE",
];

test("bounded Accept parser retains media-range grammar and normalization", () => {
  assert.deepEqual(
    parseAcceptMediaRanges(
      ' APPLICATION/JSON ; charset="utf,8;quoted\\" value" ; q=0.123 , */*;Q=1.000 ',
    ),
    [
      { type: "application", subtype: "json", quality: 0.123 },
      { type: "*", subtype: "*", quality: 1 },
    ],
  );
  assert.deepEqual(parseAcceptMediaRanges("text/plain; note=token"), [
    { type: "text", subtype: "plain", quality: 1 },
  ]);
  assert.equal(parseAcceptMediaRanges("*/json"), null);
  assert.equal(parseAcceptMediaRanges("application/json;q=0.1234"), null);
  assert.equal(parseAcceptMediaRanges("application/json;q=1.001"), null);
  assert.equal(parseAcceptMediaRanges("application/json;q=0;q=1"), null);
  assert.equal(parseAcceptMediaRanges("application/json;note=\"unterminated"), null);
  assert.equal(parseAcceptMediaRanges("application/json;note=\"trailing\\\""), null);
  assert.equal(parseAcceptMediaRanges("application/json;note=\"line\nbreak\""), null);
  assert.equal(parseAcceptMediaRanges("application/json,"), null);
  assert.equal(parseAcceptMediaRanges(",application/json"), null);
});

test("bounded Accept parser measures UTF-8 bytes and range count exactly", () => {
  const prefix = 'application/json;note="';
  const suffix = '"';
  const availableBytes = 4 * 1024 - new TextEncoder().encode(prefix + suffix).byteLength;
  const exactLimit = `${prefix}${"ä".repeat(Math.floor(availableBytes / 2))}${suffix}`;
  const exactLimitBytes = new TextEncoder().encode(exactLimit).byteLength;
  const paddedExactLimit = `${prefix}${"ä".repeat(Math.floor(availableBytes / 2))}${"x".repeat(4 * 1024 - exactLimitBytes)}${suffix}`;

  assert.equal(new TextEncoder().encode(paddedExactLimit).byteLength, 4 * 1024);
  assert.deepEqual(parseAcceptMediaRanges(paddedExactLimit), [
    { type: "application", subtype: "json", quality: 1 },
  ]);
  assert.equal(parseAcceptMediaRanges(`${paddedExactLimit}x`), null);

  const sixteenRanges = Array.from({ length: 16 }, () => "text/plain").join(",");
  assert.equal(parseAcceptMediaRanges(sixteenRanges)?.length, 16);
  assert.equal(parseAcceptMediaRanges(`${sixteenRanges},text/plain`), null);
});

test("Accept parser has one canonical declaration and both policies import it", async () => {
  const canonical = await readFile(new URL("../lib/accept-media-ranges.ts", import.meta.url), "utf8");
  const sources = await Promise.all(consumers.map(async (consumer) => [
    consumer,
    await readFile(new URL(`../${consumer}`, import.meta.url), "utf8"),
  ]));

  assert.equal((canonical.match(/export type AcceptMediaRange\b/gu) ?? []).length, 1);
  assert.equal((canonical.match(/export function parseAcceptMediaRanges\(/gu) ?? []).length, 1);
  for (const name of parserConstantNames) {
    assert.equal((canonical.match(new RegExp(`const ${name}\\b`, "gu")) ?? []).length, 1, name);
  }
  for (const name of parserNames.slice(1)) {
    assert.equal((canonical.match(new RegExp(`function ${name}\\(`, "gu")) ?? []).length, 1, name);
  }
  for (const [consumer, source] of sources) {
    for (const name of parserNames) {
      assert.doesNotMatch(source, new RegExp(`function ${name}\\(`, "u"), `${consumer}: ${name}`);
    }
    for (const name of parserConstantNames) {
      assert.doesNotMatch(source, new RegExp(`const ${name}\\b`, "u"), `${consumer}: ${name}`);
    }
    assert.match(source, /from ["'][^"']*accept-media-ranges["']/u, consumer);
  }
});

test("lint rejects duplicate Accept parsers without weakening earlier canonical leaves", async () => {
  const eslint = new ESLint();
  const declarationForms = (name) => [
    `function ${name}(value) { return value; }`,
    `export function ${name}(value) { return value; }`,
    `export default function ${name}(value) { return value; }`,
    `export default (function ${name}(value) { return value; });`,
    `const ${name} = () => null;`,
    `export const ${name} = () => null;`,
    `const ${name} = function () { return null; };`,
    `export const ${name} = function () { return null; };`,
  ];
  const duplicates = [
    ...parserNames.flatMap(declarationForms),
    "function isRecord(value) { return Boolean(value); }",
    "function hasExactKeys(value) { return Boolean(value); }",
    "function escapeRegExp(value) { return value; }",
    "function escapeRegex(value) { return value; }",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    [
      "export function parseAcceptMediaRanges(value) { return value; }",
      "function parseMediaRange(value) { return value; }",
      "function validParameterValue(value) { return Boolean(value); }",
      "function splitOutsideQuotes(value) { return [value]; }",
    ].join("\n"),
    { filePath: "lib/accept-media-ranges.ts" },
  );
  const [recordShapeInParser] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "lib/accept-media-ranges.ts" },
  );
  const [regularExpressionInParser] = await eslint.lintText(
    "function escapeRegExp(value) { return value; }",
    { filePath: "lib/accept-media-ranges.ts" },
  );

  assert.equal(restrictedSyntaxErrors(results), duplicates.length);
  assert.equal(restrictedSyntaxErrors([canonical]), 0);
  assert.equal(restrictedSyntaxErrors([recordShapeInParser]), 1);
  assert.equal(restrictedSyntaxErrors([regularExpressionInParser]), 1);
});

function restrictedSyntaxErrors(results) {
  return results.flatMap(({ messages }) => messages).filter(({ ruleId }) => ruleId === "no-restricted-syntax").length;
}
