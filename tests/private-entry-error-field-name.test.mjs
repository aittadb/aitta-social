import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { privateEntryErrorFieldName } from "../app/owner/entries/private-entry-error-field-name.ts";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const responseConsumers = [
  "app/owner/entries/draft-create-response.ts",
  "app/owner/entries/edit-save-response.ts",
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
  "isOwnerEntryJsonResponseMediaType", "isJsonResponse",
];

test("private-entry error fields map the accepted response names", () => {
  assert.equal(privateEntryErrorFieldName("entryKind"), "kind");
  assert.equal(privateEntryErrorFieldName("kind"), "kind");
  assert.equal(privateEntryErrorFieldName("title"), "title");
  assert.equal(privateEntryErrorFieldName("body"), "body");
  assert.equal(privateEntryErrorFieldName("destinationUrl"), "destinationUrl");
});

test("private-entry error fields reject values outside the exact response allowlist", () => {
  for (const value of ["", " entryKind", "entryKind ", "ENTRYKIND", "Kind", "unknown"]) {
    assert.equal(privateEntryErrorFieldName(value), null, value);
  }
});

test("private-entry error field mapping has one response canonical declaration and keeps form controls separate", async () => {
  const [canonical, ...sources] = await Promise.all([
    readFile(new URL("../app/owner/entries/private-entry-error-field-name.ts", import.meta.url), "utf8"),
    ...responseConsumers.map((consumer) => readFile(new URL(`../${consumer}`, import.meta.url), "utf8")),
    readFile(new URL("../app/owner/entries/EntryForm.tsx", import.meta.url), "utf8"),
  ]);
  const form = sources.pop();

  assert.equal((canonical.match(/export function privateEntryErrorFieldName\(/gu) ?? []).length, 1);
  for (const [consumer, source] of responseConsumers.map((consumer, index) => [consumer, sources[index]])) {
    assert.match(source, /import \{ privateEntryErrorFieldName \} from "\.\/private-entry-error-field-name";/u, consumer);
    assert.doesNotMatch(source, /^function (?:privateEntryErrorFieldName|entryFieldName)\(/mu, consumer);
    assert.equal((source.match(/privateEntryErrorFieldName\(item\.name\)/gu) ?? []).length, 1, consumer);
  }
  assert.match(form, /function entryFormFieldName\(value: string\): EntryFieldName \| null/u);
  assert.doesNotMatch(form, /function entryFieldName\(/u);
  assert.doesNotMatch(form, /privateEntryErrorFieldName/u);
  const formMapper = form.match(/function entryFormFieldName[\s\S]*?\n\}/u);
  assert.ok(formMapper);
  assert.doesNotMatch(formMapper[0], /entryKind/u);
});

test("lint reserves privateEntryErrorFieldName and legacy entryFieldName while retaining TASK-228 ownership", async () => {
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
    ...declarationForms("privateEntryErrorFieldName"),
    ...declarationForms("entryFieldName"),
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/owner/entries/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function privateEntryErrorFieldName(value: string) { return value === \"kind\" ? \"kind\" : null; }",
    { filePath: "app/owner/entries/private-entry-error-field-name.ts" },
  );
  const legacyCanonicalResults = await Promise.all(declarationForms("entryFieldName").map(async (source) => (
    await eslint.lintText(source, { filePath: "app/owner/entries/private-entry-error-field-name.ts" })
  )[0]));
  const [privateFieldInMediaType] = await eslint.lintText(
    "export function isOwnerEntryJsonResponseMediaType(value: string | null) { return value !== null; }\nfunction privateEntryErrorFieldName() {}",
    { filePath: "app/owner/entries/json-response-media-type.ts" },
  );
  const [mediaTypeInPrivateField] = await eslint.lintText(
    "export function privateEntryErrorFieldName(value: string) { return value === \"kind\" ? \"kind\" : null; }\nfunction isOwnerEntryJsonResponseMediaType() {}",
    { filePath: "app/owner/entries/private-entry-error-field-name.ts" },
  );
  const [cumulative] = await eslint.lintText(
    [
      "export function privateEntryErrorFieldName(value: string) { return value === \"kind\" ? \"kind\" : null; }",
      ...earlierRestrictedNames.map((name) => `function ${name}() {}`),
    ].join("\n"),
    { filePath: "app/owner/entries/private-entry-error-field-name.ts" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(...legacyCanonicalResults), declarationForms("entryFieldName").length);
  assert.equal(restrictedSyntaxErrorCount(privateFieldInMediaType), 1);
  assert.equal(restrictedSyntaxErrorCount(mediaTypeInPrivateField), 1);
  assert.equal(restrictedSyntaxErrorCount(cumulative), earlierRestrictedNames.length);
});
