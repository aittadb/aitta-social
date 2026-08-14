# AittaSocial roadmap

This file records high-level future product direction, not current capability
or a release commitment. Stable `ROADMAP-NNN` identifiers must not be
renumbered or reused. Accepted implementation work moves into `PLAN.md` only
one meaningful vertical increment at a time; unscheduled possibilities remain
in `BACKLOG.md`, and completed evidence belongs in `CHANGELOG.md`.

Stage 0 is the current publishing proof of concept: one independently
controlled Aitta with local identity, publishing, and sole-owner
administration. Every row below is strategic direction only, not an
implementation contract or an active plan.

- [ ] **ROADMAP-004 — Establish secure optional Hub registration and disconnect.** Let the sole local owner establish and later remove one Hub connection for an Aitta without pasted secrets, shared content storage, or loss of local public operation. This preserves unfinished provenance from former `TASK-042`, `TASK-043`, `TASK-062`, `TASK-063`, `TASK-066`, `TASK-067`, `TASK-086`, `TASK-095`, `TASK-096`, and `TASK-097`. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-005 — Add verified Aitta discovery.** Make an Aitta's public protocol consumable by AittaSocial Hub, then let the owner resolve and browse minimal opted-in verified profile metadata without rankings, identity-truth claims, or a local directory copy. This preserves unfinished provenance from former `TASK-041`, `TASK-045`, `TASK-046`, `TASK-071`, `TASK-072`, `TASK-087`, and `TASK-088`. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-006 — Retain former owner-scoped Follow and Unfollow provenance.** The former acting-Aitta-owner relationship direction is superseded for Stage 1 by member-controlled Follow in `ROADMAP-018`; it is retained only to preserve unfinished provenance from `TASK-047`, `TASK-048`, `TASK-073`, `TASK-074`, `TASK-075`, and `TASK-131`. It is not a promotion candidate without a new explicit decision. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-007 — Retain former owner-only followed-reader provenance.** The former owner-only reader direction is superseded for Stage 1 by the member-private Your Network projection in `ROADMAP-019`; it is retained only to preserve unfinished provenance from `TASK-049`, `TASK-050`, `TASK-077`, `TASK-078`, `TASK-081`, `TASK-082`, `TASK-120`, `TASK-121`, and `TASK-132`. It is not a promotion candidate without a new explicit decision. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-008 — Prove the connected social POC as one candidate.** After the contract-backed vertical slices promoted from secure registration/discovery and the separate member sign-in, invitation, safety, member Follow, and member-private Your Network directions in `ROADMAP-004`, `ROADMAP-005`, `ROADMAP-010` through `ROADMAP-012`, and `ROADMAP-018` through `ROADMAP-019` are implemented and validated, run the coordinated local and separately approved hosted evidence needed to call that exact connected source a reproducible social POC. This preserves unfinished provenance from former `TASK-053` and `TASK-135`. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-009 — Adopt the versioned Aitta Network event foundation.** After the AittaSocial Hub repository completes its shared envelope, type, thread, feed, and compatibility contracts, adopt them here in bounded conformance and product slices: each Aitta remains authoritative for events it creates, while remote readers treat the claimed authoring Aitta as untrusted until verified; optional parent references derive cross-Aitta threads; visibility and delivery remain independent of type and parent structure; feeds are access-controlled ordered projections; remote ancestry is untrusted and bounded; and Hub may authorize, discover, and route without storing authoritative participant content. The model must coexist additively with unchanged protocol 1.0 entries until an explicit local migration or projection is separately accepted. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-010 — Establish member participation and network sign-in.** Consider a separate member identity and member Sign in with ChatGPT path that never creates or implies Aitta ownership, remains distinct from Sites local sole-owner administration, and grants no independent access to ChatGPT conversations, memory, files, tokens, or billing data. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-011 — Add direct invitations.** Consider a direct invitation to a specific Aitta or permitted future space without inferring access from another relationship. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-012 — Establish report, block, and revocation safety.** Consider contract-backed reporting, blocking, revocation, access denial, and rate-limit foundations without creating shared participant-content storage. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-013 — Explore a narrow direct-conversation app space.** After the event, identity, consent, safety, retention, and authority contracts are accepted, consider a private, consent-based conversation vertical slice with clear block/report and safe-notification boundaries. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-014 — Explore App Idea as a deliberate participatory space.** After its permission and event contracts exist, consider a bounded place where a group can articulate a real need, discuss it, and receive a visible decision or closure; it must not promise automatic implementation. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-015 — Establish a trusted app-development and release loop.** Consider a human-reviewed process from an accepted need through specification, implementation, testing, security and compatibility review, approved release, and improvement. Events must not distribute executable code. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-016 — Explore declarative creation using trusted capabilities.** Only after a trusted runtime and bounded primitives exist, consider configuration from natural-language-described needs without treating generated executable code as an event or an automatically trusted release. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-017 — Evaluate narrow wider-network adapters.** Only after the internal event and trust model is stable, evaluate bounded adapter experiments with clear identity, authorization, blocking, deletion, moderation, authority, and fallback mappings; adapters translate at the boundary rather than defining the internal model. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-018 — Add member-controlled Follow and Unfollow.** After member identity is contract-defined, consider a deliberate member-controlled relationship to an Aitta with no automatic or reciprocal relationship, popularity count, or public graph. Strategic direction only; no implementation contract.
- [ ] **ROADMAP-019 — Add a member-private Your Network projection.** After member identity and Follow are contract-defined, consider a bounded, deterministic private projection of followed permitted public activity without remote credential transmission or durable shared participant-content storage. Strategic direction only; no implementation contract.

The referenced former `TASK` identifiers are unfinished deferral provenance,
not completed work or reusable IDs. Promotion from this roadmap receives new
monotonically increasing task IDs with an explicit achievable DoD and only the
direct prerequisites for that next increment.

## Promotion history

On 2026-08-09 the owner accepted earlier high-level direction under
`ROADMAP-001` through `ROADMAP-003`. Completed Aitta-first work from that
decision is recorded in `CHANGELOG.md`. On 2026-08-10 the owner returned the
still-blocked network program to `ROADMAP-004` through `ROADMAP-008` so
`PLAN.md` describes only the next immediately usable release. These records
are planning provenance, not capability claims.
