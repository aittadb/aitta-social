# AittaSocial repository instructions

This root file is authoritative for the entire repository. A nested
`AGENTS.md` may narrow instructions for its subtree but must not contradict this
file. Keep this file strictly below 32,000 bytes and run
`npm run agents:check` after changing it. Put rationale and operating detail in
`docs/`, not here.

## Product invariants

- One deployment equals one independently controlled presence.
- A presence may represent a person, company, project, community, publication,
  AI agent, or another entity. Keep the core identity-neutral.
- The deployment owns its public identity, profile, updates, drafts, canonical
  URL, D1 data, design, runtime configuration, and local behavior. Preserve
  `entry` and related names where they are stable internal or protocol terms.
- Ordinary Identity setup and public HTML are category-neutral. A new profile
  is inserted with the server-owned protocol 1.0 compatibility value `other`;
  profile updates must not accept or modify `accountType`. Preserve a legacy
  stored value and expose it only through the explicit manifest and
  `/api/v1/site` allowlists. Never use this field for presentation,
  authorization, Hub trust, capability, or network identity.
- Public profile and published-update reads operate without Hub. Any future Hub
  integration is optional and failure-isolated.
- Hub treats this deployment as an untrusted external website. Local
  authentication claims are never trusted network authentication.
- Sign in with ChatGPT here enables only possible sole-owner administration of
  this presence. It is not AittaSocial network sign-in or membership.
- Do not compare or market AittaSocial by naming another social, publishing,
  blogging, or website product.

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
- Keep R2 null until an approved upload feature requires it.
- The minimum future network direction is secure optional registration,
  verified presence discovery, explicit one-way Follow and Unfollow, and a
  private bounded followed-update reader. It is roadmap direction, not active
  implementation authority; promote only the next contract-backed vertical
  increment to `PLAN.md`. Never extend it into automatic or reciprocal
  relationships, popularity counts, public graphs, recommendations, or shared
  content storage.
- Do not implement multiple presences in one deployment, extra administrators,
  roles, teams, invitations, comments, reactions, resharing, messages,
  notifications, advertising, payments, ActivityPub, background federation,
  plugins, general themes, media uploads, or general OAuth/OIDC support in this
  POC.
- Do not add placeholders for excluded or backlog capabilities. Backlog work
  must be accepted and promoted to `PLAN.md` before implementation.

## Architecture and runtime

- Keep the architecture direct and product-specific. Prohibit generic storage
  adapters, generalized content frameworks, empty extension points, and
  premature reusable runtime packages.
- Use strict TypeScript. Parse `unknown` at every external boundary, avoid
  `any`, and keep modules small and explicit.
- Worker runtime code uses web/Cloudflare primitives only. Do not use Node
  built-ins, filesystem access, a durable process, or mutable process/module
  state for correctness, persistence, or authorization.
- Use this deployment's Sites D1 `DB` binding as the only authoritative content
  store. Browser storage may hold disposable UI preferences only.
- Keep the relational schema compact. Use bound prepared queries and indexes
  justified by real query patterns.
- Generate and review migrations with schema changes. Apply migrations before
  runtime access; request/runtime code must never create, alter, drop, repair,
  or otherwise mutate schema.
- Persist only the one profile, entries, and minimal local configuration that
  genuinely requires persistence.
- Ordinary content and restrained presentation customization must use explicit
  semantic owner controls persisted in deployment-owned D1. It must not require
  a repository fork, source edit, redeployment, Hub availability, generic
  settings blob, arbitrary CSS/HTML/JavaScript, template, plugin, or remote
  asset URL.

## Identity, authorization, and mutations

- Version one has exactly one owner. Compare the normalized authenticated
  ChatGPT email with protected `AITTA_SOCIAL_OWNER_EMAIL` in server code.
- If the owner setting is missing or invalid, reject every write and show safe
  setup guidance. Never expose the expected or authenticated email.
- Sites owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, and
  identity headers. Do not implement app-owned auth routes or a production auth
  bypass.
- Test identity only through explicit fixtures or a development-only injection
  boundary that production ignores.
- Every mutation independently requires current server-side owner
  authorization, an exact same-origin/CSRF check, an intended method/media type,
  a bounded request body, strict validation, and a prepared query.
- ChatGPT may help the owner operate the normal signed-in interface, but it is
  not an authentication principal and receives no separate token or authority.
  Never add prompt-derived authorization, a magic owner, an agent credential,
  an authentication bypass, or a public customization endpoint.
- Never trust a hidden control, client route guard, browser field, browser
  destination, or previous page authorization.
- Protected owner configuration, any future Hub credentials, runtime secrets, and
  authentication headers stay server-side and out of HTML, client code, URLs,
  errors, logs, fixtures, snapshots, and build output. ChatGPT identity,
  drafts, and database/hosting identifiers never enter public surfaces; send
  owner-only clients only the private fields their current authorized view
  requires.

## Public contracts and Hub

- Signed-out and non-owner visitors may read only the public profile and
  published entries. Drafts are indistinguishable from unknown entries in HTML,
  JSON, pagination, counts, links, status, and error wording.
- Keep public APIs versioned under `/api/v1` and discovery at
  `/.well-known/aitta-social.json`.
- Preserve the required protocol 1.0 `accountType` field and its documented
  legacy values until a deliberate versioned contract change. Hiding the
  category from ordinary HTML does not authorize dropping, renaming, or
  reinterpreting the public field.
- Build every public response from an explicit field allowlist. Never serialize
  a D1 row, environment object, authenticated user, or private domain object.
- Treat document metadata as another explicit public projection. Root metadata
  may use only the bounded public display name and short description; permalink
  metadata may additionally use only a published entry's bounded public text
  and timestamps. Construct canonical and sharing URLs from the normalized
  configured canonical URL, never `Host` or forwarding headers. Missing valid
  public profile/canonical setup uses neutral `noindex, nofollow` metadata with
  no canonical URL or image reference. Keep handler-produced HTML dynamic with
  `no-store` and `must-revalidate` so a profile, publication-state change, or
  private value is not frozen into a build or cross-request application cache;
  do not alter documented JSON or static-asset caching incidentally.
- Preserve stable entry identifiers, canonical configured URLs, documented JSON
  envelopes, correct content types/statuses, deterministic pagination, and
  resource links. Do not derive canonical success links from an untrusted
  request host.
- Treat the public Hub verification challenge only as a configured
  control-of-deployment check, never authentication.
- Do not add an outbound Hub credential flow, private Hub probe, registration,
  or connection behavior until its exact versioned contract is accepted and
  promoted to `PLAN.md`. Public reads remain independent of Hub.
- Public contract changes update `docs/protocol.md` and receive a versioning
  decision when incompatible.

## Product and accessibility

- Public pages describe the deployed presence, not the software. Human-facing
  product and setup language uses presence, updates, Your presence, and
  Identity where accurate. Keep `account`, `entries`, `accountType`, and route
  names only where stable internal or public protocol 1.0 compatibility
  requires them.
- A public owner-management entry must identify local sole-owner
  administration and must not imply AittaSocial network identity or membership.
- Keep public and owner surfaces clearly distinct, responsive, accessible,
  keyboard- and touch-friendly, with excellent typography and useful empty and
  error states.
- Use constrained accent/density choices, few colors, no gradients, no
  unnecessary generated imagery, and no generic dashboard clutter.
- Keep the template's default identity typographic and its sharing metadata
  text-only; a generic software logo, favicon, or preview image does not
  represent the configured presence. An owner-approved source customization may
  add a directly checked-in asset and an accessible text alternative. Do not
  add a runtime asset resolver, URL setting, upload UI, media manager, R2, or a
  storage abstraction for identity assets.
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
  dependencies before implementation. Never reuse an omitted or archived ID,
  renumber history, or split one outcome into separate implementation, test,
  security, migration, documentation, or deployment-inspection phases.
- Each active task must fit one focused reviewable commit and own one meaningful
  vertical outcome plus its relevant negative tests or security review,
  documentation, and migration or configuration decision. Its DoD must be
  binary and achievable from named evidence; a task cannot complete merely by
  creating a follow-up for work its own outcome requires. A contract-pin or
  conformance task covers one versioned operation or one deliberately shared
  envelope; a hosted checkpoint covers one explicitly approved external
  mutation or cohesive read-only journey; an acceptance task covers one
  coherent matrix. Bundle outcomes only when separating them would leave
  unusable evidence or require duplicating the same irreversible action.
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
  as a reason to stop unrelated presence, documentation, test, or contract work.
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

- GPT-5.6 Sol Ultra is the primary architect, orchestrator, integrator, and
  final decision-maker.
- The primary agent owns requirements analysis, architecture, task
  decomposition, dependency ordering, conflict resolution, final review, and
  validation.
- Use GPT-5.6 Luna Max for small, fully specified implementation tasks with
  clear scope, acceptance criteria, file ownership, tests, and no unresolved
  architectural decisions.
- Use GPT-5.6 Terra High for read-only codebase exploration, dependency mapping,
  and investigation when implementation boundaries are not yet clear.
- Use GPT-5.6 Sol High or Max for independent architecture, security,
  correctness, and integration review.
- Do not delegate ambiguous product, protocol, authorization, data-integrity,
  concurrency, or cross-cutting architectural decisions to Luna.
- Parallelize only independent work. Never allow concurrent write agents to
  modify overlapping files, shared behavior, or tightly coupled components.
- Every delegated implementation unit must include implementation, relevant
  tests, and documentation as one complete task.
- Subagents must report changed files, validation performed, assumptions, and
  unresolved risks.
- The primary agent must inspect and integrate all returned work, resolve review
  findings, run the full relevant validation suite, and review the final
  combined diff before declaring completion.
- Prefer the specified models and reasoning levels whenever explicit subagent
  selection is available; otherwise treat them as the intended routing policy.
