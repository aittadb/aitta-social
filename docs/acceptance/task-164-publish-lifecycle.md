# TASK-164 publish and unpublish lifecycle acceptance

TASK-164 makes the existing per-update state transition understandable without
changing its route, JSON payload, authorization, D1 transition, public
projection, cache, metadata, protocol, schema, migration, or hosted state.

## Product outcome

- Each owner action group names the current state directly. **Draft** means only
  the owner can read the update; **Published** means it is publicly readable on
  this Aitta. The published state also states that unpublishing returns the same
  update to a private draft.
- A draft has a deliberate native, update-specific publication confirmation. It
  names the bounded update label and full stable identifier, and says that the
  update will become publicly readable on this Aitta at its permalink.
- Publishing and unpublishing keep the exact existing `PUT
  /api/private/entries/{id}/state` JSON request and server state semantics. A
  successful response reloads the server-rendered owner state. There is no
  automatic publication, timer, background request, retry, social control, or
  new endpoint.
- A definitive 4xx result identifies the rejected publication or unpublish
  request without claiming the update's current state, leaves the lifecycle
  choice available, and never offers an ambiguous-result link. A rejected fetch
  or 5xx result is unconfirmed: it
  locks another publication-state request from that rendered state and provides
  the native **Check this Aitta’s current saved state** route. Edit and
  the existing independent delete action remain available.

## Security, privacy, and recovery

The unchanged state route repeats server-side sole-owner authorization, exact
same-origin verification, JSON media-type and body bounds, state validation,
and a prepared D1 query before the transition. A native confirmation is a
human approval boundary, not an authorization bypass. Drafts continue to be
indistinguishable from unknown identifiers on public HTML and JSON routes.

The focused lifecycle test publishes a synthetic draft with the unchanged
owner-only route, verifies its public JSON projection, then unpublishes the
same stable record and verifies the public detail route returns the generic
not-found response without the synthetic private canary. Existing owner
security and journey tests retain coverage for missing-owner, non-owner,
same-origin, malformed payload, cache, metadata, and draft/unknown parity.

## Responsive and accessibility evidence

The action group remains a semantic labelled group with per-update accessible
labels, a referenced Draft/Published description, a polite live status, native
buttons and anchors, and the existing 44-pixel button, focus, wrapping,
reduced-motion, forced-colors, and responsive owner-row rules. The task adds no
new global style, visual vocabulary, sticky layout, or client router.

The final rendered matrix used only the exact compiled Worker from commit
`b35a13f678de2b94f6e34b099727c4a86cbdb1f4`, a disposable loopback D1, and
synthetic fixture identities and entries. The fixture served its compiled CSS
at `/_next/static/css/index.DNMW_nIF.css` with `200 text/css; charset=utf-8`,
38,942 bytes, and SHA-256
`5b977280c20741e46781c06e9086b672b6b4235ee487b8fe2faf4102b7a84a34`.
No hosting binding, Site, hosted D1, access setting, or production content was
read or changed.

At 320, 390, and 1440 CSS pixels, the dashboard containing both Draft and
Published rows had matching client/scroll widths of 305/305, 375/375, and
1425/1425 respectively. It had 18 controls, every measured action was at least
44 CSS pixels high, and no control was off-screen. The Draft and Published edit
rows independently had those same client/scroll-width pairs, a 44-pixel
minimum action height, no off-screen control, and the correct state statement.

The native Publish confirmation was observed and handled by the browser
controller. Cancelling left the entry as Draft with Publish enabled and the
exact status `Publication cancelled. The update is still private.` Accepting
published it, exposed its `/entries/{id}` permalink, and replaced Publish with
Unpublish. A normal Unpublish returned the same entry to Draft and restored
Publish. The published permalink was readable, then the unpublished detail
route produced the exact same `404` snapshot as an unknown identifier: `This
update is not public`.

A synthetic one-shot `400` after confirming publication retained Draft and an
enabled Publish control, with the exact status `The server rejected this
publication request. Synthetic lifecycle 400 response; no D1 transition
occurred.` A synthetic one-shot `500` after confirmation announced that the
publication result could not be confirmed before another publication-state
change, disabled Publish, left Delete enabled, and exposed recovery at
`/owner`. A fresh reset fixture repeated cancel, accept, normal unpublish, the
500 recovery, and draft/unknown public-detail parity with new synthetic
identifiers, confirming no conclusion depended on an earlier fixture's state.

At all three widths, the synthetic non-owner page had the sole heading `This
presence is not yours to administer`, no entry-action group or private canary,
and matching client/scroll widths of 320/320, 390/390, and 1440/1440. The
synthetic missing-owner fixture at those same widths showed `This update is not
public`, no controls or private canary, and the same matching client/scroll
widths. This records the observed safe route result without claiming a broader
missing-owner behavior.

At a 320-CSS-pixel inner viewport with DPR 4 (1280 physical pixels),
client/scroll width was 305/305, every measured action was at least 44 pixels
high, and none was off-screen. Reduced-motion and forced-colors emulation were
both active; the same page stayed 305/305 and its focus outline was solid
three-pixel. Keyboard focus on Publish had a solid three-pixel outline with a
three-pixel offset. A coarse-pointer CUA click used the 62.05-by-44-pixel
Manage target at 320 pixels and navigated to the owner page. CDP Log/Runtime
console, error, and exception events remained empty after reload. The review
did not observe a complete sequential-Tab traversal and makes no such claim.

## Validation and residual evidence

The task branch passed the focused lifecycle, assisted-runtime, owner-security,
and accessibility tests; `npm run db:generate` with no migration drift; the
full `npm run validate` suite with 213 passing tests; `npm audit --omit=dev`
with zero vulnerabilities; and final diff review. The integration owner records
the exact commit and completed evidence in `CHANGELOG.md` only after integration.
