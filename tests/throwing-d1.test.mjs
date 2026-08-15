import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { throwingD1 } from "./helpers/throwing-d1.mjs";

const consumers = [
  "tests/custom-page-preview.test.mjs",
  "tests/private-entry-create-json.test.mjs",
  "tests/private-entry-delete-json.test.mjs",
  "tests/private-entry-edit-json.test.mjs",
  "tests/private-entry-state-json.test.mjs",
  "tests/private-profile-json.test.mjs",
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
  "responseJson",
];

test("throwingD1 exposes only fresh prepare boundaries that throw fresh exact Errors", () => {
  const first = throwingD1("FIRST_STORAGE_CANARY");
  const second = throwingD1("SECOND_STORAGE_CANARY");

  assert.deepEqual(Object.keys(first), ["prepare"]);
  assert.deepEqual(Object.keys(second), ["prepare"]);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.prepare, second.prepare);

  let firstError;
  let repeatedFirstError;
  let secondError;
  assert.throws(() => first.prepare(), (error) => {
    firstError = error;
    return true;
  });
  assert.throws(() => first.prepare(), (error) => {
    repeatedFirstError = error;
    return true;
  });
  assert.throws(() => second.prepare(), (error) => {
    secondError = error;
    return true;
  });
  for (const [error, message] of [
    [firstError, "FIRST_STORAGE_CANARY"],
    [repeatedFirstError, "FIRST_STORAGE_CANARY"],
    [secondError, "SECOND_STORAGE_CANARY"],
  ]) {
    assert.ok(error instanceof Error);
    assert.strictEqual(error.constructor, Error);
    assert.equal(error.message, message);
  }
  assert.notStrictEqual(firstError, repeatedFirstError);
  assert.notStrictEqual(firstError, secondError);
});

test("throwingD1 has one canonical declaration and six direct consumers", async () => {
  const [canonical, ...sources] = await Promise.all([
    readFile(new URL("./helpers/throwing-d1.mjs", import.meta.url), "utf8"),
    ...consumers.map((consumer) => readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8")),
  ]);

  assert.equal((canonical.match(/export function throwingD1\(message\)/gu) ?? []).length, 1);
  assert.match(canonical, /return \{\s+prepare\(\) \{\s+throw new Error\(message\);/u);
  for (const [consumer, source] of consumers.map((consumer, index) => [consumer, sources[index]])) {
    assert.match(source, /import \{ throwingD1 \} from "\.\/helpers\/throwing-d1\.mjs";/u, consumer);
    assert.doesNotMatch(source, /(?:export )?function throwingD1\(/u, consumer);
  }
});

test("lint reserves throwingD1 and retains all earlier ownership", async () => {
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
  const duplicates = declarationForms("throwingD1");
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function throwingD1(message) { return { prepare() { throw new Error(message); } }; }",
    { filePath: "tests/helpers/throwing-d1.mjs" },
  );
  const [responseJsonInThrowingD1] = await eslint.lintText(
    "export function throwingD1(message) { return { prepare() { throw new Error(message); } }; }\nasync function responseJson() {}",
    { filePath: "tests/helpers/throwing-d1.mjs" },
  );
  const [throwingD1InResponseJson] = await eslint.lintText(
    "export async function responseJson(response) { return JSON.parse(await response.text()); }\nfunction throwingD1() {}",
    { filePath: "tests/helpers/json-response-body.mjs" },
  );
  const [cumulative] = await eslint.lintText(
    [
      "export function throwingD1(message) { return { prepare() { throw new Error(message); } }; }",
      ...earlierRestrictedNames.map((name) => `function ${name}() {}`),
    ].join("\n"),
    { filePath: "tests/helpers/throwing-d1.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(responseJsonInThrowingD1), 1);
  assert.equal(restrictedSyntaxErrorCount(throwingD1InResponseJson), 1);
  assert.equal(restrictedSyntaxErrorCount(cumulative), earlierRestrictedNames.length);
});
