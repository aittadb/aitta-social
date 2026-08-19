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

## Rendered local evidence

The fresh disposable local Miniflare/D1 fixture at
`http://127.0.0.1:43197` served the frozen `5bb97c0` production build without
a source or build change. It used only synthetic owner or non-owner identity,
two synthetic updates, and one-shot local state-response faults. Owner HTML,
the emitted CSS, the emitted JavaScript, and the preloaded WOFF2 each returned
`200` with their browser-appropriate content types before the checks. No hosted
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

The in-app-browser owner layout measurements were:

| Viewport and state | Observed result |
| --- | --- |
| `320×800` CSS pixels | Document and body widths were `305/305`; 25 controls were present; the smallest target was 44 CSS pixels; every lifecycle action was in bounds. The pre-existing owner navigation is its own horizontal scroller, so **Pages** began partly outside that scroller's viewport; the document itself did not horizontally overflow. |
| `390×844` CSS pixels | Document and body widths were `375/375`; the smallest target was 44 CSS pixels; no non-navigation control or lifecycle action was off screen. |
| `1440×900` CSS pixels | Document and body widths were `1425/1425`; the smallest target was 44 CSS pixels; no non-navigation control or lifecycle action was off screen. |
| `320×800` CSS pixels at emulated DPR 4 | `devicePixelRatio` was 4, document widths were `320/320`, the smallest target was 44 CSS pixels, and every lifecycle-action rectangle was in bounds. |

Forced-colors `active` and reduced-motion `reduce` both matched under
emulation. A sampled control resolved to system white, and sampled transition
and animation durations were `0s`. After touch emulation, both `pointer` and
`any-pointer` coarse media queries matched and the smallest target remained 44
CSS pixels. The in-app-browser warning/error log array was `[]`.

A fresh styled Safari pass independently showed the safe non-owner heading
above with no owner navigation, actions, or private canary, and showed the
fully styled owner dashboard with both relevant Draft and Published action
groups during recovery. Safari browser zoom was increased to its maximum, but
the browser exposed no numeric ratio; this record makes no numeric zoom claim.
Native Tab did not yield a reliable focused control because focus remained in
the HTML content, so this record makes no sequential-Tab or rendered-focus
claim. TASK-196 did not change [`app/globals.css`](../../app/globals.css), so
the shared focus styling is source-preserved relative to `df5e932`; that is not
rendered focus evidence.

## Validation

Frozen source candidate `5bb97c0` passed `npm run validate` with `493/493`
tests. `npm run db:generate` reported no schema drift, and `npm audit
--omit=dev` reported zero vulnerabilities. An independent source-only Sol
review found no P0/P1/P2 findings and independently ran the focused
state/lifecycle/owner-security suites with `45/45` passing. This acceptance
amendment changes only this evidence record; its final clean diff/status check
and exact-SHA documentation review are recorded in the handoff.
