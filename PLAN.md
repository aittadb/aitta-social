# AittaSocial Stage 1 plan

This is the accepted, unfinished Stage 1 queue. IDs are stable. Finished work
moves to `CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`; and
the long-term direction belongs in `ROADMAP.md`. Every task is one bounded
vertical outcome with its necessary security, privacy, documentation, and
decisive evidence.

## Boundary

The current publishing proof of concept remains the foundation: one Aitta
deployment currently runs one independently controlled Aitta with local
sole-owner administration, public profile/update reads, drafts, and protocol
1.0 resources. No current capability includes Aitta Network membership,
invitations, following, Your Network, recursive app spaces, messaging, App
Ideas, or generated app implementations. Stage 1 must not guess an identity,
Hub, invitation, relationship, moderation, storage, or event contract.

## Active queue

- [ ] **TASK-190 — Verify the Sites identity-header ingress boundary without mutation.** This is a Stage 1 safety prerequisite. DoD: with the owner's explicit read-only approval, authoritative current-origin inventory, ephemeral configured-owner test input, and separate current owner/non-owner sessions, test `/owner` on every current Sites-provided and custom origin plus a local control using anonymous, forged owner/non-owner, owner, and non-owner requests; retain only status/redirect/access and stripped/overwritten/forwarded classifications, make no form, content, settings, access, domain, deployment, Hub, or data change, and retain no body, email, header, cookie, token, secret, or hosting identifier; record exactly verified ingress reliance, a documented signed assertion with exact verification fields, a demonstrated vulnerability, or unresolved; add one acceptance record, update only necessary trust documentation, independently review, validate, and push. Depends on: TASK-189.
- [ ] **TASK-198 — Pin the Stage 1 member identity and member Sign in with ChatGPT contract boundary.** This is a documentation-only contract refinement. DoD: make no runtime, route, schema, migration, credential, hosting, Hub, account, or external-state change; record either the exact authoritative versioned contract for member identity and member Sign in with ChatGPT, separately from current Sites Sign in with ChatGPT local sole-owner administration and Aitta ownership, or the exact missing external contract artifact that blocks it; state that member sign-in does not independently grant access to ChatGPT conversations, memory, files, tokens, or billing data. Do not define or add registration, discovery, invitations, relationships, Your Network, safety, storage, permissions, endpoints, credentials, or Hub behavior. Depends on: none.
- [ ] **TASK-222 — Centralize published-entry detail query assertions in tests.** This is test-maintainability only. DoD: add one dependency-free `tests/helpers/published-entry-detail-query-contract.mjs` leaf exporting canonical `assertPublishedOnlyDetailQueries(db, ids)`; preserve the exact behavior that filters recorded `from entries` queries, requires one query per ordered identifier, requires every query to contain `where id = ? and state = ?`, and requires ordered `[id, "published"]` bindings; replace the two byte-identical declarations in `tests/api-v1-entry-detail.test.mjs` and `tests/public-entry-document.test.mjs` with imports while keeping each consumer’s identifiers, response expectations, document oracle, and private-canary assertions local; add focused correct, unrelated-query, empty, repeated-identifier, wrong-count, missing-state-predicate, wrong-order, wrong-binding, and non-published-state evidence plus canonical-declaration, two-consumer-import, legacy-removal, cumulative lint-matrix, and cross-family regression evidence; reject top-level `assertPublishedOnlyDetailQueries` declarations outside the canonical helper across supported function, class, and variable declaration forms using `restrictedSyntaxErrorCount` without weakening prior restrictions; import no production implementation or test harness and add no dependency or production behavior, route, API, schema, migration, persistence, hosting, deployment, data, access, or external-state change; pass the helper and both consumer suites, repository checks, and full validation. Depends on: TASK-221.
