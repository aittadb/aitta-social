-- Frozen POC 0.1 deployment-owned data used only in disposable local D1.
-- Apply only drizzle/0000_closed_talos.sql before loading this fixture. The
-- upgrade test deliberately does not create schema through current app code.

INSERT INTO profiles (
  id,
  display_name,
  account_type,
  short_description,
  introduction,
  location,
  website,
  external_links_json,
  canonical_url,
  accent_color,
  density,
  hide_powered_by,
  created_at,
  updated_at
) VALUES (
  1,
  'Legacy Person Presence',
  'person',
  'A preserved deployment-owned profile.',
  'This introduction, presentation, and content must survive an in-place upgrade.',
  'Helsinki',
  'https://legacy-person.example/about',
  '[{"label":"Work","url":"https://legacy-person.example/work"},{"label":"Contact","url":"https://legacy-person.example/contact"}]',
  'https://legacy-person.example/presence',
  '#6a4b35',
  'compact',
  1,
  '2026-01-02T03:04:05.000Z',
  '2026-02-03T04:05:06.000Z'
);

--> statement-breakpoint

INSERT INTO entries (
  id,
  kind,
  title,
  body,
  destination_url,
  state,
  published_at,
  created_at,
  updated_at
) VALUES (
  'poc-v0-draft-private',
  'article',
  'POC_V0_DRAFT_TITLE_PRIVATE_CANARY',
  'POC_V0_DRAFT_BODY_PRIVATE_CANARY',
  NULL,
  'draft',
  NULL,
  '2026-03-04T05:06:07.000Z',
  '2026-05-06T07:08:09.000Z'
);

--> statement-breakpoint

INSERT INTO entries (
  id,
  kind,
  title,
  body,
  destination_url,
  state,
  published_at,
  created_at,
  updated_at
) VALUES (
  'poc-v0-published-update',
  'link',
  'A preserved public update',
  'POC_V0_PUBLISHED_BODY_CANARY',
  'https://legacy-person.example/resource',
  'published',
  '2026-04-05T06:07:08.000Z',
  '2026-04-04T05:06:07.000Z',
  '2026-04-06T07:08:09.000Z'
);
