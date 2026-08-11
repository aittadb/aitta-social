# TASK-154 compact public frame acceptance

TASK-154 replaces the configured public page's editorial opening with the
shared AittaSocial presence frame. It changes public markup and scoped CSS only.
The homepage's update-card implementation remains the input to TASK-155; the
published permalink's article body and controls are likewise unchanged inside
the new frame.

## Fixed public composition

The homepage and permalink use the same product-specific server component for:

- a safe-area-aware 60-pixel header that never wraps, fixes, or sticks;
- a flexible, ellipsizing presence name whose complete DOM text remains its
  accessible name;
- one short native action with an explicit accessible destination; and
- a quiet shared footer containing the existing owner-hideable AittaSocial and
  source attribution plus manifest, profile JSON, and updates JSON links.

The configured homepage additionally renders one bounded Identity region:

- a 108-pixel phone and 120-pixel larger-screen solid derived-accent field;
- exactly two clipped, same-accent CSS forms, both decorative;
- an 88-pixel phone and 96-pixel larger-screen rounded-square initials tile
  crossing the field boundary;
- a sans-serif 32-pixel phone and 38-pixel larger-screen display name;
- the complete short description;
- only the location, website, and at most eight saved external links that
  actually exist; and
- a concise About region, using a native disclosure for introductions longer
  than 220 Unicode characters and retaining the complete original text.

The CSS geometry requires no image, SVG, upload, external request, gradient, or
client script. Essential text is never placed on a derived lighter or darker
shape. White tile text uses only the base accent already constrained by the
shared rendering resolver. Decorative shapes disappear in forced colors while
system-visible field, tile, and focus boundaries remain.

## Behavioral and privacy evidence

Focused server-rendered coverage proves:

- shared home and permalink headers and footers keep native routes and
  separately labeled primary and technical navigation;
- signed-out and signed-in management destinations preserve the current local
  sole-owner meaning while the visible phone label is shortened;
- a long multilingual Identity derives the expected two-letter tile, wraps its
  complete name and description, renders all eight external links with
  `me noopener noreferrer`, and keeps the full long About text in a keyboard
  disclosure;
- absent location, website, external links, and an empty historical
  introduction render no detail aside, About region, placeholder, or reserved
  column;
- the owner-hideable attribution still hides the complete software/source
  reference without removing public technical resources;
- configured, unconfigured, unavailable, published-permalink, draft/unknown
  not-found, non-owner, and missing-owner HTML retain their existing safe
  selection and authorization behavior;
- long public values and hostile markup stay escaped, and draft, profile-row,
  owner-setting, authentication, and credential canaries remain absent; and
- the fixed CSP, no-store HTML behavior, canonical metadata, public APIs,
  protocol projection, and native route-navigation boundary are unchanged.

Source contracts additionally pin the 60-pixel unwrapped frame, safe-area
padding, 44-pixel actions/details/disclosure/footer links, phone and larger
Identity dimensions, anywhere wrapping, reduced motion, forced-color fallback,
absence of gradients, and contrast of every supported derived accent against
the complete light-surface set.

## Scope boundary

The private owner workspace retains its markup and established selectors. New
public rules use `public-`, `presence-`, and existing permalink scopes; shared
owner classes such as `button`, `text-link`, `eyebrow`, and `entry-meta` are not
restyled for the new Identity. The unconfigured deployment prompt and
temporary-unavailable state keep their established meaning and data selection.

There is no schema or migration change, no new profile field, no API, protocol,
metadata, cache, CSP, authentication, authorization, privacy, or runtime-setting
change, and no Hub, sibling-repository, package, Site, hosted data, protected
setting, access, DNS, domain, or deployment operation. The complete rendered
viewport and assistive-technology matrix remains the accepted TASK-156
integration proof after TASK-155 supplies the final update stream.
