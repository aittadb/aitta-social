# AittaSocial POC plan

This is the accepted, unfinished POC queue. IDs are stable. Finished work moves
to `CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item
is a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security review, migration, and documentation.

Current external blocker: the verified owner-only Sites deployment succeeds,
but Sites denies the sole owner after the normal ChatGPT consent flow before a
request reaches AittaSocial. Keep access private; do not add a bypass or broaden
the allowlist. This blocks the hosted initial profile and owner-experience checks
in TASK-025 and TASK-026, while local fixture coverage remains complete.

- [ ] **TASK-008 — Finalize the project license.** Obtain the exact owner-selected FSL variant, parameters, and change license, replace the non-granting placeholder with reviewed official text, and add required notices/checks. DoD: owner confirms exact terms, automated repository checks pass, and README/changelog identify the final license without paraphrasing it. Depends on: TASK-007.
- [ ] **TASK-025 — Reuse and configure the existing private Site.** Resolve exactly one AittaSocial/`aittasocial` match, stop on ambiguity, retain this GitHub repository as maintained source, provision its own D1, set protected owner/canonical keys without disclosure, and save the initial profile. DoD: no duplicate exists, active binding remains checkout-local, hosted owner/non-owner and fixture-based signed-out cases pass, and deployment notes record only safe identity-free evidence. Depends on: TASK-024.
- [ ] **TASK-026 — Inspect the Sites agent preview.** Exercise public empty/populated, each entry kind, permalink, missing-owner, non-owner, dashboard, profile, editor, lifecycle, and Hub states; correct functional, responsive, accessibility, and visual defects. DoD: focused regression tests and docs land with each fix and no public/custom-domain access change occurs. Depends on: TASK-025.
- [ ] **TASK-027 — Save and verify a private checkpoint.** Package the exact validated source plus checkout-local binding and reviewed migration, save one private version, poll deployment status to success, and retain private access. DoD: the handoff includes the successful private URL, implemented/excluded scope, required setting keys, remaining decisions, and no secrets/hosting identifiers; no public release or custom domain occurs. Depends on: TASK-026.
