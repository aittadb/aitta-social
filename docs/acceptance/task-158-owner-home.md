# TASK-158 owner home acceptance

TASK-158 replaces the dark 72-pixel owner brand bar and 220-pixel sidebar with
a compact owner-only application frame. It does not change authorization,
repository reads, mutation behavior, public output, routes, schema, migrations,
runtime configuration, or hosting state.

## Source outcome

- The neutral application header is 60 pixels before any device top safe-area
  inset. It exposes native `Manage` and quiet `View presence` links.
- The separate owner route bar contains exactly three native links: Home,
  Identity, and New update. It is non-wrapping and horizontally scrollable at
  320 pixels. Sign out remains a native link in the compact `Private owner
  workspace` footer.
- The shell still accepts its existing `displayName` prop, but authenticated
  ChatGPT display names are not rendered.
- Owner surfaces reuse `--paper`, `--paper-raised`, `--ink`, `--muted`,
  `--line`, focus, and action colors. The former owner-only ink/panel palette,
  dark header, serif owner hierarchy, sidebar, and phone 2-by-2 navigation grid
  are absent. The only new bounded token is the shared 44-pixel control minimum.
- Owner Home has one state-derived primary action and one concise
  `.owner-next-step` status panel. The panel keeps the existing native Identity
  progress label/value, compact effective-canonical truth, and explicit textual
  status without a duplicate action. Counts, all update rows, all row actions,
  and compact empty-state meaning remain intact.
- Authorization still completes before D1 reads. Fresh/incomplete states skip
  first-entry reads; complete states retain bounded earliest-draft and
  earliest-published reads. Owner page rendering never mutates D1.

## Automated evidence

The focused acceptance set is:

`tests/accessibility-contract.test.mjs`,
`tests/first-update-journey.test.mjs`,
`tests/headline-scale.test.mjs`,
`tests/public-hierarchy.test.mjs`,
`tests/identity-journey.test.mjs`,
`tests/presentation-accent.test.mjs`, and
`tests/empty-heading-hierarchy.test.mjs`, plus the exact owner-shell assertions
in `tests/assisted-runtime-journey.test.mjs` and
`tests/presence-functional-matrix.test.mjs`.

It pins the three-link route bar, header/view/sign-out destinations, absence of
the authenticated display name, 44-pixel targets, one primary owner-home CTA in
every readiness/update state, progress and canonical semantics, bounded reads,
owner denial before private reads, private canaries, draft/public parity, public
hierarchy regressions, shared semantic surfaces, restrained sans-serif heading
relationships, forced colors, reduced motion, and no gradients.

The integration owner ran the complete repository gate on the initial rendered
candidate `c2c7e9054071039b7643067c305abb7f176e9e5a`: `npm run validate` passed
all 191 tests, `npm run db:generate` produced no schema drift, and
`npm audit --omit=dev` reported zero vulnerabilities. After the rendered review
identified the missing phone-footer safe-area floor, the corrected exact source
candidate `5562888a769366d4f976a3df82247ccf58f8c2eb` passed the focused
accessibility contract 15/15 and diff checks. The integration owner repeated
the complete gate after finalizing this evidence record.

## Rendered evidence

The complete 16-row rendered matrix passed on exact source candidate
`c2c7e9054071039b7643067c305abb7f176e9e5a` in the Codex in-app browser's
Chrome 151.0.0.0 runtime. No application source changed during the inspection.
No Site, hosted data, setting, access policy, DNS record, domain, or external
service was read or changed.

The fixture built the candidate's production Worker and current Vinext client
assets, applied the checked-in migration to four separate disposable local D1
databases, and exposed each Worker only on a random `127.0.0.1` port. The
standard authenticated-user request headers were injected by this explicit
test proxy; owner authorization still compared that identity with a synthetic
protected owner binding. The active ignored hosting configuration was neither
read nor copied. The four database states were:

- fresh Identity with zero updates;
- saved but incomplete Identity with one private update;
- complete Identity with one private update; and
- a complete 13-word long Identity with twelve mixed draft/published updates,
  including a repeated long title and a 248-character unbroken body token.

The raw compact rows below use `client/document/height` for document CSS-pixel
geometry, then `h1 size/height`, one summary-cell `width×height`, minimum
interactive `width×height`, interactive count, and the sole primary action.

| State | Requested viewport | Document | h1 | Summary cell | Minimum target | Targets | Primary action |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Fresh | 320×900 | 305/305/1070 | 28/62.7 | 91.7×93.7 | 48.3×44 | 8 | Set up identity |
| Incomplete | 320×900 | 305/305/1133 | 28/31.4 | 91.7×93.7 | 48.3×44 | 13 | Finish identity |
| Complete, one | 320×900 | 305/305/1197 | 28/31.4 | 91.7×70.1 | 48.3×44 | 13 | Resume first draft |
| Complete, many/long | 320×900 | 305/305/4021 | 28/219.5 | 91.7×70.1 | 48.3×44 | 61 | Preview public presence |
| Fresh | 390×900 | 375/375/971 | 28/31.4 | 115×70.1 | 48.3×44 | 8 | Set up identity |
| Incomplete | 390×900 | 375/375/1057 | 28/31.4 | 115×70.1 | 48.3×44 | 13 | Finish identity |
| Complete, one | 390×900 | 375/375/1134 | 28/31.4 | 115×70.1 | 48.3×44 | 13 | Resume first draft |
| Complete, many/long | 390×900 | 375/375/3602 | 28/156.8 | 115×70.1 | 48.3×44 | 61 | Preview public presence |
| Fresh | 768×1024 | 768/768/1024 | 28/31.4 | 242×75 | 48.3×44 | 8 | Set up identity |
| Incomplete | 768×1024 | 768/768/1024 | 28/31.4 | 242×75 | 48.3×44 | 13 | Finish identity |
| Complete, one | 768×1024 | 768/768/1024 | 28/31.4 | 242×75 | 48.3×44 | 13 | Resume first draft |
| Complete, many/long | 768×1024 | 753/753/3283 | 28/94.1 | 237×75 | 48.3×44 | 61 | Preview public presence |
| Fresh | 1440×900 | 1440/1440/900 | 36/40.3 | 319.3×75 | 48.3×44 | 8 | Set up identity |
| Incomplete | 1440×900 | 1440/1440/900 | 36/40.3 | 319.3×75 | 48.3×44 | 13 | Finish identity |
| Complete, one | 1440×900 | 1425/1425/908 | 36/40.3 | 319.3×75 | 48.3×44 | 13 | Resume first draft |
| Complete, many/long | 1440×900 | 1425/1425/2523 | 36/120.9 | 319.3×75 | 48.3×44 | 61 | Preview public presence |

Every row had equal document client and scroll width. The 15-pixel difference
between requested and client width in long rows is the vertical scrollbar, not
horizontal overflow. Every header measured 60 pixels and stayed on one line.
Every owner route bar measured 45 pixels, retained exactly three links,
`nowrap`, `overflow-x: auto`, and equal client/scroll width at the tested
content. All three 320-pixel summary cells stayed equal-height; the fresh and
incomplete values wrapped by increasing the whole row uniformly. Long Identity
and update text wrapped without clipping. Every row retained one `main`, one
labelled owner navigation, one state-derived primary action, and the logical
`h1`, `h2`, `h3` hierarchy. No row contained a gradient or the removed owner
sidebar/brand chrome.

At 320 pixels, the skip link, Manage, View presence, Home, Identity, New
update, and primary action each exposed a 3-pixel visible focus outline. Their
boxes were completely inside the viewport; all three route links were also
inside the route-bar viewport. The focused footer Sign out link scrolled into a
fully visible 48.3×44-pixel box at `y=848..892` in the 900-pixel viewport. A
native click on Identity performed full-document navigation from `/owner` to
`/owner/profile`, where the `Identity` h1 rendered.

The in-app browser controller could focus a named native anchor, but its
synthetic Tab command repeatedly left focus on the skip link and its synthetic
Enter command did not activate the focused Identity anchor. Those are
controller limitations, not successful keyboard claims. Logical DOM order,
native anchor destinations, target geometry, and focus presentation are
covered here; exact-source automated tests cover the native-anchor contract.
An actual hardware-keyboard Tab/Enter pass remains residual hosted-review
evidence.

Literal browser page zoom was not available. A separate Chromium device-metric
run used DPR 4 and reported a 320×900 CSS viewport, 1,280 physical pixels,
visual scale 1, client/document widths 305/305, a 305/305 non-wrapping route
bar, the long h1 at 277×219.5, and a 48.3×44 minimum target. This is
400-percent reflow-equivalent evidence and is deliberately not described as
literal page zoom.

With reduced motion and forced colors active together, both media queries
matched, root scrolling became `auto`, transition duration was `0s`, animation
was `none`, the focused route link used a browser `Highlight` 3-pixel outline
with no shadow and `forced-color-adjust: auto`, and the textual `published`
state retained a solid boundary. The source and loaded stylesheet use
`safe-area-inset-top` for the 60-pixel header and left/right safe-area insets
for the header, route bar, and footer. The final source correction also gives
the phone footer a bottom padding floor of 8 pixels or
`safe-area-inset-bottom`, whichever is larger. Nonzero cutout emulation was
unavailable, so this last boundary is source- and contract-backed rather than
a rendered nonzero-inset claim.

The final clean reload returned `200` for owner HTML, CSS, both Geist fonts,
and all current Vinext chunks, with no loading failure and zero browser warning
or error entries. HTML carried `no-store, must-revalidate` and the fixed CSP;
no CSP error appeared. The synthetic protected owner-email and authenticated
full-name canaries were absent from both the rendered DOM and every state row.

The final product-source delta after that matrix is exactly the phone-footer
safe-area declaration plus its focused source assertion; at a zero safe-area
inset it computes to the same 8-pixel padding already measured above. The
primary browser thread rebuilt exact corrected source candidate
`5562888a769366d4f976a3df82247ccf58f8c2eb` and repeated the complete-long
owner row at requested 320×900 and 390×900. It measured client/document widths
305/305 and 375/375, respectively; a 60-pixel header; a 45-pixel `nowrap` route
bar with equal client/scroll width; 61 interactive targets with the Sign out
link as the 48.34×44-pixel minimum; 8-pixel computed footer padding at the zero
inset; the new `safe-area-inset-bottom` rule in the loaded stylesheet; no
private canary; and an empty browser log. The corrected source files are
byte-identical in the final task commit; only this evidence record changes when
the commit is finalized.
