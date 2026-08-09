import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const root = new URL("../drizzle/", import.meta.url);
const files = (await readdir(root)).filter((name) => name.endsWith(".sql")).sort();
assert(files.length > 0, "At least one reviewed D1 migration is required");
const journal = JSON.parse(await readFile(new URL("meta/_journal.json", root), "utf8"));
assert.equal(journal.entries.length, files.length, "Migration journal must match SQL files");
for (const file of files) {
  const sql = await readFile(new URL(file, root), "utf8");
  assert.match(sql, /CREATE TABLE/);
  assert.doesNotMatch(sql, /AITTA_SOCIAL_|appgprj_|@|deployment.credential/i, `${file} may contain private deployment material`);
}
console.log(`D1 migrations are present and journaled (${files.length} file).`);
