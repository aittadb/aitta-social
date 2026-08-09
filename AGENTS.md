# AittaSocial repository instructions

This root file is authoritative for the entire repository. A nested
`AGENTS.md` may narrow instructions for its subtree but must not contradict this
file. Keep this file strictly below 32,000 bytes and run
`npm run agents:check` after changing it. Put rationale and operating detail in
`docs/`, not here.

## Product invariants

- One deployment equals one independently controlled account.
- An account may represent a person, company, project, community, publication,
  AI agent, or another entity. Keep the core identity-neutral.
- The deployment owns its profile, entries, drafts, canonical URL, D1 data,
  design, runtime configuration, and local behavior.
- Public profile and published-entry reads operate without Hub. Hub integration
  is optional and failure-isolated.
- Hub treats this deployment as an untrusted external website. Local
  authentication claims are never trusted network authentication.
- Sign in with ChatGPT here authorizes only possible local administration of
  this deployment.
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
- Do not copy sibling storage, OAuth/OIDC, R2, financial, custom-domain, or FSL
  terms into this project; follow this product's accepted requirements only.
- This project does not use AittaDB, external databases, shared Hub content
  storage, shared Aitta runtime libraries, or external infrastructure.
- Keep R2 null until an approved upload feature requires it.
- Do not implement multiple local accounts, extra administrators, roles, teams,
  invitations, follows, combined timelines, comments, reactions, resharing,
  messages, notifications, recommendations, advertising, payments, ActivityPub,
  background federation, plugins, general themes, media uploads, or general
  OAuth/OIDC support in this POC.
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
- Never trust a hidden control, client route guard, browser field, browser
  destination, or previous page authorization.
- Protected owner configuration, Hub credentials, runtime secrets, and
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
- Build every public response from an explicit field allowlist. Never serialize
  a D1 row, environment object, authenticated user, or private domain object.
- Preserve stable entry identifiers, canonical configured URLs, documented JSON
  envelopes, correct content types/statuses, deterministic pagination, and
  resource links. Do not derive canonical success links from an untrusted
  request host.
- Treat the public Hub verification challenge only as a configured
  control-of-deployment check, never authentication.
- Send the Hub deployment credential only from server code to the exact
  configured HTTPS Hub origin. Accept no browser destination, follow no
  credentialed redirect, expose only documented safe statuses, and keep public
  reads independent of Hub.
- Public contract changes update `docs/protocol.md` and receive a versioning
  decision when incompatible.

## Product and accessibility

- Public pages describe the deployed account, not the software. Use neutral
  terms such as account, presence, and entries.
- Keep public and owner surfaces clearly distinct, responsive, accessible,
  keyboard- and touch-friendly, with excellent typography and useful empty and
  error states.
- Use constrained accent/density choices, few colors, no gradients, no
  unnecessary generated imagery, and no generic dashboard clutter.
- Keep the restrained “Powered by AittaSocial” reference owner-hideable.

## Delivery and work tracking

- Complete changes vertically: implementation, negative tests, security review,
  migration when relevant, and documentation land together.
- Never weaken a production boundary for tests. Include private canaries in
  public-projection tests.
- `PLAN.md` contains only accepted unfinished work with stable `TASK-NNN` IDs,
  direct dependencies, and a definition of done. Keep it a flat list of bounded
  vertical slices.
- Move finished tasks to `CHANGELOG.md` with decisive validation evidence and
  residual uncertainty.
- `BACKLOG.md` contains stable-ID unscheduled possibilities only. It is not a
  capability or release claim; promotion to PLAN is required before work.
- Run repository agent/plan checks, focused tests, strict type/lint checks, the
  deployment build, and migration review relevant to each change.
- Keep the Site private until protected owner configuration and the initial
  profile are tested. Do not publish or connect a custom domain without explicit
  owner approval.
- Do not finalize `LICENSE` until the owner supplies the exact FSL variant,
  parameters, and change license. Do not copy terms from sibling projects.
