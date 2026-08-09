import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../AGENTS.md", import.meta.url));
assert(source.byteLength < 32_000, `AGENTS.md must stay below 32,000 bytes (found ${source.byteLength})`);
console.log(`AGENTS.md instruction budget is valid (${source.byteLength} bytes).`);
