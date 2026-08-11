# TASK-153 empty-state heading hierarchy acceptance

TASK-153 corrects only the two empty-update heading scales. It keeps the public
and owner empty-state h3 elements semantically below their existing Updates h2
elements and does not change either message.

## Fixed relationship

- Public empty-update h3: `clamp(1.65rem, 2.5vw, 2.25rem)`, below the public
  Updates h2 scale of `clamp(2rem, 4vw, 3.4rem)`.
- Owner empty-update h3: `clamp(1.5rem, 2vw, 1.75rem)`, below the owner Updates
  h2 scale of `clamp(1.75rem, 2.5vw, 2.5rem)`.

Both empty headings keep the existing serif treatment and gain a bounded
1.15 line height plus anywhere wrapping. There is no narrow breakpoint override,
so an actual 320 CSS-pixel viewport and a 1280-pixel desktop reflowing at 400
percent resolve the same hierarchy. The primary h1 scales, populated public
card titles, public note titles, and populated owner-row titles are unchanged.

## Automated evidence

`tests/empty-heading-hierarchy.test.mjs` pins both h2/h3 relationships at 320,
640, 900, 1280, 1600, and 2560 CSS pixels. It also pins the unchanged primary,
public-card, note-card, and owner-row typography and the reduced-motion and
forced-color rules. Its SSR checks prove each Updates h2 precedes its empty h3,
the empty-state wording and labelled section remain intact, and a private D1
canary reaches neither public nor authorized-owner HTML.

## Rendered evidence

The exact application candidate was built against a disposable configured local
D1 fixture containing no updates and inspected in Chrome 151 through the
in-app browser. No application source changed after these measurements.

| Empty-update surface | 1280 x 900 (client 1265) | Actual 320 x 900 (client 305) |
| --- | ---: | ---: |
| Public | Updates h2 51.2px; h3 32px | Updates h2 32px; h3 26.4px |
| Owner | Updates h2 32px; h3 25.6px | Updates h2 28px; h3 24px |

The public and owner h3 remained strictly smaller than their Updates h2 in all
four rendered rows. Both narrow h3 elements wrapped safely inside the client
width; `scrollWidth` equalled `clientWidth` for each document. Every visible
link or button retained at least a 44 CSS-pixel target height. Public and owner
heading text contrast remained above 14.5:1 and 16.6:1 respectively, and the
four rows produced no warning or error console entries.

A 1280-pixel desktop reflowing at 400 percent has the same 320 CSS-pixel layout
width and therefore resolves the same narrow cascade measured above. This is a
reflow-equivalence assertion, not a claim that a separate CDP zoom action was
successfully completed. Reduced-motion, forced-color focus, primary-headline,
populated-card, and long-content wrapping preservation are pinned by the source
and full repository regressions; TASK-153 does not claim separate rendered
interaction evidence for those unchanged boundaries.

This correction changes no schema, migration, protocol, runtime configuration,
hosting binding, Site, hosted data, protected setting, access, DNS, custom
domain, or other external state.
