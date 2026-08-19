import assert from "node:assert/strict";

import { varyHeaderTokens } from "./vary-header-tokens.mjs";

/** Asserts the common response contract for the narrow API v1 document tests. */
export function assertApiJson(response, status, cacheControl) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  assert.equal(response.headers.get("cache-control"), cacheControl);
  assert.equal(response.headers.get("location"), null);
  assert(varyHeaderTokens(response).includes("accept"));
}
