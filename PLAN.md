# AittaSocial POC plan

This is the accepted, unfinished POC queue. IDs are stable. Finished work moves
to `CHANGELOG.md`; unscheduled possibilities belong in `BACKLOG.md`. Every item
is a bounded vertical slice whose definition of done includes its relevant
implementation, negative tests, security review, migration, and documentation.

Current external blockers:

- The owner explicitly changed the test Site to link-public access. Anonymous
  probes now reach AittaSocial: `/` returns the intentional empty public state,
  unconfigured public JSON routes return the same safe `profile_not_configured`
  response, and signed-out `/owner` redirects to Sign in with ChatGPT. A signed-in
  request reaches the owner boundary but does not match the protected sole-owner
  setting, so the hosted profile cannot yet be saved. Correct that value only
  through protected runtime settings; never disclose either email or weaken the
  check. Local production-equivalent owner/non-owner, write-authorization, and
  draft-privacy fixtures remain complete.
- A private version and successful deployment status were proven before access
  became link-public, but TASK-027 remains open because TASK-026 is an explicit
  dependency and its hosted owner checks are incomplete.
- The reusable prompt is now deliberately short, but the maintained default
  branch still contains only starter content. TASK-028 cannot prove a clean
  prompt-only deployment until the validated feature branch is promoted with
  explicit merge approval.

- [ ] **TASK-025 — Reuse and configure the existing Site.** Resolve exactly one AittaSocial/`aittasocial` match, stop on ambiguity, retain this GitHub repository as maintained source, provision its own D1, set protected owner/canonical keys without disclosure, and save the initial profile. DoD: no duplicate exists, active binding remains checkout-local, hosted owner/non-owner and fixture-based signed-out cases pass, and deployment notes record only safe identity-free evidence. Depends on: TASK-024.
- [ ] **TASK-026 — Inspect the Sites agent preview.** Exercise public empty/populated, each entry kind, permalink, missing-owner, non-owner, dashboard, profile, editor, lifecycle, and Hub states; correct functional, responsive, accessibility, and visual defects. DoD: focused regression tests and docs land with each fix and no further access or custom-domain change occurs. Depends on: TASK-025.
- [ ] **TASK-027 — Save and verify the approved link-public checkpoint.** Package the exact validated source plus checkout-local binding and reviewed migration, save one version, poll deployment status to success, and retain the owner-approved link-public access without a custom domain. DoD: the handoff includes the successful checkpoint URL, implemented/excluded scope, required setting keys, remaining decisions, and no secrets/hosting identifiers; no custom-domain or unrelated production change occurs. Depends on: TASK-026.
- [ ] **TASK-028 — Make the repository directly deployable from the short prompt.** Keep the README prompt minimal and self-contained, make the validated application and exact license available from the maintained default branch, and preserve the guarded private-first setup. DoD: a clean prompt-only deployment from the bare repository URL reaches the application, validation passes on the promoted commit, and the merge occurs only after explicit owner approval. Depends on: TASK-008, TASK-024.
