import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [license, readme] = await Promise.all([
  readFile(new URL("../LICENSE", import.meta.url)),
  readFile(new URL("../README.md", import.meta.url), "utf8"),
]);

const expectedSha256 = "8bd3e073a18d1a25d02bd9696c1d585c4c6c0bf3ab8f02f7e188598888785317";
const actualSha256 = createHash("sha256").update(license).digest("hex");

assert.equal(actualSha256, expectedSha256, "LICENSE must remain the exact owner-selected FSL-1.1-MIT text");
assert.match(readme, /`FSL-1\.1-MIT`/, "README.md must identify the selected license exactly");
assert.doesNotMatch(readme, /license selection pending|still require an owner decision/i);

console.log("LICENSE and README identify the exact owner-selected FSL-1.1-MIT terms.");
