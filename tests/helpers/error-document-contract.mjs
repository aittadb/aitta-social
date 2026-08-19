/** Creates the shared JSON error envelope used by API contract tests. */
export function errorDocument(code, message) {
  return { data: null, error: { code, message }, links: [] };
}
