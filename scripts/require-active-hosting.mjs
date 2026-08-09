import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

let configuration;
try {
  configuration = JSON.parse(readFileSync(new URL("../.openai/hosting.json", import.meta.url), "utf8"));
} catch {
  assert.fail("Create checkout-local .openai/hosting.json before packaging for Sites");
}
assert.match(configuration.project_id ?? "", /^appgprj_[A-Za-z0-9]+$/, "Active Sites binding must contain the exact project_id");
assert.equal(configuration.d1, "DB");
assert.equal(configuration.r2, null);
console.log("Active private Sites binding is ready for packaging.");
