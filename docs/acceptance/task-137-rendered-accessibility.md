# TASK-137 rendered presence-first accessibility acceptance

Status: **pass.** The final production-equivalent local candidate passes the
public, permalink, and owner rendered matrix. No assertion is accepted merely
because a defect was recorded: the two narrow empty-heading failures found on
the earlier candidate were corrected by TASK-153, and every row below was run
again from fresh state after that correction.

This proof packages or deploys nothing. It does not read the ignored active
hosting binding, mutate hosted or production data, change a protected setting,
access level, DNS record, or custom domain, or contact a Hub.

## Exact candidate and fixture

- Source: pushed `origin/develop` commit
  `e13bc26091d0e70b42d1793c56edd7a46a4085ad`.
- Runtime: the `vinext build` output in `dist/server`, executed through
  Miniflare with the packaged `DB` binding and real persisted disposable D1
  databases.
- D1 states: all current migrations on an empty database, and the frozen POC
  fixture after its historical migration and before any later migration.
- Fixture isolation: four HTTP servers bound only to `127.0.0.1`; the proof
  worktree contained no `.openai/hosting.json`.
- Browser: Chrome 151 on macOS through the supported in-app and connected
  Chrome controls. The route matrix and media checks used fresh tabs and reset
  every viewport, media, pointer, and zoom override afterward.

| Reviewed input | SHA-256 |
| --- | --- |
| `drizzle/0000_closed_talos.sql` | `95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a` |
| `tests/fixtures/poc-upgrade-v0.sql` | `bde6241fd75d84b729a0b84401ffe671df2e505fc7f42c6e23e7d4fbd5755ac9` |

## Wide and narrow route matrix

Eleven states were measured twice: requested 1280-pixel width and actual
320-pixel width. The in-app browser provided 720 CSS pixels of height for the
wide rows despite the 900-pixel height request; every full document remained
measurable through its scroll extent. At 320 by 900, pages with a vertical
scrollbar had a 305-pixel client width and short pages retained 320 pixels.

| Route and state | Wide result | 320-pixel result |
| --- | --- | --- |
| Fresh public home | 9 targets; 1265/1265 client/scroll width; h1 57.6, h2 51.2, empty h3 32px | 9 targets; 305/305; h1 40, h2 32, empty h3 **26.4px** |
| Configured public home | 12 targets; 1265/1265; h1 64, h2 51.2, card h3 38.4px | 12 targets; 305/305; h1 40, h2 32, card h3 27.2px |
| Published permalink | 6 targets; 1265/1265; h1 64px | 6 targets; 320/320; h1 40px |
| Private-draft public permalink | Generic 404; 2 targets; 1280/1280; h1 51.2px | Same generic 404; 2 targets; 320/320; h1 36px |
| Configured owner home | 20 targets; 1265/1265; h1 44.8, h2 38.4/32, h3 22.4px | 20 targets; 305/305; h1 36, h2 28.8/28, h3 22.4px |
| Configured owner Identity | 20 targets; 1265/1265; 981 by 44px checkbox label | 20 targets; 305/305; 277 by 49.59px checkbox label |
| New-update editor | 13 targets; 1265/1265; labelled form | 13 targets; 305/305; 277px fields |
| Private-draft editor | 16 targets; 1265/1265; labelled form | 16 targets; 305/305; 277px fields |
| Published-update editor | 17 targets; 1265/1265; labelled form | 17 targets; 305/305; 277px fields |
| Fresh owner home | 9 targets; 1265/1265; h1 44.8, h2 38.4/32, empty h3 25.6px | 9 targets; 305/305; h1 36, Updates h2 **28px**, empty h3 **24px** |
| Fresh owner Identity | 20 targets; 1265/1265; 981 by 44px checkbox label | 20 targets; 305/305; 277 by 49.59px checkbox label |

Across all 22 rows, the 288 effective click targets ranged from 44.13 to 981
pixels wide and from 44 to 455.16 pixels high. No effective target was smaller
than 44 by 44 pixels, and no control was clipped or horizontally off-screen.
The native checkbox glyph is 20 by 20 pixels, but its complete associated label
is the click target reported above. Every row had zero horizontal overflow.
The skip link is deliberately translated above the viewport only before focus;
its focused state is covered below.

Every document had exactly one `main`. Every rendered navigation, region, and
form that requires a name retained one, including the public actions and
technical-resource navigation, owner navigation, Identity form, and new/edit
update forms. Form controls retained their programmatic labels. Heading levels
and visual sizes stayed ordered. In particular, the corrected fresh public
empty h3 is 26.4px below its 32px Updates h2 at 320px, and the fresh owner
empty h3 is 24px below its 28px Updates h2.

## Reflow, keyboard, focus, touch, and media

The 400-percent reflow condition is 1280 / 4 = 320 CSS pixels. It was proved in
two independent ways:

1. the complete 11-route actual-320 matrix above; and
2. a separate Chromium physical-1280/DPR-4 emulation on configured public,
   published permalink, owner home, and owner Identity, which produced a
   320-pixel CSS viewport (305-pixel client width with a scrollbar) and zero
   overflow, off-screen controls, undersized targets, missing names, or
   text/control contrast failures.

The supported browser controllers expose no page-zoom capability. Actual
Meta/Cmd zoom-shortcut attempts in both the in-app browser and connected Chrome
were no-ops: observable page zoom remained 1, so this record does not relabel
those attempts as literal browser zoom. The independent 320-pixel and
physical-1280-to-CSS-320 measurements are the accepted reflow-equivalent
evidence required by the task.

Connected Chrome supplied a working native keyboard path where the in-app
browser's synthetic key backend did not. On the configured public home,
`Read update` was the native focused `<a>` and `locator.press("Enter")`
navigated from `/` to `/entries/poc-v0-published-update`; the final title was
`A preserved public update · Legacy Person Presence`. In owner Identity,
pressing Tab from the Display name input moved focus to the Short description
textarea without changing either value. The focused owner field and public
link used `:focus-visible`, a 3px solid `#18201e` outline, 3px offset, and 6px
white halo. The owner field's visible focused rectangle was 750 by 97 pixels.

With forced colors and reduced motion active together, focus used the browser
system color `rgba(0, 230, 255, 0.8)` as a solid 3px outline with 3px offset;
`forced-color-adjust` remained `auto`. No inspected element retained a nonzero
animation or transition duration, and smooth scrolling was disabled. Under
touch emulation, `(pointer: coarse)` and `(any-pointer: coarse)` were true and
`(hover: none)` was true. Owner Identity still had zero overflow, off-screen
controls, or effective targets below 44px; its smallest target height was 44px
and smallest width was 48.34px.

## Contrast, CSP, console, and retired Hub surfaces

The minimum measured text contrast in the 22-route matrix was 4.78:1, with no
text failures. Required form boundaries measured at least 3.04:1. The saved
runtime accent `#6a4b35` measured at least 6.9:1 in its text/fill context; its
permalink button retained 7.86:1 white-text contrast. Default owner buttons
measured 8.28:1. Low-contrast quiet/danger decorative borders were not their
sole affordance: the already named text controls measured 7.79:1 to 15.47:1.

All 22 route rows reached `readyState=complete` with zero warning or error
console entries and no application error page. A CSP-compatible permalink load
used 202 stylesheet rules plus 17 inline self-hosted font rules, three
same-origin modules, and two loaded self-hosted fonts, with zero CSP or other
console errors. The fixed response-header contract is independently pinned by
the exact-candidate CSP tests for every application HTML state; the browser
matrix injected no deliberate policy violation.

The retired owner Hub route and retired private probe route rendered the same
inert 404 copy and URL for public and owner views, with no metadata redirect and
zero console errors. Public reads, the manifest-only protocol challenge, and
owner reads remained available without an outbound Hub request. No credential,
private canary, or retired control appeared in a rendered public surface.

## Validation and residual boundary

The exact candidate passed:

```bash
npm run db:generate
npm run validate
npm audit --omit=dev
git diff --check
```

`npm run db:generate` reported no schema change. Full validation passed the
instruction, license, plan, instance, runtime, migration, type, lint,
production-build, and 188-test gates. The production dependency audit reported
zero vulnerabilities.

No product defect remains in this matrix. Residual uncertainty is deliberately
hosted: this proof does not claim a deployed Sites version, CDN behavior,
hosted identity session, hosted D1 state, or custom-domain behavior. Those
belong only to the separately controlled hosted checkpoint.
