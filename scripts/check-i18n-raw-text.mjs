import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const repoRoot = process.cwd();
const targetRoot = repoRoot;

const CHECKED_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "button",
  "a",
  "label",
  "li",
  "td",
  "th",
  "summary",
  "figcaption",
  "title",
]);

const CHECKED_ATTRIBUTES = new Set([
  "placeholder",
  "aria-label",
  "aria-description",
  "aria-valuetext",
  "title",
  "alt",
  "caption",
  "label",
]);

const SKIP_FILES = [
  /\/tests\//,
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
];

const SKIP_TEXT_PARENTS = new Set(["code", "pre", "style", "script", "codeblock"]);
const SKIP_DIRS = new Set(["node_modules", ".wrangler", "dist", "build", ".next", ".git"]);

const findings = [];
const files = scanTsxFiles(targetRoot);

for (const file of files) {
  if (SKIP_FILES.some((pattern) => pattern.test(file))) continue;

  const sourceText = fs.readFileSync(file, "utf8");
  if (isFileIgnored(sourceText)) continue;
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const lines = sourceText.split(/\r?\n/);

  const fileFindings = [];
  const parentStack = [];

  const visit = (node) => {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText(sourceFile);
      parentStack.push(tag);
      ts.forEachChild(node, visit);
      parentStack.pop();
      return;
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile);
      parentStack.push(tag);
      // no children
      parentStack.pop();
      return;
    }

    if (ts.isJsxExpression(node) && ts.isStringLiteral(node.expression)) {
      // handled by text checks if not in JSX text context
    }

    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile);
      if (isIgnoredLine(lines, sourceFile.getLineAndCharacterOfPosition(node.getStart()).line)) {
        return;
      }

      const trimmed = normalizeJsxText(text);
      if (!trimmed) {
        return;
      }

      const parentTag = parentStack[parentStack.length - 1]?.toLowerCase();
      if (parentTag && !CHECKED_TAGS.has(parentTag)) {
        return;
      }
      if (parentTag && SKIP_TEXT_PARENTS.has(parentTag)) {
        return;
      }

      fileFindings.push(formatFinding(file, node.getStart(), sourceText, trimmed));
      return;
    }

    if (ts.isJsxAttribute(node)) {
      const attributeName = node.name.getText(sourceFile);
      if (!CHECKED_ATTRIBUTES.has(attributeName)) {
        return ts.forEachChild(node, visit);
      }

      const initializer = node.initializer;
      if (!initializer) return;

      if (
        initializer.kind === ts.SyntaxKind.StringLiteral
        || initializer.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
      ) {
        const value = initializer.text;
        if (!value || value.trim().length < 2) return;
        if (isIgnoredLine(lines, sourceFile.getLineAndCharacterOfPosition(node.getStart()).line)) {
          return;
        }

        if (!looksLikeUiText(value, attributeName)) {
          return;
        }

        fileFindings.push(formatFinding(file, node.getStart(), sourceText, value, `attribute ${attributeName}`));
      }
      return;
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  if (fileFindings.length) {
    findings.push(...fileFindings);
  }
}

function isFileIgnored(sourceText) {
  return sourceText.includes("i18n-raw-text: ignore")
    || sourceText.includes("i18n:raw-text-ignore");
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}:${finding.column}`);
    console.error(`  User-visible text should use i18n: ${finding.value}`);
    if (finding.attribute) {
      console.error(`  at ${finding.attribute}`);
    }
  }
  process.exit(1);
}

console.log("i18n-raw-text: no hardcoded user-visible text found in tsx/jsx files.");

function isIgnoredLine(lines, line) {
  const lineIndex = line;
  for (let i = Math.max(0, lineIndex - 2); i <= lineIndex; i += 1) {
    const candidate = lines[i];
    if (!candidate) continue;
    if (candidate.includes("i18n-ignore") || candidate.includes("i18n:disable-text-check")) {
      return true;
    }
  }
  return false;
}

function normalizeJsxText(text) {
  const trimmed = text
    .replace(/\u00a0/g, " ")
    .trim();
  if (!trimmed) return "";
  if (/^[{}]|[{}]$/.test(trimmed)) return "";

  const simplified = trimmed.replace(/\s+/g, " ");
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(simplified)) return "";
  if (!/[.\-!?,:]/.test(simplified) && simplified.length <= 2) return "";
  if (/^\d+$/.test(simplified)) return "";
  if (/(?:^|\s)([A-Z]{2,}|\w+\.\w+|\/[\w-]+|\{\{?)/.test(simplified) && simplified.split(/\s+/).length <= 1) {
    return "";
  }

  if (/(?:\{\{|\{|<|>|<\/)/.test(simplified)) return "";
  return simplified;
}

function looksLikeUiText(value, attributeName) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/[\n\r]/.test(trimmed)) return false;
  if (/^https?:\/\//.test(trimmed)) return false;
  if (/^\w+:/.test(trimmed)) return false;
  if (/^\//.test(trimmed) && trimmed.length <= 3) return false;
  if (attributeName === "alt" && /^logo$/i.test(trimmed)) return false;
  if (trimmed.length <= 2 && !/\s/.test(trimmed)) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^[A-Z0-9_.-]+$/.test(trimmed)) return false;
  if (/^[^A-Za-zÀ-ÖØ-öø-ÿ]*$/.test(trimmed)) return false;
  if (/^[_a-zA-Z][\w-]*$/.test(trimmed) && !/\s/.test(trimmed)) return false;
  return true;
}

function formatFinding(file, position, sourceText, value, attribute) {
  const sourceFile = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(position);
  return {
    file,
    line: line + 1,
    column: character + 1,
    value,
    attribute,
  };
}

function scanTsxFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx")) {
        out.push(abs);
      }
    }
  };
  walk(root);
  return out;
}
