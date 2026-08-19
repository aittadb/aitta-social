import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ESLint } from "eslint";

import {
  characterLength,
  hasForbiddenTextControl,
  hasUrlControl,
} from "../lib/custom-pages/page-text-boundaries.ts";
import { importCustomPageDocumentModules } from "./helpers/custom-page-document-esm-compiler.mjs";
import { restrictedSyntaxErrorCount } from "./helpers/eslint-restricted-syntax.mjs";

const boundaryNames = ["characterLength", "hasForbiddenTextControl", "hasUrlControl"];
const visibleTextNames = ["pageInlineVisibleText", "visibleInlineText", "inlineVisibleText"];
const consumers = [
  "lib/custom-pages/html-fragment-compiler.ts",
  "lib/custom-pages/page-document.ts",
];

test("page text boundaries preserve Unicode code-point and control semantics", () => {
  assert.equal(characterLength("A😀e\u0301\uD800"), 5);
  assert.equal(characterLength("😀"), 1);
  assert.equal(characterLength("e\u0301"), 2);
  assert.equal(characterLength("\uD800"), 1);

  assert.equal(hasForbiddenTextControl("tabs\tand\nlines\rremain"), false);
  for (const control of ["\0", "\x01", "\x1f", "\x7f"]) {
    assert.equal(hasForbiddenTextControl(control), true, JSON.stringify(control));
  }
  assert.equal(hasForbiddenTextControl("space \u0085 remains"), false);

  assert.equal(hasUrlControl("https://example.com/\u0085"), false);
  for (const control of ["\0", "\t", "\n", "\r", "\x1f", " ", "\x7f"]) {
    assert.equal(hasUrlControl(`https://example.com/${control}`), true, JSON.stringify(control));
  }
});

test("nested inline text stays visible to compiler and document validation", async () => {
  const { pageDocument, htmlFragmentCompiler } = await importCustomPageDocumentModules();
  const { isPageDocumentV1, pageInlineVisibleText } = pageDocument;
  const { compilePagePreview, PagePreviewValidationError } = htmlFragmentCompiler;
  const content = [
    { type: "text", text: "before " },
    {
      type: "strong",
      content: [
        { type: "code", text: "code" },
        {
          type: "emphasis",
          content: [{ type: "link", label: " link", destination: { kind: "updates" } }],
        },
      ],
    },
    { type: "text", text: " after" },
  ];
  assert.equal(pageInlineVisibleText(content), "before code link after");

  const document = compilePagePreview({
    schemaVersion: 1,
    title: "Unicode 😀 page",
    description: "Nested inline content stays visible.",
    htmlFragment: "<p>before <strong><code>code</code><em><a href=\"/updates\"> link</a></em></strong> after</p>",
  });
  assert.equal(isPageDocumentV1(document), true);

  assert.throws(
    () => compilePagePreview({
      schemaVersion: 1,
      title: "invalid\0title",
      description: null,
      htmlFragment: "<p>Visible content</p>",
    }),
    PagePreviewValidationError,
  );

  assert.equal(isPageDocumentV1({ ...document, title: "invalid\0title" }), false);
  assert.equal(
    isPageDocumentV1({
      ...document,
      sections: [{
        ...document.sections[0],
        blocks: [{
          type: "paragraph",
          content: [{
            type: "link",
            label: "External",
            destination: { kind: "external", url: "https://example.com/\x7f" },
          }],
        }],
      }],
    }),
    false,
  );
});

test("page text boundaries and visible-text recursion have canonical declarations and imports", async () => {
  const [boundaries, document, compiler] = await Promise.all([
    readFile(new URL("../lib/custom-pages/page-text-boundaries.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/custom-pages/page-document.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/custom-pages/html-fragment-compiler.ts", import.meta.url), "utf8"),
  ]);

  for (const name of boundaryNames) {
    assert.equal((boundaries.match(new RegExp(`export function ${name}\\(`, "gu")) ?? []).length, 1, name);
    assert.doesNotMatch(document, new RegExp(`function ${name}\\(`, "u"), `page document: ${name}`);
    assert.doesNotMatch(compiler, new RegExp(`function ${name}\\(`, "u"), `compiler: ${name}`);
  }
  assert.equal((document.match(/export function pageInlineVisibleText\(/gu) ?? []).length, 1);
  for (const name of visibleTextNames.slice(1)) {
    assert.doesNotMatch(document, new RegExp(`function ${name}\\(`, "u"), `page document: ${name}`);
    assert.doesNotMatch(compiler, new RegExp(`function ${name}\\(`, "u"), `compiler: ${name}`);
  }
  for (const consumer of consumers) {
    const source = consumer.endsWith("page-document.ts") ? document : compiler;
    assert.match(source, /from ["'][^"']*page-text-boundaries["']/u, consumer);
  }
  assert.match(compiler, /from ["'][^"']*page-document["']/u);
  assert.match(compiler, /\bpageInlineVisibleText\(/u);
});

test("lint rejects boundary and legacy visible-text redeclarations without weakening prior leaves", async () => {
  const eslint = new ESLint();
  const names = [...boundaryNames, ...visibleTextNames];
  const duplicates = names.flatMap(declarationForms);
  const results = await Promise.all(duplicates.map(async (source) => (
    await eslint.lintText(source, { filePath: "app/example.ts" })
  )[0]));
  const [boundariesCanonical] = await eslint.lintText(
    boundaryNames.map((name) => `export function ${name}(value) { return value; }`).join("\n"),
    { filePath: "lib/custom-pages/page-text-boundaries.ts" },
  );
  const [documentCanonical] = await eslint.lintText(
    "export function pageInlineVisibleText(value) { return value; }",
    { filePath: "lib/custom-pages/page-document.ts" },
  );
  const [boundaryInDocument] = await eslint.lintText(
    "function characterLength(value) { return value.length; }",
    { filePath: "lib/custom-pages/page-document.ts" },
  );
  const [visibleTextInBoundary] = await eslint.lintText(
    "function visibleInlineText(value) { return value; }",
    { filePath: "lib/custom-pages/page-text-boundaries.ts" },
  );
  const legacyVisibleTextInDocument = await Promise.all(
    visibleTextNames.slice(1).flatMap(declarationForms).map(async (source) => (
      await eslint.lintText(source, { filePath: "lib/custom-pages/page-document.ts" })
    )[0]),
  );
  const [recordShapeInBoundary] = await eslint.lintText(
    "function isRecord(value) { return Boolean(value); }",
    { filePath: "lib/custom-pages/page-text-boundaries.ts" },
  );

  assert.equal(restrictedSyntaxErrorCount(...results), duplicates.length);
  assert.equal(boundariesCanonical.errorCount, 0);
  assert.equal(documentCanonical.errorCount, 0);
  assert.equal(restrictedSyntaxErrorCount(boundaryInDocument), 1);
  assert.equal(restrictedSyntaxErrorCount(visibleTextInBoundary), 1);
  assert.equal(
    restrictedSyntaxErrorCount(...legacyVisibleTextInDocument),
    visibleTextNames.slice(1).length * declarationForms("visibleInlineText").length,
  );
  assert.equal(restrictedSyntaxErrorCount(recordShapeInBoundary), 1);
});

function declarationForms(name) {
  return [
    `function ${name}(value) { return value; }`,
    `export function ${name}(value) { return value; }`,
    `export default function ${name}(value) { return value; }`,
    `export default (function ${name}(value) { return value; });`,
    `const ${name} = () => null;`,
    `export const ${name} = () => null;`,
    `const ${name} = function () { return null; };`,
    `export const ${name} = function () { return null; };`,
    `class ${name} {}`,
    `export class ${name} {}`,
    `export default class ${name} {}`,
    `export default (class ${name} {});`,
    `const ${name} = class ${name} {};`,
    `export const ${name} = class ${name} {};`,
  ];
}
