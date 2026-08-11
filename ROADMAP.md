# AittaSocial roadmap

This file records high-level future product direction, not current capability
or a release commitment. Stable `ROADMAP-NNN` identifiers must not be
renumbered or reused. Accepted implementation work moves into `PLAN.md` only
one meaningful vertical increment at a time; unscheduled possibilities remain
in `BACKLOG.md`, and completed evidence belongs in `CHANGELOG.md`.

The current `PLAN.md` ends with a production-equivalent Aitta-first release
and one separately approved Sites checkpoint. The following social direction
is intentionally not active work while its exact Hub contracts and review
services do not exist:

- [ ] **ROADMAP-004 — Establish secure optional Hub registration and disconnect.** Let the sole local owner establish and later remove one Hub connection for an Aitta without pasted secrets, shared content storage, or loss of local public operation. This preserves unfinished provenance from former `TASK-042`, `TASK-043`, `TASK-062`, `TASK-063`, `TASK-066`, `TASK-067`, `TASK-086`, `TASK-095`, `TASK-096`, and `TASK-097`.
- [ ] **ROADMAP-005 — Add verified Aitta discovery.** Make an Aitta's public protocol consumable by AittaSocial Hub, then let the owner resolve and browse minimal opted-in verified profile metadata without rankings, identity-truth claims, or a local directory copy. This preserves unfinished provenance from former `TASK-041`, `TASK-045`, `TASK-046`, `TASK-071`, `TASK-072`, `TASK-087`, and `TASK-088`.
- [ ] **ROADMAP-006 — Add explicit one-way Follow and Unfollow.** Use a session confined to the acting Aitta so the owner can deliberately create or remove one Hub-owned edge, with no automatic or reciprocal relationship, popularity count, or public graph. This preserves unfinished provenance from former `TASK-047`, `TASK-048`, `TASK-073`, `TASK-074`, `TASK-075`, and `TASK-131`.
- [ ] **ROADMAP-007 — Add a private followed-update reader.** Safely read one followed verified origin and then a bounded followed set into a deterministic owner-only feed without remote credential transmission or durable shared content storage. This preserves unfinished provenance from former `TASK-049`, `TASK-050`, `TASK-077`, `TASK-078`, `TASK-081`, `TASK-082`, `TASK-120`, `TASK-121`, and `TASK-132`.
- [ ] **ROADMAP-008 — Prove the connected social POC as one candidate.** After the preceding vertical slices exist, run the coordinated local and separately approved hosted evidence needed to call that exact connected source a reproducible social POC. This preserves unfinished provenance from former `TASK-053` and `TASK-135`.
- [ ] **ROADMAP-009 — Adopt the versioned Aitta Network event foundation.** After the AittaSocial Hub repository completes its shared envelope, type, thread, feed, and compatibility contracts, adopt them here in bounded conformance and product slices: each Aitta remains authoritative for events it creates, while remote readers treat the claimed authoring Aitta as untrusted until verified; optional parent references derive cross-Aitta threads; visibility and delivery remain independent of type and parent structure; feeds are access-controlled ordered projections; remote ancestry is untrusted and bounded; and Hub may authorize, discover, and route without storing authoritative participant content. The model must coexist additively with unchanged protocol 1.0 entries until an explicit local migration or projection is separately accepted.

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
