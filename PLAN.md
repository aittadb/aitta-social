# AittaSocial POC plan

This is the accepted, unfinished POC queue. IDs are stable. Finished work moves
to `CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item
is a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security review, migration, and documentation.

Current external blockers:

- TASK-008 has no authoritative exact FSL variant, parameters, change license,
  official selected text, or owner confirmation anywhere in this repository or
  its reachable history. Do not infer or copy terms.
- The verified Sites deployment is active with custom access, exactly one owner,
  no groups or external visitors, protected owner/canonical settings, and no
  custom domain. An earlier authenticated `GET /` reached AittaSocial with a 200,
  but current in-app and Chrome owner retries are rejected by Sites before any
  Worker invocation. This blocks deterministic hosted owner/profile proof in
  TASK-025 and TASK-026. Keep access private; do not generate a bypass or
  broaden the allowlist. Local production-equivalent signed-out/non-owner and
  owner-authorization fixtures remain complete.
- The final private version and successful deployment status required by
  TASK-027 are proven, but the task remains open because TASK-026 is an explicit
  dependency and its hosted owner checks are incomplete.

- [ ] **TASK-008 — Finalize the project license.** Obtain the exact owner-selected FSL variant, parameters, and change license, replace the non-granting placeholder with reviewed official text, and add required notices/checks. DoD: owner confirms exact terms, automated repository checks pass, and README/changelog identify the final license without paraphrasing it. Depends on: TASK-007.
- [ ] **TASK-025 — Reuse and configure the existing private Site.** Resolve exactly one AittaSocial/`aittasocial` match, stop on ambiguity, retain this GitHub repository as maintained source, provision its own D1, set protected owner/canonical keys without disclosure, and save the initial profile. DoD: no duplicate exists, active binding remains checkout-local, hosted owner/non-owner and fixture-based signed-out cases pass, and deployment notes record only safe identity-free evidence. Depends on: TASK-024.
- [ ] **TASK-026 — Inspect the Sites agent preview.** Exercise public empty/populated, each entry kind, permalink, missing-owner, non-owner, dashboard, profile, editor, lifecycle, and Hub states; correct functional, responsive, accessibility, and visual defects. DoD: focused regression tests and docs land with each fix and no public/custom-domain access change occurs. Depends on: TASK-025.
- [ ] **TASK-027 — Save and verify a private checkpoint.** Package the exact validated source plus checkout-local binding and reviewed migration, save one private version, poll deployment status to success, and retain private access. DoD: the handoff includes the successful private URL, implemented/excluded scope, required setting keys, remaining decisions, and no secrets/hosting identifiers; no public release or custom domain occurs. Depends on: TASK-026.
