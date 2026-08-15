import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { expectedApiV1JsonLink } from "./helpers/api-v1-json-link.mjs";

const consumers = [
  "tests/api-v1-collection.test.mjs",
  "tests/api-v1-entry-detail.test.mjs",
  "tests/api-v1-profile.test.mjs",
];

test("expectedApiV1JsonLink returns exact fresh JSON-link expectations", () => {
  assert.deepEqual(expectedApiV1JsonLink("self", "https://example.test/"), {
    rel: "self",
    href: "https://example.test/",
    mediaType: "application/json",
  });
  assert.deepEqual(expectedApiV1JsonLink("", "https://example.test/ä/日本"), {
    rel: "",
    href: "https://example.test/ä/日本",
    mediaType: "application/json",
  });
  const first = expectedApiV1JsonLink("item", "one");
  const second = expectedApiV1JsonLink("item", "one");
  assert.notStrictEqual(first, second);
  first.rel = "changed";
  assert.equal(second.rel, "item");
});

test("expectedApiV1JsonLink has one canonical declaration and three consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/api-v1-json-link.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function expectedApiV1JsonLink\(/gu) ?? []).length, 1);
  assert.doesNotMatch(canonical, /from ["'][^"']*(?:public-entry-document|representation)|JSON_MEDIA_TYPE/gu);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /^function jsonLink\(/mu, consumer);
    assert.match(source, /from ["'][^"']*api-v1-json-link(?:\.mjs)?["']/u, consumer);
    assert.doesNotMatch(source, /from ["'][^"']*(?:public-entry-document|representation)|JSON_MEDIA_TYPE/gu, consumer);
  }
  const production = await readFile(new URL("../lib/public-entry-document/representation.ts", import.meta.url), "utf8");
  assert.match(production, /^function jsonLink\(/mu);
  assert.doesNotMatch(production, /api-v1-json-link/gu);
});

test("lint rejects both helper names in all declaration forms with safe guidance", async () => {
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
  const sources = forms.flatMap((form) => [
    form.replaceAll("NAME", "expectedApiV1JsonLink"),
    form.replaceAll("NAME", "jsonLink"),
  ]);
  const results = await Promise.all(sources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  assert.equal(restrictedSyntaxErrorCount(...results), sources.length);
  assert(results.every(({ messages }) => messages.some(({ message }) => (
    message.includes("tests/helpers/api-v1-json-link.mjs") ||
    message.includes("lib/public-entry-document/representation.ts")
  ))));
  const jsonLinkDiagnostics = results
    .filter((_result, index) => index % 2 === 1)
    .flatMap(({ messages }) => messages.map(({ message }) => message))
    .join("\n");
  assert.match(jsonLinkDiagnostics, /Keep jsonLink private/gu);
  assert.match(jsonLinkDiagnostics, /independent expectedApiV1JsonLink oracle/gu);
  assert.doesNotMatch(jsonLinkDiagnostics, /Import jsonLink from lib\/public-entry-document\/representation\.ts/gu);
});

test("lint exempts only each canonical owner and retains prior restrictions", async () => {
  const eslint = new ESLint();
  const expectedCanonical = await eslint.lintText(
    "export function expectedApiV1JsonLink(rel, href) { return { rel, href, mediaType: \"application/json\" }; }",
    { filePath: "tests/helpers/api-v1-json-link.mjs" },
  );
  const productionCanonical = await eslint.lintText(
    "function jsonLink(rel, href) { return { rel, href, mediaType: JSON_MEDIA_TYPE }; }",
    { filePath: "lib/public-entry-document/representation.ts" },
  );
  const crossFamily = await eslint.lintText(
    "function expectedApiV1JsonLink() {}\nfunction jsonLink() {}",
    { filePath: "tests/example.test.mjs" },
  );
  const priorRestriction = await eslint.lintText(
    "function isRecord() {}",
    { filePath: "tests/example.test.mjs" },
  );
  assert.equal(restrictedSyntaxErrorCount(...expectedCanonical), 0);
  assert.equal(restrictedSyntaxErrorCount(...productionCanonical), 0);
  assert.equal(restrictedSyntaxErrorCount(...crossFamily), 2);
  assert.equal(restrictedSyntaxErrorCount(...priorRestriction), 1);
});
