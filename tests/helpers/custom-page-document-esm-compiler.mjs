import { readFile } from "node:fs/promises";
import ts from "typescript";

import { rewriteTypeScriptImportSpecifiers } from "./record-shape-esm-compiler.mjs";

const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

let modulesPromise;

/** Imports custom-page modules after replacing their extensionless local imports for Node tests. */
export async function importCustomPageDocumentModules() {
  modulesPromise ??= compileCustomPageDocumentModules();
  return modulesPromise;
}

async function compileCustomPageDocumentModules() {
  const [recordShapeUrl, pageTextBoundariesUrl, parse5Url] = await Promise.all([
    compileTypeScriptModule(new URL("../../lib/record-shape.ts", import.meta.url)),
    compileTypeScriptModule(new URL("../../lib/custom-pages/page-text-boundaries.ts", import.meta.url)),
    import.meta.resolve("parse5"),
  ]);
  const pageDocumentUrl = await compileTypeScriptModule(
    new URL("../../lib/custom-pages/page-document.ts", import.meta.url),
    {
      "../record-shape": recordShapeUrl,
      "./page-text-boundaries": pageTextBoundariesUrl,
    },
  );
  const htmlFragmentCompilerUrl = await compileTypeScriptModule(
    new URL("../../lib/custom-pages/html-fragment-compiler.ts", import.meta.url),
    {
      parse5: parse5Url,
      "../record-shape": recordShapeUrl,
      "./page-document": pageDocumentUrl,
      "./page-text-boundaries": pageTextBoundariesUrl,
    },
  );
  const [pageDocument, htmlFragmentCompiler] = await Promise.all([
    import(pageDocumentUrl),
    import(htmlFragmentCompilerUrl),
  ]);
  return { pageDocument, htmlFragmentCompiler };
}

async function compileTypeScriptModule(moduleUrl, replacements = {}) {
  const source = await readFile(moduleUrl, "utf8");
  const compiled = ts.transpileModule(
    rewriteTypeScriptImportSpecifiers(source, replacements),
    { compilerOptions },
  ).outputText;
  return `data:text/javascript,${encodeURIComponent(compiled)}`;
}
