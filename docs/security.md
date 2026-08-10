# Security and trust boundaries

AittaSocial separates public publishing, local owner administration, and
optional network discovery. A successful Sign in with ChatGPT identifies a
visitor to this Site; only this deployment decides whether that visitor is its
one local owner. Neither the presence nor Hub may reinterpret that decision as
trusted network authentication or network membership.

## Boundaries

| Boundary | Trusted for | Never trusted for |
| --- | --- | --- |
| Anonymous or signed-in browser | Rendering public output; submitting validated owner forms | Identity headers, owner claims, destination URLs, write authorization, secrets |
| ChatGPT Sites dispatcher | Injecting authenticated-user headers and operating sign-in routes | Establishing local owner status or AittaSocial network identity |
| AittaSocial server code | Validating inputs, authorizing each operation, projecting public data, using protected settings | Assuming an earlier page check covers a later write |
| Deployment-owned D1 | Persisting validated profile, entry, and minimal local configuration records | Producing a safe public response without an explicit projection |
| Protected runtime settings | Supplying local owner and optional Hub configuration to server code | Browser-visible configuration or publishable content |
| AittaSocial Hub | Optional registration, discovery, verification, credentials, and future network sessions | Availability required for public reads; trusted claims from a presence deployment |
| This presence deployment | Its own profile, updates, presentation, and local owner actions | Network-user authentication or authority over another deployment |

ChatGPT Sites access policy is a hosting boundary. Keeping a Site private during
setup is important, but private hosting does not replace application-level
authorization. Every write still performs the same owner check that will be
used after a public release.

## Local owner authorization

Version one supports exactly one owner and no fallback administrator.

For each owner page, server action, or private API request, server code must:

1. Read `AITTA_SOCIAL_OWNER_EMAIL` from protected runtime configuration.
2. Normalize it using the same trim-and-case normalization applied to the
   authenticated email. An empty or syntactically invalid configured value is
   treated as missing.
3. Obtain the authenticated ChatGPT identity only through the Sites-provided
   server authentication helper or trusted forwarded headers.
4. Require a non-empty normalized authenticated email that exactly matches the
   normalized configured owner email.
5. Reject the operation before reading or mutating owner-only data when any
   check fails.

An anonymous browser can be redirected through dispatch-owned Sign in with
ChatGPT for an owner page; private APIs reject rather than redirect. A signed-in
non-owner receives no administrative data or write capability. If the owner
setting is missing, all writes are disabled and the interface explains how to
use protected Site settings without printing an email or configuration value.

Do not infer `AITTA_SOCIAL_OWNER_EMAIL` from a Sites project owner, editor,
access-policy record, or workspace account. Those hosting identities can differ
from the verified email returned by Sign in with ChatGPT. The intended owner
must enter the verified ChatGPT email directly in protected settings and verify
the match by reaching the owner surface; neither value is displayed.

Do not send the configured email to a client for comparison. Hidden controls,
client route guards, form fields, cookies created by application code, and
browser-supplied headers are not authorization. A dashboard check does not
authorize a subsequent profile or entry mutation: every mutation repeats the
server-side check.

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

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, and `/callback`.
The presence must not implement those routes or a general OAuth/OIDC client.
Sign-in return locations are same-origin relative paths. Human-facing entry to
this flow must identify sole-owner presence administration and must not imply
AittaSocial network sign-in or membership.

## Route exposure

- `/`, `/entries/{id}`, `/.well-known/aitta-social.json`, and `/api/v1/*` are
  anonymous-compatible and expose only the public profile or published entries.
- `/owner`, `/owner/profile`, `/owner/entries/new`,
  `/owner/entries/{id}`, and `/owner/hub` require current server-side owner
  authorization.
- `/api/private/*` is not a public API. Every request independently requires
  current server-side owner authorization and strict method, media-type, and
  input validation.

The public HTML and API behavior must be identical for a draft identifier and
an unknown identifier. Draft counts, identifiers, titles, timestamps, errors,
and pagination effects are private.

## Write validation and data access

- Enforce an exact same-origin/CSRF check on every mutation before processing
  it. When `Origin` is present, require it to match the server request origin
  exactly. When it is absent, require the browser-controlled
  `Sec-Fetch-Site: same-origin` signal. Opaque, malformed, cross-site, and
  otherwise unverified requests fail closed.
- Bound every request body before parsing it; do not trust `Content-Length` as
  the only limit. Then parse unknown input through a strict schema that rejects
  unknown enum values, oversized strings, unsupported URL schemes, invalid
  timestamps, malformed identifiers, and extra security-sensitive fields.
  Private JSON bodies are limited to 64 KiB of UTF-8; the Hub probe is bodyless
  and rejects any supplied body.
- Treat profile introduction and entry body as text. Escape it during HTML
  rendering; do not accept executable markup in the POC.
- Permit only reviewed `http:` or `https:` destinations for public website,
  external-link, and entry-link fields. Apply safe link behavior in HTML.
- Normalize the canonical deployment URL once at a server write boundary. A
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
  replace the stored value. Project only editable fields into the client form;
  a successful private write returns no profile serialization.
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
  Authorization, same-origin enforcement, body bounds, and validation happen
  even when the trusted interface made the request.

Worker runtime code uses only supported web and Cloudflare APIs. It must not
depend on Node built-ins, filesystem access, a durable process, or mutable
module/process state for correctness or authorization.

## Public projection safety

Public serializers are allowlists, not omission filters. Tests should seed
owner identity, draft content, deployment credentials, runtime canaries, and
hosting/database canaries, then assert that none appears in public HTML, JSON,
headers, URLs, errors, counts, or logs.

The discovery manifest conditionally exposes only the configured Hub
verification challenge. The challenge is intentionally public and proves only
that a deployment could be changed at verification time. It must never be used
as a bearer credential or owner session.

Protocol 1.0 also requires the stored `accountType` in the discovery manifest
and `/api/v1/site`. Ordinary HTML does not display it. Legacy supported values
remain public and are unchanged by profile edits, while the server inserts
`other` for a new profile; no value is an authorization decision, verified
identity category, capability claim, Hub assertion, or network-membership
signal. Both JSON surfaces continue to construct the field through their exact
allowlists.

## Public document metadata and identity assets

Document metadata is a public projection, not a copy of a profile or D1 row.
The presence page may read only the bounded public display name and short
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
social image. A later approved source edit may add only a direct checked-in
asset with an accessible text alternative. Do not resolve an asset from a
request value, profile URL, remote response, or protected setting, and do not
add an upload endpoint, R2 bucket, runtime asset registry, or generic media
abstraction for this boundary.

## Hub boundary

Hub is an optional trusted central service, but a presence deployment is an
untrusted external website from Hub's perspective. Local ChatGPT authentication
claims from this presence must not be sent to Hub as proof of a network user.

The protected Hub probe follows these constraints:

- `AITTA_SOCIAL_HUB_URL` must parse as an HTTPS origin with no username,
  password, path beyond `/`, query, or fragment.
- The browser supplies no Hub destination. Server code derives the request only
  from the protected configured origin.
- The deployment credential is read only on the server and sent only in an
  `Authorization: Bearer ...` header to that exact origin.
- Redirects are not followed with the credential. A redirect is categorized as
  a reachable response, not as permission to contact another origin.
- The request has a short timeout, asks for JSON, and never reads, relays, or
  logs the response body.
- The owner sees only `connected`, `credentialRejected`, `reachable`, or
  `unavailable`. Safe messages contain no URL details, headers, response body,
  stack, credential fragment, or environment value.
- A timeout, DNS failure, invalid response, missing configuration, or Hub
  outage cannot change the status of public presence or update reads.

This manual challenge and root bearer probe is provisional Hub setup owned by
the presence POC. It must remain labeled as such until an accepted versioned
Hub contract replaces it. Its internal `connected` result is transport-only;
it is not registration, a verified connection, network membership, a network
session, or trusted authentication.

## Secrets and operational output

Treat `AITTA_SOCIAL_OWNER_EMAIL` and
`AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL` as protected values. Treat Hub and
canonical configuration as server-owned even when their non-secret effects are
public. Never include protected values in HTML, hydration data, client bundles,
URLs, thrown messages, telemetry, snapshots, fixtures committed to the
repository, or deployment output.

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
asset packaging, manifest canary exclusion, deterministic pagination, Hub URL
pinning, redirect confinement, credential/error/log redaction, timeout
behavior, and public reads during Hub failure.

Use explicit request fixtures or a development-only identity injection boundary
in tests. Never add a production bypass, magic owner address, or client-only
authorization mode.
