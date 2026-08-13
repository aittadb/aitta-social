# TASK-181 — Prerelease v1 published-update detail

## Outcome and boundary

`GET /api/v1/entries/{id}` now emits the one prerelease v1 detail grammar. It
reuses TASK-180's explicit typed entry resource and TASK-178's bounded
JSON-only response helpers. The slice changes no schema, migration, D1 row,
unversioned human route, private route, browser-owner behavior, machine
authority, Hub behavior, hosting state, or external system.

## Representation and discovery

The detail document contains one published `entry` resource with only kind,
optional title, body, optional destination URL, optional published time,
created time, and updated time. Ordered links identify the canonical JSON
`self`, JSON collection, JSON API `profile`, and human HTML `alternate`;
anonymous `actions` are empty. State, row extras, owner facts, authentication
facts, and draft facts are absent.

The v1 root advertises the detail URI template as an `item` link with
`templated: true`; the manifest advertises the identical string as
`endpoints.entryTemplate`. `{id}` is documented as RFC 6570 level-1 path
expansion that percent-encodes an opaque identifier as one path segment. The
closed schema relation list now includes the implemented `alternate` relation.
All successful links derive only from normalized protected or already-public
stored canonical configuration, never request authority.

## Media, errors, cache, and privacy evidence

The route negotiates bounded JSON `Accept` before D1. Success is
`public, max-age=60` with `Vary: Accept`; errors are no-store. `HEAD` preserves
GET status and headers with no body. Every unsupported conventional method,
including `OPTIONS`, returns the common structured `405` and exact
`Allow: GET, HEAD`.

Absent profile, invalid canonical authority, and unexpected storage/runtime
failure use fixed common 404, 503, and 500 documents. Draft, unpublished,
deleted, malformed, and unknown identifiers use the identical published-only
prepared query boundary and `404 entry_not_found` body and headers, revealing
no existence or state signal. Focused compiled-Worker fixtures cover all four
kinds, optional omission, encoded identifiers, root/manifest discovery,
excluded/malformed/excessive Accept, exact methods and HEAD, setup order,
storage failure, hostile request hosts, and owner, Hub, Sites identity, cookie,
credential, database-row, and draft canaries. The task changes no human
rendering, so browser viewport evidence is not applicable.

## Validation evidence

- Focused compiled-Worker detail, root, profile, public-contract, privacy, and
  upgrade suites pass.
- `npm run validate` passes instruction, license, plan, instance, runtime,
  migration, type, lint, production build, and full-test gates.
- `npm audit --omit=dev` reports zero production vulnerabilities.
- `npm run db:generate` reports no schema change, and `git diff --check` reports
  no whitespace error.

No hosted request, push, deployment, secret access, data mutation, setting or
access-policy change, DNS/domain change, Hub request, or sibling-repository
change was made.
