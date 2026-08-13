const MAX_ACCEPT_BYTES = 4 * 1024;
const MAX_MEDIA_RANGES = 16;
const TOKEN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/u;
const Q_VALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/u;

export type ApiV1AcceptResult =
  | { accepted: true }
  | { accepted: false };

/** Parses only the bounded Accept behavior needed by the JSON-only v1 API. */
export function acceptsApiV1Json(value: string | null): ApiV1AcceptResult {
  if (value === null) return { accepted: true };
  if (new TextEncoder().encode(value).byteLength > MAX_ACCEPT_BYTES) {
    return { accepted: false };
  }

  const ranges = splitOutsideQuotes(value, ",");
  if (!ranges || ranges.length === 0 || ranges.length > MAX_MEDIA_RANGES) {
    return { accepted: false };
  }

  const matches: Array<{ specificity: number; quality: number }> = [];
  for (const range of ranges) {
    const parsed = parseMediaRange(range);
    if (!parsed) return { accepted: false };
    const specificity = jsonSpecificity(parsed.type, parsed.subtype);
    if (specificity !== null) {
      matches.push({ specificity, quality: parsed.quality });
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

function parseMediaRange(
  source: string,
): { type: string; subtype: string; quality: number } | null {
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

function jsonSpecificity(type: string, subtype: string): number | null {
  if (type === "application" && subtype === "json") return 2;
  if (type === "application" && subtype === "*") return 1;
  if (type === "*" && subtype === "*") return 0;
  return null;
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
