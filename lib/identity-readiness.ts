import type { Profile } from "./types";
import { resolveCanonicalUrl } from "./public-resources";

export type IdentityReadiness = {
  state: "fresh" | "incomplete" | "complete";
  canonicalUrl: string | null;
  canonicalSource: "runtime" | "stored" | null;
  requirementsComplete: number;
};

export function deriveIdentityReadiness(profile: Profile | null): IdentityReadiness {
  const canonicalUrl = resolveCanonicalUrl(profile);
  const runtimeCanonicalUrl = resolveCanonicalUrl(null);
  return {
    state: profile ? (canonicalUrl ? "complete" : "incomplete") : "fresh",
    canonicalUrl,
    canonicalSource: canonicalUrl
      ? (runtimeCanonicalUrl === canonicalUrl ? "runtime" : "stored")
      : null,
    requirementsComplete: Number(Boolean(profile)) + Number(Boolean(canonicalUrl)),
  };
}
