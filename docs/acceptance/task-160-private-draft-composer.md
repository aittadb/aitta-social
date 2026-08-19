# TASK-160 private-draft composer acceptance

TASK-160 makes creating and editing an update a compact, body-first owner
journey. It does not change an API route or payload, entry model, publication
state transition, authorization decision, same-origin check, D1 query, schema,
migration, public projection, protocol 1.0 resource, runtime setting, or hosted
state.

## Product outcome

- Update text is the first and largest control. The existing kind, optional
  title, and optional destination follow without adding kind-specific dynamic
  behavior owned by TASK-163.
- A concise status panel identifies a new private draft, an existing private
  draft, or an existing public update. It says exactly what saving does and
  never presents saving as publication.
- The composer has one save action: `Save private draft` for a new or existing
  draft and `Save update` for an already public update. Publishing,
  unpublishing, and deleting remain the separate existing actions outside this
  form. The return path is the native `Back to this Aitta` link.
- All four stored kinds and every accepted title, body, and destination value
  use the unchanged create or edit request. Successful creation retains the
  server-created stable identifier and navigates to the existing encoded edit
  route; successful edit retains its current draft or published state.
- The editor is bounded to 760 CSS pixels on larger screens. At the existing
  phone breakpoint, the secondary two-column fields become one column, action
  links become full-width, field padding tightens, and the text area remains a
  useful 190 CSS pixels tall. Long values, status copy, and error copy wrap.

## Validation, recovery, and privacy

Native required and URL checks run before a request. A definitive 4xx response
keeps current values in the form, maps only nonblank recognized `body`, `title`,
`entryKind`, and `destinationUrl` detail strings of at most 240 characters to
the corresponding control using `aria-invalid` and `aria-describedby`, announces
that no save occurred, moves focus to the first affected control, and permits a
corrected retry. Unknown fields and malformed, blank, or oversized error bodies
produce bounded fixed fallback copy.

A rejected fetch or 5xx response is an unconfirmed result. The form preserves
its open values, disables save, performs no retry, and exposes either `Check
saved updates before retrying` for a new POST or `Reload saved update before
retrying` for an edit. The owner must load D1-backed state before another
request because the first request may have committed. The composer uses no
timer, automatic or background save, beacon, browser storage, generic editor
framework, or publication side effect.

Focused route tests prove owner denial and same-origin enforcement before D1
mutation, body and link validation without mutation, all-kind create and edit
value preservation, and a draft private canary absent from public home,
permalink, detail JSON, and collection JSON. Existing security and journey
suites continue to cover missing owner configuration, public draft/unknown
parity, entry state changes, and independent mutation authorization.

## Responsive and accessibility evidence

The form retains native labels, fieldset and legend semantics, one live status
region, the repository's visible three-pixel focus ring, 48-pixel fields,
44-pixel actions, reduced-motion override, forced-color ownership, and native
route anchors. Source and rendered-server tests pin text-before-kind order,
single-column phone behavior, long/unbroken wrapping, unambiguous save labels,
field-associated errors, first-error focus, ambiguous-result lock, and absence
of automatic retry or client storage.

The final local rendered review used a Vinext development preview from the
exact task application and test source, including the bounded error-display
correction recorded here. Separate repository validation built the same final
tree; this browser evidence does not claim that interaction ran in the
production Worker. It used only an ignored `.env.local` synthetic owner fixture
and a disposable local D1 with synthetic new, draft, published, and
long/unbroken entries. No active hosting binding, Site, hosted D1, external
identity, or production data was read or changed.

At `320×900`, `390×900`, and `1440×900` CSS pixels, all twelve new/draft/
published/long rows reached `readyState=complete`, had one logical h1, body
before kind/title/destination in the form, equal document client and scroll
widths (305/305, 375/375, and 1425/1425 after the browser scrollbar), zero
horizontal or offscreen interactive overflow, and a 48.34-by-44-pixel minimum
visible non-skip target. The phone composer was 277 pixels wide at 320 and
347 pixels wide at 390; the large layout remained bounded to 760 pixels. The
text area stayed 277 CSS pixels tall in the reviewed browser because its ten
rows exceeded the 190/220-pixel minimum. Long title, body, and destination
values remained in their native fields without document overflow. New and
draft rows used `Save private draft`; published rows used `Save update`.

The browser created one local-only draft through the unchanged POST route and
navigated to its server-created encoded edit URL without a console warning or
error. It then verified kind switching in the new form: text, title, and
destination values remained unchanged through Link then Announcement. A
synthetic 400 response associated its short body message with `entry-body`,
set `aria-invalid`, focused that field, kept the value and Save enabled, and
announced the definitive retry path. A synthetic oversized/blank details body
instead rendered no field error, no invalid state, and only the bounded fixed
fallback. Synthetic 503 and rejected-fetch paths each preserved the body,
disabled Save, made no retry, and exposed the native `/owner` `Check saved
updates before retrying` route.

At DPR 4 the long row reported a 320 CSS-pixel viewport, 1280 physical pixels,
visual scale 1, and 305/305 client/scroll width with no overflow or offscreen
control; this is 400-percent-reflow-equivalence evidence, not literal browser
zoom. Under reduced motion, the media query matched, root scroll behavior was
`auto`, and no element or pseudo-element had nonzero animation or transition
duration. Under forced colors, the query matched, `forced-color-adjust` stayed
`auto`, the active text field had a solid three-pixel system-color outline with
a three-pixel offset, all controls remained visible, and no overflow appeared.
Under coarse-pointer emulation, pointer/any-pointer were coarse, hover was
none, every visible target stayed at least 48.34-by-44 pixels, and no target
crossed the viewport. A direct body-field focus check found `:focus-visible`,
the standard solid three-pixel outline/offset, in-viewport geometry, and a
matching center hit-test. The browser controller did not advance focus when it
sent Tab, so this record makes no observed sequential-Tab claim; native source
order, labels, and focus contracts remain covered by focused tests.

Separate local runs with a synthetic non-owner and then an omitted owner
setting covered all three widths. Each produced the safe denial or disabled
administration page, no editor fields, 44-pixel-or-larger actions, equal
client/scroll widths, zero overflow, and no synthetic draft, owner-email, or
runtime canary. A signed-out local request returned the exact existing
`307 Location: /signin-with-chatgpt?return_to=%2Fowner%2Fentries%2Fnew`.
Browser warning and error logs were empty across the owner matrix, validation,
failure, media, and denial checks. The temporary server, local D1 state, and
browser overrides were stopped or reset after review.

## Validation and review

Focused composer, accessibility, and assisted-runtime tests passed 34/34 after
the error-bound correction. The original exact feature candidate passed
`npm run validate` with 211 tests, `npm run db:generate` with no schema drift,
and `npm audit --omit=dev` with zero vulnerabilities; the correction is three
task-owned files only and will receive the same full final gate after rebasing.
Independent Sol review found no P0 issue and identified the rendered-evidence
and bounded-error corrections now recorded above. No Site, hosted D1, access
policy, protected setting, DNS record, domain, Hub, sibling repository,
`develop`, or `main` state is changed by this task.
