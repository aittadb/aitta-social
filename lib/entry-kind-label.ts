import type { EntryKind } from "./constants";

/** Returns the fixed public label for an entry kind. */
export function entryKindLabel(kind: EntryKind): string {
  return `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
}
