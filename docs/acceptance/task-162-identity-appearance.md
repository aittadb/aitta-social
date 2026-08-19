# TASK-162 — Identity appearance acceptance

## Scope and invariants

TASK-162 changes only the private Identity form's appearance composition. It
places the existing accent, density, attribution, and transient Identity preview
in one compact secondary block. It does not change the profile request, response,
authorization, validation, D1, public projection, protocol, or migration.

The complete existing profile payload remains mounted in the one form. The
accent control contains an exact valid stored preference, while only the preview
style passes through `resolvePresentationAccent`. An invalid historical value
instead displays the reviewed safe fallback and blocks saving until the owner
deliberately chooses a replacement, so an unrelated edit cannot rewrite it.
Density remains exactly
`comfortable` or `compact`, and the attribution checkbox continues to send the
existing `hidePoweredBy` boolean. No theme, arbitrary style input, new profile
field, runtime setting, browser storage, or automatic save exists.

## Owner behavior

- **Saved appearance** means the sample matches an existing profile loaded from
  this Aitta. Before the first save it instead says **Appearance not saved**.
- Changing any form value changes the sample to **Unsaved preview** and says the
  open choices remain temporary until Save Identity succeeds. Restoring every
  value exactly restores the loaded label unless the owner has deliberately
  selected a replacement for a malformed historical accent; that replacement
  remains unsaved even when it equals the displayed fallback.
- The sample visibly reports comfortable or compact update spacing and visible
  or hidden attribution. Hidden attribution removes the sample attribution but
  retains the explicit `Attribution · Hidden` explanation.
- A successful save reloads the server-owned Identity route. A rejected fetch
  or 5xx result retains the unsaved sample, disables another save, and exposes
  the existing reload-before-retry path.
- A valid low-contrast stored accent is adjusted only for rendering. An invalid
  historical value falls back safely in both the native control and preview,
  retains its server-saved value on load/reload, and requires an explicit
  replacement before the complete form may save.

## Automated evidence

`tests/identity-appearance.test.mjs` proves both density and attribution values,
the stored-versus-derived accent distinction, the invalid historical fallback,
saved/unsaved/new copy, exact-value restoration logic, reload and recovery
contracts, denial-before-D1, private-canary exclusion, compact responsive CSS,
44/48-pixel controls, reduced-motion and forced-color rules, and the absence of
free-form theme or browser-storage behavior. The established Identity,
accessibility, assisted-runtime, and accent suites continue to prove the exact
payload, save/reload behavior, D1/protocol preservation, validation, public
rendering, and shared contrast resolver.

Focused validation passed 58/58 tests against the compiled Worker, including a
real migrated D1 reopen with a malformed historical accent. The migration
decision is no schema change.

## Disposable compiled-Worker browser evidence

On 2026-08-13, the in-app Browser exercised the compiled production Worker
through a loopback-only proxy and disposable, freshly migrated D1 fixtures. It
did not read active hosting configuration or contact a Site.

In the table, `x = y` means the document's CSS-pixel `clientWidth` equalled its
`scrollWidth`. Every configured row exposed 21 effective interactive targets
with a minimum height of 44 pixels; denial rows exposed only three safe native
destinations, also at least 44 pixels. No row exposed a private canary or an
off-screen interactive target.

| State | 320 CSS pixels | 390 CSS pixels | 1440 CSS pixels |
| --- | --- | --- | --- |
| Saved comfortable, visible attribution, safe `#31554d` | `305 = 305`; preview 277px wide; saved label; derived `#31554d` | `375 = 375`; preview 347px wide; saved label | `1425 = 1425`; preview 655.20px wide; saved label |
| Saved compact, hidden attribution, raw white accent | `305 = 305`; compact/hidden; derived `#55736c`; attribution absent | `375 = 375`; compact/hidden; derived `#55736c`; attribution absent | `1425 = 1425`; compact/hidden; derived `#55736c`; attribution absent |
| New Identity | `305 = 305`; `Appearance not saved` | `375 = 375`; `Appearance not saved` | `1425 = 1425`; `Appearance not saved` |
| Invalid historical accent | `305 = 305`; derived `#31554d`; no hostile style | `375 = 375`; derived `#31554d`; no hostile style | `1425 = 1425`; derived `#31554d`; no hostile style |
| Different signed-in user | `320 = 320`; no form/preview/canary | `390 = 390`; no form/preview/canary | `1440 = 1440`; no form/preview/canary |
| Missing owner configuration | `320 = 320`; no form/preview/canary | `390 = 390`; no form/preview/canary | `1440 = 1440`; no form/preview/canary |

At 390 pixels, selecting compact spacing and hidden attribution immediately
produced **Unsaved preview**, `Spacing · Compact`, and `Attribution · Hidden`
without persistence. Restoring both controls exactly returned **Saved
appearance**. A real save reloaded to the same compact/hidden saved state, and a
second reload retained it. A separate synthetic 500 retained the unsaved state,
disabled Save Identity, exposed the reload link, and reloaded back to the
original comfortable/visible saved state. The focused native accent control had
a 3-pixel solid outline with a 3-pixel offset. Browser warning/error logs were
empty throughout these returned observations.

The integration owner then ran four separate bounded observations against the
same retained exact compiled fixture at application/test candidate
`392bc36d67f68b750cf0a153f9ab4b73de6732b2`; the later evidence-only amendment
does not change those runtime or test bytes:

- a physical 1280-by-900 viewport with DPR 4 produced a 320-CSS-pixel inner
  width and `305 = 305`, with no horizontal or off-screen control and no
  effective target below 44 pixels;
- forced colors matched, the preview used the system border and background
  (`rgb(255, 255, 255)` and `rgb(0, 0, 0)` in that browser palette), and the
  keyboard-focused `#profile-accentColor` retained a solid 3-pixel system focus
  outline (`rgba(0, 230, 255, 0.8)`) with no private canary;
- reduced motion matched, the root scroll behavior was `auto`, and no element
  retained a nonzero transition or animation duration; and
- touch emulation made both `pointer: coarse` and `any-pointer: coarse` match,
  with no overflow, horizontal control, or effective target below 44 pixels.

Browser warning/error logs were empty for all four returned observations.

An independent review then found that the malformed historical value could be
coerced by a hydrated native color control and later included in an unrelated
save. Candidate `e41a933d40c2b25e00a8518af3ce228f836716eb` corrected that boundary
without changing the established CSS or valid-profile markup. The integration
owner re-ran the exact corrected compiled fixture in the supported browser and
observed:

- the invalid fixture loaded `#profile-accentColor` as the safe `#31554d`
  fallback with `aria-invalid="true"`, while the preview's `--accent` also
  remained `#31554d`;
- editing Display name produced **Unsaved preview** without changing the
  preview accent, and restoring the exact original name returned **Saved
  appearance** with no unsaved message;
- editing the name and selecting Save Identity did not navigate, focused the
  accent control, retained `aria-invalid="true"`, and announced exactly
  “Identity was not saved. Choose a replacement for the historical accent and
  try again.”; and
- reload reproduced the safe fallback, invalid state, historical-value help,
  saved label, and clean console. Browser warning/error logs were empty.

The disposable fixture's separately queried read-only evidence endpoint then
returned `{"accentStillHistorical":true,"invalidMutationRequests":0}`. This
confirms that the blocked browser action sent no profile mutation and the raw
historical fixture value remained in its disposable D1 database. The browser
client itself blocked navigation to the double-underscore evidence path, so
that response was obtained independently over loopback rather than described as
an in-browser observation.

Final application/test candidate
`178b5ee421347722e6bed7f90423ce97d54d0948` then made deliberate replacement
intent permanent for that open form, closing the review edge case where the
owner selected another color and returned to the displayed fallback. Against
that exact compiled fixture, the integration owner observed the initial
`#31554d`, `aria-invalid="true"`, **Saved appearance**, historical-replacement
help, and `#31554d` preview. After selecting `#123456` and returning to
`#31554d`, the control cleared `aria-invalid`, showed the normal saved-choice
help, and remained **Unsaved preview** with Save enabled and the preview still
`#31554d`. Saving the disposable fixture completed one local navigation to
`/owner/profile`, then showed the valid saved `#31554d` preference with **Saved
appearance** and no unsaved status. Browser warning/error logs were empty.

The same read-only loopback evidence endpoint returned
`{"accentStillHistorical":false,"invalidMutationRequests":1}` after that
deliberate save, proving the disposable historical value was replaced by
exactly one profile request. As above, the response was queried independently
because the browser client blocks the double-underscore path.

No hosted data, Site, deployment, setting, access, DNS, domain, Hub, sibling,
`main`, or production state changed.
