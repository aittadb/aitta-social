# TASK-151 primary headline scale acceptance

TASK-151 reduces only the main display headings that were visually dominating
public and owner pages. It changes no component semantics, public content,
navigation, stored preference, or route behavior.

## Fixed scale

- Public Identity and published permalink: `clamp(2.5rem, 5vw, 4.5rem)`.
- Unconfigured setup: `clamp(2.5rem, 4.5vw, 4rem)`.
- Public unavailable, 404, and owner-access states:
  `clamp(2.25rem, 4vw, 3.75rem)`.
- Owner workspace page headings: `clamp(2.25rem, 3.5vw, 3.5rem)`.
- Owner workspace section headings: `clamp(1.75rem, 2.5vw, 2.5rem)`.

The owner section scale stays below its page h1 across all supported widths.
The previous 640-pixel rules that could enlarge public Identity, setup, and
permalink headings to 5rem are removed. Existing serif treatment, line height,
balanced text, anywhere wrapping, semantic heading levels, update-card titles,
native anchors, and focus behavior are unchanged. The owner section h2 is the
only subordinate heading whose scale changed, solely to keep it below its page
h1 at every supported width.
The repeated navigation wordmark is bounded and may ellipsize a maximum-length
name; the complete Identity remains available in the wrapping primary heading.
The owner header's text column may shrink below its intrinsic content width, so
an unbroken maximum-length Identity wraps instead of widening the workspace.

## Automated evidence

`tests/headline-scale.test.mjs` pins every main-heading bound, rejects a narrow
breakpoint enlargement, and protects the existing section/update typography.
It renders configured public Identity and maximum-length permalink headings,
unconfigured setup, public-not-found, owner-access, and authorized owner page
states, while proving their semantic heading text, shrink-and-wrap boundary,
and private-canary exclusion.

## Rendered evidence

The reachable pre-correction base
`59822f794739cbed37d0d00c77f9fd6d1b56c636` supplied the before values below.
Final source candidate `28d5b4b7a1a4dbafbde546e76ac34e0ca5c1d042`
was built and opened against disposable loopback-only D1 fixtures in Chrome
151.0.0.0 through the in-app browser for every corrected row:

| Primary surface | Before wide / 320 | Corrected wide / 320 |
| --- | ---: | ---: |
| Maximum-length public Identity | 115.2 / 54.4px | 64 / 40px |
| Unconfigured setup | 89.6 / 54.4px | 57.6 / 40px |
| Maximum-length published permalink | 102.4 / 48px | 64 / 40px |
| Public not-found state | 80 / 48px | 51.2 / 36px |
| Owner access state | 83.2 / 44.8px | 51.2 / 36px |
| Owner Identity page | 64 / 40px | 44.8 / 36px |

The wide pass used a requested 1280-by-900 viewport and the narrow pass a
requested 320-by-900 viewport. The actual content width was 1265 or 1280 CSS
pixels wide and 305 or 320 CSS pixels narrow, depending on scrollbar presence.
In all 12 route/viewport rows, `scrollWidth` equaled `clientWidth`, no primary
heading rectangle crossed either viewport edge, and all documents reached the
complete state. The deliberately unbroken 200-character public Identity and
permalink title wrapped at both sizes; the bounded repeated wordmark ellipsized
instead of widening the page. Short setup, not-found, access, and owner
headlines retained clearly smaller steps.

Every row reported zero warning or error console entries, and the runtime
exception observation reported zero page exceptions. A native owner field
received the unchanged 3-pixel visible focus outline; route controls and
heading semantics are unchanged native HTML, and the 320-pixel layout continues
to exercise the same reflow rules used at 400-percent desktop enlargement.

The same final source candidate additionally rendered the dashboard with an
unbroken 200-character Identity. At the wide viewport its 44.8-pixel h1 stayed
above the 32-pixel Updates h2; at the narrow viewport its 36-pixel h1 stayed
above the 28-pixel h2. The heading wrapped to 10 and 20 lines respectively,
both heading rectangles remained within the viewport, document overflow was
zero, and both rows reported zero warning or error console entries.

This correction changes no schema, migration, protocol, runtime setting,
hosting binding, Site, hosted data, access, DNS, or custom domain.
