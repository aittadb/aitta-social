import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";
import { consumeResponse } from "./helpers/response-body-consumption.mjs";

const consumers = [
  "tests/presence-functional-matrix.test.mjs",
  "tests/upgrade-preservation.test.mjs",
];

test("consumeResponse calls text exactly once, awaits it, and discards the body", async () => {
  let calls = 0;
  let resolveText;
  const textFinished = new Promise((resolve) => {
    resolveText = resolve;
  });
  const response = {
    text() {
      calls += 1;
      return textFinished;
    },
  };

  let settled = false;
  const consumed = consumeResponse(response).then(() => {
    settled = true;
  });
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(settled, false);
  resolveText("discarded body");
  await consumed;
  assert.equal(settled, true);
  assert.equal(await consumeResponse({ text: async () => "discarded" }), undefined);
});

test("consumeResponse propagates the original text rejection", async () => {
  const rejection = new Error("body read failed");
  let calls = 0;
  const response = {
    text() {
      calls += 1;
      return Promise.reject(rejection);
    },
  };

  await assert.rejects(consumeResponse(response), (error) => error === rejection);
  assert.equal(calls, 1);
});

test("consumeResponse has one canonical declaration and both consumers import it", async () => {
  const canonical = await readFile(new URL("./helpers/response-body-consumption.mjs", import.meta.url), "utf8");
  assert.equal((canonical.match(/export async function consumeResponse\(/gu) ?? []).length, 1);
  for (const consumer of consumers) {
    const source = await readFile(new URL(`./${consumer.slice("tests/".length)}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /^async function consumeResponse\(/mu, consumer);
    assert.match(source, /from ["'][^"']*response-body-consumption(?:\.mjs)?["']/u, consumer);
    assert.equal((source.match(/\bconsumeResponse\(/gu) ?? []).length, consumer.includes("presence") ? 5 : 2, consumer);
  }
});

test("lint rejects every duplicate declaration form and preserves family boundaries", async () => {
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
  const duplicateSources = declarationForms("consumeResponse");
  const eslint = new ESLint();
  const results = await Promise.all(duplicateSources.map(async (source) => (
    await eslint.lintText(source, { filePath: "tests/example.test.mjs" })
  )[0]));
  const [canonical] = await eslint.lintText(
    "export async function consumeResponse(response) { await response.text(); }",
    { filePath: "tests/helpers/response-body-consumption.mjs" },
  );
  const [varyInCanonical] = await eslint.lintText(
    "export function varyHeaderTokens() {}\nexport async function consumeResponse(response) { await response.text(); }",
    { filePath: "tests/helpers/response-body-consumption.mjs" },
  );
  const [consumeInVaryCanonical] = await eslint.lintText(
    "export function varyHeaderTokens() {}\nfunction consumeResponse() {}",
    { filePath: "tests/helpers/vary-header-tokens.mjs" },
  );
  const [orderedInCanonical] = await eslint.lintText(
    "export async function consumeResponse(response) { await response.text(); }\nfunction assertOrdered() {}",
    { filePath: "tests/helpers/response-body-consumption.mjs" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicateSources.length);
  assert.equal(canonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(varyInCanonical), 1);
  assert.equal(restrictedSyntaxErrorCount(consumeInVaryCanonical), 1);
  assert.equal(restrictedSyntaxErrorCount(orderedInCanonical), 1);
});
