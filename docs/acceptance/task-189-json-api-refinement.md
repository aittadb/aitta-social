# TASK-189 — JSON-first API and authentication refinement

> **Superseded pre-release planning decision (2026-08-13).** Before any
> `/api/v2` implementation, deployment, migration, or client was created, the
> owner selected one versioned integration API at `/api/v1` plus current
> hypermedia JSON variants of selected unversioned human documents. The current
> decision and dependency graph are in `PLAN.md` and
> [hypermedia.md](../hypermedia.md). This record preserves what TASK-189
> concluded at the time; it is historical evidence, not a claim that `/api/v2`
> exists or remains planned.

TASK-189 is a read-only architecture and compatibility decision. It changes no
application handler, response, schema, migration, dependency, Site, deployment,
data, runtime setting, access policy, DNS, domain, Hub, or sibling repository.
No hosted request was made. The implemented API remains protocol 1.0.

## Scope audit

The endpoint contract, Sites ingress evidence, and machine-authentication
boundary are one cohesive refinement outcome: choosing a safe successor path
requires all three. They do not need separate planning tasks before the first
implementation can be bounded. Implementation remains split by independently
reviewable resource in TASK-178–181, while the external ingress matrix is the
separate TASK-190 acceptance outcome.

The audit inspected the root instructions; every `app/**/route.ts`, human page,
root layout and not-found route; `app/chatgpt-auth.ts`; `lib/auth.ts`,
`lib/http.ts`, `lib/public-resources.ts`, validation/runtime/cache behavior;
browser fetch callers; `worker/index.ts`; D1 schema, repository, the single
current migration and upgrade fixtures; route/contract/privacy/security tests;
`docs/protocol.md`, `docs/security.md`, deployment/checkpoint evidence; and the
inert `.openai/hosting.example.json`. The ignored active hosting binding was not
read or copied.

## Current endpoint inventory

`Accept` is ignored by every current application API handler. `Response.json`
sets JSON for application-produced results, but unknown `/api/*` paths and
framework-produced method/errors are not covered by one JSON-only application
boundary. There is no `/api/v1` root, API profile/schema route, action
representation, machine credential, machine actor, or audit table.

### Public machine routes

| Route and method | Request | Success | Application errors | Cache and caller class |
| --- | --- | --- | --- | --- |
| `GET /.well-known/aitta-social.json` | No body; `Accept` ignored | `200` protocol 1.0 manifest object, including optional public challenge | `404 profile_not_configured`, `503 canonical_url_unconfigured`, or safe unexpected framework failure | JSON; public 60 seconds on success, `no-store` for application errors; anonymous public/discovery |
| `GET /api/v1/site` | No body; `Accept` ignored | `200 { data, links }` with the exact profile/presentation allowlist and object-shaped links | Same setup errors | JSON; public 60 seconds on success, `no-store` errors; anonymous public/profile |
| `GET /api/v1/entries` | No body; query `page` default 1 and `pageSize` default 20, max 50 | `200 { data, pagination, links }`; published-only deterministic page, object-shaped links | `400 invalid_pagination` plus setup errors | JSON; public 30 seconds on success, `no-store` errors; anonymous public/collection |
| `GET /api/v1/entries/{id}` | No body; opaque path identifier | `200 { data }`; nested entry links | Identical `404 entry_not_found` for draft/unpublished and unknown, plus setup errors | JSON; public 60 seconds on success, `no-store` errors; anonymous public/detail |

Public application errors use `{ "error": { "code", "message" } }`. The
documented v1 `405` carries `Allow`, but its body is framework-owned and is not
part of the application JSON contract. V1 has no `first` or `last` pagination
link, link array, action array, field-level error array, or content negotiation.

### Private browser mutation routes

All private routes first require the current browser same-origin rule and the
sole-owner email policy derived from Sites identity headers. JSON bodies are
read as unknown, limited to 64 KiB, and parsed by resource validation. They are
browser-owner routes, not public AittaSocial protocol or machine APIs.

| Route and method | Request | Success | Current error behavior |
| --- | --- | --- | --- |
| `PUT /api/private/profile` | JSON profile input | `204`, empty, `no-store` | Authentication `{ error: string }` at 401/403/503; wrong/missing media, malformed JSON, size, and domain validation all use `400 { error, details? }` |
| `POST /api/private/entries` | JSON entry input | `201 { data: <private entry> }`, `no-store` | Same auth/400 shapes |
| `PUT /api/private/entries/{id}` | JSON entry input | `200 { data: <private entry> }`, `no-store` | Same auth/400 shapes; `404 { error: string }` |
| `DELETE /api/private/entries/{id}` | No request body | TASK-197 later normalized this to a no-store JSON `200` deletion acknowledgement | Same auth shape; structured JSON failures |
| `PUT /api/private/entries/{id}/state` | JSON `{ state: "draft" | "published" }` | `200 { data: <private entry> }`, `no-store` | Same auth/400 shapes; `404 { error: string }` |

Unsupported media is currently a `400`, valid JSON that fails domain rules is
also `400`, and `Accept` is ignored. Unsupported methods and unknown private
paths can be framework responses. The browser clients call only these exact
routes: Identity sends JSON `PUT`; the composer sends JSON `POST` or `PUT`;
publication sends JSON `PUT`; deletion sends bodyless `DELETE`. They parse the
current safe message categories. No common hypermedia action authorizes them.

### Human and platform-navigation routes

Every application-owned human route accepts browser `GET` with no request body;
the framework may supply the corresponding bodyless `HEAD`. The Worker changes
every HTML response it receives to `Cache-Control: no-store, must-revalidate`
and applies the fixed CSP. The table keeps routes separate where their D1,
authorization, or failure behavior differs.

| Route | Method and request | Success | Error or access result | Cache | Authentication and class |
| --- | --- | --- | --- | --- | --- |
| `/` | `GET`/implicit `HEAD`; no body; browser HTML request | `200` configured profile and published updates, or `200` unconfigured setup; signed-in state changes only the Manage link | Caught profile/entry storage failure renders a fixed `200` unavailable state; metadata independently falls back to neutral noindex output | HTML `no-store, must-revalidate` | Public human; no sign-in required; optional Sites user context is not authorization |
| `/entries/{id}` | `GET`/implicit `HEAD`; no body; opaque path ID | `200` published update and optional public profile | Draft, unpublished, deleted, malformed, and unknown IDs converge on the global `404` page; uncaught D1 failure is framework `500`; metadata independently falls back to neutral noindex output | HTML `no-store, must-revalidate` | Public human; no sign-in; published-only D1 projection |
| `/privacy` | `GET`/implicit `HEAD`; no body | `200` fixed D1-independent Privacy page | No application error branch; framework failure/not-found remains HTML | HTML `no-store, must-revalidate` | Public human; anonymous; no D1 or auth read |
| `/technical` | `GET`/implicit `HEAD`; no body | `200` fixed D1-independent Technical page with raw manifest/profile/updates links | No application error branch; framework failure/not-found remains HTML | HTML `no-store, must-revalidate` | Public human; anonymous; no D1 or auth read |
| `/owner` | `GET`/implicit `HEAD`; no body | Authorized owner gets `200` dashboard after profile and all-entry reads | Signed out gets framework navigation redirect to `/signin-with-chatgpt?return_to=%2Fowner`; signed-in non-owner or invalid/missing owner setting gets fixed `200` safe access state before D1; post-authorization D1 failure is framework `500` | HTML/redirect handled as `no-store, must-revalidate` when HTML reaches the Worker | Owner-only browser page; Sites identity then sole-owner email policy |
| `/owner/profile` | `GET`/implicit `HEAD`; no body | Authorized owner gets `200` Identity form after profile read | Same signed-out redirect and pre-D1 non-owner/unconfigured safe states; post-authorization D1 failure is framework `500` | HTML/redirect `no-store, must-revalidate` when processed as HTML | Owner-only browser page; Sites identity then sole-owner email policy |
| `/owner/entries/new` | `GET`/implicit `HEAD`; no body | Authorized owner gets `200` empty private draft composer; no D1 content read | Same signed-out redirect and pre-D1 non-owner/unconfigured safe states | HTML/redirect `no-store, must-revalidate` when processed as HTML | Owner-only browser page; Sites identity then sole-owner email policy |
| `/owner/entries/{id}` | `GET`/implicit `HEAD`; no body; opaque path ID | Authorized owner gets `200` private editor for draft or published entry | Same signed-out redirect and pre-D1 non-owner/unconfigured safe states; only after owner authorization, unknown/deleted ID gets global `404`; D1 failure is framework `500` | HTML/redirect `no-store, must-revalidate` when processed as HTML | Owner-only browser page; Sites identity then sole-owner email policy |
| Any unmatched human path, including retired Hub paths | `GET`/implicit `HEAD`; no application body contract | No success representation | Framework/global `404` HTML; retired Hub paths have no handler, credential, redirect, or outbound request | HTML `no-store, must-revalidate` | Public human not-found; no application authentication |
| `/signin-with-chatgpt` | Browser `GET`; Sites may consume `return_to`; no application body contract | Sites dispatcher starts browser sign-in navigation | Status, errors, authentication, and cache are dispatcher-owned and not defined by application source | Dispatcher-owned; no application cache contract | Platform-navigation exception; no application handler |
| `/signout-with-chatgpt` | Browser `GET`; Sites may consume `return_to`; no application body contract | Sites dispatcher signs out and navigates | Status, errors, authentication, and cache are dispatcher-owned and not defined by application source | Dispatcher-owned; no application cache contract | Platform-navigation exception; no application handler |
| `/callback` | Dispatcher callback request with platform-owned query/state; no application body contract | Sites dispatcher completes its browser authentication flow | Status, errors, authentication, and cache are dispatcher-owned and not defined by application source | Dispatcher-owned; no application cache contract | Platform-navigation exception; no application handler |
| Built static, font, and framework-asset paths | Platform-generated `GET`/`HEAD`; no application-data body | Static bytes or framework asset response | Platform `404`/asset failure | Asset/platform headers are preserved because the Worker rewrites only HTML | Platform asset family; no application authentication or data contract |

The schema contains only the singleton `profiles` table and `entries` table.
Sites D1 `DB` is the only binding in the committed hosting example and R2 is
null. There is no credential metadata, audit event, Hub content, event, custom
page, or machine-auth state in current D1.

## Protocol 1.0 compatibility decision

Changing v1 object-shaped links to arrays, wrapping data in resource
`id/type/attributes`, changing error envelopes, adding HTML redirects, or
changing status/media semantics would be incompatible. The exact boundary is:

| V1 surface | Preserved contract |
| --- | --- |
| Manifest | Exact top-level fields, optional challenge, setup errors, public 60-second cache, canonical authority, and JSON-only route meaning |
| Site | Exact `{ data, links: object }` envelope, every allowlisted field including stored `accountType`, optional omissions, setup errors, and public 60-second cache |
| Entry collection | Exact data objects, `pagination.page/pageSize/hasMore`, object-shaped `self/previous/next/site`, validation wording/status, deterministic published-only order, no total, and public 30-second cache |
| Entry detail | Exact `{ data }`, entry field/link allowlist, public 60-second cache, and identical draft/unknown `404` |
| Private routes | Exact paths, methods, browser clients, successful bodies or empty responses, authorization order, same-origin rule, and current safe error categories until a separately versioned private migration exists |

Therefore `/api/v1` and the discovery manifest remain JSON and do not negotiate
or redirect to HTML. `?format=json` is unnecessary. Human-readable material
stays at `/technical` and existing public pages. The previously planned
TASK-178–181 API-to-HTML redirects conflicted with the JSON-first requirement
and are superseded by four `/api/v2` JSON-only resource slices. No v1 source or
documentation is changed by this refinement.

## Accepted JSON successor

The successor is `/api/v2`, not an additive envelope change to `/api/v1`.
`docs/api-v2.md` is the complete planned representation and media decision. Its
essential rules are:

- resource data uses explicit `id`, `type`, and `attributes`; collections use
  arrays of the same resource form;
- links and currently available actions are ordered arrays with canonical
  URLs; action visibility is derived from caller authorization and resource
  state, while invocation always reauthorizes;
- `rel: profile` refers only to the API schema/profile at `/api/v2/schema`;
  the Aitta's outward public profile uses `rel: social.aitta.profile`;
- anonymous public reads expose no owner or machine write action;
- errors use `{ data: null, error: { code, message, fields? }, links }`;
- JSON is the default; explicit JSON exclusion is structured `406`; body
  media mismatches are `415`; malformed JSON is `400`; syntactically valid
  domain failures are `422`; unsupported methods are JSON `405` plus `Allow`;
- known and unknown `/api/v2/*` results never return HTML or an HTML redirect;
  Sites browser navigation remains outside `/api`;
- the v2 root advertises only capabilities implemented in that exact commit.

The root and API-profile bootstrap are D1-independent. They normalize only
protected `AITTA_SOCIAL_CANONICAL_URL` and use it for absolute links; missing or
invalid configuration returns structured no-store
`503 canonical_url_unconfigured`. They never fall back to D1, the request host,
or forwarding headers and do not invent profile or storage states. D1-backed
profile and entry resources introduced later use the same normalized configured
canonical authority.

TASK-178 establishes only the D1-independent root, `GET /api/v2/schema` API
profile, and shared boundary.
TASK-179 adds the singleton public profile with the namespaced Aitta-profile
relation. TASK-180 adds the published collection and derives `last` from an
explicit count that uses the exact published-only predicate; draft-only and
mixed databases must prove that neither the count nor last-page link changes
with draft state. TASK-181 reuses that entry representation for detail. This
order serializes the shared composition points and keeps each review and
rollback independent. TASK-191 depends directly on TASK-181 so both the
collection action point and completed entry detail/representation boundary are
available before a draft-create response is added. It is the one next machine
vertical slice: a scoped deployment service actor can discover and invoke draft
creation only. No other write operation is preloaded.

## Current Sites authentication evidence

On 2026-08-13 the exact public official-documentation searches
`ChatGPT Sites authentication headers` and
`"oai-authenticated-user-email"` were run across `developers.openai.com`,
`platform.openai.com`, and `learn.chatgpt.com`. They produced no matching
public authentication page. The current [OpenAI Developers index](https://developers.openai.com/)
was opened but did not supply a Sites header contract.

The exact current product guidance available to this repository is the local
OpenAI-bundled Sites reference at
`openai-bundled/sites/0.1.34/skills/sites-building/references/authentication.md`.
It is a versioned local product reference, not a public web page. It documents:

- signed-in visitors receive `oai-authenticated-user-id` and
  `oai-authenticated-user-email`; anonymous visitors to a public Site may
  receive neither;
- the ID is stable for one user on one Site and differs across Sites; email and
  name are display/contact data;
- optional full name is percent-encoded UTF-8 and usable only with its matching
  encoding header;
- Sites dispatch owns the sign-in, sign-out, and callback paths; API routes
  check the server-side user context rather than client affordances.

Neither that reference nor the inspected source provides an application-
verifiable signed assertion, issuer, subject proof, audience, signature, public
key, expiry, nonce, or request binding. The reference does not state that
caller-supplied identity headers are stripped or overwritten on Sites ingress.
The application reads raw values and tests inject them; neither fact proves
their production provenance. Full name is display-only. The current owner email
comparison is application policy after identity is supplied, not independent
cryptographic authentication.

## Production-origin blocker and read-only protocol

The last accepted checkpoint records two candidate production origins:

- `https://aittasocial.jaakko-heusala.chatgpt.site`
- `https://jhh.aitta.social`

That historical checkpoint cannot prove this is the complete current origin
inventory. The ignored active hosting identity was not inspected, the owner did
not separately authorize the hosted security matrix, and separate current
owner/non-owner sessions and a non-recorded configured-owner test input were
not available. No black-box request was made. The exact result is **Case D:
unresolved**; do not describe the Sites identity headers as cryptographically
authentic or proven to be stripped/overwritten.

TASK-190 owns the coherent acceptance matrix. After explicit approval it must:

1. obtain the complete current Sites-provided and custom origin list from
   authoritative hosting state without recording project, database, credential,
   cookie, or protected-setting values;
2. on each origin, use `GET /owner` only and retain no response body: anonymous
   without identity headers, forged configured-owner email plus arbitrary ID,
   forged non-owner email plus arbitrary ID, normal owner browser session, and
   normal non-owner browser session;
3. classify only signed-out, denied, owner-shell, or platform-blocked behavior;
   a bounded in-memory marker may distinguish the fixed owner shell and must be
   discarded immediately without recording profile, update, or identity text;
4. repeat the raw-header cases against local/non-Sites mode to prove that
   application parsing alone cannot establish provenance;
5. record per-origin whether ingress strips, overwrites, or forwards the
   caller-supplied values and choose exactly one outcome: documented and
   observed ingress reliance; verified signed assertion; demonstrated
   vulnerability that fails closed; or unresolved.

The protocol submits no form, calls no mutation API, changes no content or
configuration, and does not use Host, Origin, Referer, User-Agent, source IP, or
the header name as proof. Actual emails, identity values, cookies, tokens,
bodies, secrets, and hosting identifiers never enter commands, logs, fixtures,
screenshots, or the acceptance record.

## Separate machine boundary and next slice

A machine client must never impersonate Sites by sending `oai-*` headers. A
future accepted v2 write uses a distinct server adapter and one deployment-
local service actor. The actor is not ChatGPT, Codex, a prompt, the browser
owner, or an AittaSocial network identity. It receives no owner dashboard or
unscoped administration.

TASK-191 is the minimum usable contract: one opaque bearer credential selected
from bounded protected current/next runtime slots, the normalized canonical
deployment as audience, only `entries:write`, Web Crypto constant-time
verification, overlap rotation, removal/expiry revocation, and exactly one
`POST /api/v2/entries` operation that forces a private draft. The authenticated
service actor discovers `rel: create` from TASK-180's collection; anonymous and
invalid callers receive no action. The `201` response reuses TASK-180's typed
entry representation, while all public collections, counts, links, detail
reads, and HTML continue to omit the draft.

The collection cache contract is caller-safe and binary. TASK-180 returns a
normal no-credential representation with empty actions using
`Cache-Control: public, max-age=30`; every collection response has
`Vary: Accept, Authorization`. TASK-191 makes a valid service-credential
representation with `rel: create` `no-store`, and any presented invalid
credential is explicit `no-store` 401 while an authenticated wrong-scope
credential is `no-store` 403; neither becomes anonymous fallback. POST success
and error responses are always `no-store`. Acceptance must run
anonymous→valid→anonymous, valid→anonymous, and invalid-before/after-anonymous
orders through the same cache harness and prove no action, failure, or cached
body crosses caller classes.

One reviewed D1 migration adds the bounded audit record. It contains only an
authenticated attempt's credential ID, fixed service actor, operation, target
identifier when allocated, safe outcome, correlation ID, and timestamp.
Secrets, Authorization headers, request bodies/content, owner email, and Sites
identity never enter D1, URLs, responses, browser code, fixtures, or logs.
Every invocation repeats authentication, scope, state, method, media, size,
validation, and prepared-query checks. Invalid unauthenticated traffic creates
no attacker-controlled audit row. Missing or invalid configuration and local
or non-Sites production without explicitly established machine mode fail
closed.

TASK-191 creates no browser owner, ChatGPT, Codex, or network identity and
grants no dashboard, existing private-API, publish, edit, delete, configuration,
Hub, or general administration access. Hosted completion is explicitly blocked
until the owner approves the exact target Site and protected current/next
secret-slot setup. TASK-189 creates no credential, secret, migration, or write;
public protocol 1.0 reads remain the only current direct machine access and
browser-owner writes remain unchanged.

## Validation and residual uncertainty

Final local evidence on the task branch:

- `npm run validate`: passed instruction, license, plan, instance, runtime,
  migration-journal, strict type, lint, production build, and all 211 repository
  tests. The first sandboxed attempt reached 199 passes and 12 loopback-only
  `listen EPERM` failures; the identical suite passed 211/211 when allowed to
  open its disposable local Miniflare ports. Neither run contacted a hosted
  Site.
- `npm run plan:check`: passed with 16 active and 82 completed tasks before the
  integration owner archives TASK-189.
- `git diff --check`: passed.

`docs/protocol.md` remains unchanged so the previously accepted protocol-1.0
privacy-matrix digest and current capability claim remain valid. No production
dependency audit was required because no dependency or runtime source changed;
no hosted or external security test is claimed.

Residual blockers are exact: current origin inventory, ingress stripping or
overwriting, presence of any signed platform assertion, and normal owner plus
non-owner behavior remain unverified until TASK-190 receives the explicit
inputs and approval above. TASK-191's machine credential, draft-create route,
audit migration, and hosted protected-secret setup remain unimplemented; hosted
completion additionally requires the owner's explicit target-Site secret-slot
approval.
