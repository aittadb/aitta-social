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
- The deployed Site version 7 uses the exact reviewed and pushed `develop`
  source commit `a14fb61bd43c372d12fed02365020f4cc77c6b57`. The
  presence-first language, metadata, hierarchy, onboarding,
  runtime-customization, reproducibility, upgrade, security, and rendered
  accessibility work is aligned with the live checkpoint recorded in
  `docs/checkpoint.md` and `CHANGELOG.md`; `main` remains untouched pending a
  later owner-reviewed pull request.
- No accepted presence-consumable Hub contract currently exists. Secure Hub
  registration, verified discovery, Follow and Unfollow, and a private
  followed-update reader therefore remain future direction in `ROADMAP.md`.
  They return to this queue only one bounded vertical increment at a time after
  their exact external contract or service prerequisite exists; endpoints,
  claims, tokens, and data ownership must never be guessed.
- The planning checkout passes `npm run validate` with the instruction,
  license, plan, instance, runtime, D1 migration, type, lint, production-build,
  and 188 test gates green; `npm audit --omit=dev` reports no production
  dependency advisory.
- The accepted presence-first increment is complete, so the active queue is
  intentionally empty. The 34 former Hub and network tasks remain future
  provenance under `ROADMAP-004` through `ROADMAP-008`, while more speculative
  lifecycle and suggestion work remains in `BACKLOG.md`. Promote only the next
  immediately useful, contract-backed vertical increment when it is concrete.

## Active queue

This remains one flat dependency graph rather than phased work. Once every
recorded dependency is complete, tasks without an edge between them are
intended to be parallelizable when their declared files and migration surfaces
are disjoint. Each task owns one bounded outcome plus its tests, documentation,
and migration/configuration decision; split it again before implementation if
those cannot land as one focused reviewable commit.

There is no accepted unfinished task. Promote only the next smallest meaningful
increment from `ROADMAP.md` or `BACKLOG.md` after its prerequisites and binary
definition of done are concrete.
