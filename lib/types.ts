import type {
  AccountType,
  EntryKind,
  EntryState,
  PresentationDensity,
} from "./constants";

export type ExternalLink = { label: string; url: string };

export type Profile = {
  displayName: string;
  accountType: AccountType;
  shortDescription: string;
  introduction: string;
  location: string | null;
  website: string | null;
  externalLinks: ExternalLink[];
  canonicalUrl: string;
  accentColor: string;
  density: PresentationDensity;
  hidePoweredBy: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Entry = {
  id: string;
  kind: EntryKind;
  title: string | null;
  body: string;
  destinationUrl: string | null;
  state: EntryState;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileInput = Omit<Profile, "createdAt" | "updatedAt">;
export type EntryInput = Pick<Entry, "kind" | "title" | "body" | "destinationUrl">;
