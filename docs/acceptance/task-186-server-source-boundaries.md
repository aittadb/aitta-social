# TASK-186 — Server-source boundary refinement

## Scope and decision

This is a source-only refinement on `develop` commit `2f30aad`. It inspected
the production modules under `app/api`, `lib`, and `db`, plus their existing
test seams. It deliberately excluded the implementation boundaries already
owned by active work: private Identity editing (TASK-161), presentation accent
behavior (TASK-162), private update composition and lifecycle work
(TASK-160 and TASK-163–165), public-frame work (TASK-177), and the public v1
integration and document-negotiation vertical slices (TASK-178–181 and
TASK-193). No source refactor is
safe to schedule in parallel at this point.

The concrete conclusion is **no follow-on refactor row**. The remaining source
modules are already small, named around an AittaSocial behavior, and their
apparently repeated route structure is intentional at the current ownership
and security boundary. Extracting it now would either cross an active task or
introduce a generic abstraction with no independently useful behavior.

## Production responsibility and import map

| Boundary | Current responsibility and direct dependencies | Existing test seam | Parallel-safe conclusion |
| --- | --- | --- | --- |
| `app/api/private/profile/route.ts` | Owner-authorized JSON parsing, profile validation, and profile save through `requireOwnerApi`, `readJson`, `parseProfileInput`, and `saveProfile`. | `tests/identity-journey.test.mjs`, `tests/owner-security.test.mjs`, and the compiled-worker matrices exercise it through HTTP. | TASK-161 owns this route's optional Identity behavior. Do not extract a shared mutation wrapper while that behavior is active. |
| `app/api/private/entries/**` | Four deliberately separate entry mutations: create, edit/delete, and publication state. Each has an explicit authorization, validation, D1, and response decision. | `tests/update-composer.test.mjs`, `tests/owner-security.test.mjs`, `tests/first-update-journey.test.mjs`, and runtime matrices exercise route behavior. | TASK-160 and TASK-163–165 own these route semantics. A common write wrapper would couple their distinct recovery, state, and not-found behavior. |
| `app/api/v1/site/route.ts` and `app/api/v1/entries/**` | Three direct public projections that obtain profile/canonical state, then build an allowlisted JSON response. The collection alone owns pagination. | `tests/public-contract.test.mjs`, `tests/public-contract-privacy-matrix.test.mjs`, `tests/upgrade-preservation.test.mjs`, and compiled-worker matrices exercise the protocol externally. | TASK-178–181 deliberately own the pre-release v1 representation reset; TASK-193 owns the first unversioned entry-document negotiation boundary. No response helper may be introduced ahead of those vertical slices. |
| `lib/auth.ts`, `lib/http.ts`, and `lib/runtime.ts` | Small cross-cutting boundaries for owner status/same-origin enforcement, bounded JSON/error responses, and protected runtime settings. | Owner-security and journey tests assert status, no-D1-read, and response behavior through routes and owner pages. | They are security-sensitive shared behavior, not an independent feature seam. Refactoring would overlap active owner/private work and risk changing failure ordering. |
| `lib/validation.ts` | One bounded external-data boundary with distinct profile, update, URL, and pagination parsing. | HTTP journey and public-contract tests cover the parsers through routes; update-composer and validation tests provide focused failure coverage. | The only small-looking extraction is entry-state parsing, but it belongs to TASK-164's lifecycle behavior. Splitting profile/update/pagination parsers would create files without reducing a present responsibility. |
| `lib/public-resources.ts`, `lib/public-metadata.ts`, and `lib/identity-readiness.ts` | Explicit public-field projections/canonical resolution, public metadata, and owner-home readiness derivation. | Contract/privacy, metadata, first-update, and page tests assert their effects; accent has a focused direct unit test. | These modules are already narrow. Their consumers are active public-frame, owner-shell, and negotiation work, so changing their composition is not parallel-safe. |
| `db/index.ts`, `db/repository.ts`, and `db/schema.ts` | D1 binding, compact named queries, row-to-domain mapping, and schema. `FakeD1` fails closed on each query shape. | `tests/helpers/worker-harness.mjs` is deliberately product-specific; migrations and compiled-worker tests cover the real D1 path. | A query/helper or repository split would change a shared persistence/test seam and violates the no-concurrent-schema/persistence-work rule. No generic repository adapter is justified. |

## Rejected candidates

1. **A generic private-mutation handler.** The repeated route outline is only
   superficial: profile save returns `204`, create returns `201`, edit/delete
   have per-resource not-found semantics, and state mutation owns a distinct
   discriminated input. A wrapper would hide security/error ordering and overlap
   TASK-160–165 and TASK-161.
2. **A generic public-resource route helper.** The current routes are 15–58
   lines and have materially different profile, detail, pagination, cache, and
   future negotiation requirements. TASK-178–181 must retain independently
   reviewable protocol behavior; a premature helper would be an unneeded
   framework.
3. **A repository/query abstraction.** `db/repository.ts` remains one compact
   D1-specific persistence boundary. Extracting query builders or a generic
   storage adapter would enlarge the `FakeD1` compatibility surface without an
   independent product need, contrary to the repository's direct D1 invariant.
4. **Splitting the parser module by nominal data type.** `lib/validation.ts`
   has no growing central dispatch; its profile, update, URL, and pagination
   parsers are explicit exported contracts sharing only small private parsing
   primitives. The split would add source churn but no clearer ownership or
   additional isolated test seam.

## Evidence and residual risk

- `rg` import inventory shows routes depend directly on narrow `auth`, `http`,
  `validation`, repository, and public-resource modules; no circular import or
  broad facade was found.
- `wc -l` found the inspected production modules total 1,286 lines. The only
  sizeable modules are `db/repository.ts` (258 lines) and `lib/validation.ts`
  (219 lines), each with one bounded responsibility and explicit focused test
  coverage.
- Tests exercise route behavior through the product-specific `FakeD1` and the
  compiled Worker rather than depending on a hidden general-purpose test
  framework. `tests/presentation-accent.test.mjs` directly exercises the one
  pure visual resolver where a direct seam is useful.

The conclusion should be revisited only after the active routes have landed or
when a future accepted vertical slice demonstrates a repeated, independently
meaningful behavior with exclusive file ownership. It is not authority to
introduce a storage adapter, route framework, plugin registry, dependency
injection container, or speculative extension point.

## Validation

- `npm run agents:check`
- `npm run plan:check`
- `git diff --check`

No production code, tests, public contract, schema, migration, Worker/runtime,
or external state was changed.
