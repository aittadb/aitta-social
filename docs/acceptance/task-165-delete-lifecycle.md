# TASK-165 delete lifecycle acceptance

TASK-165 makes deletion an explicit per-update owner action while preserving
the existing `DELETE /api/private/entries/{id}` route, its authorization and
D1 behavior, and every public and protocol boundary. The API returns `204` for
a successful deletion; the client then navigates to `/owner`.

## Product and recovery outcome

- The native confirmation names the bounded update label and complete stable
  identifier, makes permanence clear, and sends no request after cancellation.
- A successful confirmed request receives the unchanged `204`, then the client
  navigates to `/owner`. A definitive 4xx
  response identifies the rejected deletion request, keeps Delete available,
  and never asserts the update's current state.
- A rejected fetch or 5xx response is unconfirmed. It locks only Delete and
  offers **Check this Aitta’s saved state** at `/owner`; Edit and Publish or
  Unpublish remain available. There is no retry, timer, background deletion,
  schema change, or new endpoint.
- TASK-164's distinct publication-state recovery remains unchanged: it locks a
  further publication-state request and continues to expose **Check this
  Aitta’s current saved state**.

## Route, privacy, and regression evidence

`tests/delete-lifecycle.test.mjs` uses the compiled local Worker and disposable
FakeD1 fixtures to delete both a draft and a published update through the
unchanged owner-only route. It verifies each `204`, then verifies that draft,
published-after-deletion, and unknown public detail requests all return `404`
without the private canary. Here, “draft” identifies the deleted draft record's
post-deletion request; it does not claim that deletion caused a draft's already
private public representation. It also proves non-owner and cross-origin denial
leave the published record and its public projection intact.

The focused client contract covers confirmation cancellation, one delete fetch
with no retry path, the exact client navigation, 4xx wording, 5xx/network recovery,
Delete-only lock, retained publication controls, update-specific accessible
labels, and the `/owner` recovery destination. The assisted runtime journey
now deletes its synthetic record after publish/unpublish and verifies public
unknown parity before and after deletion.

## Rendered accessibility review boundary

The shared owner action group retains its semantic labelled group, polite live
status, native buttons and anchors, per-update accessible labels, 44-pixel
controls, focus treatment, wrapping, reduced-motion, and forced-colors rules.
The partial rendered review used compiled candidate
`e1639858aea9fbf0ceed4a3a2278246f030da087`, two loopback-only Workers, a
disposable migrated D1 containing synthetic draft and published updates, and a
disposable loopback header/failure proxy. The authenticated owner dashboard
rendered both action groups at 320, 390, and 1440 CSS pixels. Its document
client/scroll widths were respectively 305/305, 375/375, and 1440/1440; 18
visible controls had a 44-pixel minimum height; and no visible control was
off-screen. Full-page renders at 320 and 390 pixels were also visually
inspected.

That partial evidence is not the required completion matrix. During the first
published-cancellation interaction, the Browser controller stopped responding;
the call was interrupted and its outcome is unknown. The controller then
reported the selected browser unavailable, a fresh local browser request found
no browser, and the alternate connected-browser selector was also unavailable.
Therefore no deletion cancellation, success, 4xx, 5xx, network-failure,
denial/private-canary, keyboard/focus, touch, DPR-4 reflow, reduced-motion,
forced-colors, or clean-console browser result is claimed. TASK-165 remains
pending until all of those cells are observed against a fresh exact candidate.
No hosted or external mutation was attempted.

## Validation and residual evidence

The rendered local browser matrix remains the explicit completion blocker
above. No Site, hosted D1, access, setting, domain, Hub, or other external state
was changed.
