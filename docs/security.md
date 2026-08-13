# Security and trust boundaries

AittaSocial separates public publishing, local owner administration, and
optional network discovery. A successful Sign in with ChatGPT identifies a
visitor to this Site; only this Aitta deployment decides whether that visitor is
its one local owner. Neither the Aitta nor the AittaSocial Hub may reinterpret
that decision as trusted network authentication or network membership.

## Boundaries

| Boundary | Trusted for | Never trusted for |
| --- | --- | --- |
| Anonymous or signed-in browser | Rendering public output; submitting validated owner forms | Identity headers, owner claims, destination URLs, write authorization, secrets |
| Verified ChatGPT Sites ingress | Forwarding the documented signed-in visitor context and operating sign-in routes, but only after that origin's ingress behavior is established | Application-level cryptographic proof, local owner status, machine authentication, or AittaSocial network identity |
| AittaSocial server code | Validating inputs, authorizing each operation, projecting public data, using protected settings | Assuming an earlier page check covers a later write |
| Aitta-owned D1 | Persisting validated profile, entry, accepted page, and minimal local configuration records | Producing a safe public response without an explicit projection |
| Protected runtime settings | Supplying local owner, canonical URL, and optional public verification challenge to server code | Browser-visible configuration beyond documented public effects or publishable content |
| Future AittaSocial Hub contract | Optional registration, discovery, verification, credentials, and future network sessions | Current implementation authority; availability required for public reads; trusted claims from an Aitta deployment |
| This Aitta deployment | Its own profile, updates, presentation, and local owner actions | Network-user authentication or authority over another Aitta deployment |

ChatGPT Sites access policy is a hosting boundary. Keeping a Site private during
setup is important, but private hosting does not replace application-level
authorization. Every browser-owner write still performs the same owner and
same-origin checks that will be used after a public release.

## Sites identity provenance

The current bundled OpenAI Sites authentication reference documents that a
signed-in visitor receives `oai-authenticated-user-id` and
`oai-authenticated-user-email`. It describes the user ID as stable for the same
user and Site but different across Sites, and describes email and name as
display or contact data. An optional non-empty full name may be forwarded as
percent-encoded UTF-8 only with the matching encoding header. Sites dispatch
owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, and `/callback`; the
application does not implement them.

That reference does not document a signed assertion, issuer, audience,
signature, public key, expiry, nonce, or request binding visible to this
application. It also does not state that caller-supplied identity headers are
stripped or overwritten on every Sites-provided or custom origin. The source
code can parse a header value but cannot establish who inserted it. Header
provenance is therefore an ingress property, not an application-level
cryptographic fact.

The current Aitta deployment relies on Sites-managed ingress for browser sign
in, but that reliance remains externally unverified for the current origins.
TASK-190 owns a separately approved, read-only absent/forged/normal-session
matrix. Until that evidence exists, do not describe the raw headers as secure,
cryptographically authentic, or independently verified by AittaSocial. Tests
that inject headers prove only application policy after an identity context is
supplied; they do not prove the production ingress. A non-Sites production
mode must not treat raw `oai-*` headers as identity. The explicit development
fixture remains development-only and production ignores it.

This is a current limitation, not a check already enforced by the raw-header
parser. `getChatGPTUser()` cannot determine request provenance and current
authorization code proceeds from the values it receives. Verified per-origin
Sites ingress is therefore an unresolved deployment assumption for current
browser administration and a prerequisite for any future
`SitesAuthenticationContext`; adding an adapter alone cannot create that proof.

## Local owner authorization

Version one supports exactly one owner and no fallback administrator.

For each owner page, server action, or private API request, server code must:

1. Read `AITTA_SOCIAL_OWNER_EMAIL` from protected runtime configuration.
2. Normalize it using the same trim-and-case normalization applied to the
   authenticated email. An empty or syntactically invalid configured value is
   treated as missing.
3. Establish the Sites ingress prerequisite for the deployed origin, then
   obtain the authenticated ChatGPT identity through the Sites-provided server
   helper; never infer provenance from a raw forwarded-header value.
4. Require a non-empty normalized authenticated email that exactly matches the
   normalized configured owner email.
5. Reject the operation before reading or mutating owner-only data when any
   check fails.

An anonymous browser can be redirected through dispatch-owned Sign in with
ChatGPT for an owner page; private APIs reject rather than redirect. A signed-in
non-owner receives no administrative data or write capability. If the owner
setting is missing, all browser-owner writes are disabled and the interface
explains how to use protected Site settings without printing an email or
configuration value.

Do not infer `AITTA_SOCIAL_OWNER_EMAIL` from a Sites project owner, editor,
access-policy record, or workspace account. Those hosting identities can differ
from the verified email returned by Sign in with ChatGPT. The intended owner
must enter the verified ChatGPT email directly in protected settings and verify
the match by reaching the owner surface; neither value is displayed.

Do not send the configured email to a client for comparison. Hidden controls,
client route guards, form fields, cookies created by application code, and
browser-supplied headers are not authorization. A dashboard check does not
authorize a subsequent profile or entry mutation: every browser-owner mutation
repeats the server-side owner and same-origin checks.

Identity readiness is also a server decision, not an authentication shortcut.
Each authorized owner page derives it from the current D1 profile and the
existing normalized effective-canonical resolver: no profile is fresh, a
profile without an effective canonical URL is incomplete, and only both
together are complete. It never derives display name, description, canonical
URL, or defaults from ChatGPT identity headers, drafts, request host headers, or
Hub state. Unsaved form progress exists only in the current browser component
and cannot make a later request appear complete.

First-update guidance is derived only after that same owner check. Incomplete
Identity keeps the Identity action primary. Complete Identity plus no entries
offers a new private draft; entries with no published record resume an existing
stable draft; any published record offers public preview and its permalink.
The milestone uses bounded prepared state queries ordered by creation time and
stable identifier, rather than inferring existence from the capped management
list. The dashboard performs no onboarding write and grants no authority to
the linked editor or action controls: create, edit, publish, unpublish, and
delete requests each repeat the established server-side owner, origin,
media-type, size, and validation checks. Hub failure cannot promote a state or
block these local D1 decisions.

## Supervised browser assistance

ChatGPT may control the normal owner interface only through the human owner's
existing foreground browser session. It is not a principal: there is no agent
credential, agent route, prompt-derived permission, source mutation endpoint,
or production authorization bypass. Closing the browser session or losing the
owner match removes the same access it would remove from a human-operated page.

The native publication confirmation is a human approval boundary, not another
authentication factor. A browser-controlling ChatGPT must pause before
accepting it and ask the owner for explicit approval of that update. The
server-side publication request still independently enforces owner
authorization, same origin, JSON media type, body bound, state validation, and
the prepared D1 update; a manipulated client or accepted dialog cannot bypass
those checks.

A rejected fetch or 5xx response is ambiguous because D1 may have committed
before the browser lost a usable success response. Owner controls therefore
never claim the record stayed unchanged in either case. They retain unsaved
inputs, re-enable the controls, announce that the result could not be confirmed,
and offer a native saved-state recovery link. The owner or assistant reloads
and inspects that server-rendered state before any retry. A 4xx validation or
authorization response uses its safe response category, re-enables the control,
and does not show the ambiguous-result recovery link.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, and `/callback`.
The Aitta must not implement those routes or a general OAuth/OIDC client.
Sign-in return locations are same-origin relative paths. Human-facing entry to
this flow must identify sole-owner Aitta administration and must not imply
AittaSocial network sign-in or membership.

## Machine clients

No machine credential or machine write endpoint currently exists. A machine
client can read the anonymous protocol 1.0 resources but cannot gain owner
authority by sending `oai-authenticated-user-*` headers, copying a browser
cookie, supplying an email in JSON or a query, or naming itself ChatGPT or
Codex. Supervised browser assistance remains the only current ChatGPT-assisted
write path.

The planned versioned JSON API v1 keeps machine authentication in a separate typed
adapter from Sites browser authentication. TASK-191 is the accepted first
write slice: one deployment-local service actor may use protected current/next
opaque bearer-secret slots and only the `entries:write` scope to create one
server-forced private draft through `POST /api/v1/entries`. The credential
identifies neither ChatGPT nor the human owner, grants no `/owner` or existing
private-API access, and is useful only to the specific normalized canonical
Aitta deployment and audience that issued it. Missing, malformed, expired,
revoked, wrong-audience, wrong-scope, local-production, and unverified machine-
deployment modes fail closed.

Action discovery is cache-separated from authentication. The normal anonymous
`GET /api/v1/entries` response retains its reviewed public cache and empty
actions. A valid service credential receives a `no-store` response with the
create action; any presented invalid credential receives an explicit `no-store`
401, while an authenticated wrong-scope credential receives `no-store` 403.
Every collection variant uses
`Vary: Accept, Authorization`, and the machine POST is always `no-store`, so a
shared cache cannot replay an authenticated action to an anonymous caller or
hide one behind a cached anonymous response.

Rotation uses bounded current and next credential slots with explicit expiry;
revocation removes the accepted slot without changing content. Each attempted
operation repeats scope, state, media, size, validation, and prepared-storage
checks and records a bounded D1 audit event with credential ID, machine actor,
operation, target identifier, outcome category, correlation ID, and timestamp.
Never store or log the raw secret, Authorization header, request body, owner
email, ChatGPT identity, or response content. A discoverable hypermedia action
does not authorize its invocation. The exact credential lifecycle, audit
migration and hosting-secret authority must land in that same vertical task.
TASK-191 remains blocked from hosted completion until the owner explicitly
approves the exact target Site and protected current/next secret-slot setup;
this planning text creates no credential and authorizes no setting or hosting
change. No edit, publish, unpublish, delete, credential-minting, or other
machine operation is accepted.

## Route exposure

- `/`, `/entries/{id}`, `/.well-known/aitta-social.json`, and `/api/v1/*` are
  anonymous-compatible and expose only the public profile or published entries.
- `/owner`, `/owner/profile`, `/owner/entries/new`, and
  `/owner/entries/{id}` require current server-side owner authorization.
- `/api/private/*` is not a public API. Every request independently requires
  current server-side owner authorization and strict method, media-type, and
  input validation.
- `/api/v1` is the only versioned integration surface for this unpublished
  first release. Its accepted tasks may reshape pre-release response contracts
  with exact tests and protocol documentation; `/api/v2` is not planned. This
  does not turn a browser-private route into a machine route.

An implemented published custom page may later occupy a validated non-reserved
human path. Authentication, owner, API, discovery, Privacy, Technical, entry,
update, asset, framework, and static paths remain system owned. The accepted
path and publication contract is recorded in
`docs/acceptance/task-187-safe-owner-managed-website.md`; this refinement adds
no route.

The public HTML and API behavior must be identical for a draft identifier and
an unknown identifier. Draft counts, identifiers, titles, timestamps, errors,
and pagination effects are private.

## Write validation and data access

- Enforce an exact same-origin/CSRF check on every browser-owner mutation before
  processing it. When `Origin` is present, require it to match the server
  request origin exactly. When it is absent, require the browser-controlled
  `Sec-Fetch-Site: same-origin` signal. Opaque, malformed, cross-site, and
  otherwise unverified requests fail closed.
- The accepted TASK-191 versioned machine POST does not borrow browser same-origin or
  Sites-owner authorization. It independently requires its deployment-bound
  bearer adapter, exact scope and audience, JSON media/body/validation checks,
  and prepared transaction. Browser mode fails closed on missing/invalid owner
  configuration; machine mode fails closed on missing/invalid machine slots,
  deployment mode, canonical audience, scope, or expiry. Neither mode's
  configuration authorizes the other.
- Bound every request body before parsing it; do not trust `Content-Length` as
  the only limit. Then parse unknown input through a strict schema that rejects
  unknown enum values, oversized strings, unsupported URL schemes, invalid
  timestamps, malformed identifiers, and extra security-sensitive fields.
  Existing private JSON mutation bodies are limited to 64 KiB of UTF-8. A
  custom-page implementation may use only its accepted feature-local 192 KiB
  import-body bound and must not broaden another private route.
- Treat profile introduction and entry body as text. Escape them during HTML
  rendering. A future custom-page importer may create only the accepted closed
  non-executable page document; it does not change these text fields.
- Permit only reviewed `http:` or `https:` destinations for public website,
  external-link, and entry-link fields. Apply safe link behavior in HTML.
- Normalize the canonical Aitta deployment URL once at a server write boundary. A
  hosted canonical URL is an HTTPS base without credentials, query, or
  fragment. Do not derive public canonical links from the request host.
- Resolve effective canonical URLs with valid protected runtime configuration
  first and the stored profile URL second. Owner readiness and preview may
  expose only the resulting normalized public URL and a safe source category;
  never serialize an invalid/raw runtime value, credentials, query text, or a
  Host-derived fallback.
- Do not render an owner category control or include `accountType` in the
  private profile-write model. The server inserts the protocol 1.0
  compatibility value `other` for a new profile and leaves the column unchanged
  on updates. Ignore a browser-supplied `accountType`; it cannot select or
  replace the stored value. Project only editable fields into the client form.
  The normalized private Identity write returns a feature-local allowlisted
  `owner-profile` resource containing only those editable fields, canonical
  navigation links, and the verified owner's current `edit` action. It never
  serializes `accountType`, owner identity/configuration, raw D1 rows, runtime
  settings, authentication headers, or another private resource.
- The normalized private draft-create response projects one `owner-entry` with
  only its accepted content, server-owned Draft state/identifier/timestamps,
  same-origin private self and owner-editor links, and the verified owner's
  current edit, publish, and delete actions. It never serializes a D1 row,
  profile fields, owner identity/configuration, authentication headers, runtime
  settings, Hub state, or machine authority. The actions aid discovery but do
  not replace authorization on their separate routes.
- Use prepared D1 statements with bound parameters. Pass one SQL statement to
  each preparation and batch separate statements when an operation must be
  atomic. Never concatenate user input into SQL.
- Apply schema changes only through generated and reviewed migrations before
  runtime access. Worker request code must never create, alter, drop, or repair
  database schema.
- Select the minimum columns needed. Convert database records into explicit
  owner or public domain objects; do not return raw records.
- Use stable server-generated identifiers. A browser may not select or replace
  the identifier of an existing entry.
- Mutating requests accept only their intended method and media type.
  Browser-owner requests repeat owner authorization and same-origin checks;
  the accepted versioned machine request repeats service authentication, audience,
  and scope checks. Both repeat body bounds and validation even when a trusted
  interface made the request.

`PUT /api/private/profile` is the first normalized browser-private JSON
mutation. It runs exact same-origin and current sole-owner authorization before
Accept negotiation, media inspection, body streaming, validation, or D1. Only
bounded `application/json` with an optional UTF-8 charset is accepted. The body
reader stops after 64 KiB before parsing unknown input. Missing or unsupported
media is `415`, malformed/oversized JSON is `400`, valid domain-invalid JSON is
`422`, explicit JSON refusal is `406`, and unsupported methods are `405` with
`Allow: PUT`. Success, authorization, validation, storage, and unexpected
responses are structured JSON with `Cache-Control: no-store` and `Vary:
Accept`. This browser-private contract is not discovery, machine authority, or
a public profile resource.

The Identity client requests and validates that exact JSON success resource
before navigating to the server-rendered saved state. A rejected 4xx response
is definitive and may expose only allowlisted field messages. A failed fetch,
5xx, unexpected success status, non-JSON success, or malformed success document
is unconfirmed: the client retains the open form, disables another save, and
requires a server-state reload before retrying.

`POST /api/private/entries` applies that policy independently: exact same
origin and current sole-owner authorization precede Accept, media, body, and D1;
missing or unsupported media is `415`, malformed or oversized JSON is `400`,
valid domain-invalid JSON is `422`, explicit JSON refusal is `406`, and every
unsupported method is `405` with `Allow: POST`. Its private browser-navigation
links are safe relative paths, so creation requires no public profile or
canonical setup and never uses request Host or forwarding headers. Every
response is structured JSON, no-store, and varies on `Accept`. A safe
`500` deliberately treats the creation result as unconfirmed because the
prepared insert may have committed before a later failure; authorization and
validation failures perform no mutation. Unsupported methods remain exact JSON
`405` responses even when `Accept` is missing, excluded, or malformed; only an
authorized `POST` negotiates `406`. The client treats only an exact bounded 4xx
error document as definitive and bounds the response stream before parsing, so
a redirect, malformed response, invalid success document, or storage failure
cannot enable a duplicate retry. Draft state remains absent from every public
HTML and v1 projection.

`PUT /api/private/entries/{id}` applies the same bounded browser-private policy
without changing publication state. Same-origin and sole-owner authorization
run before Accept, media, body, parameters, or D1; denial returns an allowlisted
JSON category without reading the request stream or target. Accepted JSON is
bounded to 64 KiB and validated as unknown input before the prepared update.
The response projects only the stable identifier, editable values, retained
state/timestamps, relative private navigation, and the verified owner's
currently applicable edit, publish-or-unpublish, and delete actions. It never
serializes a raw row, private canary, request host, owner identity, protected
configuration, or machine authority. An unknown target is a safe structured
404; unexpected authorization-setting, storage, or post-write failure is a
non-reflective 500 whose result is deliberately unconfirmed. Every normalized
edit response is no-store and varies on Accept. Neighboring unsupported methods
advertise the actual `PUT, DELETE` methods, but DELETE retains its existing
authorization, response bytes, and negotiation behavior until its own task.
Unsupported neighboring methods always return structured JSON `405` with exact
`Allow: PUT, DELETE`; only an authorized PUT can reach `406` negotiation.

The edit client accepts success only from an exact bounded `200` owner-entry
document matching the stable identifier, state, and normalized kind, title,
body, and destination submitted by the current form. A
well-formed structured 4xx is definitive and may return only recognized field
messages. An invalid success document, redirect, non-JSON response, oversized
response, failed fetch, or 5xx remains unconfirmed, disables another save, and
requires the owner to reload the server-rendered saved update before retrying.

Worker runtime code uses only supported web and Cloudflare APIs. It must not
depend on Node built-ins, filesystem access, a durable process, or mutable
module/process state for correctness or authorization.

## Accepted owner-managed website boundary

TASK-187 refines a future owner-managed website replacement model without
implementing it. Imported markup, stylesheets, and assets remain untrusted even
when the sole owner submits them. This is necessary because public content and
private owner administration share an origin: persistent script execution
could make same-origin authorized mutations and would defeat the owner
boundary.

The only accepted content representation is a versioned closed
`PageDocument`. An HTML fragment is an optional import format parsed as a tree
into that document. The importer rejects document/head/chrome nodes, scripts,
styles, forms, frames, embedded objects, SVG, MathML, event attributes, inline styles,
DOM-clobbering identifiers, active URL schemes, remote resources, unknown
semantics, and every size/depth/count overflow. Raw input is not retained in a
public field or rendered through `dangerouslySetInnerHTML`, `srcdoc`, a
template runtime, dynamic component lookup, or code evaluation. Full documents
must be deliberately decomposed into page, shell, design, metadata, and asset
inputs; the importer never guesses those boundaries. The renderer
exhaustively creates reviewed React elements and escapes their values. Custom
JavaScript is unsupported.

A versioned `SiteShell` may add bounded brand, navigation, and footer content.
It cannot remove, cover, rename into ambiguity, or restyle away the local
Manage destination or Privacy, Technical, and GitHub. Page links use stable
page identifiers and validated fragments; external contact links use an exact
scheme allowlist. Shell publication rejects missing or unpublished targets.

A versioned `SiteDesign` owns validated public tokens. Optional CSS is also
only an import format: a standards-aware parser compiles accepted class-based
page-body selectors and a closed property/value union into typed rules. Raw CSS
never enters D1 or rendered HTML. Compiled rules cannot target common shell,
system, owner, access, error, Privacy, or Technical markup and cannot express a
resource URL, import, font face, generated content, hidden control, fixed
overlay, z-index, pointer-event change, overflow trap, animation, or unbounded
layout. Regex replacement is not an accepted HTML or CSS parser.

Draft and published values are separate normalized snapshots. Public routes,
metadata, shell links, assets, errors, and counts read only published values;
draft, deleted, corrupt, unknown-version, and unknown paths fail closed without
an existence signal or partial fallback. Publishing repeats owner, exact
same-origin, media-type, body, schema, and prepared-query checks. A failed or
5xx result is unconfirmed and never automatically retried.

Custom routes use normalized lowercase path segments and reject every reserved
system prefix—including Cloudflare `/cdn-cgi`, authentication dispatcher
names, and conventional metadata/static filenames—before persistence and again
before routing. Non-normalized or encoded-separator variants return the generic
404 before D1/custom rendering. Canonical and
sharing URLs use only the normalized configured Aitta URL plus the published
path. Imported canonical, metadata, base, redirect, and request-host values are
ignored or rejected.

Same-origin assets are a later, separately accepted boundary. D1 owns metadata
and references; deployment-owned R2 may own normalized raster bytes only after
an explicit owner-approved hosting change. Upload must verify bytes and decoded
bounds, remove metadata through a reviewed normalization pipeline, use immutable
server-generated identifiers, and publish only referenced normalized bytes
with an exact safe type and `nosniff`. Remote fetches, original upload
passthrough, SVG/scriptable formats, public upload, custom fonts, and a generic
media library are not accepted.

The exact document shapes, limits, route reservations, lifecycle, asset rules,
and first independently useful implementation row are recorded in the TASK-187
acceptance record. Each later implementation must add its focused negative,
privacy, migration, accessibility, and rendered evidence before it changes the
current product.

## Public projection safety

Public serializers are allowlists, not omission filters. Tests should seed
owner identity, draft content, deployment credentials, runtime canaries, and
hosting/database canaries, then assert that none appears in public HTML, JSON,
headers, URLs, errors, counts, or logs.

The discovery manifest conditionally exposes only the configured Hub
verification challenge. The challenge is intentionally public and proves only
that an Aitta deployment could be changed at verification time. It must never
be used as a bearer credential or owner session.

Protocol 1.0 also requires the stored `accountType` in the discovery manifest
and `/api/v1/site`. Ordinary HTML does not display it. Legacy supported values
remain public and are unchanged by profile edits, while the server inserts
`other` for a new profile; no value is an authorization decision, verified
identity category, capability claim, Hub assertion, or network-membership
signal. Both JSON surfaces continue to construct the field through their exact
allowlists.

## Public document metadata and identity assets

Document metadata is a public projection, not a copy of a profile or D1 row.
The public profile page may read only the bounded public display name and short
description. A permalink may additionally read only a published entry's bounded
public title or body excerpt and stable identifier; article metadata may also
read its public publication/update timestamps. Draft and unknown identifiers
produce the same non-public metadata;
an entry draft, owner identity, runtime value, private canary, or database field
must never enter a title, description, link, image URL, or serialized head tag.

Canonical and sharing URLs are constructed only from the normalized configured
canonical URL. `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, and other request
headers are untrusted and cannot select identity, origin, or an asset URL. If the
public profile or canonical URL is missing or invalid, emit neutral setup text,
`noindex, nofollow`, and no canonical, Open Graph URL, or image reference. Do
not fall back to the request origin.

All handler-produced HTML, including an owner page and a draft/unknown 404,
remains dynamic with `no-store` and `must-revalidate`; do not freeze D1 profile
or publication state into the build, mutable module state, or a cross-request
application cache. This prevents the application from continuing to serve a
stale draft/public decision, but it cannot recall metadata already retained by
an external crawler or recipient. The versioned JSON endpoints retain their
documented public cache headers, and this rule does not change static-asset
caching.

The default template uses text-only sharing metadata and no logo, favicon, or
social image. A direct checked-in asset remains an accepted source workflow.
A separately accepted custom-page asset slice may use only the bounded
same-origin normalized-raster boundary above; it must not resolve an asset from
a request host, profile URL, remote response, or protected setting.

## Hub boundary

The AittaSocial Hub is optional future infrastructure, and every Aitta
deployment is an untrusted external website from the Hub's perspective. Local
ChatGPT authentication claims from this Aitta must not be sent to Hub as proof
of a network user. Every remote Aitta is untrusted; its profile, content, origin,
and claims confer no local authority.

The only current Hub-related input is the optional public protocol 1.0
verification challenge. It is projected through the manifest allowlist and
proves only control of the deployment at verification time. It never authorizes
a request. The application has no private Hub route, configured Hub origin,
deployment credential, outbound probe, registration, Hub connection, or safe
status category. No browser or server path may invent one before an exact
versioned Hub contract is accepted and promoted to `PLAN.md`. Hub absence or
failure cannot change public profile or update reads.

## Secrets and operational output

Treat `AITTA_SOCIAL_OWNER_EMAIL` and runtime secrets as protected values. Treat
canonical and challenge configuration as server-owned even when their
documented non-secret effects are public. Never include protected values in
HTML, hydration data, client bundles, URLs, thrown messages, telemetry,
snapshots, fixtures committed to the repository, or deployment output.

Errors sent to a browser use fixed safe categories. Server diagnostics may
record an operation category and generated correlation identifier, but not
request bodies, authentication headers, email addresses, credentials, SQL, or
Hub response bodies.

## Required negative tests

At minimum, keep focused tests for anonymous public reads, matching-owner
access, another signed-in user, missing owner setting, every independently
authorized write, forged client fields, draft privacy, exact public projections,
canonical URL rejection/normalization, hostile-host metadata, neutral
unconfigured metadata, draft/private-canary absence from head tags, checked-in
asset packaging, manifest canary exclusion, deterministic pagination, exact
verification-challenge projection, retired Hub-route absence without redirect
or outbound fetch, obsolete-setting canary exclusion from built output, and
public reads without Hub.

Once a custom-page slice is implemented, extend this set with raw-markup/script
and stylesheet injection canaries, reserved and ambiguous paths, draft/unknown
page parity, corrupt and unknown document versions, shell-reference failures,
canonical-host attacks, body/node/depth/style bounds, asset type/sniffing and
draft parity, and proof that customization cannot select owner or system
chrome.

Use explicit request fixtures or a development-only identity injection boundary
in tests. Never add a production bypass, magic owner address, or client-only
authorization mode.
