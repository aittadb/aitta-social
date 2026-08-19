import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { isOwnerEntryJsonResponseMediaType } from "../app/owner/entries/json-response-media-type.ts";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const consumers = [
  "app/owner/entries/publication-state-response.ts",
  "app/owner/entries/deletion-response.ts",
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
];

test("owner-entry JSON response media type accepts the exact existing forms", () => {
  for (const value of [
    "application/json",
    "APPLICATION/JSON",
    "application/json;charset=utf-8",
    "application/json ; charset=utf-8",
    "application/json; charset=utf-8",
    "application/json\t;\tcharset=utf-8",
  ]) {
    assert.equal(isOwnerEntryJsonResponseMediaType(value), true, value);
  }
});

test("owner-entry JSON response media type rejects non-exact forms", () => {
  for (const value of [
    null,
    "",
    " application/json",
    "application/json ",
    "application/json-seq",
    "application/problem+json",
    "text/json",
    "application/json; charset=iso-8859-1",
    'application/json; charset="utf-8"',
    "application/json; charset=utf-8; profile=owner",
    "application/json; profile=owner",
  ]) {
    assert.equal(isOwnerEntryJsonResponseMediaType(value), false, String(value));
  }
});

test("owner-entry JSON response media type has one canonical declaration and two consumers", async () => {
  const [canonical, ...sources] = await Promise.all([
    readFile(new URL("../app/owner/entries/json-response-media-type.ts", import.meta.url), "utf8"),
    ...consumers.map((consumer) => readFile(new URL(`../${consumer}`, import.meta.url), "utf8")),
  ]);

  assert.equal((canonical.match(/export function isOwnerEntryJsonResponseMediaType\(/gu) ?? []).length, 1);
  for (const [consumer, source] of consumers.map((consumer, index) => [consumer, sources[index]])) {
    assert.match(source, /import \{ isOwnerEntryJsonResponseMediaType \} from "\.\/json-response-media-type";/u, consumer);
    assert.doesNotMatch(source, /^function (?:isOwnerEntryJsonResponseMediaType|isJsonResponse)\(/mu, consumer);
    assert.equal((source.match(/isOwnerEntryJsonResponseMediaType\(response\.headers\.get\("content-type"\)\)/gu) ?? []).length, 1, consumer);
  }
});

test("lint reserves owner-entry JSON response media-type recognition and retains TASK-227 ownership", async () => {
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
  const duplicates = [
    ...declarationForms("isOwnerEntryJsonResponseMediaType"),
    ...declarationForms("isJsonResponse"),
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/owner/entries/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function isOwnerEntryJsonResponseMediaType(value: string | null) { return value !== null; }",
    { filePath: "app/owner/entries/json-response-media-type.ts" },
  );
  const legacyCanonicalResults = await Promise.all(declarationForms("isJsonResponse").map(async (source) => (
    await eslint.lintText(source, { filePath: "app/owner/entries/json-response-media-type.ts" })
  )[0]));
  const [migrationInventoryInMediaType] = await eslint.lintText(
    "export function isOwnerEntryJsonResponseMediaType(value: string | null) { return value !== null; }\nfunction migrationInventory() {}",
    { filePath: "app/owner/entries/json-response-media-type.ts" },
  );
  const [mediaTypeInMigrationInventory] = await eslint.lintText(
    "export async function migrationInventory(repositoryRoot) { return [repositoryRoot]; }\nfunction isOwnerEntryJsonResponseMediaType() {}",
    { filePath: "tests/helpers/migration-inventory.mjs" },
  );
  const [cumulative] = await eslint.lintText(
    [
      "export function isOwnerEntryJsonResponseMediaType(value: string | null) { return value !== null; }",
      ...earlierRestrictedNames.map((name) => `function ${name}() {}`),
    ].join("\n"),
    { filePath: "app/owner/entries/json-response-media-type.ts" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(...legacyCanonicalResults), declarationForms("isJsonResponse").length);
  assert.equal(restrictedSyntaxErrorCount(migrationInventoryInMediaType), 1);
  assert.equal(restrictedSyntaxErrorCount(mediaTypeInMigrationInventory), 1);
  assert.equal(restrictedSyntaxErrorCount(cumulative), earlierRestrictedNames.length);
});
