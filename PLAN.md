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
- [ ] **TASK-210 — Centralize API v1 JSON response expectations.** This is test-maintainability only. DoD: add dependency-free, narrowly named `tests/helpers/api-v1-json-response.mjs` exporting canonical `assertApiJson`; preserve the exact status, case-insensitive `application/json` content-type, caller-supplied `cache-control`, absent `location`, and case-insensitive tokenized `Vary: Accept` assertions; replace the three byte-identical declarations in API v1 profile, root, and entry-detail tests with imports; add focused positive/negative response-contract, canonical-declaration, consumer-import, and lint regression evidence; reject top-level `assertApiJson` redeclarations in test `.mjs` files outside the canonical helper across function, class, and variable declaration forms without weakening record-shape, regular-expression, public-footer, private-JSON, Accept-parser, or error-document restrictions; add no dependency or production, route, API, schema, migration, persistence, hosting, deployment, data, access, or external-state change; pass the three focused consumers plus helper test and full validation. Depends on: TASK-209.
