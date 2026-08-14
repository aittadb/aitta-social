/** Escapes text for literal use inside a JavaScript regular expression. */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
