/**
 * Builds the exact JSON-link expectation shared by API v1 response tests.
 *
 * This remains a test oracle and intentionally does not import production
 * representation code or constants.
 */
export function expectedApiV1JsonLink(rel, href) {
  return { rel, href, mediaType: "application/json" };
}
