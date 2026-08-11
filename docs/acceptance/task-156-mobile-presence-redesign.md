# TASK-156 mobile-first public redesign acceptance

Status: **pass.** The integrated TASK-154 and TASK-155 public experience,
followed by the focused TASK-156 responsive corrections, reads as one compact,
identity-led social presence at phone and desktop sizes. The evidence below was
collected without deploying the redesign or changing a Site, hosted data,
settings, access, DNS, domains, Hub state, a sibling repository, `develop`, or
`main`.

## Baseline and exact candidate

The live public deployment was inspected read-only as the visual baseline. Its
public application markup and compiled presentation matched the pre-redesign
repository source: a two-row phone header with a full-width owner action, a
large serif identity statement, prominent template labels and numbering, a
separate long Introduction opening, and numbered editorial previews below the
first phone viewport. At desktop width, the identity opening and whitespace
expanded while the updates remained visually secondary. No meaningful live
versus source presentation difference was found.

The exact final rendered implementation candidate was
`a3b5bcba319c24a7f924e9973af1a1a0a9187008`. It descends only from the
integrated TASK-155 tracker commit
`2072ecb680b4f820d0d4737dceadab4b07e4f7c4` through the focused TASK-156
implementation commits. Its rendered product input is pinned below. This
acceptance record and the current presentation-guide correction were added
afterward without changing the rendered product or focused-test bytes; the
owner-review branch changelog records the final integrated task commit.

| Rendered product input | SHA-256 |
| --- | --- |
| `app/globals.css` | `e599aba197e85a22c781621c567645b576ef61bede906dc48a3c029c6c2e1a83` |

The disposable acceptance harness had SHA-256
`8f40784e3c53d66a04761977272544bfa2ba8553ed1b03bb5292bf9b18c19f4f`.
It exported the exact commit with `git archive`, built outside the checkout,
never read or copied `.openai/hosting.json`, applied reviewed migration
shown below to real persisted disposable Miniflare D1 databases, bound random
`127.0.0.1` ports only, and removed its runtime state on exit. All data was
reserved synthetic fixture content, including a private draft canary in every
database. The reviewed migration SHA-256 was:

`95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a`

Rendered checks used Chrome 151 on macOS with user agent
`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36` through the supported
browser controls.

## Brand and layout outcome

The public homepage and permalink now use AittaSocial's own compact shared
frame: one 60-pixel phone header, a shallow solid safe-accent identity field,
two same-accent CSS forms, a crossing initials tile, concise Identity/About
information, a bounded source-first update stream, and a quiet technical
footer. The phone field/tile/name are 96/80/30 pixels; larger screens restore
120/96/38 pixels. The stream never exceeds 700 CSS pixels.

Updates repeat a 40-pixel identity tile, source name, and human-readable time.
Notes lead with ordinary-scale body text; articles, announcements, and links
use moderate titles and useful kind context. Permalinks retain the same source
language and native return path. The design contains no sequence numbers,
promotional Read call, generic hero, gradient, uploaded or stock imagery,
placeholder destination, or inert social control.

Only public-scoped composition changed, plus one shared safe-area correction to
the global skip link's focused position. The private owner workspace layout,
routes, and source components, public routes, native-navigation boundary,
identity and publication behavior, protocol 1.0, metadata and canonical
projection, caching, CSP, authentication, authorization, privacy, D1 schema,
migrations, runtime configuration, and owner-stored presentation values remain
unchanged.

## Rendered matrix

The complete 52-row identity-free matrix ran on focused candidate
`aef85959b024a1862be9a5d0d5475348357b41cf`:

| Matrix | Rows | Result |
| --- | ---: | --- |
| Representative home and note permalink at 320×568, 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900 | 14 | Pass |
| No profile; no, one, and fifteen updates; maximum/long content; missing details; eight links; all four kinds; and hidden attribution at 320×568 and 1440×900 | 18 | Pass |
| Profileless, long, note, article, link, announcement, and hidden-attribution permalinks plus draft, unknown, and plain not-found states at 320×568 and 1440×900 | 20 | Pass |

Across the matrix:

- every document completed with zero horizontal overflow, clipped or
  off-screen control, private canary, fake control, console warning, or console
  error;
- every visible effective target was at least 44 by 44 CSS pixels; the smallest
  measured width was 44.1 pixels and the smallest height was 44 pixels;
- the minimum measured text contrast was 4.521:1, and required control and
  focus boundaries passed their applicable thresholds;
- every document retained one main landmark, coherent headings, named
  navigation and regions, native labelled controls, and logical source order;
- the configured stream remained at most 700 pixels wide at every larger
  viewport; and
- the fixed public header remained one line, with the complete accessible name
  preserved when its visible identity cue ellipsized.

Final candidate `a3b5bcba319c24a7f924e9973af1a1a0a9187008` then made only the
reviewed public setup-state, short-target, narrow-metadata, and corresponding
focused-test corrections. A targeted nine-row rerun on that exact commit
covered the representative home at 320×568, 390×844, and 1440×900 plus the
profileless, one-update, and all-kind homes at both 320×568 and 1440×900. The
profileless h1 was sans-serif at 30 pixels on the phone and 38 pixels on the
desktop, its header was 61 pixels high, its bounded setup panel was 700 pixels
wide on desktop, and both rows had zero horizontal overflow or off-screen
targets. The one-character announcement and note permalink labels each
measured exactly 44 by 44 pixels at both widths. The representative phone row
retained the source and first-body positions recorded below, while the desktop
stream remained exactly 700 pixels wide. Every targeted row had zero
undersized target, and the final browser log contained zero warnings or
errors.

At 320×568, the first update's complete source row ended at y=523.2 and its
body began at y=534.4, leaving 33.6 pixels of meaningful body text in the first
viewport. At 390×844, the body occupied y=534.4–606.4, so the compact header,
Identity, About, Updates heading, source row, and meaningful update content were
all visible together.

Boundary fixtures proved that the public query shows the newest twelve of
fifteen seeded updates; a profileless historical update uses
`Independent presence` without inventing an Identity; missing details render
no empty aside; all eight supported external links coexist with website and
location rows; all four kinds keep their intended hierarchy; and hidden
attribution retains the technical resources. The all-kind fixture showed only
Article, Link, and Announcement labels, while the note remained body-first.

Draft, unknown, and plain not-found permalinks all returned the same public
heading, no canonical URL, no redirect, and no private canary. Request-specific
framework transport markers may differ internally, but their public status,
metadata, wording, links, and privacy projection remain indistinguishable.

## Keyboard, enlargement, touch, and media

Native keyboard traversal began with the skip link, then the product/Identity
link, then Manage. Each used `:focus-visible`, a 3-pixel solid near-black
outline, 3-pixel offset, and 6-pixel white halo without obstruction. Enter on a
publication-time anchor navigated to the exact local permalink; Enter on the
permalink source returned to `/`; and Enter on Manage reached the exact local
dispatcher path `/signin-with-chatgpt?return_to=%2Fowner` by GET. The local
fixture correctly cannot implement the Sites-owned dispatcher. The long About
native summary opened and closed with Enter while preserving all 5,966
characters and without clipping or overflow.

At 200-percent root text on the representative, maximum-length, and all-kind
fixtures, the observed root size was 32 pixels. The header grew to 66.05 pixels
without wrapping or overlap; documents retained equal client and scroll widths,
zero off-screen or undersized targets, and a minimum target height of 44 pixels.
The representative source row retained 247 pixels of usable width; the
all-kind fixture retained all four updates.

The 400-percent reflow condition was proved twice: the complete actual
320-pixel matrix and a separate physical-1280/DPR-4 Chromium emulation that
reported a 320-pixel CSS viewport, DPR 4, and visual viewport scale 1. That
representative row retained a complete source row in the first viewport, a
44.1-by-44-pixel minimum target, zero overflow/off-screen controls, and working
internal touch navigation. This is explicitly reflow-equivalent evidence, not
a claim of literal browser page zoom. Meta/Cmd zoom shortcuts exposed by the
available controllers were no-ops and left the observable page scale at 1.

With reduced motion enabled, the media query matched, root scrolling became
`auto`, inspected elements and pseudos retained zero animation and transition
duration/delay, `document.getAnimations()` was empty, and navigation still
worked. After reset the query no longer matched.

With forced colors enabled, decorative identity forms disappeared, the field
retained a 1-pixel `CanvasText` boundary, and the initials tile retained a
distinct system-colored border and readable text. Focus used a solid 3-pixel
system Highlight outline with 3-pixel offset while `forced-color-adjust`
remained `auto`. After reset the query no longer matched.

Coarse-pointer emulation reported `pointer: coarse`, `any-pointer: coarse`,
`hover: none`, and nonzero touch points. Every visible control on the
representative, permalink, long, and all-kind fixtures retained its target,
remained on-screen, and navigated natively. A separate nonzero safe-area row
used top/left/bottom/right insets of 24/28/20/22 pixels; the header, focused
skip link, management action, and footer remained inside those occupied edges
with zero horizontal overflow. Every media, touch, viewport, text, and device
override was reset after inspection.

## Public contract and privacy

Representative home, permalink, and not-found HTML retained dynamic
`no-store, must-revalidate` caching and the fixed CSP:

`default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; block-all-mixed-content`

Eleven observed current CSS, JavaScript, and font assets were same-origin and
loaded successfully; `document.fonts.status` was `loaded`, with zero failed
asset, CSP-violation, page/runtime-error, warning, or error observations.

The manifest, site, collection, and published-detail resources retained their
exact protocol 1.0 envelopes, content types, canonical synthetic authority,
published-only projection, and 60/30/60-second cache policies. Public HTML,
headers, metadata, JSON, links, and bundles remained free of the draft,
authenticated-identity, owner-setting, credential, and hosting canaries used by
the repository tests.

## Visual artifacts

Before and after images are deliberately untracked owner-review artifacts in
`/private/tmp`; they are not committed because the live baseline contains the
owner's public identity. The after images use only the reserved synthetic
fixture. Exact dimensions and digests are:

| Artifact | Pixels | SHA-256 |
| --- | ---: | --- |
| `aitta-social-redesign-before-390x844.jpg` | 390×844 | `14fdd9195d65e8dde7eb2b2e98460fe7e3da6458711b2a196f25c999bdb84eac` |
| `aitta-social-redesign-after-390x844.jpg` | 390×844 | `b1d4bc82e7bcbcf55a0a654e2c81ad221781302aef37d8cfa181f01df1d2e07c` |
| `aitta-social-redesign-before-1440x900.jpg` | 1440×900 | `efed4f2aa155ff33480739ca47c7681565da5f2b81b782e06f11dca17f23315c` |
| `aitta-social-redesign-after-1440x900-exact-a3b5.jpg` | 1440×900 | `f51bb61928164ac7786509638bdd05bf57f25b9008c6d3c1d7fa15a749ac9e77` |

The 390×844 after image was captured on full-matrix candidate `aef8595`; the
desktop after image was recaptured on exact final rendered candidate `a3b5bcb`.
The final commit changed only the profileless setup selectors, minimum widths
for optional-detail and titled-update links, and narrow stacking for non-note
metadata. None applies to the configured, detail-free, untitled-note
representative used by the phone image. The exact-final 390×844 rerun retained
the same y=479.2–523.2 source row and y=534.4 body start with zero overflow and
errors. A second exact-final phone capture produced a 375×812 content raster
because the available in-app screenshot backend excluded its 15-pixel
scrollbar and 32-pixel lower browser chrome; it is retained separately as
`aitta-social-redesign-after-390x844-exact-a3b5.jpg` with SHA-256
`dd7ae00097f7680ef5155d3d2973d1e6066e47685ee8d1fc1d4a700a2b391541`
and is not mislabeled as the required exact-size artifact. Chrome was
unavailable for a replacement capture. This provenance makes the one
source-equivalent phone artifact limitation explicit rather than attributing
it to the final commit.

The phone comparison shows the old template opening consume the viewport
before updates, while the candidate shows the complete compact Identity/About
composition and meaningful first-update content. The desktop comparison shows
the old oversized editorial hero and whitespace replaced by the same bounded
identity-and-stream composition used on phones.

## Validation and residual boundary

The four directly changed focused suites pass 19/19. The final combined
evidence tree passes `npm run db:generate` with no migration,
`npm run validate` with 191/191 tests, `npm audit --omit=dev` with zero
production vulnerabilities, and `git diff --check`.

Three deliberate verification limitations remain. First, the local packaged
Worker can prove the exact owner dispatcher href, GET navigation, and clean
browser behavior, but it cannot execute the Sites-owned sign-in dispatcher or
an authenticated hosted owner lifecycle; deployment was explicitly prohibited.
Second, the supported controllers exposed no successful literal browser
page-zoom operation. Third, the available final-candidate phone screenshot
backend emitted only its 375×812 content raster for a requested 390×844 view;
the exact-size phone comparison therefore uses the explicitly source-equivalent
focused candidate, backed by the exact-final geometry rerun and selector audit
recorded above.
The separately measured actual-320 and physical-1280/DPR-4 conditions provide
the required 400-percent reflow equivalence without mislabelling that
limitation. No visual requirement was weakened. Image upload, profile media,
network actions, engagement controls, counts, and additional destinations
remain intentionally absent product features rather than incomplete visual
placeholders.
