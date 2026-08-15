import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { deletionAcknowledgement } from "./helpers/deletion-acknowledgement-contract.mjs";

const consumers = [
  "tests/assisted-runtime-journey.test.mjs",
  "tests/delete-lifecycle.test.mjs",
  "tests/owner-security.test.mjs",
  "tests/private-entry-delete-json.test.mjs",
];

test("deletion acknowledgement is exact and fresh for every identifier", () => {
  const first = deletionAcknowledgement("entry-1");
  const second = deletionAcknowledgement("entry-1");
  assert.deepEqual(first, {
    data: { id: "entry-1", type: "owner-entry-deletion", attributes: { deleted: true } },
    links: [
      { rel: "collection", href: "/owner", mediaType: "text/html" },
      { rel: "recovery", href: "/owner", mediaType: "text/html" },
    ],
    actions: [],
  });
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.data, second.data);
  assert.notStrictEqual(first.data.attributes, second.data.attributes);
  assert.notStrictEqual(first.links, second.links);
  assert.notStrictEqual(first.links[0], second.links[0]);
  assert.notStrictEqual(first.links[1], second.links[1]);
  assert.notStrictEqual(first.actions, second.actions);
  first.links[0].href = "/changed";
  first.actions.push({ rel: "unexpected" });
  assert.equal(second.links[0].href, "/owner");
  assert.deepEqual(second.actions, []);
});

test("deletion acknowledgement has one canonical declaration and imported consumers", async () => {
  const canonical = await readFile(new URL("./helpers/deletion-acknowledgement-contract.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export function deletionAcknowledgement\(/gu) ?? []).length, 1);
  const sources = await Promise.all(consumers.map(async (consumer) => [
    consumer,
    await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8"),
  ]));
  for (const [consumer, source] of sources) {
    assert.doesNotMatch(source, /(?:function|const)\s+(?:deletionAcknowledgement|acknowledgement)\b/u, consumer);
    assert.match(source, /from ["'][^"']*deletion-acknowledgement-contract(?:\.mjs)?["']/u, consumer);
  }
});

test("lint rejects canonical and legacy acknowledgement redeclarations while allowing the canonical leaf", async () => {
  const eslint = new ESLint();
  const duplicates = [
    "export function deletionAcknowledgement(value) { return value; }",
    "export function acknowledgement(value) { return value; }",
    "export default function deletionAcknowledgement(value) { return value; }",
    "export default function acknowledgement(value) { return value; }",
    "export default (function deletionAcknowledgement() { return {}; });",
    "export default (function acknowledgement() { return {}; });",
    "export class deletionAcknowledgement {}",
    "export class acknowledgement {}",
    "export const deletionAcknowledgement = () => ({});",
    "export const acknowledgement = () => ({});",
    "export const deletionAcknowledgement = function () { return {}; };",
    "export const acknowledgement = function () { return {}; };",
  ];
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export function deletionAcknowledgement(value) { return value; }",
    { filePath: "tests/helpers/deletion-acknowledgement-contract.mjs" },
  );
  const [legacyCanonical] = await eslint.lintText(
    "function acknowledgement(value) { return value; }",
    { filePath: "tests/helpers/deletion-acknowledgement-contract.mjs" },
  );
  assert.equal(
    results.flatMap(({ messages }) => messages).filter(({ ruleId }) => ruleId === "no-restricted-syntax").length,
    duplicates.length,
  );
  assert.equal(restrictedSyntaxErrors(canonical), 0);
  assert.equal(restrictedSyntaxErrors(legacyCanonical), 1);
});

function restrictedSyntaxErrors(result) {
  return result.messages.filter(({ ruleId }) => ruleId === "no-restricted-syntax").length;
}
