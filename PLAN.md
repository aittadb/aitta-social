# AittaSocial POC plan

This is the accepted, unfinished POC queue. IDs are stable. Finished work moves
to `CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item
is a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security review, migration, and documentation.

Current external blockers:

- Hosted owner/non-owner, signed-out public reads, profile persistence, draft
  privacy, publication lifecycle, public JSON privacy, and narrow layouts now
  pass. The review found and fixed an empty-request-stream incompatibility in
  the optional Hub test; full validation passes with 77 tests on the feature
  branch.
- Sites correctly refused to save the corrected archive because its commit is
  not the configured source branch's current `main` HEAD. TASK-028 requires
  explicit owner approval to promote the validated feature branch to `main`.
  Do not mislabel an archive or bypass source provenance.
- TASK-026 and therefore TASK-027 remain open until that promoted commit is
  saved, deployed under the already approved link-public access, and the fixed
  hosted Hub control is rechecked. No custom domain is connected.

- [ ] **TASK-026 — Inspect the Sites agent preview.** Exercise public empty/populated, each entry kind, permalink, missing-owner, non-owner, dashboard, profile, editor, lifecycle, and Hub states; correct functional, responsive, accessibility, and visual defects. DoD: focused regression tests and docs land with each fix and no further access or custom-domain change occurs. Depends on: TASK-025, TASK-028.
- [ ] **TASK-027 — Save and verify the approved link-public checkpoint.** Package the exact validated source plus checkout-local binding and reviewed migration, save one version, poll deployment status to success, and retain the owner-approved link-public access without a custom domain. DoD: the handoff includes the successful checkpoint URL, implemented/excluded scope, required setting keys, remaining decisions, and no secrets/hosting identifiers; no custom-domain or unrelated production change occurs. Depends on: TASK-026.
- [ ] **TASK-028 — Make the repository directly deployable from the short prompt.** Keep the README prompt minimal and self-contained, make the validated application and exact license available from the maintained default branch, and preserve the guarded private-first setup. DoD: a clean prompt-only deployment from the bare repository URL reaches the application, validation passes on the promoted commit, and the merge occurs only after explicit owner approval. Depends on: TASK-008, TASK-024.
