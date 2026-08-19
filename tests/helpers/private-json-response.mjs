import assert from "node:assert/strict";

export function assertPrivateJson(
  response,
  status,
  { caseInsensitiveContentType = true } = {},
) {
  assert.equal(response.status, status);
  assert.match(
    response.headers.get("content-type") ?? "",
    caseInsensitiveContentType ? /^application\/json\b/iu : /^application\/json\b/u,
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok((response.headers.get("vary") ?? "").split(",").map((value) => value.trim()).includes("Accept"));
}
