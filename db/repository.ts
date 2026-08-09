import { getD1 } from ".";
import type { Entry, Profile, ProfileInput, EntryInput } from "@/lib/types";
import type { EntryKind, EntryState } from "@/lib/constants";

type ProfileRow = {
  display_name: string;
  account_type: string;
  short_description: string;
  introduction: string;
  location: string | null;
  website: string | null;
  external_links_json: string;
  canonical_url: string;
  accent_color: string;
  density: string;
  hide_powered_by: number;
  created_at: string;
  updated_at: string;
};

type EntryRow = {
  id: string;
  kind: string;
  title: string | null;
  body: string;
  destination_url: string | null;
  state: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const PROFILE_SELECT = `SELECT
  display_name, account_type, short_description, introduction, location,
  website, external_links_json, canonical_url, accent_color, density,
  hide_powered_by, created_at, updated_at
FROM profiles`;

const ENTRY_SELECT = `SELECT
  id, kind, title, body, destination_url, state, published_at, created_at, updated_at
FROM entries`;

export async function getProfile(): Promise<Profile | null> {
  const row = await getD1()
    .prepare(`${PROFILE_SELECT} WHERE id = ?`)
    .bind(1)
    .first<ProfileRow>();
  return row ? mapProfile(row) : null;
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const now = new Date().toISOString();
  await getD1()
    .prepare(`INSERT INTO profiles (
      id, display_name, account_type, short_description, introduction, location,
      website, external_links_json, canonical_url, accent_color, density,
      hide_powered_by, created_at, updated_at
    ) VALUES (?, ?, 'other', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      display_name = excluded.display_name,
      short_description = excluded.short_description,
      introduction = excluded.introduction,
      location = excluded.location,
      website = excluded.website,
      external_links_json = excluded.external_links_json,
      canonical_url = excluded.canonical_url,
      accent_color = excluded.accent_color,
      density = excluded.density,
      hide_powered_by = excluded.hide_powered_by,
      updated_at = excluded.updated_at`)
    .bind(
      1,
      input.displayName,
      input.shortDescription,
      input.introduction,
      input.location,
      input.website,
      JSON.stringify(input.externalLinks),
      input.canonicalUrl,
      input.accentColor,
      input.density,
      input.hidePoweredBy ? 1 : 0,
      now,
      now,
    )
    .run();
  const profile = await getProfile();
  if (!profile) throw new Error("Profile could not be saved.");
  return profile;
}

export async function listPublishedEntries(
  limit: number,
  offset = 0,
): Promise<{ entries: Entry[]; hasMore: boolean }> {
  const result = await getD1()
    .prepare(`${ENTRY_SELECT}
      WHERE state = ?
      ORDER BY published_at DESC, id DESC
      LIMIT ? OFFSET ?`)
    .bind("published", limit + 1, offset)
    .all<EntryRow>();
  const rows = result.results ?? [];
  return {
    entries: rows.slice(0, limit).map(mapEntry),
    hasMore: rows.length > limit,
  };
}

export async function listAllEntries(limit = 200): Promise<Entry[]> {
  const result = await getD1()
    .prepare(`${ENTRY_SELECT} ORDER BY updated_at DESC, id DESC LIMIT ?`)
    .bind(limit)
    .all<EntryRow>();
  return (result.results ?? []).map(mapEntry);
}

export async function getEntry(
  id: string,
  publishedOnly = false,
): Promise<Entry | null> {
  const statement = publishedOnly
    ? getD1().prepare(`${ENTRY_SELECT} WHERE id = ? AND state = ?`).bind(id, "published")
    : getD1().prepare(`${ENTRY_SELECT} WHERE id = ?`).bind(id);
  const row = await statement.first<EntryRow>();
  return row ? mapEntry(row) : null;
}

export async function createEntry(input: EntryInput): Promise<Entry> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await getD1()
    .prepare(`INSERT INTO entries (
      id, kind, title, body, destination_url, state, published_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      id,
      input.kind,
      input.title,
      input.body,
      input.destinationUrl,
      "draft",
      null,
      now,
      now,
    )
    .run();
  const entry = await getEntry(id);
  if (!entry) throw new Error("Entry could not be created.");
  return entry;
}

export async function updateEntry(id: string, input: EntryInput): Promise<Entry | null> {
  const result = await getD1()
    .prepare(`UPDATE entries SET
      kind = ?, title = ?, body = ?, destination_url = ?, updated_at = ?
      WHERE id = ?`)
    .bind(
      input.kind,
      input.title,
      input.body,
      input.destinationUrl,
      new Date().toISOString(),
      id,
    )
    .run();
  if (!result.meta.changes) return null;
  return getEntry(id);
}

export async function setEntryState(
  id: string,
  state: EntryState,
): Promise<Entry | null> {
  const now = new Date().toISOString();
  const result = state === "published"
    ? await getD1()
        .prepare(`UPDATE entries SET
          state = ?, published_at = COALESCE(published_at, ?), updated_at = ?
          WHERE id = ?`)
        .bind(state, now, now, id)
        .run()
    : await getD1()
        .prepare(`UPDATE entries SET state = ?, updated_at = ? WHERE id = ?`)
        .bind(state, now, id)
        .run();
  if (!result.meta.changes) return null;
  return getEntry(id);
}

export async function deleteEntry(id: string): Promise<boolean> {
  const result = await getD1().prepare("DELETE FROM entries WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    accountType: row.account_type as Profile["accountType"],
    shortDescription: row.short_description,
    introduction: row.introduction,
    location: row.location,
    website: row.website,
    externalLinks: parseExternalLinks(row.external_links_json),
    canonicalUrl: row.canonical_url,
    accentColor: row.accent_color,
    density: row.density as Profile["density"],
    hidePoweredBy: Boolean(row.hide_powered_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    kind: row.kind as EntryKind,
    title: row.title,
    body: row.body,
    destinationUrl: row.destination_url,
    state: row.state as EntryState,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseExternalLinks(value: string): Profile["externalLinks"] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof (item as { label?: unknown }).label !== "string" ||
        typeof (item as { url?: unknown }).url !== "string"
      ) return [];
      return [{
        label: (item as { label: string }).label,
        url: (item as { url: string }).url,
      }];
    });
  } catch {
    return [];
  }
}
