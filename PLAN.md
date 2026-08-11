# AittaSocial presence plan

This is the accepted, unfinished queue. IDs are stable. Finished work moves to
`CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item is
a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security and privacy review, accessibility,
migration and protocol decisions, documentation, and decisive evidence.

## Audit basis

- On 2026-08-09 the repository POC and public Site were rechecked. Public
  profile and published-update HTML, protocol 1.0 discovery and `/api/v1`, the
  sole-owner boundary, draft privacy, deployment-owned D1, native navigation,
  responsive behavior, and Hub-failure isolation are working and remain in
  scope without being rewritten.
- The deployed Site version 6 uses product source commit
  `3d028321f26cda7ce1e4cdbffc64406bb52e4ff5`; the current reviewed feature
  source includes the completed presence-first language, metadata, hierarchy,
  onboarding, runtime-customization, reproducibility, and upgrade work recorded
  in `CHANGELOG.md`. The older live version predates those source corrections;
  hosted alignment belongs only to the separately approved TASK-061 checkpoint.
- No accepted presence-consumable Hub contract currently exists. Secure Hub
  registration, verified discovery, Follow and Unfollow, and a private
  followed-update reader therefore remain future direction in `ROADMAP.md`.
  They return to this queue only one bounded vertical increment at a time after
  their exact external contract or service prerequisite exists; endpoints,
  claims, tokens, and data ownership must never be guessed.
- The planning checkout passes `npm run validate` with the instruction,
  license, plan, instance, runtime, D1 migration, type, lint, production-build,
  and 181 focused test gates green; `npm audit --omit=dev` reports no production
  dependency advisory.
- The current increment is deliberately smaller than the full social roadmap:
  finish the production-equivalent presence-first acceptance matrices, then
  save and inspect one separately approved Sites checkpoint. The 34 former Hub
  and network tasks are preserved as unfinished provenance under
  `ROADMAP-004` through `ROADMAP-008`, while more speculative lifecycle and
  suggestion work remains in `BACKLOG.md`.

## Active queue

This remains one flat dependency graph rather than phased work. Once every
recorded dependency is complete, tasks without an edge between them are
intended to be parallelizable when their declared files and migration surfaces
are disjoint. Each task owns one bounded outcome plus its tests, documentation,
and migration/configuration decision; split it again before implementation if
those cannot land as one focused reviewable commit.

- [ ] **TASK-061 — Save and inspect an explicitly approved presence-first Sites checkpoint.** Split from release acceptance: only with separate owner approval, package and deploy the exact reviewed commit to the one existing Site without changing content, D1 data, protected settings, access, DNS or custom domains. DoD: verify deployment status and commit provenance; repeat configured public/owner/metadata/API/navigation and focused accessibility smoke checks; prove the setup prompt is absent on the configured Site; record checkpoint URL and residual uncertainty; make no unapproved external mutation; and pass post-deployment status checks. Depends on: TASK-060, TASK-136, TASK-137.
- [ ] **TASK-137 — Complete the rendered presence-first accessibility matrix.** Split from TASK-060: inspect public, permalink and owner journeys in production-equivalent local browsers without deployment. DoD: verify wide and actual 320-pixel layouts, 400-percent reflow equivalence, no overflow or off-screen controls, semantic landmarks and labels, native keyboard navigation, visible and forced-color focus, touch targets, contrast, reduced motion and clean console behavior; record exact evidence and defects; leave TASK-137 open while any named assertion fails because recording a correction does not satisfy this task; make no external-state change; and pass full validation. Depends on: TASK-149, TASK-150, TASK-151.
