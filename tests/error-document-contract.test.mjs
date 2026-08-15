import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { errorDocument } from "./helpers/error-document-contract.mjs";

const consumers = [
  "tests/api-v1-root.test.mjs",
  "tests/api-v1-entry-detail.test.mjs",
  "tests/api-v1-collection.test.mjs",
  "tests/api-v1-profile.test.mjs",
  "tests/public-entry-document.test.mjs",
  "tests/private-entry-delete-json.test.mjs",
];

test("error document preserves the exact fresh envelope", () => {
  const code = "not_found";
  const message = "Entry was not found.";
  const first = errorDocument(code, message);
  const second = errorDocument("other", "Other message.");

  assert.deepEqual(first, { data: null, error: { code, message }, links: [] });
  assert.deepEqual(second, { data: null, error: { code: "other", message: "Other message." }, links: [] });
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.error, second.error);
  assert.notStrictEqual(first.links, second.links);
  first.error.code = "changed";
  first.links.push("changed");
  assert.deepEqual(second, { data: null, error: { code: "other", message: "Other message." }, links: [] });
});

test("error document has one canonical declaration and all consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/error-document-contract.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function errorDocument\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /function errorDocument\(/u, consumer);
    assert.match(source, /from ["'][^"']*error-document-contract(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects every duplicate error-document declaration and preserves all canonical allowances", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "function errorDocument() {}",
    "export function errorDocument() {}",
    "export default function errorDocument() {}",
    "export default (function errorDocument() {});",
    "const errorDocument = () => {};",
    "export const errorDocument = () => {};",
    "const errorDocument = function () {};",
    "export const errorDocument = function () {};",
    "class errorDocument {}",
    "export class errorDocument {}",
    "export default class errorDocument {}",
    "export default (class errorDocument {});",
    "const errorDocument = class errorDocument {};",
    "export const errorDocument = class errorDocument {};",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function errorDocument(code, message) { return { data: null, error: { code, message }, links: [] }; }",
    { filePath: "tests/helpers/error-document-contract.mjs" },
  );
  const [recordShapeCanonicalDuplicate] = await eslint.lintText(
    "function errorDocument() {}",
    { filePath: "lib/record-shape.ts" },
  );
  assert.equal(restrictedSyntaxErrors(results), duplicates.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrors([recordShapeCanonicalDuplicate]), 1);
});

function restrictedSyntaxErrors(results) {
  return results.flatMap(({ messages }) => messages).filter(({ ruleId }) => ruleId === "no-restricted-syntax").length;
}
