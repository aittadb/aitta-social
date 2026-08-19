# TASK-161 — Optional public Identity details acceptance

## Scope and evidence boundary

This task changes only the private Identity form composition for location,
website, and external links. It does not change the profile API, D1 schema,
authorization, public route composition, or protocol fields.

## Expected owner behavior

- The four required Identity fields remain the first save task.
- One labelled native disclosure, **Optional public details**, contains
  location, website, and external links. Its summary reports the current
  category count, from `0 of 3 added` through `3 of 3 added`.
- The section starts open when stored location, website, or external links are
  present. It remains mounted while closed, so opening it never reconstructs
  typed values or changes the submitted `FormData`.
- An invalid optional website opens the disclosure before native browser
  validation is reported: the form's capture-phase native invalid handler and
  an imperative `details.open = true` update both run before `reportValidity()`
  can focus the control. A definitive field-specific server error for one of
  the three fields also opens it and focuses the normal first invalid field.
- Location, website, and all eight allowed labelled external links retain their
  existing labels, payload encoding, validation, save/reload behavior, and
  public projection.

## Automated evidence

`tests/identity-journey.test.mjs` statically verifies the labelled native
disclosure, mounted field ownership, count, stored-value default-open rule,
native/server-error reopen paths, the synchronous imperative-open-before-
`reportValidity()` ordering, capture-phase native-invalid recovery, 44-pixel
summary target, visible native marker, long-text wrapping, and the shared
responsive/motion/focus contracts. The established identity and runtime journey
tests continue to cover accepted optional-field payloads, eight-link validation,
saved values, authorization denial, and public/private projection boundaries.

## Local rendered review

On 2026-08-13, a Browser-controller review used an exact compiled Worker
through a loopback-only fixture proxy, documented fixture identities, and
disposable local D1 states. The TASK-161 application-and-test patch is
byte-equivalent to candidate `639122e` (SHA-256
`87f66bfa5c3c46f8fa8bdf626a1311652c45d439a0b0d98601a978d2f1b5e7ab`; stable
patch ID `d4d435d0915b05a413f6ffa50b3ac8b65563d7b4`), so these observations
apply to that runtime and test surface. This review did not contact a Site or
change hosted state.

In the table, `x = y` means `clientWidth = scrollWidth` in CSS pixels.

| State | 320 CSS pixels | 390 CSS pixels | 1440 CSS pixels |
| --- | --- | --- | --- |
| Absent optional details | Closed, `0 of 3 added`; `305 = 305`; summary `277 × 74.45` | Closed, `0 of 3 added`; `375 = 375`; summary `347 × 48.42` | Closed, `0 of 3 added`; `1425 = 1425`; summary `960 × 48.42` |
| One detail | Open, `1 of 3 added`, `Helsinki`; `305 = 305`; summary `277 × 74.45` | Open, `1 of 3 added`, `Helsinki`; `375 = 375`; summary `347 × 48.42` | Open, `1 of 3 added`, `Helsinki`; `1425 = 1425`; summary `960 × 48.42` |
| Eight links | Open, `1 of 3 added`, exactly eight nonempty lines; `305 = 305`; summary `277 × 74.45` | Open, `1 of 3 added`, exactly eight nonempty lines; `375 = 375`; summary `347 × 48.42` | Open, `1 of 3 added`, exactly eight nonempty lines; `1425 = 1425`; summary `960 × 48.42` |
| Long/unbroken details | Open, `3 of 3 added`; `305 = 305`; summary `277 × 74.45` | Open, `3 of 3 added`; `375 = 375`; summary `347 × 48.42` | Open, `3 of 3 added`; `1425 = 1425`; summary `960 × 48.42` |
| Closed disclosure with invalid website | Opens; active `profile-website`; visible `277 × 49.83`; native message `Please enter a URL`; `305 = 305` | Opens; active `profile-website`; visible `347 × 49.83`; native message `Please enter a URL`; `375 = 375` | Opens; active `profile-website`; visible `470 × 49.83`; native message `Please enter a URL`; `1425 = 1425` |
| Non-owner and missing-owner | No form or disclosure; `320 = 320` | No form or disclosure; `390 = 390` | No form or disclosure; `1440 = 1440` |

Every table cell had no horizontal overflow, offscreen target, effective target
below 44 pixels, or private-canary exposure; browser console warnings and
errors were both empty arrays. A real mutable save and reload at 390 CSS pixels
preserved `Helsinki`, normalized `https://example.test/`, and one external
link; it reopened the disclosure as `3 of 3 added`, with `375 = 375`, a
44-pixel minimum effective target, and no overflow, offscreen target, or
private canary. A DPR-4, 320-CSS-pixel review had `305 = 305` and effective
targets of at least 44 pixels. Reduced motion matched, root scroll behavior was
`auto`, and the summary transition duration was zero. Forced colors matched; a
focused summary retained a 3-pixel solid outline with a 3-pixel offset.
Coarse-touch media queries matched both `pointer` and `any-pointer`, with
effective targets of at least 44 pixels.

The Browser controller can inspect focus state but cannot prove a sequential
hardware-Tab traversal. Native focus targets, visible focus styling, and the
remaining keyboard interaction contract therefore continue to have focused
automated coverage. This record deliberately makes no hosted or external-state
claim.

## Dependency-audit provenance

Dependencies are unchanged since the earlier successful `npm audit --omit=dev`
audit. A fresh audit lookup was unavailable in the root environment because DNS
could not resolve the npm advisory endpoint; this evidence-only amendment makes
no claim of a newer audit result.
