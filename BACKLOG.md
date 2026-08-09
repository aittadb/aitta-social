# AittaSocial backlog

This file contains possible work beyond the account POC. Backlog items are not
commitments and must not introduce placeholder tables, routes, interfaces, or
empty abstractions into the current implementation.

IDs are stable and unscheduled. An item must be explicitly accepted, split into
a bounded vertical slice with dependencies and definition of done, and promoted
to `PLAN.md` before any implementation begins. Its presence here is never a
claim that the capability exists or is planned for a release.

The network items below depend on explicit AittaSocial Hub contracts for
network-user registration and deployment discovery, plus trusted
Hub-issued network sessions. This account's local Sign in with ChatGPT cannot
substitute for those sessions, and Hub must continue to treat account
deployments as untrusted external websites.

- **BACKLOG-001 — Following accounts.** Consider following verified AittaSocial accounts only after Hub supplies accepted network identity/session and deployment-resolution contracts. Any promoted work must define one accepted service as the owner of follow state, test untrusted/deleted/unavailable deployments, and document privacy, portability, and removal behavior.
- **BACKLOG-002 — Combined followed-account timeline.** Consider a combined timeline only after BACKLOG-001 and trusted network-session work are accepted and complete. Any promoted work must use bounded retrieval without making an account's public page depend on Hub, test malicious/unavailable/slow deployments and deterministic ordering, and document provenance and failure isolation.
- **BACKLOG-003 — People and account discovery.** Consider discovery through Hub's public deployment directory only after its contract and abuse/privacy controls are accepted. Any promoted work must avoid a speculative local index, test verification, stale records, opt-out, and unsafe metadata, and document ranking-neutral behavior and owner control.

These are intentionally not partially implemented in the POC.
