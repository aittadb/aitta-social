# TASK-176 technical-information acceptance

## Outcome

`/technical` is a public, D1-independent HTML guide to the existing
AittaSocial protocol 1.0 discovery manifest, public profile, and
published-update collection. It explains each resource in plain language and
links directly to `/.well-known/aitta-social.json`, `/api/v1/site`, and
`/api/v1/entries`. It contains no JSON dump, runtime-derived identity, owner
value, profile value, private update, or Hub state.

The page uses fixed `Independent Aitta` framing and neutral `noindex, nofollow`
metadata with no canonical or sharing URL. Handler-produced HTML remains
`no-store, must-revalidate` under the fixed application CSP. The common public
footer now makes Technical a native `/technical` link and labels the exact
three machine destinations Manifest, Profile, and Updates. Privacy and the
official GitHub source remain permanent; only the existing powered-by
attribution remains owner-hideable.

No public JSON handler, payload, status, error, field, route, canonical-link
construction, cache duration, D1 query, authorization decision, schema,
migration, runtime setting, or external state changed.

## Focused automated evidence

- `tests/technical-page.test.mjs` proves that a throwing D1 binding and hostile
  request/runtime values cannot affect the `200` technical page, the page has
  neutral metadata and the fixed CSP/cache boundary, its content and resource
  hierarchy are truthful, its exact machine paths are present, no raw JSON or
  private canary appears, both powered-by states retain Technical/Privacy/GitHub
  and the concise resource labels, and shared information-page/footer links
  preserve 44-pixel, wrapping, focus, and reduced-motion source contracts.
- The existing privacy, public hierarchy, and protocol suites continue to
  exercise the shared footer, explicit public projections, exact protocol 1.0
  routes and envelopes, canonical construction, JSON cache behavior, published
  filtering, and draft/unknown privacy boundaries.

The focused build and technical, privacy, hierarchy, and protocol suites pass
with 32 tests and zero failures.

## Rendered evidence

The built local Worker was inspected in the in-app browser at `320×568`,
`390×844`, and `1440×900`. At each width the document stayed within its layout
viewport, the h1 and centered information column remained inside their
gutters, and every measured resource/footer link was at least 44 CSS pixels in
each required dimension. At 1440 pixels the information column remained 732
CSS pixels wide. The semantic snapshot exposed the skip link, one main
landmark, one h1, four labeled h2 regions, native resource links, the return
action, Privacy, Technical, GitHub, and the three concise resource links in
logical source order.

A separate bounded 400-percent-reflow-equivalence row used an in-app Chromium
viewport requested at `320×900` CSS pixels with device scale factor 4. It
reported `innerWidth=320`, `devicePixelRatio=4`, a 1280-physical-pixel width,
and `visualViewport.scale=1`; this is explicit 1280-physical/320-CSS reflow
equivalence, not literal browser zoom. The document and body had equal
305-pixel client and scroll widths after the 15-pixel browser scrollbar, with
no horizontal overflow, offscreen target, or target smaller than 44-by-44 CSS
pixels. The 305-by-61-pixel header kept both links on one row, the h1 and all
four h2/resource regions stayed contained, and the footer wrapped within the
305-pixel content width.

The enlarged row reached `readyState=complete`, contained the corrected public
protocol/profile/published-update copy, retained the skip-link, one-main, h1,
four-h2, native-resource, and footer order, and produced zero warning or error
console entries. Native sequential Tab synthesis remained unsupported and the
body stayed active, so this record does not claim observed Tab traversal;
keyboard focus and reduced-motion behavior remain covered by the focused
source contracts. The device metrics and viewport were reset and the task tab
was finalized. No hosted Site was read or changed.

## Validation and review

The final handoff records the rebased commit, full repository validation,
migration-drift check, production audit, clean-source check, focused diff, and
independent review result. No hosted Site, database, protected setting, Hub,
domain, access policy, sibling repository, or other external state is read or
changed by this task.
