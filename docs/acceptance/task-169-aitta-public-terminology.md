# TASK-169 configured public Aitta terminology

Status: **pass.** Implementation, automated contracts, and the rendered public
state matrix satisfy the TASK-169 definition of done.

TASK-169 changes only human-facing configured public browsing and metadata
terminology. The owner-controlled application is now an Aitta; `profile`
describes its optional outward presentation. Existing component, CSS, test,
route, protocol, database, and API identifiers remain stable.

## Definition-of-done audit

This remains one focused vertical slice. The configured public frame, empty
stream, published permalink, not-found route, and generic metadata fallbacks
must name the same application consistently. They share the same profile and
entry projections and would be contradictory if reviewed or rolled back
separately. The slice needs no schema, migration, API, authorization, hosting,
or external-state change.

## Accepted behavior

- Configured public navigation is labelled `Aitta navigation`; its management
  action identifies local sole-owner administration as managing this Aitta for
  both signed-out and signed-in visitors without making a public owner claim.
- Optional location, website, and external links are labelled as Profile
  details. Configured display name, short description, About text, update text,
  and URLs remain unchanged owner content.
- A configured Aitta with no published updates says that this Aitta already
  stands on its own. A published historical update without a profile uses the
  bounded `Independent Aitta` source fallback in the stream, permalink, footer,
  and generic metadata only; the fallback is never persisted or projected as
  profile data.
- Published permalink navigation returns to this Aitta and all updates. Draft,
  unknown, and missing update routes retain identical not-found status,
  headers, metadata, and body apart from their requested identifier, and offer
  the native `Return to Aitta` path.
- Generic layout, profile, entry, and not-found metadata use Aitta wording.
  Configured owner text remains authoritative. Canonical URLs still come only
  from normalized configuration, successful configured documents remain
  indexable, and absent/invalid canonical states remain `noindex, nofollow`
  without canonical or sharing URLs.

## Contract and privacy evidence

The focused 58-test set covers configured zero, one, many, and all-kind update
streams; a missing-profile historical update; published, draft, unknown, and
not-found permalinks; canonical and no-canonical metadata; signed-out and
signed-in management destinations; fresh and historical D1 lineages; hostile
request hosts; and owner, draft, credential, Hub, database, and row canaries.
It also proves the unchanged protocol 1.0 envelopes, explicit public
allowlists, deterministic pagination, draft/unknown parity, CSP, dynamic HTML
cache policy, technical resources, attribution control, and native anchors.

The checked-in protocol digest is deliberately refreshed because the protocol
documentation now records the human-facing terminology boundary. No protocol
field, envelope, route, status, content type, schema, migration, query, or
runtime binding changes.

## Rendered fixture and browser evidence

The exact rendered product source candidate was
`8605185fbc4ac50fc01a197cc69cb7f5c422d196`. The final evidence-only amendment
changes this acceptance record but no production, test, protocol, or
presentation byte. The integration owner records the resulting focused commit.
The fixture builds the production Worker and client assets,
applies the checked-in migration to four separate disposable local D1
databases, and binds only random `127.0.0.1` ports. Its configured-many state
contains thirteen published updates plus a private draft canary; it also
provides configured-empty, profile-absent, canonical-absent, signed-out, and
signed-in public states and published, draft, and unknown permalink routes.
The active ignored hosting configuration is neither read nor copied.

The Codex in-app Chromium browser inspected these states at a 320-by-900 CSS
pixel viewport:

| State | Public items | Metadata | Result |
| --- | ---: | --- | --- |
| Configured, signed out | 12 newest of 13 published updates | configured canonical; `index, follow` | `Manage` kept the full sign-in/local-owner accessible name |
| Configured, signed in | 12 newest of 13 published updates | configured canonical; `index, follow` | `Manage` used `/owner` without claiming owner authorization |
| Configured, no updates | 0 | configured canonical; `index, follow` | Aitta-specific empty state remained below Identity and About |
| Profile absent | 2 published updates; private draft absent | no canonical; `noindex, nofollow` | setup remained distinct and update sources used `Independent Aitta` |
| Canonical absent | 1 published update | no canonical; `noindex, nofollow` | configured owner text remained unchanged |
| Configured published permalink | 1 update | entry canonical; `index, follow` | source, `All updates`, and `Return to Aitta` were intact |
| Profile-absent published permalink | 1 update | no canonical; `noindex, nofollow` | `Independent Aitta` was the only source fallback |
| Draft and unknown permalinks | 0 | no canonical; `noindex` | identical generic not-public presentation with no draft canary |
| Unknown framework route | 0 | no canonical; `noindex` | same `Independent Aitta` root metadata and `Return to Aitta` path |

Every row had equal document client and scroll widths, zero horizontal
overflow, no offscreen target, one `main`, and no seeded owner, authenticated
name, draft-title, or draft-body canary. Rows with a vertical scrollbar
measured 305/305 CSS pixels; permalink and not-found rows measured 320/320.
Every visible interactive target was at least 44 CSS pixels high. No visible
whole-word `presence` remained in any inspected public body.

The configured-many state was repeated with a 320-CSS-pixel layout and device
scale factor 4: `innerWidth` remained 320, physical width was 1280, document
width remained 305/305, all 12 projected updates remained available, the
minimum target height remained 44 CSS pixels, and no target was offscreen.
Viewport metadata remained `width=device-width, initial-scale=1`.

Keyboard-dispatched focus on the 77.46-by-44-pixel `Manage` target and the
not-found `Return to Aitta` target showed the reviewed solid 3-pixel dark
outline, 3-pixel offset, and 6-pixel white halo. The in-app controller focused
these native anchors but did not dispatch Enter navigation, so this record does
not claim controller-observed keyboard activation. The focused source remains
an ordinary native `href="/"` anchor, automated accessibility coverage pins
that native route boundary, and browser pointer activation navigated from the
not-found page to the exact configured root. Browser activation of the first
update-time native link likewise reached its exact published permalink with
the expected Aitta title and source h1. The complete inspection produced no
console warning or error.

## Validation and external-state boundary

The complete repository gate passes 198 tests, including production build,
strict type checking, lint, instruction/license/plan/instance/runtime/migration
checks, fresh and upgrade D1 matrices, privacy, authorization, CSP, metadata,
and public-contract coverage. Migration generation reports no schema drift;
the production dependency audit reports zero vulnerabilities; and `git diff
--check` passes.

No Site, deployment, hosted D1 data, protected setting, access policy, DNS,
custom domain, Hub, sibling repository, `develop`, or `main` was read or
mutated. Final commit evidence is recorded by the integration owner.
