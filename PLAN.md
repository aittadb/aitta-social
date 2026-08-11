# AittaSocial presence plan

This is the accepted, unfinished queue. IDs are stable. Finished work moves to
`CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item is
a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security and privacy review, accessibility,
migration and protocol decisions, documentation, and decisive evidence.

## Audit basis

- On 2026-08-11 the repository POC and public Site were rechecked. Public
  profile and published-update HTML, protocol 1.0 discovery and `/api/v1`, the
  sole-owner boundary, draft privacy, deployment-owned D1, native navigation,
  responsive behavior, and Hub-failure isolation are working and remain in
  scope without being rewritten.
- The one existing public Site now runs version 8 from exact owner-reviewed
  `main` source commit `18fa16dc967d8502c17afb2bd3cc28518039a172`.
  The saved version and terminal deployment report that exact commit, and the
  preserved access, protected-environment metadata, D1 binding, and custom
  domain evidence is recorded in `docs/checkpoint.md` and
  `docs/acceptance/task-157-mobile-presence-deployment.md`.
- No accepted presence-consumable Hub contract currently exists. Secure Hub
  registration, verified discovery, Follow and Unfollow, and a private
  followed-update reader therefore remain future direction in `ROADMAP.md`.
  They return to this queue only one bounded vertical increment at a time after
  their exact external contract or service prerequisite exists; endpoints,
  claims, tokens, and data ownership must never be guessed.
- The public deployment now uses the accepted compact, identity-led mobile
  presence documented in
  `docs/acceptance/task-156-mobile-presence-redesign.md`. The authenticated
  owner workspace deliberately retained its earlier sidebar, editorial panels,
  long form hierarchy, and wrapped phone navigation, so it remains the next
  accepted visual and interaction gap rather than a completed redesign claim.
- Exact deployed source validation passes the instruction, license, plan,
  instance, runtime, D1 migration, type, lint, production-build, and 191 test
  gates; migration generation reports no change and the production dependency
  audit reports no advisory. The active owner-workspace tasks must preserve
  those product, authorization, privacy, and public-contract boundaries.
- The next increment establishes only a bounded AittaSocial-specific visual
  vocabulary and simpler owner journeys. It is not authority for a generic UI
  framework, general theme system, new persisted customization, public/owner
  authorization coupling, or new capability. The 34 former Hub and network
  tasks remain future provenance under `ROADMAP-004` through `ROADMAP-008`,
  while more speculative lifecycle and suggestion work remains in
  `BACKLOG.md`.

## Active queue

This remains one flat dependency graph rather than phased work. Once every
recorded dependency is complete, tasks without an edge between them are
intended to be parallelizable when their declared files and migration surfaces
are disjoint. Each task owns one bounded outcome plus its tests, documentation,
and migration/configuration decision; split it again before implementation if
those cannot land as one focused reviewable commit.

- [ ] **TASK-158 — Establish the shared AittaSocial visual vocabulary and compact owner home.** Replace the authenticated owner's old software-brand bar, desktop sidebar, wrapped phone navigation, oversized editorial headings, duplicated readiness panels, and report-like dashboard with one mobile-first sole-owner frame and action-first home while keeping the public presence composition distinct. DoD: use only a bounded compile-time AittaSocial vocabulary for semantic surfaces, ink, separators, focus, fields, 44-pixel controls, primary/quiet/danger actions, status, notices, empty states, and compact owner rows, reusing existing safe color and accent boundaries where meanings match without introducing a generic component library, card factory, runtime theme, arbitrary CSS, new setting, or public/owner frame coupling; keep a 56–64-pixel app header, one non-wrapping real-destination route bar, public-view and sign-out actions, one clear state-derived dashboard next action, compact status/count information, and a scannable update list; preserve native anchors, authorization-before-D1, signed-out/non-owner/missing-owner behavior, update actions, private canaries, public home/permalink rendering, metadata, APIs, schema, and data; prove fresh, incomplete, complete, zero/one/many/long-update states at 320, 390, 768, and 1440 pixels with no overflow or obscured focus, logical headings and Tab order, 44-pixel targets, reduced motion, forced colors, 400-percent reflow equivalence, and clean console evidence; update presentation documentation and a task acceptance record; and pass focused security/accessibility/public-regression tests, `npm run db:generate` with no drift, `npm run validate`, `npm audit --omit=dev`, and `git diff --check` without any Site or hosted-state mutation. Depends on: none.
- [ ] **TASK-159 — Make Identity editing a simple mobile owner task.** Recompose the guarded Identity route around the TASK-158 owner frame and narrowly shared owner field, help, validation, mutation-status, and form-action patterns, with required identity fields first, one compact saved-versus-unsaved state, a restrained presence preview, and secondary details that remain discoverable without competing with the save task. DoD: explain protected canonical configuration versus stored fallback in plain language without exposing a setting or authenticated identity; preserve the exact profile payload, validation, recovery behavior, account-type boundary, constrained safe accent and density controls, attribution option, eight links, native labels, current API, same-origin and sole-owner authorization, D1 values, protocol, public rendering, and upgrade behavior; associate errors with their fields, keep save and recovery actions unambiguous, and introduce no automatic save, browser storage, generic form framework, arbitrary style input, new profile field, schema, or configuration; prove fresh, incomplete, complete, saved, unsaved, runtime/stored/invalid canonical, long-value, eight-link, validation, failure, denial, and private-canary states at 320, 390, and 1440 pixels with keyboard, focus, touch, 400-percent reflow, reduced-motion, forced-color, and clean-console evidence; update presentation/journey documentation and a task acceptance record; and pass focused identity, security, accessibility, public/accent regression, migration-drift, full-validation, production-audit, and diff gates without external mutation. Depends on: TASK-158.
- [ ] **TASK-160 — Make update composition and lifecycle app-like and self-explanatory.** Apply the accepted owner frame and shared owner control patterns to new-update, edit-update, dashboard-row, and lifecycle actions so creating and managing an update is a compact mobile task rather than a blog editor. DoD: explain Draft and Published states in direct language; keep note body primary; present kind-relevant requirements and help without discarding any entered value when kind changes; use field-associated validation, a compact primary action hierarchy, and explicit update-specific publish, unpublish, delete, unknown-result, and recovery feedback; preserve every create, edit, publish, unpublish, delete, destination, confirmation, idempotency, same-origin, authorization, D1, draft-privacy, unknown-parity, public projection, cache, metadata, API, and protocol behavior, with no auto-publish, background retry, fake social control, generic editor framework, schema, or network feature; prove new, draft, published, all four kinds, empty/one/many rows, long/unbroken content, failure/recovery, denial, and private-canary states at 320, 390, and 1440 pixels with keyboard, focus, touch, 400-percent reflow, reduced-motion, forced-color, and clean-console evidence; update presentation/journey documentation and a task acceptance record; and pass focused mutation, security, privacy, accessibility, public-contract, migration-drift, full-validation, production-audit, and diff gates without Site or hosted-state mutation. Depends on: TASK-159.
