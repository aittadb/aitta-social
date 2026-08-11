# AittaSocial backlog

This file contains unscheduled possibilities. Backlog items are not commitments
and must not introduce placeholder tables, routes, interfaces, or empty
abstractions. Stable `BACKLOG-NNN` identifiers are never renumbered or reused;
accepted work must be promoted to `PLAN.md` before implementation.

## Unscheduled possibilities

- [ ] **BACKLOG-004 — Hub registration transfer.** Deferred from `TASK-069`,
  `TASK-103`, `TASK-111`, and `TASK-125`. A future accepted slice may let two
  authorized Hub identities transfer control of an Aitta's Hub registration
  and prove it with disposable state. This does not move the Site, D1 content,
  repository, domain, or local owner setting.
- [ ] **BACKLOG-005 — Hub credential and key rotation.** Deferred from
  `TASK-044`, `TASK-101`, `TASK-109`, and `TASK-123`. A future accepted slice
  may replace expiring or compromised Hub keys and credentials with ordered
  activation, revocation, recovery, and disposable hosted proof.
- [ ] **BACKLOG-006 — Hub reconnection.** Deferred from `TASK-068`, `TASK-102`,
  `TASK-110`, and `TASK-124`. A future accepted slice may reconnect a stale or
  disconnected Aitta after exact origin and key continuity or reverification.
- [ ] **BACKLOG-007 — Lost Hub credential recovery.** Deferred from `TASK-070`,
  `TASK-104`, `TASK-112`, and `TASK-127`. A future accepted slice may recover a
  registration when its prior key or credential material cannot be used.
- [ ] **BACKLOG-008 — Canonical-origin change.** Deferred from `TASK-089`,
  `TASK-105`, `TASK-113`, and `TASK-126`. A future accepted slice may reverify
  and move a Hub registration to another already controlled HTTPS origin.
- [ ] **BACKLOG-009 — Aitta decommissioning.** Deferred from `TASK-090`,
  `TASK-106`, `TASK-114`, and `TASK-130`. A future accepted slice may retire a
  Hub registration while preserving Aitta-owned profile and update data.
- [ ] **BACKLOG-010 — Local-owner rebind.** Deferred from `TASK-091`,
  `TASK-107`, `TASK-115`, and `TASK-128`. A future accepted slice may safely
  reauthorize Hub after the protected sole-owner setting changes without
  transmitting either email.
- [ ] **BACKLOG-011 — Opaque Hub-subject transition.** Deferred from `TASK-108`,
  `TASK-116`, `TASK-117`, and `TASK-129`. A future accepted slice may recover
  Hub identity continuity without changing or inferring local Site ownership.
- [ ] **BACKLOG-012 — Advanced Hub lifecycle framework and acceptance.**
  Deferred from `TASK-064`, `TASK-065`, and `TASK-134`. If advanced lifecycle
  operations are promoted, first accept their shared receipt, retry,
  concurrency, uncertain-state, rollback, and local acceptance boundaries.
- [ ] **BACKLOG-013 — Relationship visibility controls.** Deferred from
  `TASK-080`, `TASK-118`, `TASK-119`, and `TASK-138`. A future accepted slice
  may let an owner change relationship visibility from its safe private default.
- [ ] **BACKLOG-014 — Privacy-safe Aitta suggestions.** Deferred from
  `TASK-051`, `TASK-052`, `TASK-076`, `TASK-083`, `TASK-084`, `TASK-092`,
  `TASK-133`, and `TASK-140`. A future accepted slice may show bounded,
  privacy-safe suggestions and require an explicit verified Follow action.
- [ ] **BACKLOG-015 — Suggestion opt-out.** Deferred from `TASK-098`,
  `TASK-099`, `TASK-100`, and `TASK-139`. A future accepted slice may let the
  owner disable and re-enable suggestions without changing content or edges.
- [ ] **BACKLOG-016 — Hosted revoke and disconnect proof.** Deferred from
  `TASK-122`. The retained local contract and implementation work may later be
  followed by a separately approved disposable hosted verification.

The owner deferred these items on 2026-08-10 because they are not required for
the next immediately usable Aitta-first release. The smaller core network
direction is recorded separately in `ROADMAP-004` through `ROADMAP-008`; these
backlog items remain optional even within that future program. The referenced
`TASK` identifiers are unfinished deferral provenance, not completed work; any
future promotion receives new monotonically increasing `TASK` identifiers and
a fresh achievable DoD.

## Promotion history

On 2026-08-09 the owner initially promoted the previous network candidates:

- `BACKLOG-001` (following Aittas) is represented by `TASK-047` and
  `TASK-048`.
- `BACKLOG-002` (combined followed-Aitta reader) is represented by
  `TASK-049` and `TASK-050`.
- `BACKLOG-003` (Aitta discovery) is represented by `TASK-045` and
  `TASK-046`.

On 2026-08-10 their still-unfinished core network direction returned to
`ROADMAP-005` through `ROADMAP-007`, which preserve the former task-ID
provenance. `PLAN.md` is authoritative only for the current accepted increment,
`ROADMAP.md` for future direction, and `CHANGELOG.md` for completed work; this
file makes no current-capability or delivery claim.
