import assert from "node:assert/strict";

/** Asserts the common response contract for the narrow API v1 document tests. */
export function assertApiJson(response, status, cacheControl) {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/iu);
  assert.equal(response.headers.get("cache-control"), cacheControl);
  assert.equal(response.headers.get("location"), null);
  assert(hasVaryToken(response, "accept"));
}

function hasVaryToken(response, token) {
  return (response.headers.get("vary") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .includes(token);
}
