# TASK-193 — Current published-update document negotiation

## Outcome and boundary

`GET` and `HEAD /entries/{id}` now offer the existing public HTML and a current
hypermedia JSON representation at the same canonical unversioned URI. HTML
remains the default and is byte/semantic-compatible with the established
permalink. `/api/v1/entries/{id}` remains the separate versioned integration
resource and its route, representation, status, body, headers, cache, query,
and D1 order are unchanged.

This slice adds no schema, migration, persisted field, private or machine
authority, Hub dependency, hosting setting, external state, generic router, or
future page placeholder. A future published page such as `/about` must adopt
the proven pattern through its own accepted task.

## Negotiation contract

The Worker alone recognizes a raw path containing exactly `/entries/` plus one
segment, and only for `GET` or `HEAD`. `Accept` is bounded to 4 KiB and 16 media
ranges with strict token, parameter, quoted-value, and q-value parsing. Each
representation uses its most-specific match (exact, type wildcard, then global
wildcard); equally specific duplicates use their first occurrence. JSON is
chosen only when its effective positive quality is strictly greater than
HTML's. Missing `Accept`, wildcard-only input, and every positive tie choose
HTML. Exclusion of both, unsupported input, malformed grammar, or a bound
failure returns a fixed no-store structured JSON `406` for `GET`; `HEAD` has
matching status and headers with no body. Every negotiated response includes
`Vary: Accept`.

User-Agent, query, request/forwarded authority, Sites identity, cookie,
authorization, Hub state, and row extras cannot select a variant. HTML keeps
the original query and all existing behavior. The internal JSON rewrite clears
the query before Vinext. Canonical links contain no query and derive only from
normalized protected configuration or the already-public stored canonical
fallback.

## Representation and privacy

Current JSON has one allowlisted `entry` resource with kind, optional title,
body, optional destination URL, optional published time, created time, and
updated time. It reuses only the immutable v1 entry-resource projection and
opaque-ID encoder. Its feature-local document adds ordered current JSON `self`,
v1 JSON `collection`, v1 JSON `profile`, and HTML `alternate` links plus empty
anonymous `actions`. Both `self` and `alternate` identify the same unversioned
canonical URI. Success is `public, max-age=60`; errors are no-store.

The JSON setup/canonical/storage statuses remain the established safe 404, 503,
and 500 classes. The internal route performs the same published-only prepared
entry query as the HTML and v1 projections. Draft, unpublished, deleted,
malformed-domain, and unknown identifiers share one `404 entry_not_found`
document. A raw encoded slash is kept in one Worker segment, decoded once by
Vinext, and rejected before D1; `%252F` remains the distinct literal `%2F`
identifier. Invalid percent encoding remains Vinext's pre-route `400` with no
D1 query. Private profile/row/draft, owner, Hub, cookie, credential, hostile
host, query, and storage canaries are absent from every public result.

## Internal dispatch security

Vinext ignores filesystem route directories that begin with an underscore, so
the compiled internal handler uses the explicitly reserved
`/aitta-internal/entry-document/{id}` namespace. The Worker strips the
dispatch header from every incoming request. It returns a bodyless no-store
`404` for every direct `/aitta-internal` request before Vinext and D1. Only the
exact JSON-selected external entry read adds the marker and rewrites to the
handler. `/api/*`, `/.well-known/*`, `/owner/*`, Sites navigation, static and
framework assets, other human routes, nested entry paths, and every external
method other than `GET`/`HEAD` remain untouched Vinext behavior.

## Verification evidence

The focused compiled-Worker suite proves the full quality, specificity,
ordering, duplicate, wildcard, malformed, excessive, excluded, GET, and HEAD
matrix; all four kinds and optional omissions; current links/cache; unchanged
HTML/CSP/native navigation; draft/deleted/unknown/slash parity; query and
hostile authority independence; setup/canonical/storage failures; marker
forgery and direct-namespace denial; route-family/method exclusion; private
canary absence; and source-level separation from v1 document/error/response
helpers. The complete existing TASK-181 detail suite runs alongside it and
proves v1 non-regression.

The exact production build was served from a loopback-only fixture and observed
in the in-app browser. At 320, 390, and 1440 CSS pixels the published article
had exactly one main, h1, public header, and public footer; every visible native
control was at least 44 by 44 CSS pixels; the long identity, title, and
unbroken body produced no offscreen element or horizontal overflow; Manage
remained `/owner`; View as JSON remained the direct v1 detail link; and no
private canary appeared. No visible fixed or sticky element obstructed content;
the intentional skip link remained offscreen until focused.

At 320 CSS pixels and device scale factor 4, forced colors, reduced motion, and
a coarse pointer were all active. Width remained exactly 320, no target was
undersized, no element was offscreen, no transition remained, and no private
canary appeared. Direct native focus checks on Skip to main content, Manage,
Return to Aitta, View as JSON, and Privacy each showed a visible 3-pixel system
outline and a target at least 44 pixels high. Activating Return to Aitta made a
full native navigation to `/`, which retained one main and the configured h1;
back navigation returned to the permalink.

A same-origin browser harness requested the same permalink plus an ignored
query using `Accept: application/json`. It observed `200`, JSON content,
`public, max-age=60`, `Vary: Accept`, the published ID, empty actions, and
current JSON `self` plus HTML `alternate` both at
`https://canonical.example/aitta/entries/task193-published`; the query and
private canaries were absent. Both the HTML document and JSON harness reported
no console warning or error. Browser emulation and viewport overrides were
reset and the fixture tabs and loopback listener were closed after evidence was
recorded.

On rebased `develop` commit `27b92ca`, the focused compiled-Worker, v1-detail,
and CSP suite passed 29/29 and `npm run validate` passed 297/297, including the
production build. `npm run db:generate` reported no schema change,
`npm audit --omit=dev` reported zero vulnerabilities, and `git diff --check`
passed. No hosted request, deployment, push, secret access, data mutation,
setting/access-policy change, DNS/domain change, Hub request, or
sibling-repository change was made.
