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
- [ ] **TASK-206 — Centralize bounded Accept media-range parsing.** This is a behavior-preserving production maintainability slice. DoD: add one dependency-free, narrowly named `lib/accept-media-ranges.ts` leaf owning the current `AcceptMediaRange` shape, 4 KiB UTF-8 header limit, 16-range limit, token and q-value grammar, quoted parameter validation, and quote-aware comma/semicolon splitting; make the JSON-only v1 Accept policy and public entry HTML/JSON negotiation import that parser while preserving their distinct missing-header defaults, specificity, exclusion, ordering, tie, malformed-header, `406`, and pre-D1 behavior exactly; remove both copies of `parseMediaRange`, `validParameterValue`, `splitOutsideQuotes`, and their duplicated parser constants; add focused parser tests for tokens, case normalization, wildcards, q precision and duplication, quoted delimiters and escapes, empty/malformed segments, UTF-8 byte bounds, and range bounds, plus canonical-declaration, consumer-import, and ESLint regression evidence; reject top-level redeclarations of the retired and canonical parser names outside the canonical leaf without weakening the existing record-shape or regular-expression-literal restrictions; add no dependency and make no route, API contract, schema, migration, persistence, hosting, deployment, data, access, or external-state change; pass representative v1/public negotiation tests and full validation. Depends on: TASK-205.
