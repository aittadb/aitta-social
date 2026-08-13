# TASK-196 private publication-state JSON acceptance

## Boundary and contract

TASK-196 normalizes only `PUT /api/private/entries/{id}/state` and the existing
Publish and Unpublish client. Same-origin and current sole-owner authorization
remain first. Only an authorized PUT reaches bounded Accept negotiation, JSON
media/body parsing, exact state validation, route parameters, and the existing
prepared transition. The request contains exactly one `state` member with
`draft` or `published`; missing, extra, or invalid domain values are `422`.

Success is a no-store `200` allowlisted `owner-entry` document with its stable
relative API and owner-editor links. Draft exposes `edit`, `publish`, and
`delete`; Published exposes `edit`, `unpublish`, and `delete`. Every normalized
response is JSON and varies on Accept. Missing or unsupported media is `415`,
malformed, invalid-UTF-8, or oversized JSON is `400`, explicit JSON refusal is
`406`, and unsupported methods are JSON `405` with exact `Allow: PUT`
independent of Accept. An unknown target is a structured `404`; unexpected
authorization-setting, storage, or post-transition failure is a fixed safe
`500` whose result is unconfirmed.

The D1 semantics are deliberately unchanged. Publishing sets `published_at`
only when it is absent; unpublishing retains the historical value. Both update
the same stable record and return its freshly read state. A same-state request
remains an accepted idempotent transition, so this task defines no version
conflict and returns no `409`.

## Client, privacy, and adjacent behavior

The owner client sends `Accept: application/json` and confirms success only
from an exact bounded `200` owner-entry document matching the stable identifier
and requested state, including the corresponding state-conditioned action. An
exact bounded structured 4xx is definitive and leaves the state control
available. A redirect, malformed or non-JSON response, oversized response,
wrong identifier or state, invalid action set, failed fetch, or 5xx is
unconfirmed: the rendered state choice is locked and the existing native
**Check this Aitta’s current saved state** link is exposed. No request is
retried automatically.

The update-specific Publish confirmation and cancellation remain unchanged;
Unpublish remains the existing direct choice. A confirmed transition reloads
the server-rendered owner state. TASK-165 deletion remains separate: its
request bytes, `204`, confirmation, cancellation, Delete-only ambiguous lock,
and `/owner` navigation are unchanged. This slice adds no schema, migration,
machine credential, public-v1 shape, Hub behavior, profile/canonical
dependency, hosting operation, or external mutation.

Publishing makes only the existing allowlisted public update projection
readable. Unpublishing makes the same stable identifier indistinguishable from
unknown on public HTML, v1 detail, and collection surfaces. Authorization and
validation failures do not access D1. Private rows, owner identity, protected
settings, request hosts, authentication data, and private canaries never enter
the response.

## Automated evidence

`tests/private-entry-state-json.test.mjs` covers both transitions, historical
publication time, same-state idempotence, prepared bound queries, allowlisted
links/actions, request-host independence, Accept and Content-Type matrices,
bounded/malformed/invalid-UTF-8 JSON, exact domain validation, safe 404/500,
same-origin and owner denial before body/parameters/D1, machine-header and
cookie non-authority, every unsupported method and exact Allow value, public
publish/unpublish projection, private canaries, headers/cache, strict bounded
client parsing, and deletion non-regression. Existing lifecycle, owner-security,
assisted, first-update, functional, and reproducibility suites retain the
surrounding behavior.

## Rendered local evidence and residual

A disposable local Miniflare/D1 fixture served the same production build with
only synthetic owner or non-owner identity, two synthetic updates, and
one-shot local state-response faults. Its owner HTML and the compiled CSS and
JavaScript assets each returned `200` before the interaction checks. No hosted
Site, hosted data, setting, credential, identity, or external service was
used.

- The native Publish confirmation named the exact bounded update label and
  stable identifier. Cancelling it displayed **Publication cancelled. The
  update is still private.** and retained Draft. Confirming it reloaded the
  saved owner page as Published with Unpublish, and the public permalink then
  rendered the update title and body.
- Confirming Unpublish reloaded the same stable update as Draft with Publish.
  Its public detail then showed only **This update is not public** and omitted
  the synthetic private canary.
- A one-shot structured `422` displayed **The server rejected this publication
  request. Synthetic publication request rejected.**; Publish stayed enabled,
  and a corrected retry confirmed and reloaded. One-shot `500` and malformed
  `200` responses both used the unconfirmed-result path: only the lifecycle
  Unpublish control became disabled, Delete remained enabled, and the fixed
  current-saved-state recovery link was visible.
- The synthetic non-owner owner-page request displayed **This Aitta is not
  yours to administer** with no owner navigation, entry actions, or private
  canary.

The browser surface became unavailable after those interaction observations,
so this record deliberately does **not** claim the remaining required visual
matrix: 320/390/1440 widths, literal 400-percent zoom or an equivalent
measured reflow row, focus measurements, 44-pixel measurements, forced colors,
reduced motion, coarse pointer, or a fresh clean-console observation. Those
are an explicit TASK-196 residual and must be collected against this frozen
candidate before the task can be completed or integrated.

## Validation and residuals

Focused state/lifecycle coverage, type/lint checks, migration-drift review,
and the production dependency audit are recorded against the candidate before
the final browser residual. The exact full-validation, diff, and independent
review records must be refreshed after the browser matrix is complete. The
unmeasured rendered matrix above is the sole known completion blocker; it does
not authorize a hosted or external mutation.
