import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable(
  "profiles",
  {
    id: integer("id").primaryKey(),
    displayName: text("display_name").notNull(),
    accountType: text("account_type").notNull(),
    shortDescription: text("short_description").notNull(),
    introduction: text("introduction").notNull(),
    location: text("location"),
    website: text("website"),
    externalLinksJson: text("external_links_json").notNull().default("[]"),
    canonicalUrl: text("canonical_url").notNull(),
    accentColor: text("accent_color").notNull().default("#31554d"),
    density: text("density").notNull().default("comfortable"),
    hidePoweredBy: integer("hide_powered_by", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check("profiles_singleton_check", sql`${table.id} = 1`),
    check(
      "profiles_density_check",
      sql`${table.density} IN ('comfortable', 'compact')`,
    ),
  ],
);

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    destinationUrl: text("destination_url"),
    state: text("state").notNull().default("draft"),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "entries_kind_check",
      sql`${table.kind} IN ('note', 'article', 'link', 'announcement')`,
    ),
    check(
      "entries_state_check",
      sql`${table.state} IN ('draft', 'published')`,
    ),
    index("idx_entries_public_order").on(
      table.state,
      table.publishedAt,
      table.id,
    ),
    index("idx_entries_updated_at").on(table.updatedAt),
  ],
);
