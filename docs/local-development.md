# Local development

Local development uses the same vinext application shape, server-side owner
checks, and deployment-owned D1 interface as the hosted Site. Fixtures provide
request identity explicitly; there is no production authorization bypass.

## Prerequisites

- Node.js `>=22.13.0`
- npm from that Node.js installation

No separately deployed database, object store, Hub, or other infrastructure is
required. The local Sites runtime simulates the declared `DB` binding and keeps
its state under ignored project-local tooling directories. R2 remains null.

## Install and start

```bash
npm ci
cp .env.example .env.local
npm run db:migrate:local
npm run dev
```

Open the exact local URL printed by the development server. Do not assume a
port or scan for one.

`.env.local` is ignored. Use only fixture identities and runtime values in it;
do not copy a real owner email or hosted runtime secrets into the repository or
a shared test log.

The committed `.env.example` documents these local inputs:

```text
AITTA_SOCIAL_OWNER_EMAIL=owner@example.test
AITTA_SOCIAL_CANONICAL_URL=https://account.example
AITTA_SOCIAL_HUB_CHALLENGE=
AITTA_SOCIAL_DEV_AUTH_EMAIL=owner@example.test
```

`AITTA_SOCIAL_DEV_AUTH_EMAIL` is an explicit development-only request-identity
fixture. Production code must ignore it outside development. It supplies the
same input boundary that Sites authentication headers supply in a hosted
request; all normal server authorization still runs.

## Exercise authorization states

Restart the development process after changing environment fixtures.

- **Owner:** set the development identity fixture to the same normalized test
  address as `AITTA_SOCIAL_OWNER_EMAIL`.
- **Other signed-in visitor:** use a different syntactically valid test address.
- **Signed out:** remove or leave `AITTA_SOCIAL_DEV_AUTH_EMAIL` empty.
- **Owner not configured:** remove or leave `AITTA_SOCIAL_OWNER_EMAIL` empty,
  even if a development identity is present.

Use reserved example domains and obvious canary values. Never add a constant
that treats all local visitors as owners. The missing-owner case must keep all
writes disabled; the non-owner case must expose no dashboard data; signed-out
and non-owner public reads must return published content only.

Automated tests should construct request fixtures directly rather than depend
on a developer's `.env.local`.

## Database and migrations

The committed `.openai/hosting.example.json` declares an inert `project_id:
null`, logical `DB` binding, and null R2. The ignored checkout-local
`.openai/hosting.json` resolves the one selected Site for local packaging; never
stage or print it. Sites owns the actual hosted resource and its deployment
wiring. `db/schema.ts` is the reviewed schema source. Application queries use
prepared statements against the raw D1 binding.

After every schema change:

```bash
npm run db:generate
```

Inspect the generated SQL under `drizzle/` before accepting it. Confirm that:

- each statement changes only the intended profile, entry, or index structure;
- singleton profile and entry kind/state constraints are preserved;
- indexes correspond to real published-entry and owner-dashboard queries;
- no fixture data, owner address, Hub value, or hosting identifier is embedded;
  and
- runtime code contains no `CREATE`, `ALTER`, `DROP`, or other schema mutation;
  reviewed migrations create and change the schema before application access.

After review, apply pending migrations to the project-local D1 used by the
development server:

```bash
npm run db:migrate:local
```

This command targets only the local `site-creator-d1` declaration in
`wrangler.local.jsonc` and persists it under ignored `.wrangler/state`. It is
not a hosted migration command. Hosted migrations are packaged from `drizzle/`
and applied through Sites deployment.

Run `PRAGMA optimize` after index creation in a migration or maintenance path
where the platform supports it. Use `EXPLAIN QUERY PLAN` with representative
published-entry queries when an index changes. Do not create speculative
indexes or combine multiple SQL statements in one prepared query.

Local D1 state is disposable development data. Do not treat it as a migration
substitute or copy it into production.

For an in-place candidate, run the separate
[upgrade-preservation proof](upgrade.md). It starts from the reviewed historical
migration prefix and committed legacy fixture, applies the candidate tail to a
persisted local D1, and compares the exact schema, rows, authorization, draft
privacy, canonical metadata, public APIs, and setup-prompt behavior. Its closed-
Worker file copy is a disposable recovery fixture, not an atomic or hosted D1
backup, and the proof performs no deployment or external mutation.

Worker runtime modules use web/Cloudflare primitives only. Do not import Node
built-ins, access a filesystem, or depend on mutable process state that must
survive a request. Keep TypeScript strict, parse unknown inputs at boundaries,
avoid `any`, and prefer small direct product modules.

Use native `<a>` elements for route navigation. The hosted Vinext client-link
runtime has caused click-time JavaScript failures that prevented authentication
and dashboard navigation, while ordinary browser navigation is sufficient for
this small server-rendered application. A source-boundary test keeps
`next/link` out until hosted behavior is deliberately re-evaluated.

## Verification

Run the repository checks before handing off a change:

```bash
npm run validate
```

`validate` checks root instruction size, the PLAN dependency graph, instance and
Worker boundaries, migration integrity, strict types, lint, build, and tests.
Use `npm test`, `npm run lint`, `npm run typecheck`, or the individual
`*:check` scripts for a focused rerun while correcting a failure.

Before a release candidate can claim clean-source reproducibility, follow the
separate [fresh-clone procedure](reproducibility.md). Its
`npm run reproducibility:check` command deliberately refuses an active Sites
binding, applies migrations only to a disposable fresh local D1, performs a
value-canary build and inert archive rehearsal, and changes no hosted state.
It is not a substitute for `npm run validate` or hosted acceptance.

Fresh-clone and upgrade evidence answer different questions. The fresh-clone
procedure proves an empty database can be created reproducibly; the
[upgrade-preservation procedure](upgrade.md) proves an existing historical
profile, draft, published update, presentation, canonical behavior, and owner
boundary survive the candidate migration tail. Neither is hosted deployment or
provider-backup proof.

`npm test` must cover the affected product boundary. Focused coverage for the
POC includes:

- anonymous public presence and update-permalink reads;
- exact owner match, another signed-in visitor, and missing owner setting;
- independent authorization on each write;
- profile and canonical URL validation;
- category-neutral Identity HTML, new profiles storing server-owned
  `accountType` as `other`, legacy-value preservation on edit, ignored
  browser-supplied category input, and protocol 1.0 manifest/site-resource
  compatibility;
- draft privacy and published visibility in HTML and JSON;
- exact discovery/API allowlists with private canary values;
- profile- and published-update-derived document metadata, hostile request-host
  rejection, neutral `noindex, nofollow` metadata without a canonical/image URL
  when setup is incomplete or private, draft/private-canary exclusion from head
  tags, and the absence of runtime asset-resolution code;
- deterministic `page`/`pageSize` pagination;
- exact public challenge projection plus retired Hub-route and outbound-request
  absence; and
- semantic, labeled, keyboard-usable public and owner interfaces.

The assisted-runtime fixture drives the compiled Worker through Identity and
presentation save, draft creation and edit, publication, signed-out HTML/JSON
preview, unpublish rollback, and persisted reload using the existing D1 fake
and production authorization boundaries. It also checks non-owner,
missing-owner, CSRF, validation, draft/private-canary, normalized canonical,
per-update accessible-name, publish-confirmation, definitive 4xx response, and
ambiguous rejected-fetch/5xx recovery contracts. Source assertions cover the established
320-pixel/effective-400-percent-zoom and touch/focus rules; record actual browser
geometry separately rather than presenting source checks as rendered proof.

The category-neutral Identity change does not alter `db/schema.ts`: the
existing non-null `account_type` column stores the neutral `other` value and
continues to read supported legacy values. `npm run db:generate` must therefore
produce no new migration for this change. Protocol 1.0 remains current because
the manifest and `/api/v1/site` still emit the required stored field through
their explicit allowlists.

Presence-derived text metadata also leaves `db/schema.ts` and public protocol
1.0 unchanged, so `npm run db:generate` must produce no migration for that work.
The default package should contain no generic AittaSocial logo, favicon, or
social-preview image. If a later approved source edit adds a direct identity
asset, add a packaging assertion for its exact reviewed path and an accessible
text alternative where it is exposed; do not add runtime asset configuration,
uploads, or R2. Handler-produced HTML should remain dynamic with `no-store` and
`must-revalidate`; public JSON keeps its documented cache headers and static
asset caching remains a hosting concern.

Use a local preview to inspect the empty Identity/update state, a populated
public presence, all update kinds, a public permalink, the unconfigured
explanation, Your presence, editor validation, narrow/mobile layout, zoom,
visible focus, and reduced motion. Fix failures in implementation, tests, and
the relevant documentation together.

## Local Hub-boundary testing

Public reads do not contact Hub. The only current Hub-related runtime input is
the optional public protocol 1.0 verification challenge. Local tests cover its
exact omission and inclusion in the discovery manifest and prove that owner and
public routes add no Hub destination, credential-bearing request, or outbound
probe. Do not invent a test-only network path or authentication bypass.
