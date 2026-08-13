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
The completed rendered review used exact compiled candidate
`b4abad41adc448512621804d1d481baa627d5c5a`, a loopback-only compiled Worker,
a disposable migrated D1, and a disposable same-origin header/failure proxy.
Those fixtures injected only synthetic local owner or non-owner identity and
one-shot 400, 500, or dropped-connection deletion responses; no hosted Site,
data, configuration, credential, or identity was used.

- At 320, 390, and 1440 CSS pixels, the authenticated owner dashboard rendered
  draft and published action groups with document client/scroll widths
  305/305, 375/375, and 1425/1425. The observed action controls had at least
  44-pixel heights, no horizontal document overflow, and no off-screen action.
  Draft and published native confirmation cancellation retained the same row
  and enabled controls without a deletion request; accepted deletion returned
  to `/owner` and removed the row.
- A synthetic 400 kept Delete and the separate publication control enabled,
  showed only the definite rejected-request message, and exposed no ambiguous
  recovery. Synthetic 500 and dropped-connection results retained the row,
  disabled only Delete, left publication available, and exposed the fixed
  saved-state recovery link without a retry. The public detail routes for a
  deleted draft, deleted published update, and arbitrary unknown identifier
  rendered the same not-public state without a private canary.
- The non-owner fixture at all three widths showed its safe denied heading,
  no action groups or private canary, and retained bounded 44-pixel controls.
  A focused normal-mode publication control had the shared solid 3-pixel
  outline with 3-pixel offset. Under forced colors, a focused Manage link had
  the same visible solid 3-pixel/3-pixel-offset focus treatment.
- On the exact candidate, reduced-motion media matched `reduce`, sampled
  action transition durations were `0s`, and document scroll behavior was
  `auto`. Forced colors matched `active`. Coarse and any-coarse pointer media
  both matched after loopback touch emulation, while sampled Delete, Publish,
  and Unpublish controls remained 44 pixels high. A 320-CSS-pixel DPR-4 row
  kept the document at 320/320 and action controls horizontally bounded.
- Literal Chrome zoom was separately observed: the Chrome toolbar reported
  **Zoom: 400%** for the fixture. At that zoom the page had a 300-CSS-pixel
  viewport and 296/296 document widths; visible Publish and Delete controls
  remained horizontally bounded and 44 pixels high. Zoom was reset through
  Chrome's Reset control, whose toolbar state then reported **Zoom: 100%**.
  This is distinct from the DPR-4 and 320-CSS-pixel rows.
- Fresh browser warning/error logs were empty after the fixture navigation and
  rendered checks. A complete sequential hardware-Tab traversal was not
  enumerated and is not claimed.

## Validation and residual evidence

Focused deletion, assisted-runtime, accessibility, and publication-lifecycle
coverage passed 35/35 against the rebased candidate before this evidence-only
amendment. The final repository, migration-generation, production-audit, and
diff gates are recorded with the final evidence commit. No Site, hosted D1,
access, setting, domain, Hub, or other external state changed.
