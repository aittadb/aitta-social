# AittaSocial implementation plan

This is the accepted, unfinished queue. IDs are stable. Finished work moves to
`CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item is
a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security and privacy review, accessibility,
migration and protocol decisions, documentation, and decisive evidence.

## Audit basis

- On 2026-08-11 the repository POC and public Site were rechecked. Public
  profile and published-update HTML, protocol 1.0 discovery and `/api/v1`, the
  sole-owner boundary, draft privacy, deployment-owned D1, native navigation,
  responsive behavior, and Hub-failure isolation are working and remain in
  scope without being rewritten.
- The one existing public Site now runs version 8 from exact owner-reviewed
  `main` source commit `18fa16dc967d8502c17afb2bd3cc28518039a172`.
  The saved version and terminal deployment report that exact commit, and the
  preserved access, protected-environment metadata, D1 binding, and custom
  domain evidence is recorded in `docs/checkpoint.md` and
  `docs/acceptance/task-157-mobile-presence-deployment.md`.
- No accepted Aitta-consumable Hub contract currently exists. Secure Hub
  registration, verified discovery, Follow and Unfollow, and a private
  followed-update reader therefore remain future direction in `ROADMAP.md`.
  They return to this queue only one bounded vertical increment at a time after
  their exact external contract or service prerequisite exists; endpoints,
  claims, tokens, and data ownership must never be guessed.
- The public deployment now uses the accepted compact, identity-led mobile
  profile experience documented in
  `docs/acceptance/task-156-mobile-presence-redesign.md`. The authenticated
  owner workspace deliberately retained its earlier sidebar, editorial panels,
  long form hierarchy, and wrapped phone navigation, so it remains the next
  accepted visual and interaction gap rather than a completed redesign claim.
- Exact deployed source validation passes the instruction, license, plan,
  instance, runtime, D1 migration, type, lint, production-build, and 191 test
  gates; migration generation reports no change and the production dependency
  audit reports no advisory. The active owner-workspace tasks must preserve
  those product, authorization, privacy, and public-contract boundaries.
- The next increment establishes only a bounded AittaSocial-specific visual
  vocabulary and simpler owner journeys. It is not authority for a generic UI
  framework, general theme system, new persisted customization, public/owner
  authorization coupling, or new capability. The 34 former Hub and network
  tasks remain future provenance under `ROADMAP-004` through `ROADMAP-008`,
  while more speculative lifecycle and suggestion work remains in
  `BACKLOG.md`.

## Active queue

This remains one flat dependency graph rather than phased work. Once every
recorded dependency is complete, tasks without an edge between them are
intended to be parallelizable when their declared files and migration surfaces
are disjoint. Each task owns one bounded outcome plus its tests, documentation,
and migration/configuration decision; split it again before implementation if
those cannot land as one focused reviewable commit.

- [ ] **TASK-183 — Restore reviewed engineering-policy publication.** Use an ordinary authenticated, non-rewriting push to make reviewed local multi-agent-policy commit `ec96d4d` and the completed TASK-184 guidance commit reachable from `origin/develop`. DoD: verify the remote branch contains both commits and their local/remote policy bytes match; if authentication remains unavailable after TASK-184, retain this task as the explicit external blocker rather than treating the recorded failure as completion; and make no `main`, application, schema, migration, Site, deployment, data, setting, access, DNS, domain, Hub, sibling, or runtime change. Depends on: TASK-184.
- [ ] **TASK-190 — Verify the Sites identity-header ingress boundary without mutation.** Resolve the exact external blocker recorded by TASK-189 before any new browser-owner authorization adapter relies on forwarded identity. DoD: with explicit owner approval, re-enumerate every current Sites-provided and custom production origin from authoritative hosting state, then exercise one existing read-only owner page on each origin without retaining its body: anonymous with no identity headers, forged configured-owner email plus arbitrary user ID, forged non-owner email plus arbitrary user ID, normal signed-in owner, and normal signed-in non-owner; use no form submission, API mutation, content write, deployment, setting/access/domain change, or private-body capture; record status/redirect/access classification and whether caller-supplied identity headers are stripped, overwritten, or forwarded, separately for each origin and for local/non-Sites mode; reconcile that evidence with the current official Sites contract and classify it as verified ingress reliance, a documented signed assertion with exact verification fields, a demonstrated vulnerability, or unresolved; never print either email, a header value, cookie, token, response body, hosting identifier, or secret, and never use Host, Origin, Referer, User-Agent, IP, or the header name as proof; add one acceptance record and update only the trust documentation required by the result. This task remains an explicit external blocker until the owner supplies the approval, authoritative origin inventory, configured-owner test input through a non-recorded channel, and separate owner/non-owner browser sessions. Depends on: TASK-189.
- [ ] **TASK-191 — Let one deployment-bound machine actor create a private v1 draft.** Add the first and only machine mutation: scoped `POST /api/v1/entries` creates one server-forced private draft and extends TASK-180's collection representation so only a currently authenticated `entries:write` service actor discovers its `rel: create` action. DoD: implement a machine-authentication adapter separate from Sites browser identity that accepts only bounded protected current/next `Authorization: Bearer` credential slots with non-secret credential ID, deployment audience, scope, expiry, and secret; use constant-time Web Crypto verification, canonical Aitta audience binding, overlap rotation, immediate removal/expiry revocation, and fail closed for missing/malformed/duplicate configuration, missing/wrong scheme, unknown ID, invalid secret, expiry, audience, or scope. Never accept `oai-authenticated-user-*`, cookies, email, query/body identity, ChatGPT, Codex, a prompt, or the human owner as the machine actor; grant no `/owner`, browser-private API, publish, edit, delete, configuration, Hub, or general administration. Accept only TASK-178 JSON/media input and one allowlisted draft-create payload; reuse the existing validated prepared entry-create service, force server-owned draft state/identifiers/timestamps, and return no-store `201` in TASK-180's entry representation with only safe draft facts and a canonical collection link. Keep ordinary no-credential collection reads public cached with empty actions; make a valid service-credential collection no-store with `rel:create`; return no-store 401 for invalid presented credentials and 403 only for authenticated wrong scope; keep `Vary: Accept, Authorization` on every collection variant and no-store on POST/error responses. Add one reviewed migration and atomic bounded audit record for every authenticated attempt's credential ID, fixed machine actor, operation, target identifier when allocated, safe outcome, correlation ID, and timestamp—never secret/header/body/content, owner email, Sites identity, stack, SQL, or response content; unauthenticated invalid attempts create no attacker-controlled audit rows. Prove action visibility/cache order, draft isolation from all public HTML/v1 projections/counts, every media/auth/validation failure, forged Sites headers/cookies/owner email, rotation/revocation/scope/audience/replay/audit redaction and atomicity, browser-owner non-regression, and exact cache behavior; update API/security/deployment/reproducibility documentation and acceptance evidence and pass migration/full-validation/audit/diff gates. No hosted secret may be created, changed, read, or tested without explicit owner approval of exact target-Site slots; without it, hosted completion remains blocked. Add no other machine operation, token minting, Hub credential, OAuth/OIDC, dashboard access, schema generalization, or external mutation. Exclusive ownership: machine-auth/config types, `POST` and authenticated-action extension on `app/api/v1/entries/route.ts`, one audit migration/repository operation, focused machine-create tests, and direct documentation. Depends on: TASK-180.
- [ ] **TASK-197 — Make private update deletion a truthful JSON-first browser API.** Normalize only `DELETE /api/private/entries/{id}` and its confirmed deletion client around the established browser-private JSON policy. DoD: preserve bodyless deletion while selecting JSON for missing/wildcard/JSON-compatible `Accept`, returning no-store structured JSON `406` for explicit JSON exclusion and JSON `405` plus exact `Allow` for unsupported methods; on success return no-store JSON rather than an empty `204`, with an allowlisted deleted-resource acknowledgement and safe collection/recovery links. Keep existing same-origin-before-owner authorization, stable-ID confirmation/cancellation, client navigation after successful deletion, definitive versus unconfirmed recovery, no automatic retry, prepared deletion, no-D1 denial, public unknown parity, protected-setting secrecy, and `Vary: Accept`. Return structured no-store JSON for safe not-found, authorization, storage, and unexpected failures without revealing whether an unauthorised target exists. Do not alter create/edit/publication routes, add schema or machine access, or change public v1/Hub behavior. Prove draft and published delete/cancel/success, malformed Accept/method/4xx/5xx/network recovery, non-owner/missing-owner/same-origin denial before D1, private canaries, JSON headers/body/cache, and post-delete public parity; update focused tests, security/presentation/deployment documentation, and acceptance evidence; pass migration-drift/full-validation/audit/diff gates without external mutation. Exclusive ownership: private delete route/client response handling, focused delete/API tests, and direct documentation. Depends on: TASK-196.
