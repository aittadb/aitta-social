# TASK-171 Aitta Network event refinement

TASK-171 converts the accepted event-network idea into exact cross-repository
contract ownership, dependencies, and bounded local follow-ons. It is a
read-only planning outcome: no product source, protocol, API, schema, migration,
Site, deployment, data, setting, access, DNS, domain, Hub, AittaDB, or sibling
repository changed.

## Accepted foundation

> The Aitta Network is an event network. Each Aitta is authoritative for the
> events it creates. Every event has a globally unique identifier, a namespaced
> type, and zero or one parent. A
> parentless event whose supported type permits a root starts a thread; every
> structurally valid known descendant belongs to that thread. Threads may span
> multiple Aittas. Feeds are ordered, access-controlled projections of events.
> AittaSocial Hub may support identity, authorization, discovery, and routing
> without becoming the authoritative participant-content store.

The structural rules are:

- an event has a globally unique identifier, stable authoring-Aitta reference,
  namespaced type, schema version, creation time, bounded data, and immutable
  zero-or-one parent;
- the type defines meaning and root/parent eligibility, while the parent defines
  structure only;
- a permitted parentless event is both the thread root and thread identifier;
  each descendant remains authoritative at its creating Aitta, while a remote
  reader treats that authoring claim as untrusted until verified;
- threads and feeds are derived projections, so neither an Aitta nor Hub owns a
  complete cross-Aitta thread;
- visibility is independent of type, and a parent reference grants neither
  access nor delivery;
- unknown types remain valid safe network events, but a consumer cannot infer
  type-specific root or child eligibility until it supports the applicable type
  and schema version;
- control of a reverse-domain namespace defines documented meaning but does not
  authenticate an event; and
- missing or inaccessible parents, cycles, excessive ancestry depth, excessive
  descendant traversal or fan-out, malformed payloads, and remote content are
  untrusted bounded conditions.

At a remote boundary, the authoring-Aitta reference and creation time are
untrusted assertions until a separate authenticity contract verifies the
event's provenance. An identifier, timestamp, type, schema version, or namespace
alone never establishes authorship. Events and parent relations do not mutate.
Any future revision, retraction, reaction, moderation action, or
message/comment meaning requires its own versioned type semantics; a child is
never classified from `parent` alone.

## Current capability and ownership inventory

The final inventory used exact AittaSocial `develop`
`12aa6ca9a0c31abafc175936428e7a966a99107a`, AittaSocial Hub `develop`
`438a9e8d075bb1a34296a9f3cb37d7039a1e7784`, and AittaDB `develop`
`581fcd3074696b615756aab25b73c53b48998d09`.

| Repository | Current capability | Boundary and ownership |
| --- | --- | --- |
| AittaSocial | Mutable local D1 `entries`, sole-owner writes, published-only protocol 1.0 reads | No Aitta event identity, immutable envelope, parent, signature, event feed, Hub client, or network delivery exists. This repository must conform to the shared contract later, not define a competing one. |
| AittaSocial Hub | Source-only TASK-170 through TASK-174 now own the shared envelope, reserved types, bounded cross-Aitta thread derivation, access-controlled feeds, and v1 compatibility rules | No live Aitta connection, event authorization, routing, private retrieval, event storage, or network behavior exists. Hub must never own participant event content. |
| AittaDB | Feature-gated immutable, idempotent, retained, principal-and-client-isolated Events | This is bounded application transport, not Aitta Network content storage or cross-client fan-out. |

The Hub repository is the network-contract authority. Its five active contract
tasks were admitted after the initial inventory and supersede a duplicate local
envelope task:

- Hub TASK-170 defines the immutable envelope and malicious vectors;
- Hub TASK-171 defines the first reserved `social.aitta.*` types and their
  root/parent rules;
- Hub TASK-172 derives bounded cross-Aitta threads;
- Hub TASK-173 defines access-controlled feed projections; and
- Hub TASK-174 defines additive compatibility and protocol 1.0 entry-projection
  rules.

Their direct dependency graph remains authoritative in the Hub repository. This
refinement does not copy it into AittaSocial runtime or pretend those active
contracts are complete.

AittaDB Events may later carry private opaque routing or resynchronization hints
for a Hub service, but must not become the authoritative store for Aitta events
or thread history. AittaDB's current roadmap statement that Events have no API
or persistence contract is sibling documentation debt only; this repository
does not modify it.

## Versioning and compatibility decision

The Aitta event model is additive and separately versioned. Existing discovery,
`/api/v1/site`, `/api/v1/entries`, `/api/v1/entries/{id}`, entry identifiers,
fields, values, envelopes, errors, ordering, caching, and privacy semantics keep
their exact meanings. Existing entries are not silently reinterpreted or
automatically projected as events. A later migration or parentless projection
requires its own explicit versioning, mapping, privacy, and rollback decision.

No local event task is activated in `PLAN.md` while the Hub-owned contract is
unfinished. That is an explicit external blocker, not permission to guess or
duplicate the shared wire model.

## Stable dependency-ordered follow-on work

The following rows record the exact smallest follow-ons without preloading the
active queue. Local TASK-172 through TASK-174 are reserved for promotion from
`ROADMAP-009` and must not be reused for unrelated work. Sibling rows are
authoritative only in their own repositories.

- **AittaSocial TASK-172 — Conform to the accepted Aitta event contract.** After
  Hub TASK-174 completes, implement only a local parser/validator and the shared
  conforming and malicious vectors for the accepted envelope, type registry,
  structural threads, feed boundary, and compatibility rules. DoD: prove exact
  duplicate/collision, authoring-claim, type/version, time, parent, unknown-type,
  depth/fan-out, access-non-inference, and nonreflective-error behavior; preserve
  all protocol 1.0 entry semantics; add no route, storage, migration, Hub call,
  or event-producing behavior; and pass focused conformance, security/privacy,
  full validation, audit, and diff gates. Direct external prerequisite: Hub
  TASK-174. Blocker: that contract is active and unfinished.
- **AittaSocial TASK-173 — Create and retain local `social.aitta.note` events.**
  Add one owner-authorized meaningful vertical event slice, not a generic event
  framework. DoD: append/read only the accepted note type with immutable local
  authority, exact idempotency, reviewed D1 migration, bounded data, local parent
  validation without remote fetch, explicit local/owner visibility, and
  authorization, CSRF, privacy, concurrency, rollback, upgrade, and malicious
  vectors; retain protocol 1.0 entries unchanged; and add no public event API,
  automatic entry projection, Hub call, cross-Aitta delivery, or other product
  event type. Direct prerequisite: AittaSocial TASK-172.
- **AittaSocial TASK-174 — Serve the first public Aitta event projection.** Add
  one separately versioned public item/collection projection for the local note
  events. DoD: define explicit allowlists, deterministic ordering/pagination,
  canonical links, cache and errors, unknown-type-safe behavior,
  inaccessible-parent behavior, and public/private canaries; prove exact
  compatibility while existing discovery, `/api/v1/site`, and
  `/api/v1/entries` remain byte-for-semantics compatible; and make no Hub,
  private-delivery, or hosted mutation. Direct prerequisite: AittaSocial
  TASK-173. Blocker: a separate accepted event-provenance/authenticity contract
  must exist before this row may be promoted; an authoring identifier or HTTPS
  response alone is not yet accepted as proof of event authorship.
- **AittaDB TASK-224 — Correct Persistent Events capability tracking.** Align
  the sibling roadmap and living guidance with its implemented feature-gated,
  finite-retention, namespace-isolated Events API. DoD: focused documentation
  tests reject the obsolete no-API/no-persistence claim and preserve exact
  runtime/API/schema behavior. Direct prerequisite: none. Blocker: sibling
  owner acceptance; this repository does not modify AittaDB.
- **AittaDB TASK-225 — Add conditional record writes.** Add generic
  service-client create-if-absent and version-bound update/delete operations.
  DoD: specify opaque versions and preconditions, stable conflict errors,
  namespace isolation, replay/concurrency behavior, privacy vectors, and no
  value reflection; pass sibling migration, contract, and full gates. Direct
  prerequisite: none. Blocker: sibling owner acceptance; this is not Aitta
  event storage.
- **AittaSocial Hub TASK-140 — Establish atomic AittaDB record writes.** Keep
  the existing Hub roadmap outcome and make AittaDB TASK-225 its exact external
  service prerequisite. Its current direct local prerequisite remains Hub
  TASK-011. Blocker: AittaDB conditional-write support is not accepted or
  implemented.

Private event delivery or retrieval remains a later `ROADMAP-009` outcome. It
requires the Hub-owned feed/compatibility contracts, an accepted audience and
revocation model, and a reviewed production-safe arbitrary-origin egress
primitive. It receives a new local task only when those blockers are concrete.
AittaDB Events may carry only opaque post-commit routing or resynchronization
hints through a dedicated least-privilege service client; no follow-on may use
it as participant-content storage.

## Evidence and residual boundary

The refinement makes visible architecture progress without pretending that
AittaSocial, Hub, or AittaDB already implements the network. The final agent,
plan, migration-drift, full repository, production-audit, and diff gates cover
this repository. Sibling source was inspected read-only; no hosted or other
external service state was inspected or mutated.

Event authenticity and key rotation, private audiences and revocation,
delivery, feed ordering, retention, entry projection, and hosted routing remain
deliberately unimplemented. The Hub contract tasks and AittaDB conditional-write
dependency must complete before their respective local follow-ons can be
promoted.
