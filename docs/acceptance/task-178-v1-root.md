# TASK-178 v1 integration-root acceptance

TASK-178 establishes the single pre-release versioned API boundary. It adds
the D1-independent `/api/v1` root and `/api/v1/schema` profile, a JSON catch-all
for unknown v1 paths, and the additive manifest `endpoints.api` link. It does
not reshape the existing site or entry resources; TASK-179–181 own those
vertical changes. `/api/v2` remains absent.

## Contract and privacy evidence

- Root and schema documents have exact allowlisted `data`, ordered `links`, and
  empty `actions`. Every absolute URL comes from normalized protected
  `AITTA_SOCIAL_CANONICAL_URL`, never D1, `Host`, forwarding headers,
  User-Agent, identity headers, owner configuration, or Hub state. Their
  runtime reader accesses only the canonical setting; fixtures make owner and
  Hub setting getters throw while both resources still return `200`.
- Missing or invalid protected canonical configuration returns structured
  no-store `503` without touching D1 or falling back to the stored profile.
  Synthetic unexpected runtime access failure returns the fixed structured
  no-store `500` without exception text.
- The product-specific Accept parser limits the header to 4 KiB and 16 media
  ranges, validates range/parameter/q syntax, applies exact/application/global
  wildcard specificity, and makes an exact q-zero refusal authoritative over a
  broader wildcard. Missing and accepted JSON-compatible values produce JSON;
  malformed, excessive, unsupported, and excluded values produce structured
  no-store `406`.
- Root and schema support only `GET` and matching-bodyless `HEAD`. Every tested
  `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` receives structured `405` and
  exact `Allow: GET, HEAD`. The same methods on nested unknown v1 paths receive
  structured `404`. All variants include `Vary: Accept`, use JSON content, and
  never redirect or negotiate HTML.
- Focused compiled-Worker fixtures include hostile request/forwarding hosts,
  owner/identity/Hub/profile/entry/runtime canaries, query format hints, and a
  browser User-Agent. No response projects any canary and neither discovery
  resource issues a D1 query.
- The configured manifest adds only canonical `endpoints.api`; its existing
  `profile` and `entries` names and values remain exact. Existing v1 site,
  collection, and detail response shapes remain unchanged pending their
  accepted replacement tasks.

## Validation

The task is source-only. It changes no schema, migration, D1/R2 data, active
hosting binding, deployment, Site access, domain, DNS, Hub, or sibling project.
Validation results are recorded in the reviewed task commit handoff; no hosted
claim is made by this local acceptance record.
