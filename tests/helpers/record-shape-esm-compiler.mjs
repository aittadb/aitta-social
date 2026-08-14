import { readFile } from "node:fs/promises";
import ts from "typescript";

const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

let recordShapeModuleUrlPromise;

/** Compiles a direct TypeScript test target with its record-shape import intact. */
export async function importRecordShapeAwareTypeScriptModule(moduleUrl, replacements = {}) {
  return import(await compileRecordShapeAwareTypeScriptModule(moduleUrl, replacements));
}

/** Compiles a direct TypeScript test target and returns its importable ESM URL. */
export async function compileRecordShapeAwareTypeScriptModule(moduleUrl, replacements = {}) {
  const recordShapeModuleUrl = await compiledRecordShapeModuleUrl();
  const source = await readFile(moduleUrl, "utf8");
  const compiled = ts.transpileModule(
    rewriteTypeScriptImportSpecifiers(source, {
      "@/lib/record-shape": recordShapeModuleUrl,
      ...replacements,
    }),
    { compilerOptions },
  ).outputText;
  return `data:text/javascript,${encodeURIComponent(compiled)}`;
}

async function compiledRecordShapeModuleUrl() {
  recordShapeModuleUrlPromise ??= compileTypeScriptModule(
    new URL("../../lib/record-shape.ts", import.meta.url),
  );
  return recordShapeModuleUrlPromise;
}

async function compileTypeScriptModule(moduleUrl) {
  const source = await readFile(moduleUrl, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions }).outputText;
  return `data:text/javascript,${encodeURIComponent(compiled)}`;
}

/** Rewrites only parsed static import module specifiers for the data-URL harness. */
export function rewriteTypeScriptImportSpecifiers(source, replacements) {
  const sourceFile = ts.createSourceFile(
    "record-shape-test-target.ts",
    source,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );
  const transformed = ts.transform(sourceFile, [
    (context) => (file) => ts.visitNode(file, function visit(node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const replacement = replacements[node.moduleSpecifier.text];
        if (replacement !== undefined) {
          return context.factory.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            context.factory.createStringLiteral(replacement),
            node.attributes,
          );
        }
      }
      return ts.visitEachChild(node, visit, context);
    }),
  ]);
  const output = ts.createPrinter().printFile(transformed.transformed[0]);
  transformed.dispose();
  return output;
}
