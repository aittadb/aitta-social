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
  and 166 focused test gates green; `npm audit --omit=dev` reports no production
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

- [ ] **TASK-060 — Complete the local presence-first functional journey.** Split from release acceptance: exercise clean-install and upgraded local fixtures as one source-provenance-bound candidate without deployment. DoD: verify empty and populated presence, owner, non-owner and missing-owner behavior, Hub-unavailable isolation, leading prompt only when unconfigured, fork-free Identity/presentation/update persistence, native navigation and clean console behavior; record exact evidence and independently reviewable defects; leave TASK-060 open while any named assertion fails because recording a correction does not satisfy this task; make no external-state change; and pass full validation. Depends on: TASK-059, TASK-149, TASK-150.
- [ ] **TASK-061 — Save and inspect an explicitly approved presence-first Sites checkpoint.** Split from release acceptance: only with separate owner approval, package and deploy the exact reviewed commit to the one existing Site without changing content, D1 data, protected settings, access, DNS or custom domains. DoD: verify deployment status and commit provenance; repeat configured public/owner/metadata/API/navigation and focused accessibility smoke checks; prove the setup prompt is absent on the configured Site; record checkpoint URL and residual uncertainty; make no unapproved external mutation; and pass post-deployment status checks. Depends on: TASK-060, TASK-136, TASK-137.
- [ ] **TASK-137 — Complete the rendered presence-first accessibility matrix.** Split from TASK-060: inspect public, permalink and owner journeys in production-equivalent local browsers without deployment. DoD: verify wide and actual 320-pixel layouts, 400-percent reflow equivalence, no overflow or off-screen controls, semantic landmarks and labels, native keyboard navigation, visible and forced-color focus, touch targets, contrast, reduced motion and clean console behavior; record exact evidence and defects; leave TASK-137 open while any named assertion fails because recording a correction does not satisfy this task; make no external-state change; and pass full validation. Depends on: TASK-148, TASK-149, TASK-150.
- [ ] **TASK-148 — Keep every supported runtime accent readable.** Runtime-customization accessibility correction found by TASK-137: make every accepted six-digit owner accent produce contrast-safe public and owner presentation without removing fork-free customization or corrupting legacy stored values. DoD: choose and document one deterministic server-owned foreground/fallback rule; apply it consistently to public pages, permalinks, owner previews, controls, and progress or decorative uses that require contrast; preserve the protocol 1.0 `accentColor` value exactly and make no public-envelope or authentication change; test darkest, lightest, threshold, legacy, malicious, preview, reload, upgrade, forced-colors, public/private-canary, and no-clobber cases; record the schema/migration/configuration decision; verify wide and 320-pixel rendered examples; and pass focused and full validation. Depends on: TASK-146.
- [ ] **TASK-149 — Add one fixed Content Security Policy to every application HTML response.** Worker security hardening: attach one reviewed `Content-Security-Policy` header in `worker/index.ts` to every handler-generated `text/html` response while leaving JSON and static-asset caching/contracts unchanged. DoD: define the smallest fixed directive allowlist compatible with the current built Vinext scripts, styles, fonts, navigation, forms, metadata, and same-origin assets; prohibit wildcards, `unsafe-eval`, object/embed execution, unreviewed framing, mixed content, and unnecessary outbound origins, and explicitly test/document any inline allowance that the current runtime demonstrably requires; prove the exact header on public, owner, configured, unconfigured, permalink, draft/unknown/error, and canonical-metadata HTML; cover escaped XSS payloads, unsafe-directive regressions, private canaries, current asset loading, native keyboard behavior, and clean console output at wide and 320-pixel layouts; record no schema, migration, public-protocol, runtime-setting, or hosting change; and pass focused and full validation. Depends on: none.
- [ ] **TASK-150 — Remove the provisional credential-bearing Hub root probe.** Presence security simplification: delete or server-disable the provisional root bearer probe without inventing replacement Hub registration behavior. DoD: remove `lib/hub.ts`, `app/api/private/hub/test/route.ts`, the `/owner/hub` control and owner-navigation entry, the now-empty `Advanced` label and its styling, and all now-unused `AITTA_SOCIAL_HUB_URL` and `AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL` runtime/example configuration and current setup guidance; preserve `AITTA_SOCIAL_HUB_CHALLENGE` and `hubVerificationChallenge` only where required by the existing public protocol 1.0 manifest contract; make the retired private route expose no probe behavior or credential-bearing redirect; prove no deployment credential or obsolete Hub origin reaches URLs, client code, bundles, HTML/JSON responses, headers, logs, errors, or redirects while owner authorization, public reads, discovery, keyboard navigation, and Hub-independent operation remain intact; preserve historical changelog/checkpoint evidence as history; record no schema, migration, public-protocol-version, hosting, or external-setting change; and pass focused and full validation. Depends on: none.
