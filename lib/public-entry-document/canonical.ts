import { env } from "cloudflare:workers";

import { normalizeCanonicalUrl } from "../validation";

type PublicEntryDocumentRuntime = {
  AITTA_SOCIAL_CANONICAL_URL?: unknown;
};

/** Uses only protected configuration or the already-public stored fallback. */
export function publicEntryCanonicalUrl(storedFallback?: unknown): string | null {
  const value = (env as unknown as PublicEntryDocumentRuntime)
    .AITTA_SOCIAL_CANONICAL_URL;
  const configured = typeof value === "string" ? value.trim() : "";
  for (const candidate of [configured, storedFallback]) {
    if (!candidate) continue;
    try {
      return normalizeCanonicalUrl(candidate);
    } catch {
      // A malformed protected value does not override a valid public fallback.
    }
  }
  return null;
}
