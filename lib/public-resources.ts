import type { Profile } from "./types";
import { getRuntimeSettings } from "./runtime";
import { normalizeCanonicalUrl } from "./validation";

export function resolveCanonicalUrl(profile: Profile | null): string | null {
  const configured = getRuntimeSettings().canonicalUrl;
  for (const candidate of [configured, profile?.canonicalUrl]) {
    if (!candidate) continue;
    try {
      return normalizeCanonicalUrl(candidate);
    } catch {
      // An invalid protected setting must not take public pages offline.
    }
  }
  return null;
}

export function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
