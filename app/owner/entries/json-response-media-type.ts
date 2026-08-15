/** Recognizes the deliberately narrow JSON response media type accepted by owner entry readers. */
export function isOwnerEntryJsonResponseMediaType(value: string | null): boolean {
  return value !== null && /^application\/json(?:\s*;\s*charset=utf-8)?$/iu.test(value);
}
