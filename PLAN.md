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
- [ ] **TASK-223 — Centralize Vary-header tokenization in tests.** This is test-maintainability only. DoD: add one dependency-free `tests/helpers/vary-header-tokens.mjs` leaf exporting canonical `varyHeaderTokens(response)`; preserve the existing missing-header `[""]` result, comma splitting, trimming, lowercase normalization, token order, repetitions, and empty segments without normalizing the consumer’s lookup token; replace the byte-identical `hasVaryToken` declarations in `tests/helpers/api-v1-json-response.mjs` and `tests/public-entry-document.test.mjs` plus the semantically equivalent `hasVaryToken`/`varyTokens` pair in `tests/api-v1-collection.test.mjs` with imports/use while retaining each consumer’s status, content-type, cache, location, CSP, Accept/Authorization membership, exact-once, and private-canary assertions; add focused missing, mixed-case/whitespace, ordered, repeated, empty-segment, exact-membership, canonical-declaration, three-consumer-import, legacy-removal, cumulative lint-matrix, and cross-family regression evidence; reject top-level `varyHeaderTokens`, legacy `hasVaryToken`, and legacy `varyTokens` declarations outside the canonical helper across supported function, class, and variable declaration forms using `restrictedSyntaxErrorCount`, keep both legacy names rejected inside the canonical file, and do not weaken prior restrictions; import no production implementation or test harness and add no dependency or production behavior, route, API, schema, migration, persistence, hosting, deployment, data, access, or external-state change; pass the helper and three consumer suites, repository checks, and full validation. Depends on: TASK-222.
