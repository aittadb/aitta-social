import type { Entry, Profile } from "./types";
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

export function publicEntryResource(entry: Entry, canonicalUrl: string) {
  const base = withoutTrailingSlash(canonicalUrl);
  return {
    id: entry.id,
    kind: entry.kind,
    ...(entry.title ? { title: entry.title } : {}),
    body: entry.body,
    ...(entry.destinationUrl ? { destinationUrl: entry.destinationUrl } : {}),
    ...(entry.publishedAt ? { publishedAt: entry.publishedAt } : {}),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    links: {
      self: `${base}/api/v1/entries/${encodeURIComponent(entry.id)}`,
      html: `${base}/entries/${encodeURIComponent(entry.id)}`,
    },
  };
}

export function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
