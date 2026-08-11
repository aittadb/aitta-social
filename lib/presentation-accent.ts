const DEFAULT_ACCENT = "#31554d";
const DARKEST_SUPPORTED_LIGHT_SURFACE = "#eef0eb";
const MINIMUM_CONTRAST = 4.5;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

type Rgb = readonly [red: number, green: number, blue: number];

/**
 * Derive the color used by presentation CSS without changing the owner's
 * stored preference. Invalid legacy values fail closed to the reviewed
 * default; valid colors that already meet the contrast floor keep the same
 * normalized color without tonal adjustment.
 */
export function resolvePresentationAccent(value: unknown): string {
  if (typeof value !== "string" || !HEX_COLOR.test(value)) {
    return DEFAULT_ACCENT;
  }

  const normalized = value.toLowerCase();
  if (contrastRatio(normalized, DARKEST_SUPPORTED_LIGHT_SURFACE) >= MINIMUM_CONTRAST) {
    return normalized;
  }

  const source = parseHex(normalized);
  const target = parseHex(DEFAULT_ACCENT);
  for (let step = 1; step <= 255; step += 1) {
    const candidate = toHex([
      interpolateChannel(source[0], target[0], step),
      interpolateChannel(source[1], target[1], step),
      interpolateChannel(source[2], target[2], step),
    ]);
    if (contrastRatio(candidate, DARKEST_SUPPORTED_LIGHT_SURFACE) >= MINIMUM_CONTRAST) {
      return candidate;
    }
  }

  return DEFAULT_ACCENT;
}

function interpolateChannel(source: number, target: number, step: number): number {
  return Math.round(source + ((target - source) * step / 255));
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(parseHex(first));
  const secondLuminance = relativeLuminance(parseHex(second));
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance([red, green, blue]: Rgb): number {
  const [linearRed, linearGreen, linearBlue] = [red, green, blue]
    .map((channel) => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
  return (0.2126 * linearRed) + (0.7152 * linearGreen) + (0.0722 * linearBlue);
}

function parseHex(value: string): Rgb {
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ];
}

function toHex([red, green, blue]: Rgb): string {
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
