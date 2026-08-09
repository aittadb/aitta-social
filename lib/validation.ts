import {
  ENTRY_KINDS,
  type EntryKind,
  type PresentationDensity,
} from "./constants";
import type { EntryInput, ExternalLink, ProfileInput } from "./types";

export class ValidationError extends Error {
  readonly issues: Record<string, string>;

  constructor(issues: Record<string, string>) {
    super("The submitted values are invalid.");
    this.name = "ValidationError";
    this.issues = issues;
  }
}

export function normalizeCanonicalUrl(value: unknown): string {
  const input = text(value);
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Use a complete HTTPS URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Use an HTTPS URL without credentials, a query, or a fragment.");
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString().replace(/\/$/, "");
}

export function normalizePublicUrl(value: unknown, required = false): string | null {
  const input = text(value);
  if (!input && !required) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Use a complete http or https URL.");
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error("Use a public http or https URL without credentials.");
  }
  return url.toString();
}

export function parseProfileInput(value: unknown): ProfileInput {
  const input = object(value);
  const issues: Record<string, string> = {};
  const displayName = bounded(input.displayName, "Display name", 1, 100, issues);
  const shortDescription = bounded(
    input.shortDescription,
    "Short description",
    1,
    280,
    issues,
  );
  const introduction = bounded(input.introduction, "Introduction", 1, 10000, issues);
  const location = optionalBounded(input.location, "Location", 120, issues);
  const accentColor = text(input.accentColor).toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(accentColor)) {
    issues.accentColor = "Choose a six-digit hex color.";
  }
  const density = enumValue(
    input.density,
    ["comfortable", "compact"] as const,
    "Density",
    issues,
  ) as PresentationDensity;

  let website: string | null = null;
  let canonicalUrl = "";
  try {
    website = normalizePublicUrl(input.website);
  } catch (error) {
    issues.website = message(error);
  }
  try {
    canonicalUrl = normalizeCanonicalUrl(input.canonicalUrl);
  } catch (error) {
    issues.canonicalUrl = message(error);
  }

  const externalLinks: ExternalLink[] = [];
  if (!Array.isArray(input.externalLinks)) {
    issues.externalLinks = "External links must be a list.";
  } else if (input.externalLinks.length > 8) {
    issues.externalLinks = "Add no more than eight external links.";
  } else {
    input.externalLinks.forEach((item, index) => {
      const link = object(item);
      const label = text(link.label);
      if (!label || label.length > 60) {
        issues[`externalLinks.${index}.label`] = "Use a label between 1 and 60 characters.";
      }
      try {
        const url = normalizePublicUrl(link.url, true);
        if (label && label.length <= 60 && url) externalLinks.push({ label, url });
      } catch (error) {
        issues[`externalLinks.${index}.url`] = message(error);
      }
    });
  }

  if (Object.keys(issues).length) throw new ValidationError(issues);
  return {
    displayName,
    shortDescription,
    introduction,
    location,
    website,
    externalLinks,
    canonicalUrl,
    accentColor,
    density,
    hidePoweredBy: input.hidePoweredBy === true,
  };
}

export function parseEntryInput(value: unknown): EntryInput {
  const input = object(value);
  const issues: Record<string, string> = {};
  const kind = enumValue(input.kind, ENTRY_KINDS, "Update kind", issues, "entryKind") as EntryKind;
  const title = optionalBounded(input.title, "Title", 200, issues);
  const body = bounded(input.body, "Body", 1, 50000, issues);
  let destinationUrl: string | null = null;
  try {
    destinationUrl = normalizePublicUrl(input.destinationUrl);
  } catch (error) {
    issues.destinationUrl = message(error);
  }
  if (kind === "link" && !destinationUrl) {
    issues.destinationUrl = "A link update needs a destination URL.";
  }
  if (Object.keys(issues).length) throw new ValidationError(issues);
  return { kind, title, body, destinationUrl };
}

export function parsePagination(url: URL): { page: number; pageSize: number } {
  const page = positiveInteger(url.searchParams.get("page") ?? "1");
  const pageSize = positiveInteger(url.searchParams.get("pageSize") ?? "20");
  if (!page || !pageSize || pageSize > 50) {
    throw new ValidationError({
      pagination: "page must be at least 1 and pageSize must be between 1 and 50.",
    });
  }
  return { page, pageSize };
}

function positiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function bounded(
  value: unknown,
  label: string,
  min: number,
  max: number,
  issues: Record<string, string>,
): string {
  const result = text(value);
  if (result.length < min || result.length > max) {
    issues[lowerFirst(label)] = `${label} must be between ${min} and ${max} characters.`;
  }
  return result;
}

function optionalBounded(
  value: unknown,
  label: string,
  max: number,
  issues: Record<string, string>,
): string | null {
  const result = text(value);
  if (result.length > max) issues[lowerFirst(label)] = `${label} must be ${max} characters or fewer.`;
  return result || null;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
  issues: Record<string, string>,
  issueKey = lowerFirst(label),
): T {
  const result = text(value) as T;
  if (!allowed.includes(result)) issues[issueKey] = `Choose a valid ${label.toLowerCase()}.`;
  return result;
}

function lowerFirst(value: string): string {
  const [first = "", ...rest] = value.trim().split(/\s+/);
  return first.toLowerCase() + rest
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Invalid value.";
}
