export function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}
