import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

for (const directory of ["app", "lib", "db"]) await inspect(new URL(`../${directory}/`, import.meta.url));
console.log("Runtime boundary check passed (no runtime DDL or Node built-ins). ");

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) await inspect(target);
    else if (/\.(ts|tsx)$/.test(entry.name)) {
      const source = await readFile(target, "utf8");
      assert.doesNotMatch(source, /\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX)\b/i, `${target.pathname} contains runtime DDL`);
      assert.doesNotMatch(source, /from ["']node:/, `${target.pathname} imports a Node built-in`);
      assert.doesNotMatch(source, /\bprocess\.(?:env|cwd|exit|argv)\b/, `${target.pathname} depends on Node process state`);
    }
  }
}
