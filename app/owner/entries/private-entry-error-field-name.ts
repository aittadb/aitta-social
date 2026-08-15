import type { PrivateEntryFieldName } from "@/lib/private-entry/representation";

const privateEntryErrorFields = new Set<PrivateEntryFieldName>([
  "kind",
  "title",
  "body",
  "destinationUrl",
]);

/** Maps the private-entry error field aliases that the owner response contract permits. */
export function privateEntryErrorFieldName(value: string): PrivateEntryFieldName | null {
  const normalized = value === "entryKind" ? "kind" : value;
  return privateEntryErrorFields.has(normalized as PrivateEntryFieldName)
    ? normalized as PrivateEntryFieldName
    : null;
}
