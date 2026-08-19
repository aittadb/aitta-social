import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { entryKindLabel } from "../lib/entry-kind-label.ts";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { FakeD1, entryRow, fetchApp, makeEnv } from "./helpers/worker-harness.mjs";

const consumers = [
  "app/page-content.tsx",
  "app/entries/[id]/page.tsx",
  "lib/public-metadata.ts",
];

test("entryKindLabel preserves every fixed entry-kind label", () => {
  assert.equal(entryKindLabel("note"), "Note");
  assert.equal(entryKindLabel("article"), "Article");
  assert.equal(entryKindLabel("announcement"), "Announcement");
  assert.equal(entryKindLabel("link"), "Link");
});

test("titleless entry metadata retains its kind label fallback", async () => {
  const response = await fetchApp("/entries/titleless-link", {
    headers: { accept: "text/html" },
    env: makeEnv({
      db: new FakeD1({
        entries: [entryRow({ id: "titleless-link", kind: "link", title: null })],
      }),
      canonicalUrl: "https://canonical.example/aitta",
    }),
  });

  assert.equal(response.status, 200);
  assert.match(await response.text(), /<title>Link update · Ada Account<\/title>/u);
});

test("entry-kind labels have one canonical declaration and three production consumers", async () => {
  const [canonical, page, entryPage, metadata] = await Promise.all([
    readFile(new URL("../lib/entry-kind-label.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page-content.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/entries/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/public-metadata.ts", import.meta.url), "utf8"),
  ]);
  const sources = [page, entryPage, metadata];

  assert.equal((canonical.match(/export function entryKindLabel\(/gu) ?? []).length, 1);
  for (const [consumer, source] of consumers.map((consumer, index) => [consumer, sources[index]])) {
    assert.match(source, /import \{ entryKindLabel \} from /u, consumer);
    assert.doesNotMatch(source, /^function (?:entryKindLabel|kindLabel|capitalize)\(/mu, consumer);
  }
  assert.equal((page.match(/entryKindLabel\(entry\.kind\)/gu) ?? []).length, 1);
  assert.equal((entryPage.match(/entryKindLabel\(entry\.kind\)/gu) ?? []).length, 2);
  assert.equal((metadata.match(/entryKindLabel\(entry\.kind\)/gu) ?? []).length, 1);
});

test("lint reserves entryKindLabel and kindLabel while retaining TASK-225 ownership", async () => {
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
    ...declarationForms("entryKindLabel"),
    ...declarationForms("kindLabel"),
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "lib/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function entryKindLabel(kind: string) { return kind; }",
    { filePath: "lib/entry-kind-label.ts" },
  );
  const legacyCanonicalResults = await Promise.all(declarationForms("kindLabel").map(async (source) => (
    await eslint.lintText(source, { filePath: "lib/entry-kind-label.ts" })
  )[0]));
  const [describedByInLabel] = await eslint.lintText(
    "export function entryKindLabel(kind: string) { return kind; }\nfunction describedBy() {}",
    { filePath: "lib/entry-kind-label.ts" },
  );
  const [entryKindLabelInDescription] = await eslint.lintText(
    "export function describedBy(...ids: Array<string | undefined>) { return ids.filter(Boolean).join(\" \") || undefined; }\nfunction entryKindLabel() {}",
    { filePath: "app/owner/form-field-description.ts" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(...legacyCanonicalResults), declarationForms("kindLabel").length);
  assert.equal(restrictedSyntaxErrorCount(describedByInLabel), 1);
  assert.equal(restrictedSyntaxErrorCount(entryKindLabelInDescription), 1);
});
