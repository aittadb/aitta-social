# TASK-179 — Prerelease v1 public Aitta profile resource

## Outcome and boundary

`GET /api/v1/site` is now the one v1 singleton profile resource. This is the
deliberate pre-release replacement of the former unshipped `{data, links}`
grammar; there is no compatibility route and no `/api/v2`. The slice changes no
D1 schema or row, private route, browser-owner behavior, machine authority, Hub
behavior, hosting state, or external system.

The route owns one public read. It loads the existing profile through the
prepared repository query, selects canonical authority from the protected
canonical setting followed by the already-public stored profile canonical URL,
and emits only the established profile allowlist. It reads no owner or Hub
runtime setting and never derives a link from request, forwarding, identity,
cookie, authorization, User-Agent, or query values.

## Exact representation and discovery

The success document is:

- `data.id: "profile"`, `data.type: "profile"`, and `data.attributes` holding
  only `displayName`, required compatibility `accountType`, `shortDescription`,
  `introduction`, optional non-empty `location` and `website`, copied
  `externalLinks`, normalized `canonicalUrl`, and the constrained presentation
  values;
- ordered links `self` to `/api/v1/site`, `profile` to `/api/v1/schema`, and
  `social.aitta.profile` to the canonical human profile document, each with
  truthful media types (`application/json`, `application/json`, and
  `text/html` respectively); and
- an empty anonymous `actions` array.

The v1 root adds the exact `social.aitta.profile` capability link before its
manifest link. The schema relation vocabulary adds the same relation. The
protocol 1.0 manifest already had the canonical `endpoints.profile` member, so
its exact shape remains unchanged while tests prove both discovery paths agree.

## Media, errors, methods, and privacy review

The profile route now shares TASK-178's bounded JSON-only contract. Missing,
wildcard, and JSON-compatible `Accept` succeed; an exact JSON refusal,
unsupported selection, malformed syntax, more than 16 ranges, or more than
4 KiB returns the common no-store `406` before D1. Success is
`public, max-age=60`; every response varies on `Accept`. `HEAD` has the matching
GET status and headers with no body. `POST`, `PUT`, `PATCH`, `DELETE`, and
`OPTIONS` return the common no-store `405` with `Allow: GET, HEAD`.

The route preserves the existing setup categories in the common v1 envelope:
absent profile is `404 profile_not_configured`, no valid canonical authority is
`503 canonical_url_unconfigured`, and unexpected D1 or runtime failure is the
fixed safe `500 internal_error`. Application errors contain no canonical link,
exception, SQL, stack, identifier, protected value, or request data.

The focused compiled-Worker matrix proves configured and optional-field
projections, protected and stored canonical selection, absent/invalid setup,
storage/runtime failure, media bounds, methods and HEAD, exact root/schema and
manifest discovery, anonymous/identity independence, hostile request hosts,
and exclusion of owner, Hub, identity, credential, cookie, profile-row, and
draft canaries. Existing fresh/upgraded D1 matrices prove the same public facts
and privacy boundary survive migration history without a data rewrite.

## Validation evidence

- Focused compiled-Worker v1/profile and impacted public-contract suites pass.
- `npm run validate` passes the instruction, license, plan, instance, runtime,
  migration, type, lint, production build, and full test gates.
- `npm audit --omit=dev` reports zero production vulnerabilities.
- `npm run db:generate` reports no schema changes, and `git diff --check`
  reports no whitespace error.

No hosted request, push, deployment, secret access, data mutation, setting or
access-policy change, DNS/domain change, Hub request, or sibling-repository
change was made.
