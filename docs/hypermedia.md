# Planned AittaSocial hypermedia and integration API

This is a design input for the accepted implementation tasks. It is not a
claim that every described route exists yet. The existing application remains
the first unpublished AittaSocial release, so it has one versioned integration
API, `/api/v1`; it does not carry an unimplemented `/api/v2` compatibility
lane.

The earlier unimplemented v2 proposal is retained only as a dated supersession
record in [api-v2.md](api-v2.md). TASK-189's acceptance record and CHANGELOG
entry remain historical evidence and are not rewritten as current capability.

## Two complementary surfaces

### Current hypermedia documents

An ordinary public Aitta document may have both a human HTML representation and
a current machine-readable hypermedia JSON representation at the *same
unversioned path*. For example, an accepted task may make `/technical`, `/`,
or `/entries/{id}` return HTML to a person and JSON to a machine client. A
future public page such as `/about` follows the same model only after its own
route and public-content task are accepted; this plan adds no placeholder page
or catch-all renderer.

These representations are dynamic like HTML, not `HTML v1` and `HTML v2`.
They evolve by adding documented fields, links, and currently available actions
without forcing a versioned path. Removing or changing an established semantic
requires a deliberate compatibility decision or a new resource path. Every
representation is an explicit public allowlist and preserves public/private,
draft/unknown, canonical URL, metadata, cache, and Hub-independence boundaries.

A document's bounded `Accept` policy is independent of User-Agent:

- missing `Accept`, `*/*`, and an HTML/JSON tie select HTML;
- JSON is selected only when `application/json` has higher accepted precedence
  than HTML;
- the parser bounds header size and media ranges, honors quality, specificity,
  order, and `q=0`, and rejects malformed or unsupported choices with a
  no-store `406` and `Vary: Accept` without a resource body;
- neither `?format=` nor a request host, forwarding header, or browser identity
  selects a representation;
- negotiated HTML retains the Worker CSP and no-store policy; a task states the
  matching JSON cache policy explicitly; and
- Vinext must use one narrowly proven internal dispatch/rewrite boundary rather
  than putting both `page.tsx` and `route.ts` at one pathname. It excludes
  `/api/*`, `/.well-known/*`, `/owner/*`, Sites navigation, framework, and
  static paths, and it must not create an internal public bypass.

### Versioned integrations

`/api/v1` is the one JSON-only integration namespace. It is for clients that
want a deliberately versioned contract rather than a current human document.
Until the owner declares a versioned integration released, an accepted task may
reshape a pre-release v1 resource and its tests, protocol documentation, and
discovery links together. That is not a second API version. After release, the
documented v1 behavior is frozen and a successor requires an explicit
compatibility decision.

Versioned API routes default to JSON for missing or wildcard `Accept`, return
JSON only, and never redirect or negotiate HTML. An explicit refusal of JSON,
malformed or excessive `Accept`, or an unsupported method uses the bounded
JSON error/`405 Allow` behavior specified by the applicable task. API responses
use `Vary: Accept`; representations that depend on a service credential also
use `Vary: Authorization` and the cache policy stated for that resource.

## Shared representation

The first negotiated-document task establishes only small product-specific
types and helpers, not a generic hypermedia framework. A success uses an
explicit public resource or collection and ordered links/actions:

```json
{
  "data": {
    "id": "resource-id",
    "type": "resource-type",
    "attributes": {}
  },
  "links": [
    {
      "rel": "self",
      "href": "https://example.test/path",
      "mediaType": "application/json"
    }
  ],
  "actions": []
}
```

Collections use an array in `data` and add bounded pagination metadata. An
application-generated versioned API error uses `data: null`, a fixed safe
`error` object with `code`, `message`, and optional allowlisted field errors,
and a `links` array. No error contains exception text, SQL, file paths,
identity, credentials, request bodies, or protected settings.

Links use standard relations where they fit (`self`, `collection`, `alternate`,
`first`, `previous`, `next`, `last`, `profile`, `create`, `edit`, `delete`,
`publish`, `unpublish`, `login`, `logout`) and a documented `social.aitta.*`
relation only when necessary. Links and actions use canonical URLs derived only
from normalized protected configuration. `rel: profile` identifies the
versioned API schema; an Aitta outward profile uses
`rel: social.aitta.profile`.

Actions are discoverability, not authority. They are generated from the
current resource and authenticated actor, omitted when unavailable, and each
invocation repeats authorization, scope, media, size, validation, state, and
prepared-storage checks.

## Discovery and task order

The current accepted path is deliberately incremental:

1. TASK-178 adds JSON-only `/api/v1` and `/api/v1/schema` integration
   discovery, then advertises only resources that have landed.
2. TASK-179 and TASK-180 replace the pre-release v1 public profile and
   collection response shapes with the shared integration representation.
3. TASK-181 replaces v1 entry detail. TASK-193 then proves the first current
   unversioned HTML/JSON document at `/entries/{id}`. A later public human document,
   including a published custom `/about` page, must use that proven pattern in
   its own publication task.
4. TASK-191 may add one separate, deployment-bound machine create operation to
   the v1 collection only after that collection contract exists. It never
   represents ChatGPT, Codex, the owner, or a browser session.
5. TASK-192 starts the separate browser-private JSON normalization lane with
   the Identity mutation; remaining private mutations are not pre-authorized
   by that focused task.

Existing `/api/private/*` browser-owner mutations are not yet normalized to the
new integration representation. They remain JSON browser endpoints with their
current safety boundaries until a separate accepted owner-mutation slice
changes one bounded operation and its browser client together. No statement in
this document claims that unfinished private endpoints are machine credentials
or a public API.

## Sites and machine identity

Browser owner identity remains a Sites-ingress dependency. The Aitta cannot
prove the origin of a raw `oai-authenticated-user-*` header from its value, and
no application-visible signed assertion is currently documented in the local
reference. TASK-190 remains the owner-approved, read-only production ingress
verification boundary. Machine clients never send those headers, browser
cookies, owner email, query/body identity, or ChatGPT/Codex identifiers as
credentials.

TASK-191 is the first possible machine write: a deployment-bound service actor
with the one `entries:write` scope may create a server-forced private draft at
`POST /api/v1/entries`. It uses protected rotating/revocable runtime slots,
canonical audience binding, constant-time Web Crypto verification, a bounded
audit record, and no browser or owner-dashboard authority. Hosted secret setup
remains explicitly owner-approved.
