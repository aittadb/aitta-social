import { env } from "cloudflare:workers";

import { normalizeCanonicalUrl } from "../validation";

type ApiV1Runtime = {
  AITTA_SOCIAL_CANONICAL_URL?: unknown;
};

/**
 * Reads only canonical configuration for v1 resources. A D1-independent
 * discovery caller supplies no fallback; a profile-backed resource may supply
 * its already-public stored canonical value without reading owner or Hub settings.
 */
export function apiV1CanonicalUrl(storedFallback?: unknown): string | null {
  const value = (env as unknown as ApiV1Runtime).AITTA_SOCIAL_CANONICAL_URL;
  const configured = typeof value === "string" ? value.trim() : "";
  for (const candidate of [configured, storedFallback]) {
    if (!candidate) continue;
    try {
      return normalizeCanonicalUrl(candidate);
    } catch {
      // A malformed protected value does not override a valid stored fallback.
    }
  }
  return null;
}
