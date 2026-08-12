# AittaSocial public protocol 1.0

An Aitta is your independently controlled AittaSocial application. It remains
authoritative for its identity, content, configuration, and locally stored
data, whether it is publicly reachable, private, or disconnected from the
AittaSocial Hub.

This document defines the public discovery and read-only JSON contract for one
Aitta deployment. It is usable independently of the HTML interface and does
not depend on AittaSocial Hub.

- Protocol name: `aitta-social`
- Protocol version: `1.0`
- Public API base: `/api/v1`

An incompatible public change requires a new API or protocol version. Optional
additive fields may be introduced within version 1 only when old clients can
safely ignore them.

Canonical human-facing guidance uses Aitta for the owner-controlled
application, profile for its optional outward identity presentation, and
updates for published content. Protocol 1.0 deliberately retains the stable
`accountType`, `entry`,
`entries`, `/entries/*`, and `/api/v1/site` names. The terminology change does
not alter a route, JSON field, schema, migration, or public contract.

Configured public HTML, permalink return paths, not-found guidance, and generic
document metadata name the application as an Aitta. `Independent Aitta` is a
bounded presentation fallback only when no usable configured display name is
available; it is not profile data and is never serialized into protocol 1.0.
Configured profile text remains unchanged owner content. Canonical, robots,
sharing-metadata allowlists, caching, CSP, and draft/unknown behavior are
independent of this human-facing terminology.

Ordinary Identity setup and public HTML are category-neutral. `accountType`
remains a required protocol 1.0 compatibility field in the discovery manifest
and public site resource; it is not a required visible classification of the
represented identity.

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
    "profile": "https://account.example/api/v1/site",
    "entries": "https://account.example/api/v1/entries"
  },
  "accountType": "other"
}
```

The top-level shape and field names above are stable for protocol 1.0.
`software.version` is the deployed application version, not the protocol
version.

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
  },
  "links": {
    "self": "https://account.example/api/v1/site",
    "html": "https://account.example",
    "entries": "https://account.example/api/v1/entries",
    "manifest": "https://account.example/.well-known/aitta-social.json"
  }
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
stored value through their exact public allowlists. The owner form receives
only editable fields, and a successful private profile write returns no profile
representation.

This is an additive-compatible presentation and write-boundary change: no
field, allowed legacy value, endpoint, or response envelope is removed or
renamed, so protocol and API version 1.0 remain current. The existing non-null
D1 column already stores `other`; no schema migration or data rewrite is
needed. Consumers must treat `accountType` as compatibility metadata, not as
proof of identity, authorization, capability, Hub verification, or network
membership.

The response never contains owner identity, authentication state, protected
runtime settings, Hub connection details, drafts, database metadata, or
owner-only URLs.

An unconfigured profile returns `404` with `profile_not_configured`; a missing
valid canonical URL returns `503` with `canonical_url_unconfigured`.

## Public entry resource

A published entry has this public projection:

```json
{
  "id": "7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
  "kind": "announcement",
  "title": "Field session scheduled",
  "body": "The next field session is scheduled for Thursday.",
  "destinationUrl": "https://workshop.example/sessions/thursday",
  "publishedAt": "2026-08-09T10:30:00.000Z",
  "createdAt": "2026-08-09T09:10:00.000Z",
  "updatedAt": "2026-08-09T10:30:00.000Z",
  "links": {
    "self": "https://account.example/api/v1/entries/7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
    "html": "https://account.example/entries/7eaf8f66-bff9-4a54-a78f-c7fa394b046d"
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
      "kind": "announcement",
      "title": "Field session scheduled",
      "body": "The next field session is scheduled for Thursday.",
      "publishedAt": "2026-08-09T10:30:00.000Z",
      "createdAt": "2026-08-09T09:10:00.000Z",
      "updatedAt": "2026-08-09T10:30:00.000Z",
      "links": {
        "self": "https://account.example/api/v1/entries/7eaf8f66-bff9-4a54-a78f-c7fa394b046d",
        "html": "https://account.example/entries/7eaf8f66-bff9-4a54-a78f-c7fa394b046d"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "hasMore": false
  },
  "links": {
    "self": "https://account.example/api/v1/entries?page=1&pageSize=20",
    "site": "https://account.example/api/v1/site"
  }
}
```

`links.site` always identifies the public site resource. When `page` is greater
than 1, `links.previous` contains the canonical previous-page URL. When
`hasMore` is `true`, `links.next` contains the canonical next-page URL. The
collection must determine `hasMore` without exposing a total that could include
drafts. Repeated requests against unchanged data produce the same ordering.

Invalid pagination uses `400` with `invalid_pagination`. Missing
profile/canonical setup uses `profile_not_configured` or
`canonical_url_unconfigured` before any successful resource links are emitted.

## Single entry

`GET /api/v1/entries/{id}` returns:

- `200` with `{ "data": <publicEntry> }` for a published entry; the public
  entry contains its nested `links.self` and `links.html` values;
- `404` with `entry_not_found` for an unknown identifier; and
- the same `entry_not_found` shape for a draft or unpublished identifier.

The endpoint must not reveal whether a non-public identifier exists through
status, timing-dependent branches, error wording, links, or extra fields.
Missing profile/canonical setup uses the same `profile_not_configured` and
`canonical_url_unconfigured` errors as the other resources.

## Errors and method handling

Errors contain a stable machine-readable code and a safe message:

```json
{
  "error": {
    "code": "invalid_pagination",
    "message": "page must be at least 1 and pageSize must be between 1 and 50."
  }
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
  header. This response is framework-owned; its body is not part of the
  structured application-error contract.
- `500` may be used for an unexpected server failure, but its body must not
  reveal SQL, stack traces, environment values, credentials, or identifiers.

## Private operations are not public protocol

Owner writes live behind independently authorized private routes. They are not
part of `/api/v1` and clients must not treat them as network identity endpoints.

The POC has no Hub connection, private Hub route, configured Hub destination,
deployment credential, outbound probe, or registration behavior. The optional
public `hubVerificationChallenge` described above is only manifest data for a
control-of-deployment check. It never authorizes a request or causes this
Aitta to contact Hub. Any future Hub operation requires a separately
accepted versioned contract; public reads remain independent of Hub.

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
and tie-breaking, invalid pagination, unsupported methods, and safe unexpected
errors. Test fixtures must include canary private values and assert that none
appear anywhere in public response bodies or headers.
