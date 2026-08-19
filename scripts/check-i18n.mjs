import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const enModulePath = path.join(repoRoot, "lib/i18n/messages/en.ts");
const fiModulePath = path.join(repoRoot, "lib/i18n/messages/fi.ts");
const configPath = path.join(repoRoot, "lib/i18n/config.ts");

const rawConfig = fs.readFileSync(configPath, "utf8");
if (!rawConfig.includes('export const locales = ["en", "fi"]')) {
  console.error("i18n: locales config must include exactly en and fi");
  process.exit(1);
}

const enModule = loadMessageModule(enModulePath, "en");
const fiModule = loadMessageModule(fiModulePath, "fi", enModule.en);

if (!enModule.en || !fiModule.fi) {
  console.error("i18n: expected en.ts to export `en` and fi.ts to export `fi`.");
  process.exit(1);
}

const enKeys = collectKeys(enModule.en);
const fiKeys = collectKeys(fiModule.fi);

const missingInFi = enKeys.filter((key) => !fiKeys.includes(key));
if (missingInFi.length) {
  console.error("i18n: fi is missing keys:");
  for (const key of missingInFi) {
    console.error(`  - ${key}`);
  }
  process.exit(1);
}

const extraInFi = fiKeys.filter((key) => !enKeys.includes(key));
if (extraInFi.length) {
  console.error("i18n: fi has unknown/stale keys:");
  for (const key of extraInFi) {
    console.error(`  - ${key}`);
  }
  process.exit(1);
}

console.log("i18n: messages checked (en/fi key parity is valid).");

function collectKeys(value) {
  const keys = [];
  collect(value, "");
  return keys.sort();

  function collect(current, prefix) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      for (const key of Object.keys(current)) {
        const keyPath = prefix ? `${prefix}.${key}` : key;
        collect(current[key], keyPath);
      }
      return;
    }

    keys.push(prefix);
  }
}

function normalizeMessageSource(rawSource, fallback) {
  let source = rawSource;
  if (fallback) {
    source = source.replace(
      /import\s+\{\s*en\s*\}\s+from\s+['"]\.\/en['"]?;?/,
      `const en = ${JSON.stringify(fallback)};`,
    );
  }
  const withoutImports = source
    .replace(/^import[^;\n]*;[ \t]*$/gm, "")
    .replace(/export\s+type[\s\S]+?;\s*/g, "")
    .replace(/export\s+const/g, "const");
  source = withoutImports;

  source = source
    .replace(/as const/g, "")
    .replace(/satisfies\s+[^\n]+/g, "")
    .replace(/\s+as\s+unknown\s+as\s+[^\n]+/g, "")
    .replace(/const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*[^=]+=/g, "const $1 =");

  source = source.replace(/^const\s+fi\s*=/m, "exports.fi =");
  if (!fallback) {
    source = source.replace(/^const\s+en\s*=/m, "exports.en =");
  }

  return source;
}

function loadMessageModule(filePath, exportName, fallback) {
  const source = normalizeMessageSource(fs.readFileSync(filePath, "utf8"), fallback);

  const exports = {};
  const loader = new Function("exports", `return (function() {${source}\n return exports; })();`);
  const moduleExports = loader(exports);

  if (!moduleExports || !moduleExports[exportName]) {
    throw new Error(`${path.basename(filePath)} did not export ${exportName}`);
  }

  return moduleExports;
}
