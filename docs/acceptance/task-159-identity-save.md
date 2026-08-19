# TASK-159 Identity save acceptance

TASK-159 makes saving required Identity the primary task at `/owner/profile`.
It does not change the profile API, route, repository, D1 schema, migration,
runtime configuration, public projection, authorization, same-origin policy,
hosting binding, or external state.

## Product outcome

- `Server-saved readiness` is rendered from the authorized server read. A
  separate saved/unsaved strip compares every current control with its exact
  loaded baseline and explicitly says that local edits do not change readiness.
  Reverting all required, optional, presentation, and checkbox values clears
  the unsaved state.
- Display name, short description, canonical URL fallback, and longer
  introduction form the first bounded fieldset. The existing preview, location,
  website, external links, accent, density, and attribution controls remain
  present afterward with the same submitted values.
- Canonical copy distinguishes a protected runtime URL from the saved D1
  fallback without serializing a raw protected value. An invalid stored value
  remains excluded from the default and payload. If the effective runtime URL
  is substituted into that field, the view says it is a prefill and that saving
  replaces the invalid D1 fallback; it does not call the value saved. If no
  valid runtime substitution exists, a nonempty invalid field stays empty and
  the view says the invalid saved fallback was omitted; the form is styled as
  loaded with an omission, not as an exact saved-value match. This includes a
  whitespace-only stored value. Only an exactly empty saved fallback remains
  an exact empty saved baseline.
- Native client constraints stop an invalid request. Recognized definitive 4xx
  details become field-associated errors and focus the first affected control.
  A network rejection or 5xx result disables another save and requires the
  owner to reload saved Identity before any retry.
- There is no automatic save, retry, timer, beacon, browser storage, generic
  form framework, new field, or account-type input. The server remains the only
  readiness and persistence authority.

## Contract and privacy evidence

The focused tests cover fresh, incomplete, complete, runtime-canonical,
stored-canonical, invalid-runtime, invalid-stored, successful-save, invalid
write, owner denial, missing-owner, same-origin, private-canary, and
authenticated-name-canary states. Source contracts pin the primary field order,
exact all-control baseline comparison, revert-to-clean behavior,
saved-versus-unsaved language, runtime-substitution truth, transient local
count, invalid and whitespace-only stored omission and private-canary secrecy,
native validation, field-associated errors, first-error focus,
ambiguous-result lock, explicit reload path, full profile payload, absence of
`accountType`, and absence of automatic retry or browser storage.

The profile mutation continues to submit exactly display name, short
description, introduction, optional location, optional website, parsed external
links, canonical fallback, accent, density, and attribution choice. Existing
repository tests prove a new profile receives the server-owned compatibility
value `other`, an existing legacy `accountType` survives an edit, and public
protocol allowlists remain unchanged.

## Responsive and accessibility evidence

The primary fieldset, readiness panel, saved/unsaved strip, preview, secondary
fields, and action row use the existing semantic paper, ink, line, focus,
field, action, and 44-pixel-control vocabulary. The new strip becomes one
column at the existing 640-pixel breakpoint, and the primary fieldset uses
bounded phone padding. Existing controls retain their 48-pixel minimum height,
mobile single-column grids, full-width phone actions, three-pixel focus ring,
reduced-motion override, forced-color ownership, long-value wrapping, and
no-gradient boundary.

The final rendered review used exact source commit `eb6b906` and its compiled
production Worker, separate freshly migrated local D1 databases, and a
test-only synthetic-auth proxy bound only to `127.0.0.1`. It read no active
hosting configuration and changed no hosted state. The fixture covered fresh,
incomplete, complete with runtime or stored canonical authority, invalid
runtime with valid stored fallback, invalid stored fallback with the safe
runtime substitution, and a long/unbroken/translated complete profile with
eight links, compact density, raw white accent, and hidden attribution.

A follow-up rendered review used exact application source commit
`06f3759`, its compiled production Worker, fresh local D1 data, and the same
loopback-only synthetic-auth boundary. It covered both a nonblank invalid saved
fallback with no valid runtime substitution and a genuinely empty saved
fallback at 320 by 900, 390 by 900, and 1440 by 900 CSS pixels: six rows total.
Both states rendered the Identity h1, reached browser `readyState` `complete`,
had an empty canonical input, logged zero console errors, and exposed no exact
synthetic canary. The invalid row said
`Saved profile loaded without its invalid URL`, explained the
omission and replacement consequence, and contained no false exact-match copy.
The empty row said `Saved values loaded` and that the form matched its loaded
values, with no invalid-value wording.

Across those six rows, document client/scroll widths were 305/305 at 320,
375/375 at 390, and 1,425/1,425 at 1,440. Each had zero horizontal overflow,
zero off-screen controls, and zero effective targets below 44 pixels; the
minimum effective target was 48.34 by 44 pixels. Both readiness panels said
`Identity needs a valid public URL`. Two stylesheets loaded, and `.button`
retained its 44-pixel minimum height.

All 21 state-and-width rows completed at requested 320 by 900, 390 by 900, and
1440 by 900 CSS pixels. Each form stayed within the viewport with equal
document client and scroll widths, zero horizontal overflow, no off-screen
control, the Identity h1 before the Required Identity fieldset, and no
synthetic private canary. At 320 pixels the scrollbar left a 305-pixel document
and a 277-pixel form. The corrected long row measured 305/305 client/scroll
width at 320 pixels and remained contained at every width. Every effective
interactive target except the raw native checkbox measured at least 48.34 by
44 pixels. The 20-by-20 checkbox remained inside its associated 277-by-49.59
click label, so it was not a touch-target defect.

Changing the loaded display name produced `Unsaved changes`; restoring its
exact original value restored `Saved values loaded`. The forced 400 response
announced `Identity was not saved. Correct the highlighted fields and try
again.`, associated errors with short description and canonical URL, moved
focus to canonical URL, and kept Save enabled. Both the forced 503 and closed
transport announced the exact unconfirmed-result message, exposed the
`/owner/profile` reload link, disabled Save, made no automatic retry, and
logged no browser error.

Six additional denial rows covered a signed-in non-owner and an invalid owner
setting at all three widths. Each had one main landmark, no overflow or
off-screen content, a 97.9-by-44-pixel-or-larger effective target, and none of
the exact synthetic D1, identity, or setting canaries. Those Workers contained
a seeded canary database but deliberately had no application `DB` binding, so
their rendered 200 denial responses also prove authorization completed before
an application D1 read.

At DPR 4, the long row reported a 320-pixel CSS viewport, 305/305 document
client/scroll widths, 1,280 physical pixels, visual scale 1, no overflow or
off-screen content, a 48.34-by-44-pixel minimum non-checkbox target, and the
277-by-49.59 checkbox label. This is 400-percent-reflow-equivalent evidence,
not a claim of literal browser zoom. With reduced motion requested, the media
query matched, root scrolling was `auto`, and no element or pseudo-element had
a nonzero animation or transition declaration; `document.getAnimations` was
unavailable. With forced colors active, the media query matched,
`forced-color-adjust` remained `auto`, controls retained solid one-pixel
boundaries, and the focused skip link used a system Highlight solid three-pixel
outline with a three-pixel offset. Both modes retained zero overflow.

In normal colors, native ArrowRight interaction left Display name in
`:focus-visible` with its three-pixel `#18201e` outline and three-pixel offset;
hit-testing and viewport containment passed. The in-app controller's locator
Tab command did not advance from Display name, so this record makes no
sequential-Tab claim. With coarse pointer emulation, `pointer` and
`any-pointer` were coarse, hover was none, the 320-pixel viewport retained
320/320 client/scroll width, all effective targets were at least 48.34 by 44
pixels, and no target was off-screen. Browser warning and error arrays were
empty across the configured matrix, failure states, and denials. Both fixture
sets and their temporary persisted data were stopped and removed afterward.

## Validation evidence

The final source passed all 49 focused Identity, accessibility,
assisted-runtime, and presentation-accent tests, including the persisted-D1
accent reopen case. After the complete task was rebased onto current
`origin/develop` commit `65d2df9`, the pre-existing rendered rows remained on
the exact `eb6b906` production source described above. The distinct
invalid-stored-without-valid-runtime omission state and exact-empty
classification were additionally rendered from exact application source
`06f3759` as described above. The final whitespace-only discriminator takes the
same already-rendered invalid-omission branch, copy, and layout; a direct
server-render regression covers its empty field, omitted raw value, state, and
private-canary boundary without claiming an additional browser row. The
intervening TASK-168 and TASK-169 application, test, and documentation files
remained their unmodified integration source.

On the rebased source, `npm run db:generate` reported no schema change, the full
`npm run validate` gate passed all 201 tests, `npm audit --omit=dev` reported
zero vulnerabilities, and diff checks were clean. No Site, hosted D1, setting,
access policy, DNS record, domain, Hub, sibling repository, `develop`, or
`main` state changed.
