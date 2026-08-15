import { readdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";

const APP_ROOT = path.resolve(process.cwd(), "app");

const GLOBAL_FILE_PATTERNS = [
  /^\.\/globals\.css$/u,
  /^\.\/styles\/.+\.css$/u,
];

const SHARED_GLOBAL_CLASS_ALLOWLIST = new Set([
  "button",
  "button-small",
  "button-quiet",
  "button-danger",
  "text-link",
  "skip-link",
  "visually-hidden",
  "visuallyHidden",
  "visually-hidden-only",
  "eyebrow",
  "public-state-page",
  "public-state-shell",
  "public-shell",
  "template-shell",
  "technical-shell",
  "privacy-shell",
  "update-kind",
  "update-destination",
  "button-row",
  "density-comfortable",
  "technical-title",
]);

const GENERIC_SINGLETON_CLASS_NAMES = new Set([
  "field",
  "status",
  "error",
  "help",
  "prompt",
  "resources",
  "shell",
  "topbar",
  "brand",
  "wordmark",
  "context",
  "navigation",
  "frame",
  "content",
  "footer",
  "signout",
  "state",
  "compact",
  "group",
  "section",
  "flow",
  "split",
  "cards",
  "workspace",
  "preview",
  "normalized",
  "source",
  "result",
  "form",
]);

function isGlobalStyle(relativePosixPath) {
  return GLOBAL_FILE_PATTERNS.some((pattern) => pattern.test(relativePosixPath));
}

function classNamesInSelector(selector) {
  const classes = [];
  const matcher = /(?<!:global\()\.[A-Za-z_][A-Za-z0-9_-]*/gu;
  let match;
  while ((match = matcher.exec(selector)) !== null) {
    classes.push(match[0].slice(1));
  }
  return classes;
}

function shouldSkipClass(className) {
  return SHARED_GLOBAL_CLASS_ALLOWLIST.has(className);
}

function isNamespacedEnough(className) {
  if (shouldSkipClass(className)) return true;
  if (/[A-Z]/u.test(className)) return true;
  if (className.includes("-") && !/^-[a-z]/u.test(className)) return true;
  return !GENERIC_SINGLETON_CLASS_NAMES.has(className);
}

async function collectCssFiles(entry) {
  const result = [];
  const walk = async (current) => {
    const children = await readdir(current, { withFileTypes: true });
    for (const child of children) {
      const childPath = path.join(current, child.name);
      if (child.isDirectory()) {
        await walk(childPath);
      } else if (child.isFile() && child.name.endsWith(".css")) {
        result.push(childPath);
      }
    }
  };
  await walk(entry);
  return result;
}

async function checkFile(filePath, issues, classOwners, relativePath) {
  const globalFile = isGlobalStyle(relativePath);
  const input = createInterface({ input: createReadStream(filePath) });

  for await (const line of input) {
    const brace = line.indexOf("{");
    if (brace === -1) continue;
    const selectorText = line.slice(0, brace);
    if (!selectorText) continue;
    for (const selectorPart of selectorText.split(",")) {
      const trimmed = selectorPart.trim();
      if (!trimmed) continue;
      for (const className of classNamesInSelector(trimmed)) {
        if (!className) continue;
        classOwners.set(className, [...(classOwners.get(className) ?? []), relativePath]);
        if (globalFile || shouldSkipClass(className)) continue;
        if (!isNamespacedEnough(className)) {
          issues.push(`ERROR: ${relativePath} has generic class .${className}; use component-prefixed naming`);
        }
      }
    }
  }
}

async function main() {
  const cssFiles = await collectCssFiles(APP_ROOT);
  const issues = [];
  const classOwners = new Map();

  for (const filePath of cssFiles) {
    const relativePosixPath = `./${path.relative(APP_ROOT, filePath).replace(/\\/gu, "/")}`;
    await checkFile(filePath, issues, classOwners, relativePosixPath);
  }

  for (const [className, owners] of classOwners) {
    if (shouldSkipClass(className)) continue;
    const uniqueOwners = [...new Set(owners)];
    if (uniqueOwners.length > 1 && uniqueOwners.every((owner) => !isGlobalStyle(owner))) {
      issues.push(`ERROR: .${className} is declared in multiple ownership locations: ${uniqueOwners.join(", ")}`);
    }
  }

  if (issues.length > 0) {
    console.error("css:class-prefixes failed");
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("css:class-prefixes passed: component scope and ownership checks are clean.");
}

main().catch((error) => {
  console.error("css:class-prefixes failed with unexpected error:", error);
  process.exitCode = 1;
});
