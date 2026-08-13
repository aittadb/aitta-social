# TASK-194 private draft JSON acceptance

## Outcome

`POST /api/private/entries` is now the single normalized browser-owner draft
creation operation. Exact same-origin and current sole-owner authorization run
before Accept negotiation, media inspection, body streaming, validation, or
D1. The route accepts bounded `application/json` with an optional UTF-8 charset
and returns structured JSON with `Cache-Control: no-store` and `Vary: Accept`
for success and every application error.

Missing or unsupported media is `415`; malformed, invalid-UTF-8, or oversized
JSON is `400`; valid JSON that fails update validation is `422`; explicit JSON
refusal on `POST` is `406`; and unsupported methods are always `405` with
exactly `Allow: POST`, independent of `Accept`.
Authentication, authorization, storage, and unexpected failures use fixed safe
error documents without private details or exception text.

Success is `201` with one explicit `owner-entry` resource. Its attributes are
the four accepted update fields plus server-owned Draft state, null publication
time, stable identifier, and timestamps. Safe same-origin relative links
identify the private API resource and owner editor. Because the request has already verified the
browser owner, actions contain only the draft's current edit, publish, and
delete operations; each separate operation must still reauthorize. The response
does not contain a D1 row, profile or owner identity, protected configuration,
authentication headers, Hub state, or machine authority.

Draft creation requires neither a public profile nor canonical URL setup. It
does not query profile state before insertion and never uses request Host or
forwarding headers. The existing prepared repository operation still generates
the identifier/timestamps, forces Draft state and null publication time,
inserts, and rereads the record. No schema or migration changes.

## Client and privacy boundary

The new-draft composer validates the exact, canonically bounded `201` document before redirecting to
the stable owner edit route. An invalid 2xx document, any 5xx response, or a
network failure is unconfirmed and locks another submission behind the existing
saved-state recovery link. A redirect or malformed/wrong-shaped error is also
unconfirmed. Only an exact bounded structured 4xx error document is definitive;
bounded field messages map only to Kind, Title, Text, and Destination URL,
focus the first invalid control, and permit retry. Response bytes are bounded
while streamed, before allocation and parsing. The existing edit, state, and
delete clients and routes are unchanged.

Every created update remains private until the separate publication action.
Public home, human permalink, v1 detail, and v1 collection continue to make a
draft indistinguishable from an unknown identifier. This task adds no public or
machine discovery, credential, Hub behavior, hosting action, or external
mutation.

## Automated evidence

`tests/private-entry-create-json.test.mjs` covers the allowlisted success
document, request-host independence and profile/canonical-free creation, all four update
kinds, forced server fields, state-derived actions, Accept and Content-Type
matrices, bounded/malformed JSON, domain validation, authorization-before-body
and D1 with a direct compiled-route stream sentinel, exact methods and `Allow`
across excluded and malformed `Accept`, safe storage/runtime failures, canary
exclusion, public draft-unknown parity, and the client's bounded,
domain-validating confirmed/definitive/unconfirmed parser. Existing owner security, composer,
first-update, functional, upgrade, public API, and accessibility suites retain
the surrounding behavior.

## Rendered evidence

The private localhost fixture exercised the production build of exact commit
`af3666873ac9151bc3b57a312f321dce8c6c640d` with Worker SHA-256
`fd38f33d3db6297943ed109bb149313b3adea18078dec7bbba049f6520d727f4`
and CSS SHA-256
`b6ec59a7aa3a5c3089680b4b7bdb0744668623394dfaf1d7d0a7e2a9c4706827`.
The fixture supplied only the normal owner ingress context, used a fresh
migrated D1 with no profile or canonical URL, and made no external mutation.
Every referenced client JavaScript chunk returned `200` before the journeys.

- A normal browser submission saved the exact entered body, title, and
  destination URL, navigated to the stable owner editor, and showed those same
  values after a full reload. The browser console had no warning or error.
- A one-shot structured `422` retained the entered body, announced the fixed
  corrective status, rendered the allowlisted body error `Fixture rejected
  this text.`, moved native focus to the body control, and kept Save enabled.
  Correcting the body and retrying then navigated to the stable owner editor
  with the corrected body retained. The console remained clean.
- A one-shot structured `500` retained the entered body, announced the exact
  unknown-result warning, disabled Save, and exposed the native `Check saved
  updates before retrying` recovery link. The console remained clean.
- A one-shot malformed `201` document produced the same retained,
  unknown-result, disabled-submit, native-recovery state and a clean console;
  it was not accepted as proof of creation.
- At 320, 390, and 1440 CSS-pixel viewport widths, `scrollWidth` equalled
  `clientWidth` (305, 375, and 1425 pixels respectively), no interactive target
  extended horizontally offscreen, and every measured form or action target
  was at least 44 pixels high. At device scale factor 4 and a 320 CSS-pixel
  viewport, the same 305-pixel width equality, zero offscreen targets, and
  44-pixel minimum held.
- Forced-colors emulation retained the 305-pixel width equality and the focused
  native `/owner` anchor had a visible 3-pixel solid outline. Reduced-motion
  preference matched and every sampled rendered animation and transition
  duration was `0s`. Coarse-pointer touch emulation matched, retained the
  44-pixel target minimum, and had no horizontal overflow. The browser console
  had no warning or error throughout these observations.

Browser zoom at 400 percent, the remaining native keyboard/focus sequence, and
rendered private-canary checks remain unrecorded until directly observed.
