import { parseAcceptMediaRanges } from "../accept-media-ranges";

export type ApiV1AcceptResult =
  | { accepted: true }
  | { accepted: false };

/** Parses only the bounded Accept behavior needed by the JSON-only v1 API. */
export function acceptsApiV1Json(value: string | null): ApiV1AcceptResult {
  if (value === null) return { accepted: true };
  const ranges = parseAcceptMediaRanges(value);
  if (!ranges) return { accepted: false };

  const matches: Array<{ specificity: number; quality: number }> = [];
  for (const range of ranges) {
    const specificity = jsonSpecificity(range.type, range.subtype);
    if (specificity !== null) {
      matches.push({ specificity, quality: range.quality });
    }
  }

  if (matches.length === 0) return { accepted: false };
  const specificity = Math.max(...matches.map((match) => match.specificity));
  return {
    accepted: matches.some(
      (match) => match.specificity === specificity && match.quality > 0,
    ),
  };
}

function jsonSpecificity(type: string, subtype: string): number | null {
  if (type === "application" && subtype === "json") return 2;
  if (type === "application" && subtype === "*") return 1;
  if (type === "*" && subtype === "*") return 0;
  return null;
}
