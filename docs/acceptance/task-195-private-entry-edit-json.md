# TASK-195 — Private update edit JSON acceptance

## Boundary and contract

TASK-195 normalizes only `PUT /api/private/entries/{id}` and the existing edit
form. Same-origin and sole-owner authorization remain the first operation.
Only an authorized PUT reaches bounded Accept negotiation, JSON media/body
parsing, domain validation, and the existing prepared update. No profile or
canonical setup is read. The identifier, Draft or Published state, historical
publication time, and creation time remain server-owned and unchanged.

Success is a no-store `200` `owner-entry` document with relative self and owner
editor links. Drafts expose `edit`, `publish`, and `delete`; published updates
expose `edit`, `unpublish`, and `delete`. Every normalized PUT response is JSON
and varies on Accept. Unsupported methods are JSON `405` with exact
`Allow: PUT, DELETE` independent of Accept. The existing DELETE handler was
unchanged by TASK-195. TASK-197 later normalized deletion separately to a
bodyless JSON acknowledgement with negotiated structured JSON failures.

The client sends `Accept: application/json` and confirms success only from an
exact bounded `200` document whose stable ID, state, and normalized submitted
kind, title, body, and destination match the current edit. A valid structured
4xx is definitive and maps only recognized field errors. A failed fetch, 5xx,
redirect, oversized/non-JSON response, or malformed/mismatched success is
unconfirmed: values stay open, retry is disabled, and the native saved-state
reload link is shown. There is no automatic retry, publication transition,
machine credential, request-host authority, schema, or external mutation.

## Automated evidence

`tests/private-entry-edit-json.test.mjs` covers draft and published edits, all
four kinds and optional fields, state/ID/timestamp preservation, prepared D1
parameters, allowlisted links/actions, missing and wildcard Accept, explicit or
malformed JSON refusal, media/UTF-8/body bounds, malformed JSON, domain 422,
unknown target 404, storage/auth-setting 500, same-origin and owner denial
before request-body or D1 access, machine-header/cookie rejection, public
draft-unknown parity, published replacement without stale-content exposure,
every unsupported method and Allow value, DELETE non-regression, private
canaries, response headers/cache, strict client parsing, response-size bounds,
submitted-output mismatch, and create-client non-regression. Existing owner
security, assisted journey, composer, and TASK-194 suites cover the adjacent
browser-owner and create behavior.

## Rendered local evidence

A disposable local Miniflare/D1 fixture served the pre-rebase production build
of the same TASK-195 source tree with only synthetic owner identity and content.
The subsequent rebase changed only the parent commit; the TASK-195 patch bytes
were unchanged, and final validation rebuilt those bytes on current develop.
At 390 pixels, a private draft was changed
to Link with title, body, and destination, reported `Private draft saved.`, and
reloaded with the exact persisted values while remaining Draft. A Published
Announcement retained its publication controls and reported `Public update
saved.` after its content changed.

A one-shot structured 422 retained all values, focused the Text control,
displayed its associated error, kept Save enabled, and succeeded after a
corrected retry. One-shot 500 and malformed-200 responses both retained the
open values, disabled Save, displayed the exact unknown-result warning, and
exposed `Reload saved update before retrying`. Synthetic non-owner and
missing-owner page requests rendered only the safe shared owner-access states,
with no edit form or update body.

The edit surface was also measured with maximum-length/unbroken content at
320, 390, and 1440 pixels: each had one main and one edit form, zero horizontal
overflow or off-screen controls, no private canary, and a minimum 44-pixel
interactive height. The focused Text control had a visible 3-pixel solid
outline. Forced colors, reduced motion, and coarse-pointer emulation were
active together with zero overflow and a 44-pixel Save control. The captured
browser console contained no warnings or errors. This local evidence made no
hosting, deployment, Site setting, external data, or network mutation.

## Validation and residuals

Migration drift is unchanged because TASK-195 adds no schema or migration.
Final candidate `0dc14217db9ddcb970ecb7f108fa45ba2cddd27c` rebased directly on
`fed6ee34269281fbe33680ba685c35cb9c76aac9` and passed the repository's full
validation (364/364), production audit (zero vulnerabilities), diff checks,
and independent Sol review with no P0/P1/P2 findings. The production Sites
identity-header ingress boundary remains the separately tracked TASK-190
uncertainty; this task neither strengthens nor claims it.
