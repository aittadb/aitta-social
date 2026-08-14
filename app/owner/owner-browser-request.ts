/** Browser transport used by owner request functions; it is injectable for focused tests. */
export type OwnerBrowserTransport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * Sends one owner browser request without retries, credential handling, or response parsing.
 * Features own their request shape and retain response/recovery decisions.
 */
export function ownerBrowserRequest(
  input: RequestInfo | URL,
  init: RequestInit,
  transport: OwnerBrowserTransport = fetch,
): Promise<Response> {
  return transport(input, init);
}
