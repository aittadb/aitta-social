import {
  parseAcceptMediaRanges,
  type AcceptMediaRange,
} from "../accept-media-ranges";

export type PublicEntryDocumentVariant = "html" | "json" | "not-acceptable";

type EffectiveQuality = {
  quality: number;
  specificity: number;
};

/** Selects the one current representation without inspecting client identity. */
export function selectPublicEntryDocumentVariant(
  value: string | null,
): PublicEntryDocumentVariant {
  if (value === null) return "html";
  const sources = parseAcceptMediaRanges(value);
  if (!sources) return "not-acceptable";

  let html: EffectiveQuality | null = null;
  let json: EffectiveQuality | null = null;
  for (const source of sources) {
    html = preferMoreSpecific(html, qualityFor(source, "text", "html"));
    json = preferMoreSpecific(json, qualityFor(source, "application", "json"));
  }

  const htmlQuality = html?.quality ?? 0;
  const jsonQuality = json?.quality ?? 0;
  if (htmlQuality <= 0 && jsonQuality <= 0) return "not-acceptable";
  return jsonQuality > htmlQuality ? "json" : "html";
}

function preferMoreSpecific(
  current: EffectiveQuality | null,
  candidate: EffectiveQuality | null,
): EffectiveQuality | null {
  if (!candidate || (current && current.specificity >= candidate.specificity)) {
    return current;
  }
  return candidate;
}

function qualityFor(
  range: AcceptMediaRange,
  type: "application" | "text",
  subtype: "html" | "json",
): EffectiveQuality | null {
  if (range.type === type && range.subtype === subtype) {
    return { quality: range.quality, specificity: 2 };
  }
  if (range.type === type && range.subtype === "*") {
    return { quality: range.quality, specificity: 1 };
  }
  if (range.type === "*" && range.subtype === "*") {
    return { quality: range.quality, specificity: 0 };
  }
  return null;
}
