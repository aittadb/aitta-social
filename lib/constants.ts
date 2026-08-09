export const SOFTWARE_NAME = "AittaSocial";
export const SOFTWARE_VERSION = "0.1.0";
export const PROTOCOL_NAME = "aitta-social";
export const PROTOCOL_VERSION = "1.0";

export const ACCOUNT_TYPES = [
  "person",
  "company",
  "project",
  "community",
  "publication",
  "agent",
  "other",
] as const;

export const ENTRY_KINDS = [
  "note",
  "article",
  "link",
  "announcement",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type EntryKind = (typeof ENTRY_KINDS)[number];
export type EntryState = "draft" | "published";
export type PresentationDensity = "comfortable" | "compact";
