import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { migrationInventory } from "./helpers/migration-inventory.mjs";

const consumers = [
  "tests/presence-functional-matrix.test.mjs",
  "tests/public-contract-privacy-matrix.test.mjs",
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
  "describedBy", "entryKindLabel", "kindLabel",
];

test("migrationInventory returns only regular, ordered migration files", async (t) => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-migration-inventory-"));
  const drizzleDirectory = path.join(repositoryRoot, "drizzle");
  await mkdir(path.join(drizzleDirectory, "0003_nested.sql"), { recursive: true });
  await Promise.all([
    writeFile(path.join(drizzleDirectory, "0002_second.sql"), "-- second\n"),
    writeFile(path.join(drizzleDirectory, "0001_first.sql"), "-- first\n"),
    writeFile(path.join(drizzleDirectory, "readme.sql"), "-- not a migration\n"),
    writeFile(path.join(drizzleDirectory, "0004.sql"), "-- not a migration\n"),
    writeFile(path.join(drizzleDirectory, "0005_valid.SQL"), "-- not a migration\n"),
    symlink("0001_first.sql", path.join(drizzleDirectory, "0006_link.sql")),
  ]);
  t.after(() => rm(repositoryRoot, { recursive: true, force: true }));

  assert.deepEqual(await migrationInventory(repositoryRoot), [
    "drizzle/0001_first.sql",
    "drizzle/0002_second.sql",
  ]);
});

test("migrationInventory propagates a missing drizzle directory", async (t) => {
  const repositoryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-migration-inventory-missing-"));
  t.after(() => rm(repositoryRoot, { recursive: true, force: true }));

  await assert.rejects(migrationInventory(repositoryRoot), { code: "ENOENT" });
});

test("migration inventory has one canonical declaration and both consumers import it", async () => {
  const canonical = await readFile(
    new URL("./helpers/migration-inventory.mjs", import.meta.url),
    "utf8",
  );
  assert.equal((canonical.match(/export async function migrationInventory\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(
      new URL(`./${consumer.slice("tests/".length)}`, import.meta.url),
      "utf8",
    );
    assert.match(source, /import \{ migrationInventory \} from ["'][^"']*migration-inventory(?:\.mjs)?["']/u, consumer);
    assert.doesNotMatch(source, /^async function migrationInventory\(/mu, consumer);
    assert.doesNotMatch(source, /\breaddir\b/u, consumer);
  }
});

test("lint reserves migrationInventory while retaining TASK-226 ownership", async () => {
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
  const duplicateSources = declarationForms("migrationInventory");
  const results = await Promise.all(duplicateSources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export async function migrationInventory(repositoryRoot) { return [repositoryRoot]; }",
    { filePath: "tests/helpers/migration-inventory.mjs" },
  );
  const [entryKindLabelInMigrationInventory] = await eslint.lintText(
    "export async function migrationInventory(repositoryRoot) { return [repositoryRoot]; }\nfunction entryKindLabel() {}",
    { filePath: "tests/helpers/migration-inventory.mjs" },
  );
  const [migrationInventoryInEntryKindLabel] = await eslint.lintText(
    "export function entryKindLabel(kind: string) { return kind; }\nfunction migrationInventory() {}",
    { filePath: "lib/entry-kind-label.ts" },
  );
  const [cumulative] = await eslint.lintText(
    [
      "export async function migrationInventory(repositoryRoot) { return [repositoryRoot]; }",
      ...earlierRestrictedNames.map((name) => `function ${name}() {}`),
    ].join("\n"),
    { filePath: "tests/helpers/migration-inventory.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicateSources.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(entryKindLabelInMigrationInventory), 1);
  assert.equal(restrictedSyntaxErrorCount(migrationInventoryInEntryKindLabel), 1);
  assert.equal(restrictedSyntaxErrorCount(cumulative), earlierRestrictedNames.length);
});
