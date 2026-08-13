# Public profile presentation

The default is an Aitta's profile rather than an editorial page. Every human
public route—configured and unconfigured home, published permalink, Privacy,
Technical, temporary storage-unavailable, and not-found—uses one compact
product frame:

1. a 60-pixel single-line header containing the bounded profile display name
   and one
   quiet `Manage` action for local sole-owner administration;
2. the configured Identity, with a shallow accent field, initials tile,
   display name, short description, optional public details, and About content;
3. one continuous, identity-linked, deterministic newest-first update stream;
   and
4. a restrained shared footer containing the owner-hideable AittaSocial
   attribution, a permanent GitHub source link, the public Privacy page, and
   a real Technical destination followed by the concise Manifest, Profile, and
   Updates resource links.

The frame itself is pure presentation: routes pass it already-projected display
values, profile attribution choice, and destination. It does not read D1,
runtime configuration, or authentication. Privacy and Technical therefore stay
D1-independent; the safe not-found fallback neither reads nor infers profile
attribution. A route that already has a configured public profile alone applies
the owner-selected powered-by preference. The fixed
header action is never substituted with a page-specific return or setup action.

`/technical` is a fixed, D1-independent human index of the protocol 1.0
discovery manifest, public profile, and published-update collection. It uses
the same restrained public information-page composition as Privacy, carries
neutral `noindex, nofollow` metadata, and links to the exact machine routes
without copying their JSON into the page. The machine resources remain
directly usable and secondary to the configured profile; their paths, payloads,
errors, cache policies, and protocol fields are unchanged.

A permalink is the focused view of the same update stream rather than a
separate editorial page. These presentation changes do not alter a machine
resource response, metadata projection, query, schema, or migration.

## Identity composition

The public canvas uses warm cream `#f3f0e8`, off-white `#fffcf5`, near-black
green `#181b17`, moss-grey `#667067`, and warm-stone `#d9d5c9`. Public shells
scope their exact surface variants. The composition remains visually separate
from the private owner workspace, while both surfaces reuse the small semantic
paper, raised-paper, ink, muted-text, separator, focus, and action vocabulary.
Public identity and navigation use the one Geist-derived sans-serif family.

The Identity begins with a solid configured accent field. Two clipped CSS
forms—one light circular form and one darker softened rectangle—supply the
default graphic language without an image, gradient, remote asset, upload, or
new profile field. They are decorative and hidden from the accessibility tree.
A rounded-square initials tile crosses the field boundary. It derives up to two
Unicode letters or numbers from the first and last display-name words, or the
first two useful characters of a one-word name. The tile is also decorative
because the adjacent h1 carries the complete Identity.

At phone sizes the field is 96 pixels high, the tile is 80 pixels, and the
display name is 1.875rem (30 pixels). At 768 pixels and above they become 120,
96, and 2.375rem (38 pixels). The full heading wraps anywhere; only the
repeated header name may ellipsize, while retaining its complete text as its
accessible name. Phone outer gutters, profile padding, update padding, and
source-row gaps use the reviewed fixed 8/12/16-pixel rhythm, so enlarged text
does not also double those principal non-text spaces. Smaller typographic
margins may still scale with the surrounding text.

Location, website, and up to eight external links render only when present.
Each detail is a wrapping row with a 44-by-44-pixel link target; external
public links stay native anchors and carry `me noopener noreferrer`. If every
optional detail is absent, no empty aside, separator, placeholder, or reserved
column is rendered.

About shows an introduction of at most 220 Unicode characters in full. Longer
content shows a useful summary ending at a word or line boundary when one
exists after the first 120 characters, followed by a native 44-pixel
`Read full About` disclosure containing the complete unchanged introduction.
This retains keyboard operation and all owner content without client state or
silent truncation. An empty historical introduction renders no About region.

## Update stream and focused views

The homepage stream remains at most 700 CSS pixels wide inside the existing
732-pixel padded public column. It is one ordered list on a single off-white
surface. Thin separators, rather than a sequence of floating cards, distinguish
updates. Every item repeats a 40-pixel initials tile, the complete wrapping
display name, and a human-readable linked publication time. The source name is
a native link back to the configured Identity. A non-note also carries the
quiet, human-readable Article, Announcement, or Link label when that context is
useful; Note is omitted because its body already explains the content form.

Notes lead with their complete body at the ordinary 16-pixel public text scale.
A saved note title, when present, follows the body as a quiet permalink
affordance; an absent title creates no replacement headline. Articles and
announcements may lead with a 20–24-pixel linked title and show a bounded
Unicode-aware excerpt. Link updates follow the same restrained hierarchy and
show their complete destination in a wrapping native anchor with
`noopener noreferrer`. The time already provides a clear permalink path when a
title is absent. There are no sequence numbers, generic Read calls to action,
or inert social controls.

Published permalinks repeat the 40-pixel source tile, source name, useful kind,
and full publication time directly above the content. A native header action
and a native footer action both return to the public profile. Article titles remain
moderate and article bodies use a comfortable 66-character reading measure.
Notes remain at the same ordinary scale as the stream. Every note permalink has
one visually hidden semantic h1, `Update from {display name}`, while its body
remains the visual lead; an optional stored title appears only once, quietly,
after the body. An untitled non-note likewise receives a source-based hidden h1
instead of an invented visible headline. Safe destination links remain beside
the content, while View as JSON stays in the secondary permalink footer.

Historical published rows can exist before a profile is configured. Their
source uses the bounded compatibility fallback `Independent Aitta` without
pretending that a profile exists. The same fallback is used only where a
generic public or entry title needs an application name and no usable
configured display name exists. Configured display names, descriptions, and
About content remain authoritative owner content and are never rewritten.
Public presentation never invents profile data from the setup product name,
request host, runtime configuration, or update content.

## Content states

Before an Identity exists, the reusable template keeps its established setup
semantics: the exact README prompt remains in a labeled, selectable, read-only
field; the compact header exposes the same normal local owner destination; and
any published updates still use the published-only query. A successful D1 read
with no profile is the only condition that selects this state. D1 failure still
renders the fixed temporary-unavailable state rather than setup guidance.

An Aitta with a configured profile remains intentional with no published
updates. Its Identity and About content stand on their own before the compact
explicit empty state, which names the application as this Aitta. Configured
public navigation and sole-owner management labels likewise use Aitta, while
`profile` remains the term for outward presentation. One update uses the same
continuous container as many updates, and all
four supported kinds keep the same source-first structure. Drafts never affect
public hierarchy, counts, links, or wording.
Optional Hub availability never selects or modifies any public state.

## Accepted owner-managed website composition

TASK-187 defines a future bounded website replacement model without changing
the current presentation. Until its follow-on implementation tasks land, the
profile and update stream remain the homepage and there is no custom page,
shell, design, CSS, or upload control.

The accepted model separates three owner-published concerns:

- `PageDocumentV1` is safe semantic content. It supplies one page title plus
  bounded sections, headings, paragraphs, lists, link groups, inline emphasis,
  code, and links. The first page slice deliberately excludes images, custom
  shell content, homepage selection, and CSS.
- `SiteShellV1` later adds bounded brand text, page-aware navigation, footer
  groups, footer text, and a selected homepage around the common public frame.
  It composes with fixed Manage, Privacy, Technical, GitHub, Manifest, Profile,
  and Updates destinations rather than replacing them.
- `SiteDesignV1` later adds validated palette, system typography, content
  width, corner, and spacing. A still-later version may add compiled page-body
  style rules. Neither becomes a runtime component registry, template engine,
  global stylesheet, or owner-workspace theme.

HTML and CSS are optional import formats only. The owner sees the normalized
page or compiled style result before publication. Raw source is not rendered,
retained as hidden executable content, or applied to the owner workspace.
Custom JavaScript, forms, embeds, third-party resources, remote fonts, and
remote assets are unsupported.

Published custom pages use normalized direct paths such as `/about` or
`/work/projects`. The system reserves authentication, owner, API, discovery,
Privacy, Technical, entry, update, asset, framework, and static paths. Page
navigation refers to stable page identity so a reviewed path publication can
update destinations without accepting arbitrary internal URLs.

The current profile/update root remains the default. A later explicit published
homepage selection may render one published custom page at `/`; the established
profile and update stream then remains at `/updates`. Clearing the selection
restores the default. Draft editing never changes the published page, shell,
design, homepage, metadata, or navigation. Unavailable or invalid customization
falls back to fixed safe product presentation, never a partially rendered
document.

The representative replacement shape requires responsive section navigation,
a hero, substantial grouped text, lists/cards, calls to action, contact links,
custom shell/footer content, and eventually one same-origin raster asset. It is
an abstract acceptance shape only; no reference-site identity, copy, stylesheet,
or asset is copied. The PageDocument `flow`, `split`, and `cards` compositions
must cover that shape while collapsing to one readable phone column.

A later asset slice may add normalized JPEG, PNG, WebP, and AVIF content after
an accepted R2 boundary and explicit hosted-binding approval. Images require a
meaningful bounded alternative text. Remote URLs, SVG/scriptable assets,
original upload passthrough, custom fonts, and a generic media manager remain
outside the presentation model.

The detailed types, bounds, threat controls, route behavior, metadata, asset
ownership, migration approach, and the one exact first implementation row are
recorded in
`docs/acceptance/task-187-safe-owner-managed-website.md`. Later outcomes are
promoted one independently useful slice at a time after current evidence is
reviewed; they are not current capability.

## Accessibility and responsive behavior

Source order matches reading and focus order: shared navigation, one Identity
h1, optional detail and About regions, Updates, then the shared technical
footer. All routes use native anchors. The header stays one unwrapped line at
320 pixels; the profile display name is the only flexible item and the short visible
management label retains the complete sole-owner-administration accessible
name. It is not fixed or sticky and therefore cannot obscure focused content.

Public frame padding is 16 pixels or the larger device safe-area inset on each
edge. Public interactive targets retain at least 44 by 44 CSS pixels, the
existing two-layer focus indicator, and a system Highlight outline in forced
colors. Decorative identity forms disappear in forced colors, while the field
and tile retain system-visible boundaries. Long names, descriptions,
translated text, About content, labels, source names, hosts, URLs, titles, and
update copy wrap rather than widen the page.
A non-note source row may stack its quiet kind and date below the source at the
phone breakpoint, and its metadata receives a bounded wrapping measure. This
keeps the repeated identity visually primary and prevents enlarged metadata
from squeezing it into an unreadable sliver.
A 320-pixel viewport remains equivalent to a 1280-pixel desktop reflowed at 400
percent. Reduced-motion preferences still disable smooth scrolling and all
animation or transition.

The setup prompt remains a native read-only textarea. Its visible label and help
text preserve manual selection and platform copy commands. Its existing
two-column layout becomes one column at 900 pixels, while the shared header
remains compact at every width.

The configured accent remains a constrained preference rather than a theme or
arbitrary style input. New owner writes still accept and store only a six-digit
hex color, and protocol 1.0 returns that exact stored preference. One shared
resolver derives the `--accent` used by the public home, permalink, and owner
preview without writing it back to D1. It keeps a valid color only when it has
at least 4.5:1 contrast against `#eef0eb`, still the darkest supported light
surface; otherwise it deterministically moves the value toward `#31554d`.
This also keeps the initials tile's white text readable. Invalid historical
values fail closed to that reviewed default. Forced colors remain browser-owned
and the application never disables system color adjustment.

## Owner Identity journey

The visually distinct owner workspace uses a neutral 60-pixel application
header with `Manage` and a quiet `View Aitta` public-view link. A separate, horizontally
scrollable, non-wrapping route bar contains exactly three destinations: Home,
Identity, and New update. `Sign out` stays in the compact private-workspace
footer rather than becoming a route destination or menu item. The accepted
`displayName` shell input remains compatible with callers but authenticated
ChatGPT display names are not rendered.

Owner Home presents fresh, incomplete, and complete Identity readiness derived
from saved server state. It renders exactly one state-derived primary action:
Identity setup while fresh, Identity repair while incomplete, first-draft
creation or resume while unpublished, and public preview after the first
publication. Its `Your Aitta` heading and `Aitta summary` label describe the
local application, while `Identity` and `profile` continue to name its outward
presentation. One compact `owner-next-step` panel combines status, guidance,
the existing two-step native progress semantics, and the effective public URL
when present. It contains no competing action. Counts, update rows, update
actions, and their unchanged update-state text remain available below in a compact sans-serif
hierarchy; the empty state does not reserve a large blank panel.

## Owner update composer

The compact owner composer keeps required update text first. Its Kind control
changes only plain-language guidance: Note is a short update; Article is a
fuller update; Announcement is time-sensitive; and Link requires both text
that explains the destination and a complete destination URL. Article and
Announcement say that a title helps readers, while every kind makes optional
fields explicit. Link uses the native required state for its destination; the
server remains the authority for all existing validation.

Changing Kind never removes, clears, or remounts entered text, title, or
destination values. This lets an owner compare kinds before saving without
losing work. The body remains the primary field and the guidance stays within
the existing compact, bounded owner form at phone and desktop widths. The
composer retains its existing private-draft, definitive-failure, and
unknown-result recovery copy and behavior.

The Identity route makes its four required values the first editing task:
display name, short description, canonical URL fallback, and longer
introduction. They sit in one bounded primary fieldset before optional public
details and one compact secondary Appearance block. Location, website,
external links, accent, density, and attribution retain their complete existing
payload and remain secondary.

Optional public details use one native `details` disclosure before Appearance.
Its visible summary names the three public categories and shows the concise
current count, such as “1 of 3 added.” The fields remain mounted while the
section is closed, so values, native labels, browser validation, and save
payloads do not change. Existing optional values open the section by default;
an invalid optional URL or a field-specific server error reopens it before the
owner is asked to correct that detail. The disclosure has a 44-pixel-or-larger
summary target, wraps long text, becomes a one-column form at phone widths, and
uses the shared focus, forced-colors, and reduced-motion behavior. Its native
disclosure marker remains visible as the open/closed affordance.

The Appearance block places the three restrained choices beside one transient
appearance sample. For a valid stored accent, the color control continues to
show its exact normalized six-digit preference while the sample uses the shared
contrast-safe resolver. An invalid historical accent is never passed into the
native color control: it shows the reviewed safe fallback and requires the owner
to choose a replacement before any save. Loading, editing another field, or
reloading therefore cannot rewrite that historical D1 value. Update spacing switches the two sample rows
between the existing comfortable and compact choices. Hiding the optional
attribution removes it from the sample while the explicit `Attribution · Hidden`
summary keeps that choice understandable. No theme, free-form color/CSS input,
or additional persisted presentation value is introduced.

The sample says **Saved appearance** when it reflects an existing loaded
profile, **Appearance not saved** before a profile exists, and **Unsaved
preview** after any form value changes. The unsaved message says that the open
choices remain temporary until Save Identity succeeds. Restoring every control
to its exact loaded value returns the saved or not-saved label when no
historical accent replacement has been selected. A deliberate replacement of
a malformed historical accent remains unsaved even when it equals the displayed
fallback. Both the sample and the form-wide save strip therefore identify
persistence in text rather than through color alone.

The readiness panel is explicitly server-saved. A separate saved/unsaved strip
compares every current form value with its exact loaded baseline: all required
fields, location, website, the complete external-links text, canonical URL,
accent, density, and attribution checkbox. Changing any value marks the form
unsaved; restoring every value exactly restores its loaded state unless the
owner has selected a deliberate historical accent replacement. Input events
update only transient in-memory preview values, the two appearance summaries,
and the local four-field count; none is presented as readiness or durability. A
successful save reloads `/owner/profile` so the server derives readiness again.
Reloading before success discards the local edits. The saved and live accent
preview continues to use the same derived `--accent` as public rendering,
including its border, label, and native progress accent. For a valid stored
accent, the color input represents the owner's stored preference rather than
the derived rendering color. For a malformed historical value, it instead
shows the safe fallback and remains replacement-required until the owner
operates the control; that deliberate replacement remains unsaved even when it
equals the fallback.

The normalized effective public URL is shown as compact secondary text with a
safe protected-setting or saved-Identity explanation. Raw runtime
configuration, request hosts, ChatGPT identity, drafts, and Hub state never
become Identity defaults. At 320 pixels the route bar remains one line and may
scroll horizontally, the three-column summary remains compact, and bounded
owner panels stack where necessary. Native links, buttons, and fields retain
keyboard focus behavior and at least 44-pixel interactive height. The 60-pixel
header also accounts for a device safe-area inset at its top edge.

The canonical field is always named `Canonical URL fallback`. When a protected
runtime canonical URL is effective, plain text says that it is currently public
and cannot be changed in this form; saving writes only the D1 fallback. Without
a valid protected value, the normalized saved fallback is effective. A
malformed legacy stored value is never used as a form default or transient
preview; a valid normalized runtime value becomes the safe fallback default
instead. This lets an unrelated Identity or presentation save proceed without
serializing the malformed value. In that substitution case, the form explicitly
says the stored fallback is invalid, the effective protected runtime URL has
been prefilled, and saving will replace the invalid D1 fallback. It does not
describe the substituted value as already saved or claim that every form value
came from D1. If neither the stored nor runtime value is valid, the canonical
field is empty and the loaded-state strip explicitly says that the invalid,
nonblank saved fallback was omitted; it does not claim the sanitized form
exactly matches D1. An exactly empty saved fallback remains an exact empty
baseline. The raw invalid value is never rendered. Raw protected values are
never sent to the browser.

Native required and URL constraints are checked before a request. A definitive
4xx response keeps all values in place, associates recognized server details
with their controls through `aria-invalid` and `aria-describedby`, moves focus
to the first affected control, and states that no save occurred. A rejected
fetch or 5xx response remains ambiguous: the submit control is disabled and a
native `Reload saved Identity before retrying` link is exposed. This prevents a
second request from the uncertain page while preserving the open inputs for
comparison. There is no automatic retry, automatic save, timeout, beacon, or
browser-storage recovery state.

The body-first owner update composer makes the text the first and largest
control, followed by the existing kind, optional title, and optional
destination fields. One short saved-state explanation distinguishes a new or
existing private draft from an already public update. The form has one save
action and a native return path to the Aitta; publishing and deletion remain
separate existing update actions. All four kinds and the exact accepted title,
body, and destination values continue through the unchanged create and edit
payloads. The bounded editor surface is 760 pixels at most, becomes a single
column on a phone, wraps long text and errors, and retains native 48-pixel
fields plus the shared 44-pixel buttons and focus treatment.

The composer performs native required, length, and URL checks before sending a
request. A definitive 4xx response maps recognized `body`, `title`, `entryKind`,
and `destinationUrl` details back to their controls, preserves every current
value, focuses the first affected field, and permits a corrected retry. A
rejected fetch or 5xx response is deliberately unconfirmed: the open values
remain visible, another save is disabled, and the owner must reload the saved
update or check the Aitta's saved updates before retrying. This is especially
important for a new POST, whose first request may already have created a draft.
No automatic or background retry, browser-storage recovery, or publication is
added.

Repeated update rows give each action a bounded owner-visible text label plus
the complete collision-free stable entry identifier in its accessible name,
while keeping concise visible labels. Their lifecycle statement makes **Draft**
plainly owner-only and **Published** plainly readable on this Aitta; it also
states that unpublishing returns the same update to a private draft. Publishing
opens a native, update-specific confirmation that says the update will become
publicly readable at its permalink. A supervising ChatGPT must pause for the
human owner's explicit approval before accepting it. State controls announce
their pending result. A 4xx response gives a definitive rejected-request
outcome without claiming the update's current state, and permits a corrected
later choice. A rejected fetch or 5xx response is
unknown: it locks further publication-state requests from that rendered state,
exposes the native `Check this Aitta’s current saved state` link, and
does not retry automatically. Editing and deletion remain separately available
actions. These additions use the existing button, focus, touch-target, wrapping,
320-pixel, effective 400-percent-zoom, and reduced-motion rules.

## Review checklist

The focused automated contract renders zero, one, and many updates plus
representative note, article, link, and announcement fixtures. It verifies
newest-first semantic order, body-first notes, moderate titled kinds, repeated
source identity, safe destinations, focused permalinks, neutral unconfigured
source identity, draft/unknown parity, and public-only projection using long
unbroken, translated, draft, owner, credential, and row canaries. Source
assertions cover the 700-pixel content bound, 40-pixel repeated tile,
44-pixel route and destination targets, overflow wrapping, reduced-motion
behavior, forced-colors fallback, and numeric focus-color contrast. These
checks do not claim browser geometry by themselves.

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
