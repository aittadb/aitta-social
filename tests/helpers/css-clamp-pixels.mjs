export function clampPixels(minRem, preferredVw, maxRem, width) {
  return Math.min(maxRem * 16, Math.max(minRem * 16, width * preferredVw / 100));
}
