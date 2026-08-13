# Planned AittaSocial JSON API v2

This document records the accepted successor contract selected by TASK-189.
It is a design input for the bounded TASK-178–181 implementation slices, not
a claim that `/api/v2` exists. The implemented public contract remains
AittaSocial protocol 1.0 in `docs/protocol.md` until a v2 task lands and its
tests and acceptance evidence update the current-capability documentation.

The authentication statements use the local OpenAI-bundled Sites reference at
`openai-bundled/sites/0.1.34/skills/sites-building/references/authentication.md`.
That versioned product reference is distinct from public web documentation.
Exact official searches on 2026-08-13 found no public Sites header-contract
page in the [OpenAI Developers documentation](https://developers.openai.com/),
so the source and limitation are recorded precisely in the TASK-189 acceptance
record. Nothing here treats an undocumented property as a platform guarantee.

## Version and compatibility boundary

Protocol 1.0 and `/api/v1` remain unchanged. In particular, v1 retains its
current object-shaped links, response envelopes, error bodies, cache decisions,
`accountType` compatibility field, pagination, and draft/unknown behavior. The
browser-readable Technical page remains the human entry point. An API path
never negotiates HTML and never redirects to HTML.

The successor base is `/api/v2`. A client must discover available v2 resources
from `GET /api/v2`; it must not infer that a planned route is implemented. The
root advertises a collection or operation only after that route exists in the
same validated source. Canonical links use the normalized configured Aitta URL,
never the incoming request host or forwarding headers.

The v2 work remains local to one Aitta deployment. It does not create a Hub
content authority, reinterpret entries as network events, require Hub
availability, or add a machine credential by itself.

## Closed representation

A successful singleton resource has exactly these top-level members:

```json
{
  "data": {
    "id": "profile",
    "type": "profile",
    "attributes": {}
  },
  "links": [
    {
      "rel": "self",
      "href": "https://account.example/api/v2/site",
      "mediaType": "application/json"
    }
  ],
  "actions": []
}
```

A collection uses an array of the same resource objects and adds pagination:

```json
{
  "data": [],
  "links": [],
  "actions": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  }
}
```

The contract is closed rather than a generic serialization framework:

- `data` is one explicitly projected resource, an explicitly projected array,
  or `null` for an error. A resource contains `id`, `type`, and `attributes`.
- `links` is an ordered array of `{ rel, href, mediaType }`. Relations use
  `self`, `profile`, `collection`, `alternate`, `first`, `previous`, `next`,
  and `last` where those relationships exist. `profile` is reserved for the
  API schema/profile at `/api/v2/schema`; the Aitta's outward public profile
  uses the documented namespaced relation `social.aitta.profile`. Any other
  future AittaSocial-only relation must use a documented `social.aitta.*` name.
- `actions` is an ordered array of operations currently available to the
  authenticated caller in the resource's current state. Each action contains
  `rel`, `method`, `href`, and, when it has a body, `requestMediaType` and a
  bounded `fields` array. Fields contain only `name`, a closed scalar `type`,
  and `required`; resource-specific documentation owns allowed values and
  bounds.
- Actions are discoverability, not authorization. The invoked route repeats
  current authentication, scope, state, media, size, validation, and storage
  checks. Anonymous public reads have an empty `actions` array until a
  separately accepted machine-write contract exists.
- Link and action URLs are absolute canonical URLs. Human alternatives may use
  `text/html`; API self, collection, profile, and action targets use
  `application/json`.
- Unknown response members may be added only through an explicit compatibility
  decision. Clients must not infer authorization from an omitted or present
  action alone.

The API root is itself a resource with the fixed identifier
`aitta-social-api`, type `api`, and attributes for API name and major version.
It links `rel: profile` to `GET /api/v2/schema`, whose resource identifier is
`aitta-social-api-profile` and type is `api-profile`. The D1-independent root
and API-profile resource normalize only protected
`AITTA_SOCIAL_CANONICAL_URL` and use it for absolute links. Missing or invalid
runtime canonical configuration returns structured no-store
`503 canonical_url_unconfigured`; neither D1 nor the request host is a fallback.
D1-backed resources introduced later use the same normalized configured
canonical authority. The API profile documents only this closed grammar and
the relations implemented at that commit. When TASK-179 lands, the root links
to the singleton Aitta public profile with `rel: social.aitta.profile`; that
resource uses identifier and type `profile`. Entry identifiers remain the
existing stable opaque entry identifiers and use type `entry`; v2 does not
change their authority or reinterpret them as events.

## JSON media behavior

Every implemented `/api/v2` route follows one media boundary:

- A missing `Accept`, `*/*`, or a range that permits `application/json`
  returns JSON. An explicit exclusion of JSON with no compatible JSON range
  returns `406 not_acceptable` in the same JSON error envelope.
- Media-range quality, specificity, wildcards, and `q=0` exclusions are parsed
  deterministically. Malformed or unbounded header input fails safely. Neither
  User-Agent nor `?format=` selects a representation.
- V2 routes never return HTML, an HTML redirect, a framework HTML error, or
  application data in an HTML-only shape. The Sites-owned
  `/signin-with-chatgpt`, `/signout-with-chatgpt`, and `/callback` browser
  routes are outside `/api` and remain navigation exceptions.
- A method with a request body accepts only `Content-Type: application/json`
  with optional charset parameters. A different or missing body media type
  returns `415 unsupported_media_type` before parsing. A bodyless method does
  not require `Content-Type`.
- Invalid JSON or a missing required JSON body returns
  `400 malformed_json`. A syntactically valid body that fails resource-domain
  validation returns `422 validation_failed`. Authentication and authorization
  are still checked in the order required to avoid private-state disclosure.
- Unsupported methods return JSON `405 method_not_allowed` and the exact
  `Allow` header. Missing resources return JSON `404`; an unexpected failure
  returns a safe JSON `500` without stack, SQL, file, configuration, identity,
  credential, or request-body data.
- Responses identify JSON with `Content-Type: application/json`. Negotiated
  responses use `Vary: Accept`; private or error responses use `no-store`.
  A route whose representation can depend on machine authentication also uses
  `Vary: Authorization` or a separately proven equivalent cache partition.
  Each public resource task must deliberately preserve or version its cache
  choice rather than inherit one accidentally.

## Error representation

Every application-generated v2 error uses:

```json
{
  "data": null,
  "error": {
    "code": "validation_failed",
    "message": "The update content is required.",
    "fields": [
      {
        "name": "content",
        "code": "required"
      }
    ]
  },
  "links": []
}
```

`fields` is omitted when no field-level error exists. A safe help or profile
link may be added to `links` only when its canonical target is available. The
initial code set is `malformed_json` (400), `authentication_required` (401),
`forbidden` (403), resource-specific not-found codes (404),
`method_not_allowed` (405), `not_acceptable` (406), `conflict` (409),
`unsupported_media_type` (415), `validation_failed` (422),
`canonical_url_unconfigured` or another safe availability code (503), and
`internal_error` (500). Messages are fixed public explanations, not thrown
exception text.

## Pagination

The v2 published-entry collection retains deterministic
`publishedAt DESC, id DESC` ordering and the existing bounded `page` and
`pageSize` inputs. `self`, `first`, and `last` are present for every valid page;
`previous` and `next` appear only when available. TASK-180 derives `last` from
one explicit count using exactly the published-only predicate used by the page
query; an empty collection's last page is page 1. The count, pagination
metadata, and links never include or imply a draft. Tests must cover draft-only
and mixed draft/published databases at page boundaries so neither a total nor a
last-page change leaks unpublished state. Pagination never changes
draft/unknown indistinguishability.

## Authentication separation

Browser owner authentication and machine authentication are different typed
server boundaries:

- A future `SitesAuthenticationContext` may interpret only the currently
  documented Sites identity headers after the deployment's Sites ingress
  provenance is verified. The email supports the current local owner policy;
  full name remains display-only. The Aitta cannot prove a raw header's origin
  from its value.
- A machine client never sends or receives `oai-authenticated-user-*` headers
  as credentials and never impersonates a browser session.
- A future machine credential authenticates a deployment-local service actor,
  not ChatGPT, Codex, a prompt, an AittaSocial network user, or the human owner.
  It is accepted only on explicitly scoped v2 operations and never grants the
  owner dashboard or general administration.

No machine credential is implemented or active. TASK-191 is the accepted first
vertical slice after TASK-181: one deployment-local service actor with only
`entries:write` may discover `rel: create` on the v2 entry collection and invoke
exactly `POST /api/v2/entries` to create a server-forced private draft. An
anonymous caller with no credential receives an empty action array. A presented
invalid credential receives the explicit no-store 401 or 403 error described
below, never an anonymous representation. The `201` response uses TASK-180's
typed entry representation and a canonical collection link; the created draft
stays absent from all public HTML, v1, v2 collection/detail, published-only
count, and pagination projections.

TASK-180 establishes the collection's cache split in advance: a request with no
`Authorization` header receives the normal `public, max-age=30` published-only
representation with empty actions. Every collection response carries
`Vary: Accept, Authorization`. Once TASK-191 lands, a valid service credential
receives a `no-store` representation with `rel: create`; any presented invalid,
expired, revoked, or wrong-audience credential receives an explicit `no-store`
JSON 401, while an otherwise authenticated credential without `entries:write`
receives `no-store` JSON 403; neither falls back to the anonymous representation.
The POST success and every POST error are `no-store`. Tests run
anonymous, valid, and invalid requests in both directions through one cache
harness so neither actions nor failures cross caller boundaries.

That task must use bounded protected current/next credential slots, constant-
time Web Crypto verification, a canonical-deployment audience, overlap
rotation, removal/expiry revocation, and one narrow `entries:write` scope. A D1
audit migration records only authenticated attempts' credential ID, fixed
machine actor, operation, allocated target identifier when any, safe outcome,
correlation ID, and timestamp. Raw secrets, Authorization headers, bodies,
owner emails, and ChatGPT identity never enter D1, logs, URLs, responses,
browser bundles, or fixtures. Invalid unauthenticated requests do not create
attacker-controlled audit rows. Missing, malformed, expired, revoked, wrong-
audience, wrong-scope, and non-Sites/local production configuration fails
closed. Browser CSRF rules remain separate; a machine credential does not
weaken them or grant owner-dashboard or existing private-API access.

TASK-191 remains blocked from hosted completion until the owner explicitly
approves the exact protected current/next secret-slot setup on the target Site.
Until its implementation, migration, tests, documentation, local validation,
approved secret setup, and acceptance evidence all complete, public v1 reads
remain usable by machine clients and every private write remains browser-owner
only. No edit, publish, unpublish, delete, credential-minting, or other machine
operation is preloaded.
