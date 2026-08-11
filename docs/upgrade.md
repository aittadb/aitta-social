# In-place upgrade preservation

This repository has a production-equivalent local proof that a reviewed
candidate can open and migrate an existing POC D1 database without replacing
the Aitta-owned profile, updates, presentation choices, or public
identity. The proof is deliberately local: it changes no Site, hosted D1 data,
protected runtime setting, access policy, DNS record, or custom domain.

## What the proof exercises

`tests/upgrade-preservation.test.mjs` builds and runs the compiled Worker with a
real persisted Miniflare D1 database. It performs this sequence:

1. Apply the reviewed historical migration prefix beginning with
   `drizzle/0000_closed_talos.sql`.
2. Insert the committed historical fixture, which contains one profile with a
   legacy protocol 1.0 `accountType`, stored canonical fallback, constrained
   presentation settings, one private draft, and one published link update.
3. Record the exact schema, columns, indexes, row counts, ordered profile and
   update rows, and configured Worker behavior before the candidate migration
   tail is applied.
4. Close the Worker, check the disposable SQLite files, and copy the closed
   persistence directory as a pre-upgrade recovery fixture.
5. Reopen the same persisted database, apply every reviewed migration after the
   historical prefix in filename order, and compare the complete post-upgrade
   snapshot and externally observable behavior with the pre-upgrade record.
6. Reopen the copied fixture independently, verify its schema, rows, and
   behavior, and exercise authorized and denied writes on disposable copies.

The migration source, schema snapshot, journal, and packaged migration
inventory are integrity-checked against reviewed content. The compiled Worker
uses the packaged compatibility date, compatibility flags, and D1 declaration.
Application requests never create, alter, drop, or repair schema; all schema
changes are applied before runtime access from reviewed files under `drizzle/`.

Run the focused proof after a production build:

```bash
npm run build
node --test tests/upgrade-preservation.test.mjs
```

Also run `npm run db:generate`, review the migration inventory for unintended
drift, and run `npm run validate` before accepting an upgrade candidate.

## Preserved behavior

The before-and-after comparison covers both stored state and application
boundaries:

- the profile, protocol 1.0 legacy `accountType`, Identity text and links,
  stored canonical fallback, accent, density, and attribution choice;
- stable draft and published-update identifiers, kinds, text, destination,
  state, publication time, and deterministic ordering;
- owner, non-owner, and missing-owner authorization, including rejected writes
  leaving the database unchanged and an authorized profile save preserving the
  legacy protocol value;
- published-only public HTML, manifest, and `/api/v1` resources with their
  documented allowlists, links, status, content type, and cache behavior;
- draft and missing identifiers producing the same public result without draft
  title, body, owner identity, or other private canaries;
- root and published-permalink metadata using the normalized effective
  canonical URL rather than a hostile request host; and
- protected runtime canonical configuration taking precedence over the stored
  profile fallback without exposing the raw setting.

Presentation rendering does not migrate or normalize the stored accent. The
current candidate reopens a disposable copy of the frozen historical fixture,
and the focused accent proof additionally places an invalid legacy value in
that persisted row before close and reopen. Public and owner style properties
then use the deterministic safe fallback while D1 and the existing protocol
1.0 presentation field retain the byte-identical stored value. Page reads,
preview, and reload perform no repair write. This is a rendering decision only:
there is no schema, migration, runtime configuration, authentication, or public
envelope change.

A successfully migrated but empty database is a **fresh** Aitta: after the
empty D1 read succeeds, the public page may show the leading deployment prompt
and neutral `noindex, nofollow` metadata. An **upgraded** Aitta retains its
configured Identity and public content and therefore does not show that prompt.
An unmigrated or unreadable database is neither fresh nor unconfigured; it shows
the fixed unavailable state and never the deployment prompt.

## Backup and rollback limits

The test's recovery fixture is a recursive local file copy made only after the
Miniflare Worker has closed the database. This ordering makes the disposable
test repeatable, but the copy is not atomic, is not safe while writes are in
flight, and is not a hosted D1 backup, export, snapshot, point-in-time restore,
or rollback mechanism. Reopening that copy proves only that this closed local
fixture remains readable and behaviorally equivalent.

Do not copy a live database directory or use the local procedure on production
data. Before an approved hosted schema change, use the current Sites and D1
backup or export facilities available to the Aitta owner, verify their
scope and retention, and record a migration-specific recovery decision. A
source rollback does not necessarily reverse a schema migration, and old code
must not be run against a changed schema unless that exact compatibility has
been reviewed. Destructive hosted recovery, deployment, or data mutation needs
separate owner approval.

## Residual hosted uncertainty

This proof does not package or read the active ignored `.openai/hosting.json`,
deploy a version, apply a hosted migration, mutate production data, or inspect a
provider backup. It therefore does not prove the exact hosted migration
transaction, provider-level backup consistency or retention, deployed identity
headers, or rollback on ChatGPT Sites. Those are separate checkpoint and hosted
acceptance outcomes. Until they are explicitly approved and recorded, this
document supports only the local in-place preservation claim.
