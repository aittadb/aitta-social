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

## Content states

A configured presence remains intentional when it has no published updates.
Its identity and introduction stand on their own, followed by an explicit empty
state. Drafts never affect the public hierarchy, counts, links, or wording. All
four supported update kinds use the same recent-update list and public
permalink model.

If D1 is unavailable, the existing neutral setup state remains the safe public
fallback. Optional Hub configuration or failure does not participate in public
profile or published-update rendering.

## Accessibility and responsive behavior

The source order matches the reading and focus order. The page uses one public
identity heading followed by labeled featured-information and recent-update
sections, a list for updates, native anchors, and separately labeled primary and
technical navigation landmarks.

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

The configured accent remains a constrained decorative preference. Essential
public labels use the stable foreground colors instead of depending on an
owner-selected accent for readable contrast. No image, gradient, theme engine,
arbitrary HTML, or client-side layout state is required.

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
