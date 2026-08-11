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
- The deployed Site version 7 uses the exact reviewed and pushed historical
  `develop` source commit `a14fb61bd43c372d12fed02365020f4cc77c6b57`.
  Owner-reviewed pull request #6 rebase-merged the completed mobile-presence
  source into `main`; current `main` and refreshed `develop` both identify
  `18fa16dc967d8502c17afb2bd3cc28518039a172`, while the live Site still uses
  the older checkpoint recorded in `docs/checkpoint.md` and `CHANGELOG.md`.
- No accepted presence-consumable Hub contract currently exists. Secure Hub
  registration, verified discovery, Follow and Unfollow, and a private
  followed-update reader therefore remain future direction in `ROADMAP.md`.
  They return to this queue only one bounded vertical increment at a time after
  their exact external contract or service prerequisite exists; endpoints,
  claims, tokens, and data ownership must never be guessed.
- The live deployment remains the read-only pre-redesign visual baseline. The
  current `develop` source now uses the accepted compact, identity-led mobile
  presence documented in `docs/acceptance/task-156-mobile-presence-redesign.md`;
  the redesign was deliberately not deployed and changed no data,
  authentication, public contract, metadata, hosting, or private owner
  workspace.
- The planning checkout passes `npm run validate` with the instruction,
  license, plan, instance, runtime, D1 migration, type, lint, production-build,
  and 191 test gates green; `npm audit --omit=dev` reports no production
  dependency advisory.
- The accepted mobile-presence implementation is complete. TASK-157 is the one
  explicitly approved hosted checkpoint required to put that reviewed source
  on the existing Site without changing its content or configuration. The 34
  former Hub and network tasks remain future provenance under `ROADMAP-004`
  through `ROADMAP-008`, while more speculative lifecycle and suggestion work
  remains in `BACKLOG.md`.

## Active queue

This remains one flat dependency graph rather than phased work. Once every
recorded dependency is complete, tasks without an edge between them are
intended to be parallelizable when their declared files and migration surfaces
are disjoint. Each task owns one bounded outcome plus its tests, documentation,
and migration/configuration decision; split it again before implementation if
those cannot land as one focused reviewable commit.

- [ ] **TASK-157 — Deploy and verify the mobile-first presence redesign.** Save and deploy the exact validated and pushed current `develop` source to the one existing AittaSocial Site, then prove the hosted public presence uses the accepted mobile-first identity and update-stream composition. DoD: before the external mutation, pin a clean exact `develop` commit whose product tree contains the completed TASK-154 through TASK-156 redesign, confirm its pushed source provenance, run `npm run db:generate` with no migration drift, `npm run validate`, `npm audit --omit=dev`, and package inspection, and record value-safe preflight snapshots of Site identity and status, public access, protected-environment revision and key metadata, D1 binding/migration inventory, and custom-domain inventory; save exactly one new Site version with that commit SHA and deploy it to the existing public Site without creating a Site or changing access, owner grants, D1 content, protected settings, binding configuration, DNS, domains, Hub state, or `main`; require terminal `succeeded` status and exact version/source provenance; verify both the Sites URL and `https://jhh.aitta.social` show the compact one-line frame, graphical accent identity field, initials tile, concise About area, and identity-linked chronological update stream with the old `Public presence`, numbered editorial Introduction, sequence numbers, and generic `Read update` treatment absent; recheck representative public homepage and permalink navigation, signed-out owner dispatch plus read-only owner/non-owner boundaries, manifest and `/api/v1` envelopes, published-only privacy, canonical metadata, no-store HTML, fixed CSP and same-origin assets, 320/390/1440-pixel layout, first-viewport hierarchy, keyboard focus/navigation, effective touch targets, reduced motion, forced colors, and clean console/runtime evidence; require value-safe postflight snapshots to equal preflight and public/owner semantic observations to show no hosted content change; update `docs/checkpoint.md`, `CHANGELOG.md`, and the task evidence with exact commit, version, URLs, status, validation, preserved boundaries, and residual uncertainty, then remove only TASK-157 from `PLAN.md`. Depends on: none.
