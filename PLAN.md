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
- [ ] **TASK-227 — Centralize repository migration inventory in tests.** This is a behavior-preserving test-infrastructure maintainability slice. DoD: add one Node-test-only `tests/helpers/migration-inventory.mjs` leaf exporting canonical `migrationInventory(repositoryRoot)`; preserve the exact current behavior of reading only `<repositoryRoot>/drizzle` directory entries, retaining regular files whose names match `/^\d+_.+\.sql$/u`, returning `drizzle/<filename>` paths in lexical order, and propagating filesystem failures; replace the byte-identical local declarations in `tests/presence-functional-matrix.test.mjs` and `tests/public-contract-privacy-matrix.test.mjs` with imports, pass their existing `REPOSITORY_ROOT` at all five call sites, remove the now-unused `readdir` imports, and preserve provenance, fresh-install, upgrade, and migration-application evidence; add focused inclusion, exclusion, regular-file, ordering, missing-directory, canonical-declaration, two-consumer-import, local-declaration-removal, and cumulative lint evidence; reject top-level `migrationInventory` declarations outside the canonical leaf across all supported function, class, and variable declaration forms using `restrictedSyntaxErrorCount`, keep every prior restriction active inside the canonical file, and prove TASK-226 `entryKindLabel` ownership remains active in both canonical directions; add no dependency or production behavior, route, API, schema, migration, persistence, hosting, deployment, data, access, or external-state change; pass the focused helper, both matrix, lint, database, plan, and full validation gates. Depends on: TASK-226.
