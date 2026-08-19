import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { responseJson } from "./helpers/json-response-body.mjs";

const directConsumers = [
  "tests/presence-functional-matrix.test.mjs",
  "tests/upgrade-preservation.test.mjs",
];
const earlierRestrictedNames = [
  "isRecord", "hasExactKeys", "escapeRegExp", "escapeRegex", "restrictedSyntaxErrorCount",
  "restrictedSyntaxErrors", "deletionAcknowledgement", "acknowledgement", "publicFooter",
  "assertPrivateJson", "errorDocument", "assertApiJson", "jsonLink", "expectedApiV1JsonLink",
  "assertMatchingApiV1HeadHeaders", "assertMatchingHeaders", "assertMatchingHeadHeaders",
  "parseAcceptMediaRanges", "parseMediaRange", "validParameterValue", "splitOutsideQuotes",
  "characterLength", "hasForbiddenTextControl", "hasUrlControl", "pageInlineVisibleText",
  "visibleInlineText", "inlineVisibleText", "rfc6570PathSegment", "apiV1EntryIdPathSegment",
  "privateEntryIdPathSegment", "assertOrdered", "consumeResponse", "varyHeaderTokens",
  "hasVaryToken", "varyTokens", "assertPublishedOnlyDetailQueries", "inlineStyleAttributeValues",
  "styleAttributes", "countMatches", "clampPixels", "readRepositorySource", "readSource",
  "describedBy", "entryKindLabel", "kindLabel", "migrationInventory",
  "isOwnerEntryJsonResponseMediaType", "isJsonResponse", "privateEntryErrorFieldName", "entryFieldName",
];

function jsonResponse(contentType, source) {
  return {
    headers: new Headers({ "content-type": contentType }),
    text: async () => source,
  };
}

test("responseJson returns exact native JSON values", async () => {
  for (const [source, expected] of [
    ["null", null],
    ["0", 0],
    ["false", false],
    [JSON.stringify({ data: ["value", 4], nested: { ok: true } }), { data: ["value", 4], nested: { ok: true } }],
  ]) {
    assert.deepEqual(await responseJson(jsonResponse("application/json", source)), expected);
  }
});

test("responseJson accepts the case-insensitive JSON media type with suffixes", async () => {
  for (const contentType of ["Application/JSON", "APPLICATION/JSON; charset=utf-8"]) {
    assert.deepEqual(await responseJson(jsonResponse(contentType, '{"ok":true}')), { ok: true }, contentType);
  }
});

test("responseJson rejects a non-JSON response before reading its body", async () => {
  let reads = 0;
  const response = {
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => {
      reads += 1;
      return "{}";
    },
  };

  await assert.rejects(responseJson(response), assert.AssertionError);
  assert.equal(reads, 0);
});

test("responseJson rejects malformed JSON after exactly one accepted body read", async () => {
  let reads = 0;
  const response = {
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => {
      reads += 1;
      return "{";
    },
  };

  await assert.rejects(responseJson(response), SyntaxError);
  assert.equal(reads, 1);
});

test("responseJson reads each accepted response body exactly once", async () => {
  let reads = 0;
  const response = {
    headers: new Headers({ "content-type": "application/json" }),
    text: async () => {
      reads += 1;
      return '{"answer":42}';
    },
  };

  assert.deepEqual(await responseJson(response), { answer: 42 });
  assert.equal(reads, 1);
});

test("responseJson has one canonical declaration, direct consumers, and a harness re-export", async () => {
  const [canonical, harness, ...sources] = await Promise.all([
    readFile(new URL("./helpers/json-response-body.mjs", import.meta.url), "utf8"),
    readFile(new URL("./helpers/worker-harness.mjs", import.meta.url), "utf8"),
    ...directConsumers.map((consumer) => readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8")),
  ]);

  assert.equal((canonical.match(/export async function responseJson\(/gu) ?? []).length, 1);
  assert.ok(canonical.includes('assert.match(response.headers.get("content-type") ?? "", /^application\\/json\\b/i);'));
  assert.match(canonical, /return JSON\.parse\(await response\.text\(\)\);/u);
  for (const [consumer, source] of directConsumers.map((consumer, index) => [consumer, sources[index]])) {
    assert.match(source, /import \{ responseJson \} from "\.\/helpers\/json-response-body\.mjs";/u, consumer);
    assert.doesNotMatch(source, /^async function responseJson\(/mu, consumer);
  }
  assert.match(harness, /export \{ responseJson \} from "\.\/json-response-body\.mjs";/u);
  assert.doesNotMatch(harness, /(?:export )?async function responseJson\(/u);
});

test("lint reserves responseJson and retains TASK-229 ownership", async () => {
  const eslint = new ESLint();
  const declarationForms = (name) => [
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
  const duplicates = declarationForms("responseJson");
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export async function responseJson(response) { return JSON.parse(await response.text()); }",
    { filePath: "tests/helpers/json-response-body.mjs" },
  );
  const [privateEntryErrorInJsonBody] = await eslint.lintText(
    "export async function responseJson(response) { return JSON.parse(await response.text()); }\nfunction privateEntryErrorFieldName() {}",
    { filePath: "tests/helpers/json-response-body.mjs" },
  );
  const [jsonBodyInPrivateEntryError] = await eslint.lintText(
    "export function privateEntryErrorFieldName(value: string) { return value === \"kind\" ? \"kind\" : null; }\nfunction responseJson() {}",
    { filePath: "app/owner/entries/private-entry-error-field-name.ts" },
  );
  const [cumulative] = await eslint.lintText(
    [
      "export async function responseJson(response) { return JSON.parse(await response.text()); }",
      ...earlierRestrictedNames.map((name) => `function ${name}() {}`),
    ].join("\n"),
    { filePath: "tests/helpers/json-response-body.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(privateEntryErrorInJsonBody), 1);
  assert.equal(restrictedSyntaxErrorCount(jsonBodyInPrivateEntryError), 1);
  assert.equal(restrictedSyntaxErrorCount(cumulative), earlierRestrictedNames.length);
});
