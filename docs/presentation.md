# Public presence presentation

The default public page describes the represented presence before it exposes
software or protocol details. Its semantic and visual order is:

1. public identity: display name, short description, location, website, and
   external links;
2. featured information: the configured introduction;
3. recent updates: the existing published-entry collection in deterministic
   newest-first order; and
4. restrained footer context: optional AittaSocial attribution and technical
   links to the discovery manifest and versioned JSON resources.

The manifest and JSON resources remain directly usable, but they are secondary
to the represented presence and are not primary navigation or update-heading
actions. Moving their links changes no route, response, cache policy, schema,
migration, or protocol 1.0 field.

Before an Identity exists, the reusable template has a deliberately different
first-content hierarchy:

1. a plain-language heading explaining that one ChatGPT prompt creates a
   presence;
2. the exact short README prompt in a labeled, selectable, read-only field;
3. a clear native link into the normal local owner sign-in/management path;
4. any already-published updates, still using the same published-only query;
   and
5. the existing restrained footer context.

This template-first state is selected only by a successful D1 read returning no
profile. Once Identity is saved, the prompt, setup heading, and setup action are
absent and the represented presence regains the normal hierarchy above. A D1
failure renders a fixed temporary-unavailable state instead of the creation
prompt. Optional Hub availability never selects any of these states.

## Content states

A configured presence remains intentional when it has no published updates.
Its identity and introduction stand on their own, followed by an explicit empty
state. Drafts never affect the public hierarchy, counts, links, or wording. All
four supported update kinds use the same recent-update list and public
permalink model.

If D1 is unavailable, the fixed temporary-unavailable state remains the safe
public fallback and is not presented as new setup. Optional Hub configuration
or failure does not participate in public profile or published-update
rendering.

## Accessibility and responsive behavior

The source order matches the reading and focus order. The page uses one public
identity heading followed by labeled featured-information and recent-update
sections, a list for updates, native anchors, and separately labeled primary and
technical navigation landmarks.

Primary headings use a restrained display scale instead of filling most of the
viewport. Public Identity and permalink headings stay between 2.5rem and
4.5rem; the narrower setup column tops out at 4rem; public error and owner
access headings stay between 2.25rem and 3.75rem; and owner workspace page
headings stay between 2.25rem and 3.5rem. Narrow layouts use those same fluid
bounds rather than a breakpoint that enlarges text. Section headings and update
titles retain a smaller hierarchy; the owner Updates heading uses a bounded
1.75rem-to-2.5rem scale so it never overtakes the owner page h1. Balanced lines and anywhere
wrapping remain available for long names and titles.
The repeated navigation wordmark remains a single concise line and truncates
only that repeated label when a maximum-length Identity would otherwise widen
the page; the full name remains present in the primary heading.

Public interactive targets have at least 44 CSS pixels of height and retain a
two-layer dark/light focus indicator. Its dark ring contrasts with the light
public canvas, its light halo contrasts with dark owner surfaces, and a
forced-colors override uses the system highlight color. Long names,
descriptions, translated text, links, and update copy wrap rather than expand
the viewport. At narrow effective viewports—including a 320-pixel viewport,
which is the effective layout width produced by enlarging a 1280-pixel desktop
viewport to 400 percent—the navigation, identity, featured information,
updates, empty state, and footer become single-column layouts. Reduced-motion
preferences disable smooth scrolling and animation.

The prompt itself is a native read-only textarea. Its visible label and help
text make manual selection and copying available without a script-only control;
keyboard selection and platform copy commands therefore remain available on
every browser. The field fills its bounded column, wraps long text, and becomes
single-column with the introduction at the 900-pixel breakpoint. The 320-pixel
and effective 400-percent-zoom layouts use the same narrow rules and cannot
expand the viewport.

The configured accent remains a constrained preference rather than a theme or
arbitrary style input. New owner writes still accept and store only a
six-digit hex color, and protocol 1.0 returns that exact stored preference. At
render time, one shared resolver validates the stored value and derives the
color used by `--accent` on the public page, update permalink, and owner
preview. It never writes the derived color back to D1. An invalid legacy value
falls back to `#31554d` before reaching a style property.

The resolver uses the WCAG relative-luminance and contrast-ratio formulas. A
valid color that has at least 4.5:1 contrast against `#eef0eb`, the darkest
supported light canvas, keeps the same color after lower-case normalization,
without tonal adjustment. Otherwise its 8-bit sRGB channels
are interpolated toward `#31554d` in 255 deterministic steps. At step `n`, each
channel is `Math.round(source + (target - source) * n / 255)`; JavaScript's
positive-number half ties round upward. The first candidate meeting 4.5:1 is
used, and the reviewed default is the terminating fallback. The other light
surfaces are `#f3f0e8`, `#f7f7f3`, `#fbfaf6`, and white, so the darkest-canvas
check conservatively covers accent text and decoration on every canvas as well
as white text on an accent-filled button. Forced-colors mode remains owned by
the browser; the application does not disable system color adjustment.

No image, gradient, theme engine, arbitrary HTML, or client-side layout state
is required.

## Owner Identity journey

The visually distinct owner workspace presents fresh, incomplete, and complete
Identity readiness derived from saved server state. Its primary next action is
Identity setup while fresh or incomplete, and public preview when complete;
update creation remains in the existing update controls rather than being
presented as Identity completion. The form pairs saved readiness with a clearly
labeled transient preview and native progress elements. Saving reloads the
server-derived state, while a reload before saving discards the preview.
The saved and live accent preview uses the same derived `--accent` as public
rendering, including its border, label, and native progress accent. The color
input continues to represent the owner's stored preference rather than the
derived rendering color.

The normalized effective public URL is shown with a safe runtime-override or
stored-fallback explanation. Raw runtime configuration, request hosts, ChatGPT
identity, drafts, and Hub state never become Identity defaults. The owner grids
collapse to one column at the narrow breakpoint;
native links, buttons, and fields retain keyboard focus behavior and at least
44-pixel interactive height.

When a protected runtime canonical URL is effective, the editable field is
named as the saved fallback and explains that saving it cannot change the
protected setting. A malformed legacy stored value is never used as a form
default or transient preview; a valid normalized runtime value becomes the safe
fallback default instead. This lets an unrelated Identity or presentation save
proceed without serializing the malformed value.

Repeated update rows give each action a bounded owner-visible text label plus
the complete collision-free stable entry identifier in its accessible name,
while keeping concise visible labels. Publishing opens a native,
update-specific confirmation. A
supervising ChatGPT must pause for the human owner's explicit approval before
accepting it. Save and state controls announce pending, safe response-error, and
unknown result states. A rejected fetch or 5xx response exposes a native
recovery link instead of retrying automatically; a 4xx response remains a
definitive safe error without that link. Form inputs remain available until the
owner chooses to reload the saved state. These additions use the existing button,
focus, touch-target, wrapping, 320-pixel, effective 400-percent-zoom, and
reduced-motion rules.

## Review checklist

The focused automated contract renders the public route with an empty state and
with representative published note, article, link, and announcement fixtures.
It checks semantic order and public-only projection using long unbroken,
translated, draft, owner, credential, and row canaries. Source assertions cover
the single-column breakpoints, 44-pixel target declarations, overflow wrapping,
reduced-motion behavior, forced-colors fallback, and numeric focus-color
contrast. These checks do not claim browser geometry by themselves.

For rendered review, inspect both empty and populated states in a browser at a
320-pixel viewport and at a 1280-pixel desktop viewport enlarged to 400 percent.
Measure `scrollWidth` against `clientWidth`, inspect each public target's box,
tab through the page to see the focus ring, enable reduced motion, and confirm
that long visible hostnames and unbroken text wrap without clipping. Repeat the
focused hierarchy review described in the deployment guide before a checkpoint.

The template contract additionally compares the README prompt with the reviewed
runtime content projection byte-for-byte after README whitespace normalization.
It renders signed-out, owner, non-owner, and missing-owner fixtures; an absent
profile with public and draft updates; a configured profile; unavailable D1;
and protected identity/credential canaries. Source assertions cover native
selection, visible labeling, native navigation, focus, touch sizing, wide and
narrow grids, overflow wrapping, reduced motion, and the no-gradient boundary.
This presentation adds no schema, migration, private write, public API, or
protocol change.

The focused runtime-accent contract additionally checks the black and white
extremes, the adjacent `#6d6d6d`/`#6e6e6e` threshold, fixed interpolation
outputs, invalid and malicious legacy strings, every supported light surface,
accepted-write storage and protocol preservation, public and owner rendering,
reload/no-clobber behavior, private canaries, forced-colors source behavior,
and a frozen historical D1 fixture reopened with a malformed stored accent.
The full upgrade-preservation suite remains the migration-tail and before/after
proof.
