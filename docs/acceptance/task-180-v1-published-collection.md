# TASK-180 — Prerelease v1 published-update collection

## Outcome and boundary

`GET /api/v1/entries` now emits the one prerelease v1 collection grammar. This
deliberately replaces the former unshipped object-link envelope; no
compatibility route or `/api/v2` exists. The slice changes no schema, migration,
D1 row, private route, browser-owner behavior, machine authority, Hub behavior,
hosting state, or external system.

The route reads the existing public profile, resolves canonical authority from
protected configuration followed by the already-public stored canonical value,
counts published rows once, and selects only published rows in the established
`published_at DESC, id DESC` order. Both entry queries bind `published` to the
same `WHERE state = ?` predicate. The existing
`entries(state, published_at, id)` index covers them; no schema change is
required. Draft-only and mixed fixtures prove drafts change neither collection
data nor the computed last page.

## Representation and discovery

The collection contains only typed `entry` resources with explicit public
attributes: kind, optional title, body, optional destination URL, optional
published time, created time, and updated time. State, row extras, owner facts,
and draft facts are absent. The pagination object contains only bounded `page`
and `pageSize`; a public total is not exposed.

Links are ordered arrays. `self`, `first`, and `last` are always present;
`previous` appears after page 1, including beyond-end pages; `next` appears only
before the last published page; each result has an encoded `item` link; and
`profile` plus `social.aitta.profile` identify the v1 schema and outward Aitta
profile. Empty collections define last page 1. Anonymous `actions` are empty.
The v1 root adds the canonical `collection` link, the schema advertises the
implemented item/pagination relations, and the existing manifest
`endpoints.entries` value remains the exact collection URL.

## Media, cache, errors, and privacy evidence

The route inherits TASK-178's bounded JSON-only Accept contract before D1,
bodyless matching `HEAD`, structured method errors, and exact
`Allow: GET, HEAD`. Success is `public, max-age=30`. Every success and error has
`Vary: Accept, Authorization`; errors are `no-store`. Invalid pagination uses
the common `400 invalid_pagination` envelope. Absent profile, invalid canonical
authority, and unexpected storage/runtime failure use fixed common 404, 503,
and 500 envelopes without exception or request data.

Focused compiled-Worker fixtures prove empty, draft-only, one, all four kinds,
first, middle, last, and beyond-end pages; deterministic repeat order; mixed
draft/published counts; optional omission; encoded identifiers; malformed and
excluded Accept; invalid pagination; every unsupported method and HEAD; absent
profile; invalid canonical configuration; count-query failure; hostile request
hosts; and exclusion of owner, Hub, Sites identity, cookie, credential, row,
and draft canaries. Presented browser identity or an Authorization value does
not add an action or alter the anonymous public body. Browser viewport evidence
is not applicable because the task adds no human route or rendering change.

## Validation evidence

- Focused compiled-Worker collection, root, profile, public-contract, privacy,
  and upgrade suites pass.
- `npm run validate` passes instruction, license, plan, instance, runtime,
  migration, type, lint, production build, and full-test gates.
- `npm audit --omit=dev` reports zero production vulnerabilities.
- `npm run db:generate` reports no schema change, and `git diff --check` reports
  no whitespace error.

No hosted request, push, deployment, secret access, data mutation, setting or
access-policy change, DNS/domain change, Hub request, or sibling-repository
change was made.
