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
- The live deployment and current source share the same public visual
  implementation: a large editorial identity hero, numbered Introduction, and
  article-like entry previews place updates below the first phone viewport.
  The accepted next increment replaces that hierarchy with a compact,
  identity-led mobile presence without changing data, authentication, public
  contracts, metadata, hosting, or the private owner workspace.
- The planning checkout must pass the instruction, license, plan, instance,
  runtime, D1 migration, type, lint, production-build, and complete test gates.
  The 34 former Hub and network tasks remain future provenance under
  `ROADMAP-004` through `ROADMAP-008`, while more speculative lifecycle and
  suggestion work remains in `BACKLOG.md`.

## Active queue

This remains one flat dependency graph rather than phased work. Once every
recorded dependency is complete, tasks without an edge between them are
intended to be parallelizable when their declared files and migration surfaces
are disjoint. Each task owns one bounded outcome plus its tests, documentation,
and migration/configuration decision; split it again before implementation if
those cannot land as one focused reviewable commit.

- [ ] **TASK-154 — Establish the compact shared public frame and identity area.** Replace the configured homepage and shared permalink framing with AittaSocial's mobile-first presence composition while keeping unconfigured and unavailable public states composed and semantically unchanged. DoD: at 320 pixels the public top row is one 56–64-pixel line with a bounded identity cue, its complete accessible name, and one quiet 44-pixel owner-management destination; configured identity renders a 96–120-pixel solid safe-accent field with two same-accent CSS forms, an 80–96-pixel derived-initials tile, one sans-serif 30–34-pixel phone name that tops out at 40 pixels, short description, collapsing optional location/site/eight-link rows, and concise About content whose full text remains keyboard-revealable without silent truncation; missing optional data leaves no placeholder or gap; the shared secondary footer preserves owner-hideable AittaSocial/source attribution plus the discovery manifest and site/collection JSON routes; focused SSR, long-content, safe-accent, accessible-name, native-anchor, owner-entry, and private-canary tests pass; `docs/presentation.md` and a task acceptance record document the fixed brand/layout and no schema, protocol, metadata, API, owner-workspace, network, or external-state change; and focused repository gates pass. Depends on: none.

- [ ] **TASK-155 — Make updates and permalinks one identity-linked public stream.** Replace the editorial entry teasers and isolated permalink treatment with the chronological update model inside the shared public frame. DoD: the homepage renders one newest-first stream approximately 640–700 pixels wide with a 36–44-pixel identity tile, display name, human-readable time, only useful kind context, thin separation, and no sequence number or generic promotional call to action; notes lead with body text and never receive an invented large title, articles and announcements use moderate titles and excerpts, and link updates expose a clear safely related destination; zero, one, many, and all four supported kinds remain composed; each published permalink retains the shared frame, source identity and time beside its content, a clear native return path, appropriate note/article reading scale, safe destination behavior, and secondary JSON access; no fake social control is introduced; focused semantic, ordering, kind, long/unbroken-content, external-link, draft/unknown parity, public-canary, metadata, canonical, cache, and API-contract tests pass; presentation and task acceptance documentation records the outcome and no schema, protocol, owner-workspace, network, or external-state change; and focused repository gates pass. Depends on: TASK-154.

- [ ] **TASK-156 — Prove the mobile-first public redesign across content and accessibility boundaries.** Correct and certify the integrated public homepage and permalink redesign through one production-equivalent local rendered acceptance matrix without deployment. DoD: a representative populated homepage and permalink pass at 320×568, 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900; focused 320×568 and 1440×900 boundary fixtures cover no profile, no/one/many updates, a 100-character name, long description/About, missing details, eight links, long unbroken strings, every update kind, visible/hidden attribution, and published/draft/unknown/not-found permalinks; 390×844 additionally shows the top row, identity, featured/About information, Updates heading, and meaningful first-update content, while 320×568 shows the first update's beginning and identity row; every row has no horizontal overflow, clipping, obscured focus, cutout collision, fake control, or console error and passes semantic order, native keyboard navigation, visible/forced-color focus, 44-pixel touch targets, text/control contrast, enlarged text, 400-percent reflow equivalence, reduced motion, and coarse-pointer checks; live-before and exact-candidate-after images are captured only as untracked owner-review artifacts at 390×844 and 1440×900, while committed evidence records identity-free measurements and artifact digests plus meaningful source/live differences; navigation is proven on the local packaged Worker preview because deployment is prohibited, public API/privacy/metadata/CSP behavior is unchanged, `npm run db:generate` produces no migration, `npm run validate`, `npm audit --omit=dev`, and `git diff --check` pass, and the acceptance record names exact commit/evidence and any residual limitation while making no Site, data, settings, access, DNS, domain, Hub, sibling-repository, main, or deployment change. Depends on: TASK-155.
