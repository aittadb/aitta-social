import assert from "node:assert/strict";

/** Reads a JSON response body after confirming its response media type. */
export async function responseJson(response) {
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/i);
  return JSON.parse(await response.text());
}
