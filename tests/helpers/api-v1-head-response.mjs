import assert from "node:assert/strict";

/** Asserts the headers a HEAD response must retain from its API v1 GET response. */
export function assertMatchingApiV1HeadHeaders(head, get) {
  for (const name of ["content-type", "cache-control", "vary", "allow", "location"]) {
    assert.equal(head.headers.get(name), get.headers.get(name), name);
  }
}
