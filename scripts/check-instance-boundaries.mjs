import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedActive = execFileSync("git", ["ls-files", "--", ".openai/hosting.json"], { encoding: "utf8" }).trim();
assert.equal(trackedActive, "", ".openai/hosting.json is per-deployment state and must not be tracked");
const example = JSON.parse(readFileSync(new URL("../.openai/hosting.example.json", import.meta.url), "utf8"));
assert.deepEqual(example, { project_id: null, d1: "DB", r2: null });
console.log("Sites instance boundary is valid.");
