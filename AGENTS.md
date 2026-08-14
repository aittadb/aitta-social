# AittaSocial repository instructions

This root file is authoritative for the entire repository. A nested
`AGENTS.md` may narrow instructions for its subtree but must not contradict this
file. Keep this file strictly below 32,000 bytes and run
`npm run agents:check` after changing it. Put rationale and operating detail in
`docs/`, not here.

## Product invariants

- **AittaSocial** is the platform/product family. An **Aitta** (plural
  **Aittas**) is an independently controlled top-level place, not an app,
  profile, feed, or conversation.
- An **Aitta deployment** is a running installation; one currently runs one
  Aitta. A **profile** is its optional outward identity presentation. **Aitta
  Network** is the future network of Aittas and members; **AittaSocial Hub** is
  its trusted identity, discovery, relationship, authorization, and
  coordination service within accepted contracts.
- A **member** is a future signed-in participant who need not own an Aitta. An
  **event** is a universal typed message, action, response, transition, or app
  root. An **app implementation** is trusted versioned software installed in an
  Aitta; an **app instance** is its concrete event-rooted instance; an **app
  space** is the root plus authorized descendants, state, people, and nested
  apps. Feeds/threads are projections, not authority.
- This repository is **Stage 0**, the identity/publishing POC. Membership,
  network relationships, recursive events, app spaces, and trusted apps are
  future stages with no current implementation authority.
- An Aitta may represent a person, company, project, community, publication,
  AI agent, or another entity. Keep the core identity-neutral.
- The Aitta owns its public identity, profile, updates, drafts, canonical
  URL, D1 data, design, runtime configuration, and local behavior. Preserve
  `entry` and related names where they are stable internal or protocol terms.
- Identity setup and public HTML are category-neutral. Insert new profiles with
  server-owned protocol 1.0 `accountType: other`; updates cannot modify it.
  Preserve legacy values and expose them only through manifest and `/api/v1/site`
  allowlists, never for presentation, authorization, trust, or capability.
- Public reads operate without Hub; integration remains optional and
  failure-isolated. The Hub distrusts deployments; Aittas distrust all remote
  content and claims.
- Stage 0 Sign in with ChatGPT enables only possible Sites sole-owner
  administration. Future member identity is separate from Sites identity,
  Aitta ownership, and deployment administration; joining must not silently
  create an Aitta.
- Market Aitta's value without naming competing products.

## Repository and scope boundaries

- This maintained GitHub repository is the source project. Do not commit
  secrets, owner identity, active hosting identity, generated deployment
  credentials, or private checkpoint data.
- Commit only the inert `.openai/hosting.example.json`. Keep the exact active
  `.openai/hosting.json` checkout-local and ignored; package it only for the
  selected private Site.
- Do not modify AittaSocial Hub, AittaDB, Invest, or another sibling project from
  this repository's scope.
- Do not copy sibling storage, OAuth/OIDC, R2, financial, or custom-domain
  behavior into this project; follow this product's accepted requirements only.
- This project does not use AittaDB, external databases, shared Hub content
  storage, shared Aitta runtime libraries, or external infrastructure.
- Keep R2 null until an accepted same-origin asset task and owner-approved
  hosting change require it.
- Stage 1 direction is membership without Aitta ownership, secure optional
  registration, verified discovery, direct invitations, one-way Follow/
  Unfollow, private bounded **Your Network**, and report/block/revocation.
  It authorizes nothing: each slice needs an accepted contract and `PLAN.md`
  task. Never infer automatic/reciprocal relationships, popularity, public
  graphs, recommendations, or shared content storage.
- Do not implement unaccepted Stage 1 or Stage 2+ work: recursive events/apps/
  spaces, messaging, App Ideas, declarative creation, adapters, multiple Aittas
  per deployment, extra administrators, roles, teams, invitations, resharing,
  notifications, advertising, payments, ActivityPub, background federation,
  plugins, general code loading, themes, media, or OAuth/OIDC. Only an accepted
  bounded same-origin raster slice may add media.
- Future event/app semantics remain unimplemented unless an accepted versioned
  vertical slice defines them with tests and documentation. Never guess a
  contract, reinterpret `/api/v1` entries as events, or infer a child's meaning
  or authorization from its parent relation.
- Do not add placeholders for excluded or backlog capabilities. Backlog work
  must be accepted and promoted to `PLAN.md` before implementation.

## Architecture and runtime

- Keep the architecture direct and product-specific. Prohibit generic storage
  adapters, generalized content frameworks, empty extension points, and
  premature reusable runtime packages. Use a small, typed handler, strategy,
  or adapter only when independently meaningful behavior genuinely needs it;
  do not turn that boundary into a plugin system or dependency-injection
  container.
- Use strict TypeScript. Parse `unknown` at every external boundary, avoid
  `any`, and keep modules small and explicit.
- Worker runtime code uses web/Cloudflare primitives only. Do not use Node
  built-ins, filesystem access, a durable process, or mutable process/module
  state for correctness, persistence, or authorization.
- Use Sites D1 `DB` as the only authoritative structured content, state, and
  asset-metadata store. An accepted deployment-owned R2 binding may own only
  normalized asset bytes. Browser storage may hold disposable preferences.
- Keep the relational schema compact. Use bound prepared queries and indexes
  justified by real query patterns.
- Generate and review migrations with schema changes. Apply migrations before
  runtime access; request/runtime code must never create, alter, drop, repair,
  or otherwise mutate schema.
- Persist only the one profile, entries, accepted custom pages, and minimal
  local configuration that genuinely requires persistence.
- Website customization uses versioned `PageDocument`, `SiteShell`, and
  `SiteDesign` records in D1. Compile untrusted HTML/CSS into closed documents
  or scoped typed rules; raw input may appear only as escaped owner form text,
  never in an HTML/style context. Require no fork, source edit, redeployment,
  Hub, generic settings blob, JavaScript, template/plugin, or remote asset URL.

### Maintainable TypeScript and React design

- Keep each file a small, precisely named, semantically cohesive unit with one
  understandable responsibility. Split by domain behavior, not arbitrary line
  count; do not fragment trivial logic merely to create files.
- Organize code by feature or domain where practical. A feature should normally
  own its component, types, tests, hooks, and service files, and use narrow,
  stable composition points so independent work avoids shared hot spots. Do
  not create catch-all `utils`, `helpers`, `types`, or `components` modules
  when a domain-specific name is possible, or combine unrelated work for
  convenience.
- Prefer focused interfaces or named type aliases at meaningful repository,
  adapter, handler, external-data, component, and test-substitute boundaries.
  Keep dependencies explicit through parameters, props, constructors, or small
  factories; avoid mutable global state, circular imports, initialization-order
  behavior, broad interfaces, and exports that callers do not need. For fixed
  domain states, prefer discriminated unions with exhaustive handling.
- Do not grow a large central conditional for independently extensible
  behaviors. Where a real extension boundary exists, use a lightweight typed
  feature module, handler, strategy, or adapter with a narrow declarative
  registration/composition point. Keep the core independent of feature
  implementations; do not introduce a generic registry, framework, plugin
  system, or extra indirection for one simple implementation.
- Keep React components focused on one visible responsibility and driven by
  explicit typed props. Prefer composition and local state over large
  configurable components or unrelated nested branches; separate substantial
  parsing, domain transitions, data access, and side effects from rendering.
  Make loading, empty, error, unavailable, and success states explicit, retain
  semantic accessible HTML, and add no UI framework or dependency without an
  accepted product need.
- Keep meaningful pure logic independently testable. Put storage, network,
  browser, timer, and other effects behind narrow explicit boundaries that
  tests can replace locally; test components through observable behavior, add
  regressions for defects, and avoid enormous shared fixtures or application-
  wide setup for a focused feature.
- Use precise domain names and concise TSDoc or comments for exported contracts
  and non-obvious intent, invariants, edge cases, or registration rules. Remove
  stale comments and examples rather than restating obvious syntax.
- Before implementation, identify the semantic boundary, the files that truly
  need change, existing composition points, and a feature-owned path that
  minimizes shared-file edits. During review, treat oversized mixed-purpose
  modules, growing central conditionals, hidden concrete dependencies,
  feature-specific core leakage, coupled test setup, and abstraction without
  clearer ownership, testing, or extension as reasons for a proportional
  refactor. Prefer direct readable platform/project code and a small bounded
  change over a large rewrite; add no library when existing dependencies can
  solve the problem clearly.

## Identity, authorization, and mutations

- Version one has exactly one owner. Compare the normalized authenticated
  ChatGPT email with protected `AITTA_SOCIAL_OWNER_EMAIL` in server code.
- If the owner setting is missing or invalid, reject every browser-owner write
  and show safe setup guidance. Never expose either email.
- Sites owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, and
  identity headers. Do not implement app-owned auth routes or a production auth
  bypass.
- Test identity only through explicit fixtures or a development-only injection
  boundary that production ignores.
- Every browser-owner mutation independently requires current server-side owner
  authorization, exact same-origin/CSRF, intended method/media type, a bounded
  request body, strict validation, and a prepared query.
- ChatGPT may help the owner operate the normal signed-in interface, but it is
  not an authentication principal and receives no separate token or authority.
  Never add prompt-derived authorization, a magic owner, a ChatGPT-, Codex-,
  or owner-impersonating credential, an authentication bypass, or a public
  customization endpoint.
- Only an accepted task may add one deployment-bound v1 machine credential and
  scope. Keep it separate from Sites/browser CSRF, rotating/revocable,
  D1-audited, and fail-closed; it grants no owner/private-API access and never
  represents ChatGPT, Codex, a prompt, or a human.
- Never trust a hidden control, client route guard, browser field, browser
  destination, or previous page authorization.
- Protected owner configuration, any future Hub credentials, runtime secrets, and
  authentication headers stay server-side and out of HTML, client code, URLs,
  errors, logs, fixtures, snapshots, and build output. ChatGPT identity,
  drafts, and database/hosting identifiers never enter public surfaces; send
  owner-only clients only the private fields their current authorized view
  requires.

## Public contracts and Hub

- Stage 2+ requires Hub-owned, separately versioned immutable typed event/app
  contracts and an accepted conformance task here. Preserve `/api/v1` entries;
  feeds/threads are projections, and entries are never presumed events.
- Parentage is structure, not discovery, access, delivery, membership, or
  notification authority; type supplies meaning. Contracts must identify actor,
  accepting Aitta, root/child/canonical-state authority, every local,
  participant, cached, derived, or synchronized state, conflicts, and
  revocation. Root authority gives no descendant authorship.
- Events carry bounded typed data/state, never executable code, arbitrary HTML,
  remote scripts, or packages. Only reviewed versioned releases install trusted
  app implementations. Unknown types fail safely with bounded static/fallback
  representation and never fetch the sender's implementation.
- The Hub may authenticate members and coordinate identity, discovery,
  relationships, authorization, and routing only by accepted contract; it is
  never content authority/storage. Remote Aitta, actor, authorship, type,
  parent, and payload claims remain untrusted until exact evidence verifies them.
- Signed-out and non-owner visitors read only explicit public projections: the
  profile, published entries, and implemented published custom pages. Draft and
  unknown resources are indistinguishable in every public surface.
- `/api/v1` is the sole pre-release integration namespace. An accepted task may
  reshape unshipped v1 with tests/docs; do not add `/api/v2`. Post-release
  changes require a compatibility decision. Discovery stays at
  `/.well-known/aitta-social.json`.
- Preserve the required protocol 1.0 `accountType` field and its documented
  legacy values until a deliberate versioned contract change. Hiding the
  category from ordinary HTML does not authorize dropping, renaming, or
  reinterpreting the public field.
- Build every public response from an explicit field allowlist. Never serialize
  a D1 row, environment object, authenticated user, or private domain object.
- Metadata is an allowlisted public projection: root uses only bounded display
  name/description; permalinks may add published text/timestamps; custom pages
  use bounded normalized title/description/path/reviewed asset. Build canonical
  and sharing URLs only from configured canonical URL, never request headers.
  Invalid profile/canonical setup gets neutral `noindex, nofollow` without URL
  or image. Handler HTML stays dynamic with `no-store`, `must-revalidate`; do
  not incidentally change JSON/static-asset caching.
- Preserve stable entry identifiers, canonical configured URLs, correct
  content/statuses, deterministic pagination, and resource links. A pre-release
  v1 task may replace an unshipped envelope only through a documented, tested
  decision; never derive canonical success links from an untrusted host.
- Treat the public Hub verification challenge only as a configured
  control-of-deployment check, never authentication.
- Do not add an outbound Hub credential flow, private Hub probe, registration,
  or connection behavior until its exact versioned contract is accepted and
  promoted to `PLAN.md`. Public reads remain independent of Hub.
- Update `docs/protocol.md` for a released-integration contract change. An
  unversioned public document may instead offer current HTML and hypermedia JSON
  at one path, never a parallel `/vN`: bounded `Accept` only (no User-Agent or
  query), HTML on default/tie, JSON only when preferred, `Vary: Accept`, and
  the same allowlist/privacy boundary. `/api/v1` stays JSON-only/default.

## Product and accessibility

- Public pages describe the Aitta's configured profile, not the software.
  Human-facing product and setup language uses Aitta, Aittas, profile, updates,
  and Identity where accurate. Keep `account`, `entries`,
  `accountType`, and route
  names only where stable internal or public protocol 1.0 compatibility
  requires them.
- A public owner-management entry must identify local sole-owner
  administration and must not imply Aitta Network identity or membership.
- Keep public and owner surfaces clearly distinct, responsive, accessible,
  keyboard- and touch-friendly, with excellent typography and useful empty and
  error states.
- Reuse maintained AittaSocial-specific header, navigation, footer, and page
  frame primitives across every human route, including setup, unavailable,
  not-found, Privacy, Technical, and owner-access states. Destinations and
  private/public context may differ, but individual pages must not invent
  parallel chrome. A bounded published `SiteShell` may add public brand,
  navigation, and footer content but cannot hide Manage, Privacy, Technical, or
  the official GitHub source; only the optional
  powered-by attribution may be hidden by its existing owner control.
- Maintain one small, documented AittaSocial-specific visual vocabulary for
  meanings shared across public and owner surfaces: semantic surfaces, text,
  separators, focus, 44-pixel controls, fields, actions, status, notices, and
  empty states. Reuse or deliberately extend that vocabulary instead of adding
  a parallel hard-coded visual language; keep the public profile and private
  owner workspace compositionally distinct.
- Prefer narrowly named product elements when the same interaction and meaning
  genuinely repeat. Do not turn visual consistency or source customization into
  a generic UI framework, layout factory, theme system, raw CSS/HTML renderer,
  empty extension point, or public/owner auth coupling. Closed page documents,
  design tokens, and compiled page-body style rules are the boundary.
- Use constrained accent/density choices, few colors, no gradients, no
  unnecessary generated imagery, and no generic dashboard clutter.
- Keep the template's default identity typographic and its sharing metadata
  text-only; a generic software logo, favicon, or preview image does not
  represent the configured profile. An owner-approved source customization may
  add a checked-in asset and accessible text alternative. An accepted asset task
  may add bounded same-origin raster assets with D1 metadata and R2 bytes, but
  no remote URL, scriptable format, public upload, or generic media framework.
- Keep the restrained “Powered by AittaSocial” reference owner-hideable.
- Supported runtime customization must survive reload and upgrade without
  changing the Git checkout. A downstream repository fork may be an optional
  owner-approved source workflow, but automatic creation, synchronization,
  merging, upgrades, or direct Sites forking are not assumed or promised.
- When that attribution is visible, link AittaSocial to `https://aitta.social`
  and its source to `https://github.com/aittadb/aitta-social`.
- Use native anchors for route navigation. Do not add `next/link` unless its
  hosted Vinext click and console behavior is deliberately proven; reliable
  full-document navigation is the simpler POC boundary.

## Delivery and work tracking

- Complete changes vertically: implementation, negative tests, security review,
  migration when relevant, and documentation land together.
- `develop` is the shared root workspace and feature-integration branch. Begin
  each isolated feature on a fresh `codex/*` branch from updated
  `origin/develop`, fetch again and rebase the complete validated branch onto
  `origin/develop` before integration. Only the integration owner serializes
  validated task commits, tracker finalization, and pushes on `develop`;
  parallel feature worktrees never update it directly.
- Changes reach `main` only by promoting `develop` through a pull request
  reviewed and rebase-merged by the owner. Agents must not push to, merge, or
  otherwise update `main` directly. After that release merge, follow-up feature
  work waits until the owner refreshes `origin/develop` from the updated
  `origin/main`; never treat the pre-release commit identifiers as merged.
- A Sites archive and its `commit_sha` must identify the exact validated commit
  on the configured source branch. Never mislabel a feature-branch archive as
  `main` or bypass source-provenance checks.
- `develop` is an accepted maintained source branch for Sites checkpoints. An
  explicitly approved checkpoint may package and deploy its exact validated,
  pushed commit without waiting for promotion to `main`; record it as
  `develop`, never as `main`.
- Never weaken a production boundary for tests. Include private canaries in
  public-projection tests.
- `PLAN.md` contains only accepted unfinished work required for the smallest
  next immediately useful increment, with stable `TASK-NNN` IDs, direct
  dependencies, and a definition of done. Keep it a flat list of bounded
  vertical slices; never preload the whole product roadmap or a blocked
  multi-milestone program into the active queue.
- Before starting or delegating any active task, audit its definition of done
  for independently useful user, contract, migration, destructive-operation,
  hosted-evidence, or acceptance outcomes. If more than one outcome can be
  implemented, reviewed, rolled back, externally approved, or blocked
  independently, keep the existing stable ID for the first narrow outcome,
  assign new monotonically increasing IDs to the others, and rewrite downstream
  dependencies before implementation. Prefer the smallest independently
  demonstrable increment so each completed row makes visible product or
  contract progress. Never reuse an omitted or archived ID, renumber history,
  or split one outcome into separate implementation, test, security, migration,
  documentation, or deployment-inspection phases.
- Each active task must fit one focused reviewable commit and own one meaningful
  vertical outcome plus its relevant negative tests or security review,
  documentation, and migration or configuration decision. Its DoD must be
  binary and achievable from named evidence; an implementation task cannot
  complete merely by creating a follow-up for work its own outcome requires. A
  contract-pin or conformance task covers one versioned operation or one
  deliberately shared envelope; a hosted checkpoint covers one explicitly
  approved external mutation or cohesive read-only journey; an acceptance task
  covers one coherent matrix. Bundle outcomes only when separating them would
  leave unusable evidence or require duplicating the same irreversible action.
- Where implementation scope is genuinely unknown, an accepted refinement task
  may be a standalone outcome only when its binary DoD is specific
  dependency-ordered next task rows or a specific external blocker. It makes no
  product change and never substitutes for implementation, test, security, or
  documentation phases. Do not use refinement work when current evidence is
  already sufficient to split the implementation directly.
- Record only direct prerequisites in `Depends on`; remove transitive or
  redundant edges and never use a broad acceptance or checkpoint task where a
  narrower prerequisite is sufficient. Tasks with no dependency path may run
  in parallel only when their declared files, runtime, schema, migration,
  contract fixtures, and external-state targets do not overlap. Shared
  documentation is reconciled during integration rather than serializing
  otherwise independent work. Parallel work may give each task one owner, one
  writable worktree, and one `codex/task-NNN-short-name` branch from the same
  exact validated prerequisite commit; declare intended files and
  external-state targets, stop on overlap, and never run two schema or migration
  tasks in parallel.
- Integrate only complete validated task commits into `develop` in dependency
  order after rebasing their feature branch onto its current head. Do not stack
  dependent pull requests by default or pretend an unintegrated prerequisite
  is `develop` or `main`. After integration, remove obsolete worktrees, fetch
  updated `origin/develop`, and create a fresh branch for follow-up. Never reuse
  an integrated branch.
- Serialize tracker finalization through the integration owner: after each task
  commit is integrated, remove only that task from `PLAN.md`, append its exact
  evidence/residual entry to `CHANGELOG.md`, reconcile shared documentation,
  and rerun the plan and full repository gates. Parallel task worktrees do not
  independently finalize the shared trackers.
- Parallel worktrees must not copy, package, or operate the active ignored
  `.openai/hosting.json`. Only an explicitly owner-approved checkpoint task may
  use that binding to package or deploy one exact validated commit.
- A missing external contract, approval, credential, service, or overlapping
  file blocks only the affected task and its dependents. Record that exact
  boundary and continue every independent unblocked task; never treat one lane
  as a reason to stop unrelated Aitta, documentation, test, or contract work.
- `ROADMAP.md` is a flat stable `ROADMAP-NNN` list of high-level future product
  direction. It is not current capability, a release commitment, or authority
  to implement. Promote only the smallest next meaningful vertical increment
  into `PLAN.md` when its prerequisites are concrete; leave later milestones
  on the roadmap even when their desired end state is already understood.
- Move finished tasks to `CHANGELOG.md` with decisive validation evidence and
  residual uncertainty.
- `BACKLOG.md` contains stable-ID unscheduled possibilities only. It is not a
  capability or release claim; promotion to PLAN is required before work.
- Run repository agent/plan checks, focused tests, strict type/lint checks, the
  deployment build, and migration review relevant to each change.
- Keep a new Site private until protected owner configuration and the initial
  profile are tested. Do not publish or connect a custom domain without explicit
  owner approval.
- Preserve the exact owner-selected `FSL-1.1-MIT` text and notice in `LICENSE`.
  Any license change requires a new explicit owner decision plus synchronized
  README, changelog, and automated-check updates.

## Multi-agent execution

### Main-agent role

- The main agent is primarily the orchestrator, integrator, and final
  decision-maker, not the default implementation worker. It owns requirements
  analysis, architecture, task decomposition, dependency ordering, conflict
  resolution, final review, and final validation.
- For every nontrivial task, divide work into coherent workstreams; delegate as
  much investigation, planning, implementation, testing, documentation,
  debugging, and review as practical; give every worker a bounded scope,
  relevant context, constraints, deliverables, and binary acceptance criteria;
  wait for and inspect the necessary results; then integrate and verify the
  complete outcome.
- Subagents should perform the majority of substantive repository work. The
  main agent may directly coordinate, make small integration changes, resolve
  conflicts, perform final verification, handle work that cannot reasonably be
  separated, or complete a genuinely trivial mechanically verifiable change.
- Do not create agents merely to satisfy a numerical target. Give each one
  coherent responsibility; use overlapping agents only for intentional
  independent verification.

### Cost-aware model routing

- Always choose the least expensive model and lowest reasoning level likely to
  complete the assigned work reliably. Route by actual difficulty and risk, not
  by the main agent's model. Prefer explicit `gpt-5.6-luna`,
  `gpt-5.6-terra`, and `gpt-5.6-sol` selection when supported.
- Use `low`, `medium`, `high`, `xhigh` (extra high), and `max` reasoning names
  when the active Codex configuration supports them. If an exact model or level
  is unavailable, use the closest available equivalent while preserving this
  inexpensive-worker → engineering → architecture/review hierarchy.
- **Luna is the default inexpensive worker.** Use Luna Low for searches,
  inventories, extraction/classification, log summaries, formatting, mechanical
  cleanup, simple documentation corrections, predefined commands/tests, and
  tiny verifiable edits. Use Luna Medium for routine implementation from a
  precise plan, repetitive multi-file changes, conventional tests,
  straightforward refactors, simple migrations, and known-cause fixes. Use
  Luna High only for a narrow, fully specified task with non-obvious edge cases.
- **Terra is the normal engineering and integration worker.** Use Terra Medium
  for interpretive exploration, ordinary multi-file features, moderate
  refactors, routine diagnosis, approved-architecture implementation, and
  ordinary integration or Luna-output review. Use Terra High or XHigh for
  reasonably scoped cross-module behavior, difficult integration, data flow,
  lifecycle/concurrency, or multi-component debugging. Do not default to Terra
  Max.
- **Sol is for judgment-heavy work.** Use Sol High for nontrivial planning,
  architecture, boundary/invariant definition, independent review, difficult
  diagnosis, security/privacy/authentication/authorization/trust boundaries,
  and public API/protocol/schema/persistence decisions. Use Sol XHigh for
  high-risk architecture or migrations, subtle correctness/security review,
  complex cross-system debugging, major tradeoffs, or release-critical
  validation. Use Sol Max only for exceptional unresolved, critical, or
  especially costly-to-get-wrong problems.
- Do not spend Sol effort on mechanical work that Luna or Terra can reliably
  perform. Do not delegate ambiguous product, protocol, authorization,
  data-integrity, concurrency, or cross-cutting architectural decisions to
  Luna; escalate Luna to Terra for interpretation and Terra to Sol when work is
  ambiguous, high risk, architectural, security-sensitive, or resistant to
  normal debugging. Change model when appropriate rather than repeatedly
  retrying an unsuitable one at higher reasoning.

### Delegation workflow and discipline

- Unless a change is genuinely trivial, follow this lifecycle: a Sol planner
  defines the implementation plan and acceptance boundary; Luna or Terra
  workers complete independently divided implementation, tests, documentation,
  and investigation; a different Sol agent independently reviews the diff and
  evidence; the cheapest capable worker fixes clear findings; Sol re-reviews
  substantial, risky, or architecture-affecting corrections; the main agent
  integrates, resolves conflicts, runs final validation, and reviews the final
  combined diff.
- Every delegated implementation unit is a complete vertical outcome: its
  implementation, relevant negative/security tests, documentation, and any
  required migration or configuration decision travel together. Do not split
  those into artificial handoff phases.
- Parallelize only truly independent work. Never allow concurrent write agents
  to alter overlapping files, shared behavior, tightly coupled components,
  schema/migrations, contract fixtures, or external-state targets. Follow the
  delivery/worktree rules above for declared ownership, rebasing, integration,
  and tracker finalization; shared documentation is reconciled by integration
  rather than used to serialize otherwise independent work.
- Reuse existing findings instead of redoing the same exploration. A worker that
  is uncertain must report the uncertainty rather than inventing a conclusion.

### Required subagent handoff

- Each subagent returns concise, distilled evidence: findings or decisions;
  files inspected and changed; implementation completed; commands/tests run and
  outcomes; assumptions; unresolved risks or uncertainties; and the recommended
  next action.
- The primary agent must inspect returned work, resolve review findings, run the
  full relevant validation suite, and review the final combined diff before
  declaring completion.
