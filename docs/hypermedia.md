# Planned AittaSocial hypermedia and integration API

This records the implemented foundation and the accepted follow-up tasks. It
does not claim that every described resource exists yet. The application
remains the first unpublished AittaSocial release, with one versioned
integration API, `/api/v1`; it carries no `/api/v2` compatibility lane.

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

The implemented root, schema, public profile, and unknown-path boundary defaults
to JSON for missing or wildcard `Accept`, returns
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

The implemented published-update collection at `/api/v1/entries` uses typed
`entry` resources, `{ page, pageSize }` metadata, ordered `self`, `first`,
conditional `previous`/`next`, `last`, per-resource `item`, schema `profile`,
and outward `social.aitta.profile` links, plus empty anonymous `actions`. One
published-only count derives `last`; the count and page query use the same
`state = 'published'` predicate, an empty collection has last page 1, and no
total or draft fact is exposed. Its anonymous success cache is
`public, max-age=30`; every result, including errors, varies on both `Accept`
and `Authorization` so a future service-actor representation cannot cross the
anonymous cache partition.

The implemented published-update detail at `/api/v1/entries/{id}` reuses the
collection's typed `entry` resource and adds ordered canonical JSON `self`, JSON
`collection`, JSON API `profile`, and human HTML `alternate` links with empty
anonymous `actions`.
Its success cache is `public, max-age=60` with `Vary: Accept`; every error is
no-store. Draft, unpublished, deleted, malformed, and unknown identifiers share
one published-only query and one indistinguishable `404 entry_not_found`
document. The v1 root and manifest advertise the detail URI template with
`templated: true` and `endpoints.entryTemplate`; `{id}` is RFC 6570 level-1
path expansion that percent-encodes an opaque identifier as one path segment.

Links use standard relations where they fit (`self`, `collection`, `item`, `alternate`,
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

1. TASK-178 established JSON-only `/api/v1` and `/api/v1/schema` integration
   discovery. The manifest advertises the root.
2. TASK-179 established the pre-release v1 public profile representation. The
   root and schema advertise it through `rel: social.aitta.profile`.
3. TASK-180 established the published collection representation and advertised
   it through the root's `rel: collection` and manifest `endpoints.entries`.
4. TASK-181 established v1 entry detail and its root/manifest template
   discovery. TASK-193 then proves the first current
   unversioned HTML/JSON document at `/entries/{id}`. A later public human document,
   including a published custom `/about` page, must use that proven pattern in
   its own publication task.
5. TASK-191 may add one separate, deployment-bound machine create operation to
   the v1 collection only after that collection contract exists. It never
   represents ChatGPT, Codex, the owner, or a browser session.
6. TASK-192 establishes the separate browser-private JSON normalization lane
   with the Identity mutation. TASK-194, TASK-195, TASK-196, and TASK-197 then
   normalize exactly one private entry operation each—create, edit, publication
   state, and deletion—without turning any browser-private route into a
   machine or public API.

`PUT /api/private/profile` now returns a feature-local allowlisted
`owner-profile` resource, canonical JSON/owner/public navigation links, and one
`edit` action only after same-origin sole-owner authorization. Its structured
errors follow the JSON status policy recorded in the TASK-192 acceptance
evidence. It remains private, no-store, undiscoverable, and unavailable to the
deployment-bound machine actor. Other `/api/private/*` browser-owner mutations
retain their current safety boundaries until their one-operation TASK-194–197
slices land. No statement in this document makes a browser-private endpoint a
machine credential or public API resource.

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
