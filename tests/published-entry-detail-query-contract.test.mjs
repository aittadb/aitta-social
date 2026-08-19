import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { expectedApiV1JsonLink } from "./helpers/api-v1-json-link.mjs";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { assertPublishedOnlyDetailQueries } from "./helpers/published-entry-detail-query-contract.mjs";

const consumers = [
  "tests/api-v1-entry-detail.test.mjs",
  "tests/public-entry-document.test.mjs",
];

function db(queries) {
  return { queries };
}

function query(sql, values) {
  return { sql, values };
}

test("assertPublishedOnlyDetailQueries accepts ordered published detail queries", () => {
  assert.doesNotThrow(() => assertPublishedOnlyDetailQueries(db([
    query("SELECT * FROM entries WHERE id = ? AND state = ?", ["first", "published"]),
    query("select * from entries where id = ? and state = ?", ["second", "published"]),
  ]), ["first", "second"]));
});

test("assertPublishedOnlyDetailQueries ignores unrelated queries and supports empty and repeated identifiers", () => {
  assert.doesNotThrow(() => assertPublishedOnlyDetailQueries(db([
    query("SELECT * FROM profiles", []),
    query("SELECT * FROM entries WHERE id = ? AND state = ?", ["same", "published"]),
    query("SELECT * FROM audit_log", []),
    query("SELECT * FROM entries WHERE id = ? AND state = ?", ["same", "published"]),
  ]), ["same", "same"]));
  assert.doesNotThrow(() => assertPublishedOnlyDetailQueries(db([
    query("SELECT * FROM profiles", []),
  ]), []));
});

test("assertPublishedOnlyDetailQueries rejects wrong count, predicate, order, bindings, and state", () => {
  const cases = [
    ["wrong count", db([]), ["entry-1"]],
    ["missing state predicate", db([query("SELECT * FROM entries WHERE id = ?", ["entry-1", "published"])]), ["entry-1"]],
    ["wrong order", db([
      query("SELECT * FROM entries WHERE id = ? AND state = ?", ["second", "published"]),
      query("SELECT * FROM entries WHERE id = ? AND state = ?", ["first", "published"]),
    ]), ["first", "second"]],
    ["wrong bindings", db([query("SELECT * FROM entries WHERE id = ? AND state = ?", ["other", "published"])]), ["entry-1"]],
    ["non-published state", db([query("SELECT * FROM entries WHERE id = ? AND state = ?", ["entry-1", "DRAFT"])]), ["entry-1"]],
  ];
  for (const [label, database, ids] of cases) {
    assert.throws(() => assertPublishedOnlyDetailQueries(database, ids), undefined, label);
  }
});

test("assertPublishedOnlyDetailQueries has one canonical declaration and both consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/published-entry-detail-query-contract.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function assertPublishedOnlyDetailQueries\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /function assertPublishedOnlyDetailQueries\(/u, consumer);
    assert.match(source, /from ["'][^"']*published-entry-detail-query-contract(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects all duplicate forms and cross-family declarations while allowing only the canonical helper", async () => {
  const eslint = new ESLint();
  const forms = [
    "function NAME() {}",
    "export function NAME() {}",
    "export default function NAME() {}",
    "export default (function NAME() {});",
    "class NAME {}",
    "export class NAME {}",
    "export default class NAME {}",
    "export default (class NAME {});",
    "const NAME = () => {};",
    "export const NAME = () => {};",
    "const NAME = function () {};",
    "export const NAME = function () {};",
    "const NAME = class {};",
    "export const NAME = class {};",
  ];
  const duplicates = forms.map((form) => form.replaceAll("NAME", "assertPublishedOnlyDetailQueries"));
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function assertPublishedOnlyDetailQueries(db, ids) { return db.queries.length === ids.length; }",
    { filePath: "tests/helpers/published-entry-detail-query-contract.mjs" },
  );
  const [crossFamily] = await eslint.lintText(
    "function assertPublishedOnlyDetailQueries() {}\nfunction expectedApiV1JsonLink() {}",
    { filePath: "tests/example.test.mjs" },
  );
  const [expectedCanonical] = await eslint.lintText(
    "export function expectedApiV1JsonLink(rel, href) { return { rel, href, mediaType: \"application/json\" }; }",
    { filePath: "tests/helpers/api-v1-json-link.mjs" },
  );
  assert.equal(restrictedSyntaxErrorCount(...results), forms.length);
  assert.equal(restrictedSyntaxErrorCount(canonical), 0);
  assert.equal(restrictedSyntaxErrorCount(crossFamily), 2);
  assert.equal(restrictedSyntaxErrorCount(expectedCanonical), 0);
  assert.equal(typeof expectedApiV1JsonLink, "function");
});
