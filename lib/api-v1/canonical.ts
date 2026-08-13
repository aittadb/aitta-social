import { env } from "cloudflare:workers";

import { normalizeCanonicalUrl } from "../validation";

type ApiV1Runtime = {
  AITTA_SOCIAL_CANONICAL_URL?: unknown;
};

/**
 * Reads the one runtime value required for D1-independent integration discovery.
 * It deliberately does not construct the broad runtime-settings object, because
 * owner and Hub settings are irrelevant to this public boundary.
 */
export function apiV1CanonicalUrl(): string | null {
  const value = (env as unknown as ApiV1Runtime).AITTA_SOCIAL_CANONICAL_URL;
  const configured = typeof value === "string" ? value.trim() : "";
  if (!configured) return null;
  try {
    return normalizeCanonicalUrl(configured);
  } catch {
    return null;
  }
}
