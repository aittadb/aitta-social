# AittaSocial POC plan

This is the accepted, unfinished POC queue. IDs are stable. Finished work moves
to `CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item
is a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security review, migration, and documentation.

Current external blockers:

- Preview and hosted review are complete. They proved owner/non-owner and
  signed-out behavior, profile and entry persistence, public privacy, entry
  lifecycle, and narrow layouts. The review found one empty-request-stream Hub
  incompatibility; it is fixed and full validation passes with 78 tests.
- Draft pull request [#1](https://github.com/aittadb/aitta-social/pull/1) now
  contains the validated application and short deployment prompt. The owner
  must review and rebase-merge it; an agent must not directly update or merge
  `main`.
- TASK-027 is intentionally post-merge. A rebase merge creates new commit
  identifiers, so its provenance-bound deployment work must start on a fresh
  branch from the resulting `origin/main`. No custom domain is connected.

- [ ] **TASK-027 — Verify post-merge prompt deployment and checkpoint.** Begin only after the owner rebase-merges the reviewed pull request; fetch the resulting `origin/main`, create a fresh `codex/*` branch from that exact head, validate the bare-repository prompt path, and package the checkout-local binding plus reviewed migration from that source. DoD: the exact main-derived commit is saved and deployed with successful status, the corrected Hub control is rechecked, the approved link-public access remains unchanged without a custom domain, the safe checkpoint and handoff evidence are updated, and the evidence branch is pushed for review without merging it. Depends on: TASK-028.
