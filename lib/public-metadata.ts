import type { Metadata } from "next";
import type { Entry, Profile } from "./types";
import { resolveCanonicalUrl, withoutTrailingSlash } from "./public-resources";

const UNCONFIGURED_TITLE = "Aitta setup in progress";
const UNCONFIGURED_DESCRIPTION =
  "This Aitta's optional outward profile is not configured yet.";
const UNAVAILABLE_TITLE = "Aitta unavailable";
const UNAVAILABLE_DESCRIPTION =
  "This Aitta's public data could not be loaded from its storage.";

export function publicPresenceMetadata(profile: Profile | null): Metadata {
  const title = profile
    ? metadataText(profile.displayName, "Independent Aitta", 100)
    : UNCONFIGURED_TITLE;
  const description = profile
    ? metadataText(profile.shortDescription, UNCONFIGURED_DESCRIPTION, 280)
    : UNCONFIGURED_DESCRIPTION;
  const canonicalUrl = resolveCanonicalUrl(profile);
  const configured = Boolean(profile && canonicalUrl);

  return {
    title,
    description,
    referrer: "strict-origin-when-cross-origin",
    robots: configured
      ? { index: true, follow: true }
      : { index: false, follow: false },
    ...(configured ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      type: "website",
      title,
      description,
      siteName: title,
      ...(configured ? { url: canonicalUrl } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function unavailablePublicMetadata(): Metadata {
  return {
    title: UNAVAILABLE_TITLE,
    description: UNAVAILABLE_DESCRIPTION,
    referrer: "strict-origin-when-cross-origin",
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: UNAVAILABLE_TITLE,
      description: UNAVAILABLE_DESCRIPTION,
      siteName: UNAVAILABLE_TITLE,
    },
    twitter: {
      card: "summary",
      title: UNAVAILABLE_TITLE,
      description: UNAVAILABLE_DESCRIPTION,
    },
  };
}

export function publicEntryMetadata(
  entry: Entry,
  profile: Profile | null,
): Metadata {
  const presenceTitle = profile
    ? metadataText(profile.displayName, "Independent Aitta", 100)
    : "Independent Aitta";
  const updateTitle = metadataText(
    entry.title ?? `${capitalize(entry.kind)} update`,
    "Published update",
    160,
  );
  const title = `${updateTitle} · ${presenceTitle}`;
  const description = metadataText(
    entry.body,
    profile?.shortDescription ?? "A published update from this independent Aitta.",
    280,
  );
  const canonicalBase = resolveCanonicalUrl(profile);
  const canonicalUrl = profile && canonicalBase
    ? `${withoutTrailingSlash(canonicalBase)}/entries/${encodeURIComponent(entry.id)}`
    : null;

  return {
    title: { absolute: title },
    description,
    referrer: "strict-origin-when-cross-origin",
    robots: canonicalUrl
      ? { index: true, follow: true }
      : { index: false, follow: false },
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      type: entry.kind === "article" ? "article" : "website",
      title,
      description,
      siteName: presenceTitle,
      ...(entry.kind === "article"
        ? {
            publishedTime: entry.publishedAt ?? entry.createdAt,
            modifiedTime: entry.updatedAt,
          }
        : {}),
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export function unavailableEntryMetadata(): Metadata {
  return {
    title: { absolute: "Update not found · Independent Aitta" },
    description: "This update is not public.",
    robots: { index: false, follow: false },
  };
}

function metadataText(value: string, fallback: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return fallback;
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
