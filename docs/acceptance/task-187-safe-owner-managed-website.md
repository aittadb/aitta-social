# TASK-187 safe owner-managed website refinement

## Outcome

This refinement accepts a bounded Aitta-specific website customization model.
It does not implement that model. The current profile, update stream, public
routes, owner routes, database, bindings, and deployed behavior remain
unchanged.

The customer outcome is that a sole owner can bring the content structure and
visual identity of an existing public website into the owner's Aitta without a
repository fork, source edit, or redeployment. The representative reference
shape is a substantial responsive site with a brand header, section
navigation, a hero, text and list content, grouped cards, calls to action,
contact links, a footer, and a raster identity image. No reference-site content,
identity, source, stylesheet, or asset is copied into this repository.

The model is deliberately not a general website framework. It is three
versioned Aitta-owned documents plus bounded same-origin assets:

- `PageDocumentV1` describes safe semantic page content;
- `SiteShellV1` describes public brand text, navigation, footer content, and
  the selected homepage;
- `SiteDesignV1` describes validated public design tokens; a later version may
  add optional compiled page-body style rules; and
- asset metadata lives in D1 while normalized binary bytes live in one
  deployment-owned R2 binding accepted by a later upload task.

These documents are explicit domain records, not a generic settings blob,
template, plugin registry, component loader, or executable extension point.

## Current boundaries inspected

- `app/page.tsx` and `app/entries/[id]/page.tsx` render the current public
  profile and published updates through React.
- `app/_components/PublicPresenceFrame.tsx` owns the current public header and
  footer. `app/owner/_components/OwnerShell.tsx` owns the private owner frame.
- Static public, owner, authentication, discovery, API, Privacy, Technical,
  entry, and framework routes already occupy protected path namespaces.
- `profiles` and `entries` are the only current D1 tables. Profile and entry
  writes use sole-owner authorization, same-origin checks, bounded JSON,
  validation, and prepared statements.
- The Worker places one fixed policy on handler-produced HTML. It currently
  allows framework inline script and inline style while rejecting script
  attributes, objects, framing, and mixed content.
- Public metadata and protocol resources use configured-canonical URLs and
  explicit projections. Draft entries remain indistinguishable from unknown
  entries.
- The current deployment has no R2 binding and no upload or media behavior.

## Threat model

The owner is authorized to choose public content, but imported source is still
untrusted. It can include compromised dependencies, copied third-party code,
malicious snippets, accidental secrets, active URLs, inaccessible structure,
or content too large to process safely. A compromised owner browser must not
be able to turn a permissive importer into a persistent same-origin execution
primitive.

| Threat | Required control |
| --- | --- |
| Inline or referenced JavaScript executes with the owner's same-origin session and calls private mutation APIs. | Never store or render executable nodes. Do not use `dangerouslySetInnerHTML`. `PageDocumentV1` rendering exhaustively creates reviewed React elements from validated values. Custom JavaScript is unsupported. |
| Event attributes, SVG, MathML, forms, frames, metadata, or DOM-clobbering names regain active behavior. | The HTML importer rejects unsupported elements and attributes before producing the canonical document. Raw markup never enters a public or owner document. |
| Imported CSS loads a tracking resource, obscures required links, overlays an owner control, creates fake fixed UI, defeats reflow, or consumes excessive selector work. | Parse CSS into a small declaration model, scope it to the custom page body, allow only reviewed selectors, properties, values, and media conditions, and render no raw stylesheet text. It never applies to owner, access, error, Privacy, Technical, or mandatory system-link chrome. |
| A custom path shadows authentication, owner, API, discovery, framework, asset, or established content routes. | Normalize paths at the write boundary and reject every reserved first segment or reserved exact path. Static system routes always win. |
| A draft page leaks through its route, metadata, shell links, asset paths, errors, counts, or timing-dependent wording. | Public queries use published snapshots only. Draft and unknown paths have the same generic HTML status and metadata. Page and shell publication reject references to unpublished pages or missing fragments. |
| Request hosts or imported canonical tags select public identity. | Drop imported head metadata. Construct every canonical or sharing URL from the normalized configured canonical URL and the validated published path. |
| Remote images, fonts, styles, embeds, or imports track visitors or change after review. | Import performs no network fetch. Public page resources may reference only normalized same-origin assets owned by the Aitta. |
| An uploaded file is scriptable, mislabeled, oversized, decompression-heavy, metadata-bearing, or later served with a dangerous type. | Accept only a small raster allowlist, verify bytes and decoded bounds, normalize before storage, generate immutable identifiers, set an exact type plus `nosniff`, and never serve original upload bytes. |
| Malformed or future-version D1 JSON bypasses current validation. | Parse stored JSON as `unknown` on every owner and public read. Unknown versions fail closed without exposing the stored value or partially rendering it. |
| A failed publish response causes an automatic duplicate or inconsistent retry. | Page, shell, design, and asset mutations use the existing definitive-error versus unconfirmed-result recovery rule and never retry automatically. |

Owner authorization reduces who may submit customization but does not replace
these controls. An owner-authored public page shares an origin with owner
administration, so persistent same-origin script execution would be a complete
authorization-boundary failure.

## Persisted document contracts

The following shapes are the implementation contract. Exact TypeScript names
may move into feature-owned modules, but their meanings and closed unions must
not be generalized.

```ts
type PageDocumentV1 = {
  schemaVersion: 1;
  title: string;
  description: string | null;
  sections: PageSectionV1[];
};

type PageSectionV1 = {
  fragment: string | null;
  layout: "flow" | "split" | "cards";
  blocks: PageBlockV1[];
};

type PageBlockV1 =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; content: PageInlineV1[] }
  | { type: "list"; ordered: boolean; items: PageInlineV1[][] }
  | { type: "linkGroup"; links: PageLinkV1[] }
  | { type: "group"; layout: "flow" | "split" | "cards"; blocks: PageBlockV1[] };

type PageInlineV1 =
  | { type: "text"; text: string }
  | { type: "strong"; content: PageInlineV1[] }
  | { type: "emphasis"; content: PageInlineV1[] }
  | { type: "code"; text: string }
  | { type: "link"; label: string; destination: PageContentLinkTargetV1 };

type PageLinkV1 = { label: string; destination: PageContentLinkTargetV1 };

type PageContentLinkTargetV1 =
  | { kind: "fragment"; fragment: string }
  | SiteLinkTargetV1;

type SiteLinkTargetV1 =
  | { kind: "page"; pageId: string; fragment: string | null }
  | { kind: "updates" }
  | { kind: "external"; url: string };

type PagePreviewInputV1 = {
  schemaVersion: 1;
  title: string;
  description: string | null;
  htmlFragment: string;
};
```

The renderer supplies the page's single visible `h1` from `title`; imported
content cannot create another `h1`, `main`, page header, navigation, footer, or
document head. Section fragments use normalized lowercase ASCII tokens, are
unique within the page, and cannot start with an Aitta-reserved prefix.
Page-to-page links use stable server-generated page identifiers rather
than browser-selected paths. External links accept reviewed `https:` and, only
where explicitly useful for contact content, `mailto:` and `tel:` destinations;
credentials, control characters, script/data/blob/file schemes, and imported
link relationship attributes are rejected. The renderer owns safe `rel`
behavior.

TASK-188 accepts one `PagePreviewInputV1` JSON body. It trims the separately
entered title and description, requires a non-empty title, maps an empty
description to `null`, parses `htmlFragment`, and returns the normalized
`PageDocumentV1`. The fragment does not supply document metadata. A `#fragment`
anchor maps to `kind: "fragment"`; exact `/updates` maps to `kind: "updates"`;
reviewed absolute contact/public URLs map to `kind: "external"`. Page-ID links
and every other relative path are rejected during TASK-188 because no persisted
page identity or trusted resolver exists. A later persistence slice may enable
`kind: "page"` only by resolving an existing server-generated identifier.

```ts
type SiteShellV1 = {
  schemaVersion: 1;
  brandLabel: string | null;
  homePageId: string | null;
  navigation: SiteNavigationItemV1[];
  footerGroups: SiteFooterGroupV1[];
  footerText: string | null;
};

type SiteNavigationItemV1 = {
  label: string;
  destination: SiteLinkTargetV1;
};

type SiteFooterGroupV1 = {
  heading: string;
  links: SiteNavigationItemV1[];
};
```

`brandLabel: null` uses the public profile display name. `homePageId: null`
retains today's profile-and-updates homepage. Custom navigation and footer
content compose around, but cannot remove, rename into ambiguity, cover, or
restyle away the local sole-owner Manage destination and the Privacy,
Technical, and GitHub destinations. The fixed Technical group continues to
expose Manifest, Profile, and Updates. The existing powered-by control affects
only its current attribution.

```ts
type SiteDesignV1 = {
  schemaVersion: 1;
  palette: {
    canvas: string;
    surface: string;
    text: string;
    mutedText: string;
    accent: string;
    accentText: string;
    separator: string;
  };
  typography: {
    family: "system-sans" | "system-serif" | "mixed";
    scale: "compact" | "balanced" | "spacious";
  };
  composition: {
    contentWidth: "reading" | "standard" | "wide";
    cornerStyle: "square" | "soft" | "round";
    sectionSpacing: "compact" | "balanced" | "spacious";
  };
};

type ScopedPageStyleV1 = {
  styleKey: string;
  target: "self" | "heading" | "text" | "list" | "link";
  declarations: PageStyleDeclarationV1[];
  media: "all" | "narrow" | "wide";
};
```

No inactive style-key field is stored by the first page slice. The later
compiled-CSS slice introduces a new page/design document version and adds one
normalized `styleKey` only to the exact eligible section/block nodes, together
with an explicit migration/reader decision. It must not add a caller-controlled
property bag or use the owner token as an application class. Rendering maps it
to a generated namespaced selector under one custom-page-body root.

`PageStyleDeclarationV1` is a closed property/value union, not a string map.
The compiled style model may represent only:

- typography: validated color, system-family token, bounded font size/weight,
  line height, letter spacing, text alignment, and text decoration;
- surfaces: validated color, border color/style/width, bounded radius, and a
  bounded non-interactive shadow;
- spacing and size: bounded padding, margin, gap, and max width; and
- composition: block/flex/grid display, wrapping, direction, alignment, and
  reviewed one-to-three-column templates that always use `minmax(0, …)`.

It must not represent custom properties, `url`, imports, font faces, images,
generated content, counters, `attr`, environment values, arbitrary functions,
unbounded calculations, display-none or visibility hiding, opacity below the
reviewed readable threshold, fixed/sticky/absolute positioning, z-index,
pointer-event changes, overflow clipping, minimum widths, viewport-locked
heights, filters, transforms, transitions, animations, or print rules. The
only media variants are product-owned narrow and wide breakpoints. Forced
colors and reduced motion remain application/browser owned.

An owner may paste CSS as import source, but a standards-aware parser must map
only supported class-based style keys, semantic targets, and the declarations
above into `ScopedPageStyleV1`. A selector may contain one style key and at most
one reviewed descendant target. IDs, attributes, universal selectors,
combinator chains, pseudo-elements, and functional pseudos are rejected. The
raw stylesheet is not stored or rendered. Regex replacement is not an HTML or
CSS parser and is not an accepted implementation.

## D1 ownership and publication lifecycle

The accepted program uses explicit records rather than extending the profile
row or introducing a generic key/value store. The first implementation adds
only `custom_pages`; later independently accepted slices add the other records:

- `custom_pages` owns a server-generated stable identifier, normalized draft
  path, optional published path, normalized draft document JSON, optional
  published document JSON, and timestamps;
- `site_customization` is a checked singleton whose named columns own
  normalized draft/published shell JSON and draft/published design JSON; and
- a later asset slice adds `custom_assets` metadata and explicit page-asset
  references while R2 owns only normalized binary bytes.

Draft editing never mutates a published snapshot. Publishing copies already
validated normalized draft values into published columns in one D1 transaction
or batch. A rejected or 5xx result is unconfirmed and requires a saved-state
reload before retry. Unpublishing clears only the published snapshot after
checking published-page, shell, homepage, and asset references. A page selected
as the public home cannot be unpublished or deleted until another public home
is selected.

Page and shell publication reject page or fragment targets that do not resolve
to a published snapshot. Publishing, moving, unpublishing, or deleting a page
or fragment also rejects any resulting broken inbound reference from another
published page, the published shell, or the selected homepage. Public rendering
reads only published columns and parses them from `unknown`. Unknown versions,
corrupt records, missing referenced pages, and storage failures produce a fixed
safe unavailable state; they never fall back to raw JSON, draft values, or
partially valid nodes.

The model initially supports at most:

- 64 pages per Aitta;
- eight path segments, 64 characters per segment, and 240 characters for the
  complete normalized path;
- a feature-local 192 KiB import request and 128 KiB of normalized JSON, 64
  sections, 1,024 total block/inline nodes,
  nesting depth five, 100,000 text characters, and 128 links per page;
- 200 characters for a title or heading, 500 for a description, 10,000 for one
  text/code node, 200 for a link label, 2,048 for an external URL, and 64 for a
  normalized fragment; and
- 12 primary navigation items, three custom footer groups with eight links
  each, and 500 footer-text characters;
- 32 KiB of normalized design JSON, 128 compiled style rules, 512 total
  declarations, and 32 distinct style keys.

Inputs fail as a whole when a bound is exceeded. Truncation never silently
changes meaning. The implementation may choose lower bounds only if rendered
acceptance proves the representative replacement shape still fits and the
contract record is updated before code lands.

Shell labels/text and design-token values receive their own exact field bounds
when those later slices are promoted; TASK-188 neither accepts nor persists
them.

## Route and homepage decisions

Published custom pages use direct human paths such as `/about` and
`/work/projects`; they are not forced under a product prefix. Each segment is a
lowercase ASCII slug consisting of letters, digits, and single interior
hyphens. The write boundary rejects empty, dot, dot-dot, percent-ambiguous,
Unicode-lookalike, encoded-separator, and non-normalized variants.

The following first segments or exact paths remain reserved regardless of the
framework's current route precedence:

- `_next`, `api`, `owner`, `entries`, `updates`, `assets`, `privacy`,
  `technical`, `.well-known`, and `cdn-cgi` as first segments;
- `signin-with-chatgpt`, `signout-with-chatgpt`, and `callback` as first
  segments;
- exact `robots.txt`, `sitemap.xml`, `favicon.ico`, and
  `manifest.webmanifest` paths;
- any leading underscore or dot segment; and
- any later system/static path added to the same reviewed central reserved set.

The path validator and router share one product-owned reserved-path module.
Every non-normalized inbound spelling—including percent-encoded unreserved
characters or separators, repeated/trailing slashes, dot normalization,
Unicode, and case variants—and every reserved path returns the generic static
404 before a custom-page D1 read or renderer call. Tests must prove this using
the raw request URL despite any framework preprocessing.
Custom pages cannot claim `/`. Selecting a published `homePageId` renders that
page at `/`; its stored path returns a bodyless origin-relative `307 Temporary
Redirect` with `Cache-Control: no-store` to `/`, and page-ID
links resolve to `/`. Clearing the selection restores today's profile/update
homepage. While a custom homepage is selected, the unchanged Aitta
profile-and-update view remains available at `/updates`. When no custom home is
selected, `/updates` returns the same bodyless origin-relative no-store `307`
to `/` to avoid duplicate indexed content.

Changing a page's draft path does not move its published route. Publishing the
new path moves the public route, makes the old route generic not-found rather
than an unbounded redirect history, and updates page-ID navigation resolution.
The owner must explicitly confirm path publication and is shown the affected
navigation destinations.

Every successful canonical URL is the normalized configured Aitta URL plus the
published path. The selected homepage uses the configured root. Request `Host`
and forwarding headers never choose a path authority, redirect authority,
canonical, or asset URL. Framework/system routes win even if corrupt stored
data contains a reserved path.

## HTML import and rendering

An HTML fragment is an optional owner input format, not a storage or rendering
format. A maintained Worker-compatible HTML parser must build a real tree.
The v1 importer accepts only exact `section`, `h2`, `h3`, `h4`, `p`, `ol`,
`ul`, `li`, `strong`, `em`, `code`, and `a` tags, plus an annotated `div`
group described below. It maps those nodes into the closed document union.
Images remain unsupported until the
separate asset boundary exists; that later slice must introduce a new document
version rather than hide an inactive image variant in v1.

Consecutive top-level blocks outside a `section` form one implicit `flow`
section with no fragment. A `section` defaults to `flow`; it may carry only
`data-aitta-fragment="canonical-token"` and
`data-aitta-layout="flow|split|cards"`. A `div` is accepted only with the
single `data-aitta-layout` attribute and maps to a group. A `p` may instead
carry the empty boolean `data-aitta-link-group` attribute and then contain only
links separated by whitespace; it maps to `linkGroup`. An `a` carries only
`href`. Every other element and every other attribute, including an unknown
`data-*` attribute, rejects the whole fragment. Comments may be discarded.

Full HTML documents are rejected rather than partially accepted. The owner or
an assisted migration must deliberately decompose document head, header,
navigation, footer, and body input into page, shell, design, metadata, and
asset decisions. The importer never guesses those boundaries.

It rejects the whole import when it encounters an unsupported or ambiguous
element or attribute, including `html`, `head`, `body`, `main`, `header`,
`footer`, `nav`, `h1`, `script`, `style`, `link`, `meta`, `base`, `form`, form
controls, `iframe`, `object`, `embed`, `portal`, templates, SVG, MathML, media,
canvas, event attributes, inline style, arbitrary `id`/`name`, `srcset`, active
URLs, or remotely fetched resources. The error identifies the unsupported
category without reflecting source markup.

The canonical owner editor serializes the normalized document back to a safe
editable form. Raw source may remain visible only as escaped text in the
current owner input; it is not injected as markup/style or retained in a hidden
raw column. The public renderer uses an exhaustive switch over `PageBlockV1` and
`PageInlineV1`, creates React elements, and escapes all text and attributes. It
must never use `dangerouslySetInnerHTML`, an iframe, `srcdoc`, a template
runtime, dynamic component lookup, or code evaluation.

## Asset boundary

Assets are a separate vertical slice because they introduce a binary store and
hosting binding. D1 remains authoritative for asset identity, owner state,
media type, dimensions, byte size, content digest, timestamps, and page
references. One deployment-owned R2 bucket owns only normalized bytes. The R2
binding remains absent until the owner approves the specific hosting mutation;
page, shell, and design behavior must remain usable without it.

The first asset slice accepts only JPEG, PNG, WebP, and AVIF raster input. It
rejects SVG, GIF, HTML, XML, PDF, fonts, archives, video, audio, and types that
do not match verified magic bytes. Each upload is at most 8 MiB and 16 million
decoded pixels; each Aitta has at most 128 retained assets. The server must use
an accepted Worker-compatible normalization pipeline to decode, apply
orientation, remove metadata, and re-encode before storing. If that pipeline or
the approved R2 binding is unavailable, upload fails closed; original bytes are
never published as a fallback.

Object keys and public asset identifiers are server generated and immutable.
Draft assets require owner authorization. A public `/assets/{id}` read succeeds
only for normalized bytes referenced by a currently published page or shell,
uses the exact stored safe type, `X-Content-Type-Options: nosniff`, a content-
derived ETag, and `Cache-Control: no-store, must-revalidate` so unpublication
can withdraw the application-served representation. Missing, draft-only,
deleted, and unknown identifiers have the same public response. Replacement
creates a new identifier. Deletion is rejected while any draft or published
document references the asset and never occurs automatically after an
unconfirmed result.

Publication cannot recall bytes already fetched by a visitor. The owner UI
must state that public asset publication discloses the bytes even though later
unpublication removes them from application reads.

Custom fonts, remote URLs, proxy fetching, browser-selected R2 keys, public
uploads, multipart passthrough, a generic media library, and executable assets
remain outside this model.

## CSP, metadata, caching, protocol, and privacy

- Existing profile and entry fields remain plain text and keep their exact
  renderers and public JSON projections.
- Page import creates no script. Custom JavaScript, script URLs, event
  attributes, executable assets, and third-party embeds remain unsupported.
- The normalized design renderer may emit only application-generated style
  variables and declarations. Raw CSS never reaches `<style>` or a `style`
  attribute. Page-body rules cannot select common shell or system chrome.
- Adding same-origin raster assets requires an explicit CSP decision for
  `img-src 'self'`; it does not broaden `connect-src`, `script-src`,
  `style-src`, `font-src`, `frame-src`, `object-src`, or `form-action`.
- Handler-produced custom pages and reversible public asset reads remain
  dynamic and `no-store, must-revalidate`.
- A published page's metadata is an explicit projection of its bounded title,
  description, published path, and optional reviewed published raster asset.
  Imported head elements and arbitrary metadata are unsupported. Draft,
  unknown, corrupt, and unavailable pages use identical neutral noindex
  metadata and no canonical or image URL.
- Custom page, shell, design, and asset owner APIs remain under
  `/api/private/*`; they are not public AittaSocial protocol resources. A
  published custom human document uses its own unversioned canonical URI for
  both HTML and its current hypermedia JSON representation through the proven
  bounded `Accept` policy; it does not create a `/api/v1/pages/*` route unless
  a separate accepted versioned-integration task later requires one.
- The implemented protocol 1.0 manifest and TASK-179 profile resource remain
  discovery boundaries while the entry resources await their accepted
  pre-release v1 tasks. A later published custom homepage does not change their
  public allowlists or create a second versioned API. The profile resource's
  `rel: social.aitta.profile` link continues to identify the Aitta root,
  whether that root presents the default profile or an explicitly published
  custom homepage.
- Public pages remain independent of Hub. Import never fetches the reference
  website or another Aitta at request time.

## Accessibility and common-frame rules

The semantic document supplies one main landmark and one visible `h1` before
the document sections. Heading levels cannot skip upward into an invalid
outline. Images require non-empty bounded alternative text; decorative images
are represented by design, not by an empty-alt content block. Link labels must
be non-empty and distinguishable in context. Navigation labels and fragment
targets must be unique.

The shared shell retains the one skip target, native anchors, logical source
and focus order, visible two-layer focus treatment, at least 44-by-44 CSS-pixel
interactive targets, text wrapping, 320-pixel operation, 400-percent reflow,
forced-color ownership, reduced-motion behavior, and no sticky obstruction.
Validated design colors must meet 4.5:1 for normal text and 3:1 for large text,
focus, controls, and meaningful boundaries. A design save that cannot derive
the required contrast pairs is rejected rather than silently published.

Custom page-body composition can choose flow, split, or cards, but every layout
must collapse to one readable column without horizontal scrolling. System
Privacy, Technical, source, owner-management, and unavailable/not-found content
remain semantically and visually usable even when a custom design record is
invalid or absent. Safe fallback never renders an unvalidated partial design.

## Migration, upgrade, and rollback

Implementation uses additive reviewed migrations. Existing profile and entry
rows are not rewritten. A deployment upgraded without any customization row
renders byte-for-byte equivalent current public behavior aside from deliberate
shared-frame work already accepted elsewhere. Older application source ignores
the new tables; rollback therefore restores the default profile/update
experience without deleting custom drafts or published snapshots.

Every persisted JSON document has `schemaVersion: 1`. New application versions
must keep a v1 reader or add an explicit migration before writing another
version. Runtime request handlers never create, alter, repair, or rewrite
schema or unknown documents. Migrations must prove fresh, current populated,
customized populated, rollback-compatible, corrupt-document, and unknown-
version fixtures. Asset binding and R2 objects are not created, deleted, or
changed by a D1 migration.

## First implementation row

This is the one exact next row produced by the refinement. It is independently
useful: an owner can test whether real source fragments normalize safely into
the accepted content model before any persisted or public capability exists.
The integration owner promotes this row to `PLAN.md` while preserving its
identifier and direct dependencies. Later work is deliberately not preloaded
into the active queue.

### TASK-188 — Safely import and preview one custom-page fragment

Implement the pure bounded HTML-fragment-to-`PageDocumentV1` compiler and one
authorized owner import/normalized-preview journey. It stores and publishes
nothing.

**Depends on:** TASK-182, TASK-187.

**Exclusive ownership:** new `lib/custom-pages/**`, new
`app/api/private/pages/preview/route.ts`, `app/owner/pages/import/**`, one
owner-specific navigation entry in
`app/owner/_components/OwnerShell.tsx` after TASK-182, a feature-owned preview
style module, a pinned Worker-compatible HTML-parser dependency if review
confirms it is required, and focused importer/preview tests and acceptance
documentation. Do not change D1/schema/migrations, public routes, profile/entry
contracts, root-home selection, public-frame composition, design/CSS, assets,
or hosting.

**Binary DoD:** an authorized sole owner can enter a bounded title, optional
description, and HTML fragment; receive and inspect the exact normalized
`PageDocumentV1`; and see the same document through an exhaustive escaped
preview. Exact default/annotated layout, fragment, link-group, same-page
fragment, updates, and external-link mappings work while relative page links
remain unavailable without a trusted resolver. Unsupported full documents,
shell/header/nav/footer source, active/unknown elements or attributes, hostile
and malformed URLs, malformed trees, duplicate fragments, and every byte/node/
depth/text/link bound fail as one safe non-reflective error; raw input appears
only escaped in its owner textarea and never as interpreted HTML/style,
hydration markup, logs, or a persisted value; the preview endpoint enforces
owner authorization, exact same origin, JSON media type, its feature-local body
bound, strict output allowlist, and no outbound fetch; non-owner/missing-owner,
injection/private canaries, denial, parser differentials, long/unbroken and
representative flow/split/cards content, native safe links, 320/390/1440
widths, 400-percent reflow, keyboard/focus/touch, forced colors, reduced motion,
no overflow, and clean console are proven; the production dependency audit and
full repository/diff gates pass without persistence or external mutation.

## Later sequence, not active rows

After TASK-188 is integrated and its evidence is reviewed, promote only the
next independently useful outcome. The accepted order is private page draft
persistence, page publish/unpublish and public routing, configurable
`SiteShellV1` header/navigation/footer, explicit custom-home selection, non-CSS
`SiteDesignV1` tokens, compiled page-body CSS, and finally bounded same-origin
raster assets. Each promotion receives the next unused task ID, audited binary
DoD, and exclusive ownership based on the then-current code. Do not reserve IDs
or preload those rows now.

The asset outcome additionally requires an owner-approved R2 provisioning task
before hosted upload proof. That external task must name the exact source
commit, Site, binding, disposable proof data, rollback/cleanup, and forbidden
production mutations. TASK-187 grants neither hosted approval nor authority to
copy real customer content.

## Refinement validation

TASK-187 changes only instructions and living/refinement documentation. It
introduces no route, dependency, runtime behavior, schema, migration, binding,
asset, Site operation, deployment, data mutation, setting, access change, DNS,
domain, Hub operation, or sibling-repository change.

Required checks for this commit are:

- `npm run agents:check`;
- `npm run plan:check`;
- documentation/security-focused repository tests selected after reviewing the
  diff; and
- `git diff --check` plus a manual changed-file boundary review.

The full implementation and production dependency gates belong to each
follow-on vertical slice and remain mandatory there.
