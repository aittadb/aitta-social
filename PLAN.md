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
- [ ] **TASK-226 — Centralize public entry-kind display labels.** This is a behavior-preserving public-presentation maintainability slice. DoD: add one dependency-free `lib/entry-kind-label.ts` leaf exporting canonical `entryKindLabel(kind: EntryKind): string`; preserve the exact current first-code-unit uppercase and untouched suffix behavior for all four fixed `ENTRY_KINDS`; replace the two byte-identical `kindLabel` declarations in `app/page.tsx` and `app/entries/[id]/page.tsx` and the behaviorally identical entry-kind-only `capitalize` declaration in `lib/public-metadata.ts` with imports and calls while retaining all four existing label uses, note-label suppression, titleless permalink heading behavior, and titleless metadata fallback text; keep the independent literal entry-kind label oracle in `tests/public-contract.test.mjs` local rather than importing production code; add focused four-kind mapping, titleless metadata fallback, canonical-declaration, three-consumer-import, local-declaration-removal, cumulative lint-matrix, and cross-family regression evidence; reject top-level `entryKindLabel` and legacy `kindLabel` declarations outside the canonical leaf across supported function, class, and variable declaration forms using `restrictedSyntaxErrorCount`, keep every prior restriction active inside the canonical file, and prove TASK-225 `describedBy` ownership remains active in both canonical directions; add no dependency or observable production behavior, route, API, schema, migration, persistence, hosting, deployment, data, access, or external-state change; pass the focused helper, public-contract, public-hierarchy, metadata-contract, repository, and full validation gates. Depends on: TASK-225.
