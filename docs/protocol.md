# AittaSocial public protocol 1.0

An Aitta is an independently controlled top-level place. The future Aitta
Network connects Aittas and members only through accepted contracts. The
AittaSocial Hub is a future trusted identity, discovery,
relationship, authorization, and coordination service within those contracts;
it is never content authority or shared content storage.
This Aitta deployment currently runs one Aitta and remains authoritative for
its identity, content, configuration, and locally stored data, whether it is
publicly reachable, private, or disconnected from the AittaSocial Hub. A
profile is that Aitta's optional outward identity presentation, not the Aitta
itself.

This document defines the public discovery and read-only JSON contract for one
Aitta deployment. It is usable independently of the HTML interface and does
not depend on AittaSocial Hub.

- Protocol name: `aitta-social`
- Protocol version: `1.0`
- Public API base: `/api/v1`

Until this first versioned integration is declared released, an accepted task
may deliberately revise the pre-release protocol 1.0 grammar together with its
routes, tests, manifest, and this document; it does not need to create an
unshipped v2 compatibility lane. After release, an incompatible public change
requires a new API or protocol version. Optional additive fields may be
introduced within version 1 only when old clients can safely ignore them.

Canonical human-facing guidance uses Aitta for the owner-controlled top-level
place, profile for its optional outward identity presentation, and
updates for published content. Protocol 1.0 deliberately retains the stable
`accountType`, `entry`,
`entries`, `/entries/*`, and `/api/v1/site` names. The terminology change does
not alter a route, JSON field, schema, migration, or public contract.

Protocol 1.0 `entry` resources are current publishing resources, not Aitta
Network events or app roots. They carry no network-member, event-parent, app,
or event-authority meaning. Those future concepts require their own exact,
versioned Hub contract before this Aitta can adopt them; the direction is
described separately in [strategy.md](strategy.md).

Configured public HTML, permalink return paths, not-found guidance, and generic
document metadata name the Aitta. `Independent Aitta` is a
bounded presentation fallback only when no usable configured display name is
available; it is not profile data and is never serialized into protocol 1.0.
Configured profile text remains unchanged owner content. Canonical, robots,
sharing-metadata allowlists, caching, CSP, and draft/unknown behavior are
independent of this human-facing terminology.

Ordinary Identity setup and public HTML are category-neutral. `accountType`
remains a required protocol 1.0 compatibility field in the discovery manifest
and public site resource; it is not a required visible classification of the
represented identity.

## Human technical information

`GET /technical` is a D1-independent HTML guide to the three public protocol
entry points: the discovery manifest at
`/.well-known/aitta-social.json`, the public profile at `/api/v1/site`, and the
published-update collection at `/api/v1/entries`. It is a human navigation
surface, not a protocol resource, alternate response representation, or JSON
dump. Its fixed neutral metadata does not derive a canonical URL or other value
from the request host, runtime settings, profile, or database.

Adding the guide and using the concise footer labels Manifest, Profile, and
Updates does not change the machine routes. They continue to return only the
documented JSON success and error representations with their existing status,
content-type, cache, allowlist, canonical-link, and privacy behavior.
The manifest additionally advertises the D1-independent v1 integration root;
clients discover its schema and implemented capabilities there rather than
requiring another human-navigation link.

## Conventions

- Successful responses and application-generated validation, not-found, and
  setup errors use UTF-8 JSON with an `application/json` content type.
- Public resources use camelCase property names and explicit serialization
  allowlists. Database rows, environment objects, and authenticated-user
  objects are never serialized directly.
- Resource links are absolute canonical URLs. They are constructed from the
  normalized configured canonical Aitta deployment URL, never an untrusted
  request `Host` header.
- Identifiers are stable, opaque strings. Clients must not infer sequence or
  ownership information from them.
- Timestamps are RFC 3339 UTC strings.
- An optional field that has no value is omitted rather than populated from an
  internal default or private source.
- Public reads need no sign-in. Authentication state does not expand a public
  response; owner data is available only through separately authorized private
  surfaces.

## Versioned API discovery

`GET /api/v1` is the D1-independent integration root. It requires only a valid
protected `AITTA_SOCIAL_CANONICAL_URL`; it never falls back to the request host
or the stored profile canonical URL. It returns:

```json
{
  "data": {
    "id": "aitta-social-api",
    "type": "api",
    "attributes": {
      "name": "AittaSocial",
      "version": 1
    }
  },
  "links": [
    {
      "rel": "self",
      "href": "https://account.example/api/v1",
      "mediaType": "application/json"
    },
    {
      "rel": "profile",
      "href": "https://account.example/api/v1/schema",
      "mediaType": "application/json"
    },
    {
      "rel": "social.aitta.profile",
      "href": "https://account.example/api/v1/site",
      "mediaType": "application/json"
    },
    {
      "rel": "collection",
      "href": "https://account.example/api/v1/entries",
      "mediaType": "application/json"
    },
    {
      "rel": "item",
      "href": "https://account.example/api/v1/entries/{id}",
      "mediaType": "application/json",
      "templated": true
    },
    {
      "rel": "social.aitta.manifest",
      "href": "https://account.example/.well-known/aitta-social.json",
      "mediaType": "application/json"
    }
  ],
  "actions": []
}
```

`GET /api/v1/schema` identifies the current pre-release representation and its
implemented relation vocabulary:

```json
{
  "data": {
    "id": "aitta-social-api-profile",
    "type": "api-profile",
    "attributes": {
      "version": 1,
      "representation": "aitta-social-json-api-v1",
      "relations": [
        "self",
        "profile",
        "collection",
        "item",
        "alternate",
        "first",
        "previous",
        "next",
        "last",
        "social.aitta.profile",
        "social.aitta.manifest"
      ]
    }
  },
  "links": [
    {
      "rel": "self",
      "href": "https://account.example/api/v1/schema",
      "mediaType": "application/json"
    },
    {
      "rel": "collection",
      "href": "https://account.example/api/v1",
      "mediaType": "application/json"
    }
  ],
  "actions": []
}
```

Both resources use `public, max-age=60`. Missing, wildcard, `application/json`,
and matching application wildcards accept JSON. An explicit refusal of JSON,
malformed syntax, more than 4 KiB, or more than 16 media ranges returns a
no-store structured `406`. The parser uses the most specific matching range,
so an exact `application/json;q=0` is not overridden by `*/*`.

`HEAD` returns the matching `GET` status and headers with an empty body.
`POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` return structured `405` with
`Allow: GET, HEAD`. Every method on an unknown `/api/v1/*` path returns the
same structured `404`; unacceptable media still returns `406` first. All these
responses include `Vary: Accept`, never redirect or select HTML, and ignore
User-Agent and query format hints. `/api/v2` is not an application route.

Missing or invalid protected canonical configuration returns a no-store
structured `503` without a D1 read. Unexpected root/schema failures return a
fixed safe `500`. The profile and published collection resources use this same
media, method, `HEAD`, error, and safe-failure boundary. The collection also
varies every response on `Authorization` to partition anonymous cache entries
from the separately accepted machine-create task. Entry detail uses the common
v1 JSON-only media, error, and method grammar described below.

## Discovery manifest

`GET /.well-known/aitta-social.json` returns `200` and one JSON object:

```json
{
  "protocol": "aitta-social",
  "protocolVersion": "1.0",
  "software": {
    "name": "AittaSocial",
    "version": "0.1.0"
  },
  "canonicalUrl": "https://account.example",
  "endpoints": {
    "api": "https://account.example/api/v1",
    "profile": "https://account.example/api/v1/site",
    "entries": "https://account.example/api/v1/entries",
    "entryTemplate": "https://account.example/api/v1/entries/{id}"
  },
  "accountType": "other"
}
```

The top-level shape and field names above are stable for protocol 1.0.
`software.version` is the deployed application version, not the protocol
version.

The root's templated `item` link and manifest `endpoints.entryTemplate` value
identify the same detail-resource template. `{id}` is an RFC 6570 level-1 path
expansion variable: expansion percent-encodes the complete opaque entry
identifier as one path segment. Braces are template syntax rather than a
literal route.

When and only when `AITTA_SOCIAL_HUB_CHALLENGE` is explicitly configured, the
manifest also includes:

```json
{
  "hubVerificationChallenge": "opaque-current-challenge"
}
```

The challenge shows that someone could modify this Aitta deployment at
verification time. It is public and is not authentication, a session, or a
deployment credential. Removing or rotating the setting removes or changes the
field on the next deployment.

The manifest must never include the owner email, any ChatGPT identity field,
any future Hub credential, runtime secrets, drafts, local authorization state,
database identifiers, hosting identifiers, or private endpoints.

If the profile is absent, discovery returns `404` with
`profile_not_configured`. If no valid protected/profile canonical URL is
available, it returns `503` with `canonical_url_unconfigured`. Neither error
contains links derived from the request host.

## Public site resource

`GET /api/v1/site` returns `200` with an explicit public profile projection:

```json
{
  "data": {
    "id": "profile",
    "type": "profile",
    "attributes": {
      "displayName": "Northern Workshop",
      "accountType": "other",
      "shortDescription": "Tools and field notes for careful collaboration.",
      "introduction": "We publish working notes, longer explanations, and project announcements.",
      "location": "Helsinki",
      "website": "https://workshop.example/",
      "externalLinks": [
        {
          "label": "Documentation",
          "url": "https://workshop.example/docs"
        }
      ],
      "canonicalUrl": "https://account.example",
      "presentation": {
        "accentColor": "#315b4c",
        "density": "comfortable",
        "showPoweredBy": true
      }
    }
  },
  "links": [
    {
      "rel": "self",
      "href": "https://account.example/api/v1/site",
      "mediaType": "application/json"
    },
    {
      "rel": "profile",
      "href": "https://account.example/api/v1/schema",
      "mediaType": "application/json"
    },
    {
      "rel": "social.aitta.profile",
      "href": "https://account.example",
      "mediaType": "text/html"
    }
  ],
  "actions": []
}
```

`location`, `website`, and individual external links are optional. Supported
`accountType` values are `person`, `company`, `project`, `community`,
`publication`, `agent`, and `other`. `presentation.density` is `comfortable` or
`compact`; `presentation.accentColor` is a validated six-digit hex color; and
`presentation.showPoweredBy` is a boolean. These values are validated by the
application rather than accepted as arbitrary HTML or template input.

The category-neutral owner editor does not ask the owner to choose an
`accountType`, and the private profile-write model does not contain that field.
The server inserts the neutral compatibility value `other` when it creates a
profile and omits `account_type` from later profile updates. An `accountType`
property sent by an older or handcrafted private client is ignored like any
other unknown input and cannot select or replace the stored value. Reads do not
rewrite legacy values. The manifest and `/api/v1/site` continue to emit the
stored value through their exact public allowlists. The owner form receives only
editable fields. A successful private profile write returns a no-store,
owner-authorized, feature-local `owner-profile` representation containing only
those editable fields and its current owner action; it is neither public nor
discoverable.

The v1 singleton envelope deliberately replaces the earlier unshipped profile
grammar during this pre-release. It preserves every public profile field and
allowed legacy `accountType` value inside `data.attributes`; no compatibility
route or v2 lane exists. The existing non-null D1 column already stores
`other`; no schema migration or data rewrite is needed. Consumers must treat
`accountType` as compatibility metadata, not as proof of identity,
authorization, capability, Hub verification, or network membership.

The root advertises this resource with `rel: social.aitta.profile`. Within the
resource, `rel: self` identifies this v1 JSON resource, `rel: profile`
identifies the JSON API schema, and `rel: social.aitta.profile` identifies the
canonical human profile document with `mediaType: text/html`. Link order is
stable and successful links
derive from normalized protected or stored profile canonical configuration,
never the request host.

The response never contains owner identity, authentication state, protected
runtime settings, Hub connection details, drafts, database metadata, or
owner-only URLs. It is public without Hub or sign-in, uses
`public, max-age=60` and `Vary: Accept`, and returns an empty anonymous
`actions` array.

An unconfigured profile returns the common v1 error envelope with `404` and
`profile_not_configured`; a missing valid canonical URL returns that envelope
with `503` and `canonical_url_unconfigured`. Unexpected D1 or runtime failure
returns the fixed safe `500 internal_error`. Errors are no-store. The route
uses the same bounded JSON-only `Accept`, `HEAD`, and exact `405 Allow` behavior
as the v1 root.

## Public entry resources

A published entry uses this typed public resource in both collection and detail
documents:

```json
{
  "id": "7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
  "type": "entry",
  "attributes": {
    "kind": "announcement",
    "title": "Field session scheduled",
    "body": "The next field session is scheduled for Thursday.",
    "destinationUrl": "https://workshop.example/sessions/thursday",
    "publishedAt": "2026-08-09T10:30:00.000Z",
    "createdAt": "2026-08-09T09:10:00.000Z",
    "updatedAt": "2026-08-09T10:30:00.000Z"
  }
}
```

`kind` is one of `note`, `article`, `link`, or `announcement`. `title`,
`destinationUrl`, and `publishedAt` are optional. `body` is the entry's plain
text content. Public rendering escapes content; the entry model does not admit
arbitrary executable markup.

Draft/published state is intentionally absent. Presence in the public API is
the only public publication signal. Internal state and internal scheduling or
authorization fields must not be added to the projection.

## Entries collection and pagination

`GET /api/v1/entries` accepts:

| Parameter | Default | Constraint |
| --- | --- | --- |
| `page` | `1` | Positive base-10 integer. |
| `pageSize` | `20` | Positive base-10 integer, maximum `50`. |

Invalid values return `400`. A page beyond the end returns `200` with an empty
`data` array. Results contain published entries only and use the deterministic
order `publishedAt DESC, id DESC`.

```json
{
  "data": [
    {
      "id": "7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
      "type": "entry",
      "attributes": {
        "kind": "announcement",
        "title": "Field session scheduled",
        "body": "The next field session is scheduled for Thursday.",
        "publishedAt": "2026-08-09T10:30:00.000Z",
        "createdAt": "2026-08-09T09:10:00.000Z",
        "updatedAt": "2026-08-09T10:30:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20
  },
  "links": [
    {
      "rel": "self",
      "href": "https://account.example/api/v1/entries?page=1&pageSize=20",
      "mediaType": "application/json"
    },
    {
      "rel": "first",
      "href": "https://account.example/api/v1/entries?page=1&pageSize=20",
      "mediaType": "application/json"
    },
    {
      "rel": "last",
      "href": "https://account.example/api/v1/entries?page=1&pageSize=20",
      "mediaType": "application/json"
    },
    {
      "rel": "item",
      "href": "https://account.example/api/v1/entries/7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
      "mediaType": "application/json"
    },
    {
      "rel": "profile",
      "href": "https://account.example/api/v1/schema",
      "mediaType": "application/json"
    },
    {
      "rel": "social.aitta.profile",
      "href": "https://account.example/api/v1/site",
      "mediaType": "application/json"
    }
  ],
  "actions": []
}
```

`self`, `first`, and `last` are always present. An empty collection defines its
last page as 1. `previous` appears when `page` is greater than 1, including a
request beyond the last page; `next` appears only before the last published
page. One `item` link identifies each returned resource, while `profile` names
the API schema and `social.aitta.profile` names the outward Aitta profile. The
server derives `last` from one `COUNT(*) WHERE state = 'published'` query using
the exact page-query predicate. It exposes no total and never counts or returns
a draft. Repeated requests against unchanged data produce the same ordering.

Success is `public, max-age=30` with `Vary: Accept, Authorization` and empty
anonymous `actions`. The route ignores presented browser identity, cookies,
owner configuration, Hub state, and credentials; TASK-191 separately owns any
future authenticated collection action.

Invalid pagination uses `400` with `invalid_pagination`. Missing
profile/canonical setup uses `profile_not_configured` or
`canonical_url_unconfigured` before any successful resource links are emitted.

## Single entry

`GET /api/v1/entries/{id}` returns one published entry in the same typed
resource projection used by the collection:

```json
{
  "data": {
    "id": "7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
    "type": "entry",
    "attributes": {
      "kind": "announcement",
      "title": "Field session scheduled",
      "body": "The next field session is scheduled for Thursday.",
      "publishedAt": "2026-08-09T10:30:00.000Z",
      "createdAt": "2026-08-09T09:10:00.000Z",
      "updatedAt": "2026-08-09T10:30:00.000Z"
    }
  },
  "links": [
    {
      "rel": "self",
      "href": "https://account.example/api/v1/entries/7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
      "mediaType": "application/json"
    },
    {
      "rel": "collection",
      "href": "https://account.example/api/v1/entries",
      "mediaType": "application/json"
    },
    {
      "rel": "profile",
      "href": "https://account.example/api/v1/schema",
      "mediaType": "application/json"
    },
    {
      "rel": "alternate",
      "href": "https://account.example/entries/7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
      "mediaType": "text/html"
    }
  ],
  "actions": []
}
```

The JSON `self`, JSON collection, JSON API `profile`, and human HTML `alternate`
links use canonical authority and a percent-encoded identifier. Anonymous
actions are empty.
Success is `public, max-age=60` with `Vary: Accept`.

The endpoint must not reveal whether a non-public identifier exists through
status, timing-dependent branches, error wording, links, or extra fields.
Draft, unpublished, deleted, malformed, and unknown identifiers all use the
same published-only prepared query and common no-store `404 entry_not_found`
document. Missing profile/canonical setup uses the same
`profile_not_configured` and `canonical_url_unconfigured` errors as the other
resources. Negotiation occurs before D1, `HEAD` matches `GET` without a body,
and unsupported methods return the common `405` with `Allow: GET, HEAD`.

## Errors and method handling

The v1 root, schema, profile, collection, entry detail, and unknown-path
boundary use the common pre-release error document:

```json
{
  "data": null,
  "error": {
    "code": "not_found",
    "message": "The requested API resource was not found."
  },
  "links": []
}
```

Its fixed codes are `not_acceptable`, `method_not_allowed`, `not_found`,
`profile_not_configured`, `canonical_url_unconfigured`, `entry_not_found`, and
`internal_error`.
These responses are `no-store`, contain no exception or runtime detail, and
include no link when a canonical URL is unavailable.

The collection additionally uses the common error document for invalid
pagination:

```json
{
  "data": null,
  "error": {
    "code": "invalid_pagination",
    "message": "page must be at least 1 and pageSize must be between 1 and 50."
  },
  "links": []
}
```

Errors omit canonical links rather than derive one from the request host when
the configured canonical URL is missing or invalid.

- `400` with `invalid_pagination` is used for malformed pagination.
- `404` with `profile_not_configured` is used when the profile is absent.
- `404` with `entry_not_found` is used for a missing or non-public entry.
- `503` with `canonical_url_unconfigured` is used when a successful canonical
  resource cannot be constructed safely.
- `405` is used for an unsupported method and includes an appropriate `Allow`
  header. Profile, collection, and detail return the common v1 document with
  `Allow: GET, HEAD`.
- `500` may be used for an unexpected server failure, but its body must not
  reveal SQL, stack traces, environment values, credentials, or identifiers.
  Profile, collection, and detail return the fixed common `internal_error`
  document.

## Private operations are not public protocol

Owner writes live behind independently authorized private routes. They are not
part of `/api/v1` and clients must not treat them as network identity endpoints.

The POC has no Hub connection, private Hub route, configured Hub destination,
deployment credential, outbound probe, or registration behavior. The optional
public `hubVerificationChallenge` described above is only manifest data for a
control-of-deployment check. It never authorizes a request or causes this
Aitta to contact Hub. Any future Hub operation requires a separately
accepted versioned contract; public reads remain independent of Hub. In
particular, current Sites Sign in with ChatGPT provides only local
sole-owner administration and is not Aitta Network sign-in or membership;
future member identity requires the exact accepted Hub contract.

## HTML document metadata is not protocol 1.0

The server-rendered document title, description, canonical link, robots policy,
and text-only Open Graph/Twitter fields are presentation. They are not discovery
fields, API resources, or capability signals. Protocol consumers must use the
manifest and `/api/v1` resources rather than infer a contract from HTML head
tags.

Configured public-page metadata uses the public profile, published entry
projection, and normalized configured canonical URL. Unconfigured, draft,
unknown, and owner-only metadata emits no canonical or image URL and never
substitutes a request host. This presentation change adds no route or JSON
field, does not change protocol version `1.0`, and requires no D1 schema
migration or data rewrite. Existing `/api/v1` cache headers are unchanged.

## Required contract tests

Implementations of this document must test exact field allowlists, JSON content
types, canonical absolute links, stable identifiers, manifest challenge
conditionality, draft-indistinguishable 404 responses, deterministic pagination
and tie-breaking, invalid pagination, bounded Accept behavior, unknown paths,
unsupported methods, matching HEAD responses, and safe unexpected errors. Test
fixtures must include canary private values and assert that none appear anywhere
in public response bodies or headers.
