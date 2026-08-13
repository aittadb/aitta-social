const MAX_ACCEPT_BYTES = 4 * 1024;
const MAX_MEDIA_RANGES = 16;
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u;
const Q_VALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/u;

export type PublicEntryDocumentVariant = "html" | "json" | "not-acceptable";

type MediaRange = {
  type: string;
  subtype: string;
  quality: number;
};

type EffectiveQuality = {
  quality: number;
  specificity: number;
};

/** Selects the one current representation without inspecting client identity. */
export function selectPublicEntryDocumentVariant(
  value: string | null,
): PublicEntryDocumentVariant {
  if (value === null) return "html";
  if (new TextEncoder().encode(value).byteLength > MAX_ACCEPT_BYTES) {
    return "not-acceptable";
  }

  const sources = splitOutsideQuotes(value, ",");
  if (!sources || sources.length === 0 || sources.length > MAX_MEDIA_RANGES) {
    return "not-acceptable";
  }

  let html: EffectiveQuality | null = null;
  let json: EffectiveQuality | null = null;
  for (const source of sources) {
    const range = parseMediaRange(source);
    if (!range) return "not-acceptable";
    html = preferMoreSpecific(html, qualityFor(range, "text", "html"));
    json = preferMoreSpecific(json, qualityFor(range, "application", "json"));
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
  range: MediaRange,
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

function parseMediaRange(source: string): MediaRange | null {
  const parts = splitOutsideQuotes(source, ";");
  if (!parts || parts.length === 0) return null;
  const mediaType = parts[0]?.trim() ?? "";
  const slash = mediaType.indexOf("/");
  if (slash <= 0 || slash !== mediaType.lastIndexOf("/")) return null;

  const type = mediaType.slice(0, slash).trim().toLowerCase();
  const subtype = mediaType.slice(slash + 1).trim().toLowerCase();
  if (!TOKEN.test(type) || !TOKEN.test(subtype)) return null;
  if (type === "*" && subtype !== "*") return null;

  let quality = 1;
  let sawQuality = false;
  for (const rawParameter of parts.slice(1)) {
    const parameter = rawParameter.trim();
    const equals = parameter.indexOf("=");
    if (equals <= 0) return null;
    const name = parameter.slice(0, equals).trim().toLowerCase();
    const rawValue = parameter.slice(equals + 1).trim();
    if (!TOKEN.test(name) || !validParameterValue(rawValue)) return null;
    if (name !== "q") continue;
    if (sawQuality || !Q_VALUE.test(rawValue)) return null;
    quality = Number(rawValue);
    sawQuality = true;
  }

  return { type, subtype, quality };
}

function validParameterValue(value: string): boolean {
  if (TOKEN.test(value)) return true;
  if (value.length < 2 || value[0] !== '"' || value.at(-1) !== '"') {
    return false;
  }
  let escaped = false;
  for (const character of value.slice(1, -1)) {
    const code = character.charCodeAt(0);
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (character === '"' || code < 0x20 || code === 0x7f) return false;
  }
  return !escaped;
}

function splitOutsideQuotes(value: string, delimiter: "," | ";"): string[] | null {
  const parts: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted && character === "\\") {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && character === delimiter) {
      const part = value.slice(start, index).trim();
      if (!part) return null;
      parts.push(part);
      start = index + 1;
    }
  }
  if (quoted || escaped) return null;
  const finalPart = value.slice(start).trim();
  if (!finalPart) return null;
  parts.push(finalPart);
  return parts;
}
