# Changelog

- **TASK-205 — Centralized test regular-expression literal escaping.** Added
  the dependency-free, narrowly named
  `tests/helpers/regular-expression-literal.mjs` as the canonical owner of
  `escapeRegExp`; all four former `escapeRegExp` and four legacy
  `escapeRegex` declarations now import it. The helper retains literal
  matching for metacharacters, ordinary text, slashes, Unicode, hyphens, and
  newlines. ESLint now rejects all plain, named-export, and default-export
  top-level function, function-expression, and arrow redefinitions of either
  spelling outside its canonical helper, without weakening the independent
  record-shape restrictions. Regression coverage proves helper behavior,
  canonical consumer imports, canonical allowances, cross-family rejection,
  and every protected declaration form. Validation: independent review found
  and corrected two P1 enforcement gaps and one P2 regression-evidence gap;
  final re-review found no P0/P1/P2 issues; integrated commit `a75afa8`;
  focused checks passed 3/3; full `npm run validate` passed build, typecheck,
  lint, repository checks, and 510/510 tests. No production, route, API,
  schema, migration, persistence, hosting, deployment, data, access, or
  external state changed. Residual uncertainty: other duplicate helper
  families remain separate bounded consolidation work; the next accepted
  slice centralizes only shared Accept media-range parsing, not its distinct
  response-negotiation policies.

- **TASK-204 — Centralized exact record-shape boundary predicates.** Added the
  dependency-free `lib/record-shape.ts` leaf as the sole owner of `isRecord`
  and `hasExactKeys`; all eight and seven former declarations now import it.
  The predicates retain their original type narrowing and own-enumerable key
  semantics across owner response readers, custom-page parsing, and private
  entry validation. A narrow data-URL test compiler resolves only parsed
  `record-shape` imports, and ESLint rejects plain, named-export, and
  default-export top-level redefinitions outside the canonical module.
  Regression coverage proves behavior, consumer ownership, lint enforcement,
  and import rewriting without changing comments or ordinary strings.
  Validation: independent review found no P0/P1/P2 issues; integrated commit
  `95d6460`; focused checks passed 4/4; full `npm run validate` passed build,
  typecheck, lint, repository checks, and 507/507 tests. No route, API,
  schema, migration, persistence, hosting, deployment, access, data, or
  external state changed. Residual uncertainty: other audited duplicate helper
  families require separate bounded consolidation tasks; framework route
  exports are not generic helpers.

- **TASK-203 — Co-located owner-shell CSS and established stylesheet
  ownership.** `OwnerShell` and `OwnerAccessState` now use the adjacent
  `OwnerShell.module.css`; its scoped rules own their shell, header,
  navigation, frame, footer, access-state, and narrow-layout presentation.
  `globals.css` retains theme tokens, resets, accessibility foundations, and
  genuinely shared primitives. `AGENTS.md` now requires component-specific
  CSS modules while reserving global or theme files for color/typography
  tokens and cross-component foundations. Rendered and source regressions
  preserve owner states, navigation, links, active state, 44-pixel controls,
  safe areas, responsive layout, focus, reduced motion, and forced colors;
  they also prove migrated selectors are absent from the global stylesheet.
  Validation: independent review found no P0/P1/P2 issues; integrated commit
  `b2bd90b`; direct checks passed 55 tests; full `npm run validate` passed
  build, typecheck, lint, repository checks, and 503/503 tests. No route, API,
  schema, migration, persistence, hosting, deployment, access, data, or
  external state changed. Residual uncertainty: other feature CSS remains
  global until separately migrated through focused tasks.

- **TASK-202 — Extracted Technical page information sections into a focused
  component.** Added the feature-local `TechnicalInformationSection`, which
  owns the existing semantic section class plus its exact
  `aria-labelledby`/`h2` relationship. `TechnicalPage` retains the four
  explicit section IDs, headings, prose, order, native resource links, and
  link classes. Rendered regression coverage locks the ordered sections, exact
  content, accessibility associations, links, and link-free usage section;
  source coverage confirms the narrow component composition. Validation:
  independent review found no P0/P1/P2 issues; integrated commit `ad898e9`;
  focused checks passed 4/4; full `npm run validate` passed build, typecheck,
  lint, repository checks, and 503/503 tests. No route, API, CSS, schema,
  migration, persistence, hosting, deployment, access, data, or external
  state changed. Residual uncertainty: this remains a Technical-page boundary,
  not a general information-page component.

- **TASK-201 — Split page import controls into focused feature-owned
  components.** Extracted narrow `PageImportTextField` and
  `PageImportTextareaField` components within the page-import feature. They
  own the existing labels, optional marker, help/error rendering, exact ARIA
  associations, and busy handling, while `PageImportForm` retains submission,
  strict response handling, local error clearing, focus ordering, status,
  preview, and normalized JSON orchestration. The three source controls retain
  their exact names, limits, required/optional state, rows, spell-check,
  source styling, fragment help/error IDs, and help-before-error description
  order. Focused regression coverage now pins those configurations and the
  component boundary. Validation: independently reviewed with no P0/P1/P2
  findings; integrated commit `bae6bf9`; focused checks passed 111/111; full
  `npm run validate` passed build, typecheck, lint, repository checks, and
  502/502 tests. No route, API, schema, migration, persistence, hosting,
  deployment, access, data, or external state changed. Residual uncertainty:
  future page-import fields should remain feature-local unless a distinct,
  accepted shared-control need emerges.

- **TASK-200 — Isolated owner browser requests from React components.** Added a
  narrow shared browser transport plus feature-owned, transport-injectable
  request functions for entry create/edit/publication/deletion, Identity save,
  and page preview. All current owner React components now retain UI state,
  strict response parsing, recovery, focus, and navigation while request
  construction lives outside `.tsx` files. `AGENTS.md` now prohibits direct
  component `fetch` calls, preferring small feature-owned request functions and
  reserving classes for real state or lifecycle. The runtime boundary check
  enforces the rule for every application `.tsx` file. New unit coverage proves
  exact request shape, injected transport, DELETE redirect policy, response
  identity, rejection propagation, and no retry; coupled journey assertions
  remain intact. Validation: independent review found no P0/P1/P2 issues;
  integrated `npm run validate` passed build, typecheck, lint, repository
  checks, and 502/502 tests. No route, API, schema, migration, hosting,
  deployment, access, data, or external state changed. Residual uncertainty:
  future browser request work must follow the new feature-owned boundary.

- **TASK-199 — Published contribution and feedback guidance.** Added root
  `CONTRIBUTING.md` and a README discovery link. The guide asks exactly which
  feedback is most useful, prioritizes vision clarity, landing-page messaging,
  and potential contributors for ideas, and directs desired outcomes to GitHub
  Issues. It makes clear that the maintainer is not soliciting third-party
  source-code contributions or pull requests in this agentic coding workflow,
  while welcoming concrete problem, constraint, evidence, and risk reports.
  It also states that a future Aitta is planned for discussing ideas without
  claiming that capability exists today. Independent review found and corrected
  that future-Aitta wording. Validation: focused instruction, plan, license,
  instance, runtime, migration, exact-text/link, and diff checks passed before
  integration; integrated `npm run validate` passed build, strict typecheck,
  lint, and 499/499 tests. No runtime, schema, migration, hosting, deployment,
  external state, or sibling repository changed.

- **TASK-197 — Made private update deletion a truthful JSON-first browser
  API.** `DELETE /api/private/entries/{id}` remains bodyless and now performs
  same-origin-before-owner authorization before bounded JSON `Accept`
  negotiation. It returns an allowlisted, no-store `200` deletion
  acknowledgement, structured no-store `401`/`403`/`404`/`406`/`500` errors,
  and JSON `405 + Allow: PUT, DELETE` for unsupported methods. The owner client
  sends `Accept: application/json`, refuses redirects, trusts only the exact
  stable-ID acknowledgement, and navigates only to its fixed `/owner`
  destination. Structured 4xx failures remain retryable; malformed, redirect,
  network, and 5xx outcomes disable only Delete and expose saved-state recovery
  without retrying. Public unknown parity now covers the current HTML and JSON
  document, v1 detail, and v1 collection. Validation: integrated commit
  `71f4b68`; feature candidate `ae0ec8eb919acc9cf01c366f36226b4da7c7756e`;
  full validation passed 499/499, migration generation found no schema change,
  production audit found zero vulnerabilities, and diff checks passed. An
  independent Sol review found no P0/P1/P2 issue and independently passed 75
  adjacent focused checks. Disposable browser evidence covers draft/published
  cancellation and success, structured 422, 500/malformed/network recovery,
  safe non-owner/missing-owner states, 320/390/1440, DPR-4, forced colors,
  reduced motion, coarse touch, 44-pixel controls, visible focus, and a clean
  console. No hosted Site, configuration, schema, migration, deployment, or
  external state changed.

- **TASK-183 — Restored reviewed engineering-policy publication.** An ordinary
  authenticated fast-forward advanced `origin/develop` from `17d2878` to
  `5612b6d8a1228230a2182bc8103a5c4b49e51716`. Read-back confirmed local
  `develop` and `origin/develop` match at that SHA, both the reviewed
  multi-agent-policy commit `ec96d4d8ce511f83913ecc7b7da219f2e40ac643` and
  the completed TASK-184 guidance are ancestors, and the policy bytes match
  (`AGENTS.md` SHA-256 `14f9ce…798dbf4`). No application, schema, migration,
  Site, deployment, data, setting, access, DNS, domain, Hub, sibling, or
  runtime state changed.

- **TASK-196 — Made private publication-state mutation a truthful JSON-first
  browser API.** `PUT /api/private/entries/{id}/state` now preserves
  same-origin-before-owner authorization, then accepts only bounded JSON and
  returns an allowlisted, no-store `owner-entry` resource on exact `200`, or
  structured JSON for `400`, `404`, `406`, `415`, `422`, and unexpected `500`
  outcomes. Unsupported methods always return JSON `405 + Allow: PUT`
  independently of `Accept`. The publication client sends `Accept`, confirms
  only the requested stable ID/state/action document, reloads after confirmed
  transitions, keeps structured 4xx results correctable, and locks only the
  lifecycle action for malformed, network, or unconfirmed results. Existing
  delete bytes and recovery remain unchanged. Validation: integrated commits
  `dd00477` and `d196f19`; full validation passed 493/493, migration generation
  found no schema change, production audit found zero vulnerabilities, and
  diff checks passed. Independent Sol review found no P0/P1/P2 issue and
  independently passed 45 focused checks. Disposable compiled-Worker evidence
  covers draft/published transition and public projection, cancellation,
  422/500/malformed recovery, non-owner privacy, 320/390/1440, DPR-4,
  forced colors, reduced motion, coarse touch, 44-pixel controls, no document
  overflow, and a clean console. Safari's maximum zoom had no numeric reading,
  and a sequential-Tab traversal was not claimed. No hosted, data,
  configuration, schema, migration, deployment, or external state changed.

- **TASK-165 — Made update deletion an explicit, recoverable owner action.** A
  native confirmation now names the bounded update label and stable identifier;
  cancellation sends no request. The retained owner-only `DELETE` operation
  still returns its existing `204` and navigates to `/owner` on success. A safe
  4xx leaves Delete available without asserting current state, while a 5xx or
  network result disables only Delete and offers the fixed saved-state recovery
  link. Edit and publication controls remain independently usable; there is no
  retry, timer, background deletion, schema, protocol, or machine change.
  Focused compiled-worker coverage proves draft/published deletion, denial,
  public unknown parity, and private-canary exclusion. Validation: integrated
  commit `26c204f0ac4a8c78f42c672af90ca12dde38ca4a`; full validation passed
  475/475, migration generation found no schema change, production audit found
  zero vulnerabilities, and diff checks passed. An independent Sol review
  found no P0/P1/P2 issue and reran 35 focused checks. Disposable loopback
  browser evidence covers draft/published cancellation and success, 400/500/
  network recovery, non-owner privacy, 320/390/1440, literal Chrome 400% zoom
  followed by reset to 100%, DPR-4, forced colors, reduced motion, coarse
  touch, 44-pixel controls, visible focus, and a clean console. Residual
  uncertainty: a complete sequential hardware-Tab traversal was not
  enumerated. No hosted, data, configuration, schema, migration, deployment,
  or external state changed.

- **TASK-188 — Added a safe custom-page import preview.** The sole owner can
  now use `/owner/pages/import` to submit one bounded page-body HTML fragment,
  inspect its closed normalized `PageDocumentV1` JSON, and review the same
  escaped React-rendered result before anything is stored or published. The
  owner-only JSON endpoint checks same origin and authorization before
  negotiation, media, body, parsing, or any dependency; it has fixed
  non-reflective request, validation, compiler, authorization, and 405 errors.
  The `parse5@8.0.1` compiler rejects full documents, malformed or foreign
  trees, unsafe elements/attributes/URLs, unresolved or reserved fragments,
  heading skips, and all bounded document overflows. It neither accesses D1
  nor fetches or persists. The private workspace now includes the bounded
  Pages destination while retaining the existing scrollable owner navigation.
  Validation: integrated commit
  `687419df35e742226372e9fa0af814d7dcfb9bec`; full validation passed
  472/472, focused checks passed 143/143, migration generation found no schema
  change, production audit found zero vulnerabilities, and diff checks passed.
  Independent Sol security and accessibility reviews found no P0/P1/P2 issue.
  Disposable local production-build evidence covers accepted and hostile
  fragments, 422/500/malformed-response recovery, owner/non-owner/missing-owner
  states, 320/390/1440, actual Chrome 400% zoom followed by reset to 100%,
  DPR-4, forced colors, reduced motion, touch, 44-pixel controls, bounded
  internal scrolling, and a clean console. Residual uncertainty: a complete
  sequential hardware-Tab traversal was not enumerated. No hosting, data,
  configuration, schema, migration, deployment, or external state changed.

- **TASK-195 — Made private update editing a truthful JSON-first browser API.**
  `PUT /api/private/entries/{id}` now retains same-origin-before-owner denial,
  then accepts bounded JSON and returns an allowlisted, no-store `owner-entry`
  document on exact `200`, or structured JSON for `400`, `404`, `406`, `415`,
  `422`, and unexpected `500` outcomes. Every unsupported method now returns
  JSON `405 + Allow: PUT, DELETE` independently of `Accept`; the existing
  DELETE handler remains byte-compatible. The edit client confirms a success
  only when the bounded response matches the submitted normalized kind, title,
  body, destination, identifier, and publication state. Malformed success,
  redirects, transport failure, and 5xx results lock retry as unconfirmed;
  exact structured 4xx errors remain correctable and field-focused. Validation:
  integrated commit `0dc14217db9ddcb970ecb7f108fa45ba2cddd27c`; full validation
  passed 364/364, migration generation found no schema change, production audit
  found zero vulnerabilities, and diff checks passed. An independent Sol
  security/correctness review found no P0/P1/P2 issue and independently passed
  111 focused checks. Disposable compiled-Worker evidence covers draft and
  published edits, `422` retry, `500` and malformed-200 recovery locks,
  non-owner/missing-owner safe states, 320/390/1440, forced colors, reduced
  motion, coarse touch, 44-pixel targets, no overflow/private canaries, and a
  clean console. Residual uncertainty: the Sites identity-header ingress
  boundary remains separately blocked under TASK-190; no hosted, data,
  configuration, schema, migration, deployment, or external state changed.

- **TASK-194 — Made private draft creation a truthful JSON-first browser API.**
  `POST /api/private/entries` now preserves same-origin-before-owner denial and
  then accepts bounded JSON only, returning allowlisted, no-store JSON for
  `201`, `400`, `406`, `415`, `422`, and every unsupported method's exact
  `405 + Allow: POST`. Its private `owner-entry` resource uses safe relative
  API/editor links and state-derived owner actions, forces the server-owned
  draft/id/timestamp facts, needs neither profile nor canonical setup, and
  exposes no request authority, owner, runtime, Hub, or public data. The new
  draft client accepts only the exact bounded/domain-valid `201` document;
  malformed success, redirect, malformed error, 5xx, or fetch failure locks
  retry as unconfirmed, while an exact structured 4xx remains correctable.
  Validation: integrated commit
  `f8e9e32a35e0e4500c2312dc75f88ca04445c105`; full validation passed 341/341,
  migration generation found no schema change, production audit found zero
  vulnerabilities, and diff checks passed. Two independent Sol reviews found
  no P0/P1/P2 issue after stream-bound, error-shape, and URL-parity corrections.
  Disposable compiled-Worker evidence covers create/reload, 422 recovery, 500
  and malformed-201 retry locks, 320/390/1440, DPR-4, forced colors, reduced
  motion, coarse touch, 44-pixel targets, no overflow, and clean console.
  Residual uncertainty: true 400% browser zoom, a complete native keyboard
  sequence, and rendered private-canary cells remain unobserved; automated
  canary/privacy coverage passes. No hosted, data, configuration, schema,
  migration, deployment, or external state changed.

- **TASK-193 — Negotiated current hypermedia JSON for published update documents.**
  `GET` and `HEAD /entries/{id}` now retain their HTML default while returning a
  current, allowlisted JSON document at the same unversioned canonical URI when
  bounded `Accept` strictly prefers JSON. The product-specific Worker dispatch
  has a bounded 4 KiB/16-range media parser, HTML tie/default behavior,
  feature-local JSON/error types, JSON `406` for rejected GET requests,
  empty-body matching HEAD responses, and `Vary: Accept`. It reserves and
  marker-gates one internal route, strips every caller marker, rejects direct
  internal access before Vinext/D1, clears only JSON-dispatch queries, and
  leaves other routes/methods untouched. The existing `/api/v1` detail resource
  is unchanged. Validation: integrated commit
  `1c1ba1bc1f5c424d3d887ae1df11a10221b8e4c4`; focused compiled-worker/v1/CSP
  checks passed 29/29, full validation passed 297/297, migration generation
  found no schema change, production audit found zero vulnerabilities, and
  diff checks passed. Independent security/integration review found no
  P0/P1/P2 issue. Disposable compiled-Worker evidence covers HTML/JSON,
  320/390/1440, DPR-4, forced colors, reduced motion, coarse touch, native
  focus/navigation, no overflow/private canaries, and clean console. No hosted,
  data, configuration, schema, migration, deployment, or external state
  changed.

- **TASK-182 — Reused common Aitta chrome in the private owner workspace.**
  Authorized Home, Identity, new-update, and update-edit documents now share a
  clear private owner header, exactly three native owner destinations with one
  current-page state, one content frame, and a shared footer. Safe non-owner
  and missing-owner states receive the same private context and fixed resource
  links without an owner navigation, forms, private data, or D1 read;
  signed-out requests retain their exact Sites redirect. The only extracted
  primitive is the fixed, effect-free `AittaFooterResources` navigation for
  Privacy, Technical, GitHub, Manifest, Profile, and Updates; fixed public
  header/footer composition remains private to the public frame. Validation:
  integrated commits `cff764a175acb3c0978699fc884dd429ba8d3152` and
  evidence-only `e44721a25e6fb2d741ec31942a0328959f1fdcc2`; independent
  integration review and 61 focused checks passed, while task validation passed
  288/288, migration generation found no schema change, production audit found
  zero vulnerabilities, and diff checks passed. Disposable compiled-Worker/D1
  evidence covers owner/non-owner/missing-owner states across four owner paths
  at 320/390/1440, DPR-4, forced colors, reduced motion, coarse touch, native
  focus and navigation, signed-out redirect, 44-pixel controls, no overflow or
  private canaries, and clean console logs. Residual uncertainty: a complete
  sequential hardware-Tab traversal was not enumerated. No hosted, data,
  configuration, schema, migration, deployment, or external state changed.

- **TASK-177 — Unified the human-public Aitta frame.** Every configured and
  unconfigured home, published update, Privacy, Technical, storage-unavailable,
  and global/draft/unknown not-found document now uses one pure
  `PublicPageFrame`: a fixed Aitta-home wordmark, `/owner` Manage destination
  whose accessible name explicitly identifies local sole-owner administration,
  and a shared footer with Privacy, Technical, GitHub, Manifest, Profile, and
  Updates links. The owner-hideable Powered by attribution remains hidden only
  when an already-loaded public profile selects it; profile-null static and
  error states remain D1-independent and visibly attributed. Permalink-local
  actions are a labelled navigation region, leaving one document footer. Public
  routes no longer consult ChatGPT identity to construct header navigation.
  Validation: integrated commits `91f4d9f`, `ae40b4d`, and evidence-only
  `93b284d`; focused checks passed 85/85, full validation 282/282, migration
  generation found no schema change, production audit found zero
  vulnerabilities, and diff/instruction/plan checks passed. Independent Sol
  review found no P0/P1/P2 issue. Disposable compiled-Worker/D1 evidence covers
  12 public states at 320/390/1440, long unbroken content, attribution hiding,
  DPR-4 reflow, forced colors, reduced motion, coarse touch, native header and
  footer focus, 44-pixel targets, no overflow/canary leak, and clean console.
  Residual uncertainty: a complete sequential hardware-Tab traversal was not
  enumerated. No hosted, data, configuration, schema, migration, deployment,
  or external state changed.

- **TASK-192 — Made the private Identity mutation a truthful JSON-first browser API.** Normalized only `PUT /api/private/profile` and its authorized Identity client around an allowlisted `owner-profile` success resource, canonical navigation links, a verified-owner `edit` action, and structured no-store JSON errors. The route preserves same-origin-before-owner authorization, bounded JSON/media/Accept handling, `415`/`400`/`422`/`406`/`405` semantics, protected-setting secrecy, D1/public projection behavior, and browser dirty/recovery behavior; it is neither public discovery nor machine authority. Validation: independent Sol security/API re-review passed with no P0/P1/P2; focused compiled Worker tests passed 21/21; full validation passed 270/270; migration generation found no schema change; production dependency audit found zero vulnerabilities; exact compiled-browser evidence covered persisted save/two reloads, field-focused `422` retry, safe `500` recovery lock/reload, 320/390/1440 layout, and a clean console. Residual uncertainty: Sites ingress provenance remains separately blocked under TASK-190; the remaining private entry operations are intentionally deferred to TASK-194 through TASK-197.

- **TASK-163 — Make each update kind self-explanatory while composing.**
  Added concise kind-specific requirements to the existing body-first private
  composer without unmounting or discarding body, title, or destination values
  when the kind changes. Link now expresses and uses its native destination
  requirement; leaving Link clears only stale Link-specific server feedback.
  The selector derives its choices and guidance exhaustiveness from the
  canonical entry-kind list. Existing create/edit payloads, authorization, D1,
  draft privacy, public contracts, and navigation remain unchanged. Validation:
  integrated commit `d88eccb`; full validation (249/249), focused composer
  coverage, migration generation, production audit (zero vulnerabilities), and
  diff checks pass. An independent Sol review found no P0/P1/P2 issue.
  Disposable compiled-Worker evidence covers all kinds/value retention, native
  empty-Link validation, long content, synthetic-500 recovery with one request
  and retry lock, denial/canary states, 320/390/1440, DPR-4 reflow, forced
  colors, reduced motion, coarse touch, visible focus, 44-pixel targets, no
  overflow, and clean console logs. Residual uncertainty: the controller did
  not complete a sequential hardware-Tab traversal. No schema, Site, hosted
  data, setting, access, DNS, domain, Hub, sibling, `main`, deployment, or
  external state changed.

- **TASK-162 — Clarify restrained Identity appearance controls and preview.**
  Reframed the existing constrained accent, update-spacing, and attribution
  choices as compact secondary Appearance controls beside a transient owner
  preview. The preview now makes saved, unsaved, and new state explicit while
  showing both density choices and the optional attribution without creating a
  theme system or new persisted field. Malformed historical accent preferences
  never enter the native color control or an unrelated save: a safe fallback is
  rendered, a deliberate replacement is required, and choosing that fallback
  still remains visibly unsaved until it succeeds. Identity payloads, public
  rendering, authorization, D1, API, and protocol contracts are unchanged.
  Validation: integrated commit
  `dc36059d6ef6420e58245c288120856c0491e8da`; full validation (249/249),
  focused appearance coverage, migration generation, production audit (zero
  vulnerabilities), and agent/plan/diff checks pass. Independent Sol review
  found no remaining P0/P1/P2 issue. Disposable compiled-Worker browser
  evidence covers saved, fresh, invalid-history, failure, denial, density,
  attribution, 320/390/1440, DPR-4 reflow, forced colors, reduced motion,
  coarse touch, focus, 44-pixel targets, no overflow/canary leakage, and clean
  console logs. No schema, Site, hosted data, setting, access, DNS, domain,
  Hub, sibling, `main`, deployment, or external state changed.

- **TASK-181 — Reshape the prerelease v1 published-update detail resource.**
  Replaced the unshipped `GET /api/v1/entries/{id}` grammar with the typed v1
  entry document: explicit public attributes; ordered canonical JSON `self`,
  collection, and schema-profile links; a human `text/html` alternate; and
  empty anonymous actions. Root and manifest discovery now expose the same
  RFC 6570 level-1 `{id}` template; concrete collection, self, and alternate
  paths percent-encode every non-unreserved opaque-ID character. The JSON-only
  route negotiates before D1, uses its single published-only query, preserves
  draft/unpublished/deleted/malformed/unknown `404` parity, and retains safe
  canonical authority, all four kinds, optional omissions, 60-second public
  success caching, `Vary: Accept`, `HEAD`, JSON `405`, and canary exclusion.
  Validation: integrated commit
  `f61e0f645bceb1847a6a777daf2fe8e543b4e170`; full validation (240/240),
  focused compiled-Worker/API/privacy/upgrade matrices, migration generation,
  production audit (zero vulnerabilities), and diff checks pass. Two
  independent Sol API/security reviews found no remaining P0/P1/P2 issue after
  correcting URI-template encoding. No human route was added, so rendered
  browser evidence is not applicable. No schema, Site, hosted data, setting,
  access, DNS, domain, Hub, sibling, `main`, deployment, or external state
  changed.

- **TASK-180 — Reshape the prerelease v1 published-updates collection.**
  Replaced the unshipped `GET /api/v1/entries` grammar with the public v1
  collection document: explicit published-entry resources, bounded
  `page`/`pageSize`, ordered canonical self/first/last/previous/next and item
  links, empty anonymous actions, and `Vary: Accept, Authorization`. A single
  `state = 'published'` count now derives `last` without scanning or exposing
  drafts; an empty collection reports page 1. The route retains JSON-only
  negotiation before D1, `HEAD`, JSON method/error responses, public 30-second
  anonymous caching, canonical authority, deterministic order, all four update
  kinds, and private/draft exclusion. Validation: integrated commit
  `fa647eae5682f293ac6f213834d3a3062de66942`; focused compiled-Worker/API
  matrices, full validation (235/235), migration generation, production audit
  (zero vulnerabilities), and diff checks pass. An independent Sol API/security
  review found no P0/P1/P2 issue. No human route was added, so rendered-browser
  evidence is not applicable. No schema, Site, hosted data, setting, access,
  DNS, domain, Hub, sibling, `main`, deployment, or external state changed.

- **TASK-179 — Reshape the prerelease v1 public Aitta profile resource.**
  Replaced the unshipped `GET /api/v1/site` grammar with the first public v1
  profile document: explicit `data.id/type/attributes`, stable JSON `self` and
  API-schema `profile` links, a truthful `text/html`
  `social.aitta.profile` link to the canonical human Aitta document, and empty
  anonymous actions. The v1 root and schema now advertise the profile resource;
  the existing manifest profile endpoint remains unchanged. The route retains
  public-without-Hub access, runtime-first then already-public stored canonical
  fallback, optional-field omissions, account-type compatibility, bounded
  JSON-only media negotiation before D1, `HEAD`, JSON `405`, no-store safe
  failures, and exclusion of owner, identity, Hub, draft, and private canary
  values. Validation: integrated commit `781228f33bea98d65e52d5245f5208e84babf173`;
  focused compiled-Worker/API/public matrices, full validation (229/229),
  migration generation, production audit (zero vulnerabilities), and diff
  checks pass. An independent Sol API/security review found no P0/P1/P2 issue.
  No schema, Site, hosted data, setting, access, DNS, domain, Hub, sibling,
  `main`, deployment, or external state changed.

- **TASK-161 — Make optional public Identity details compact and
  discoverable.** Replaced the competing optional-detail fieldset with a native
  `Optional public details` disclosure whose live 0–3 category count is closed
  when empty and opens for saved details or validation errors. Location, website,
  and up to eight labelled external links remain mounted while closed, preserving
 their exact payload, API, authorization, D1, validation, and public projection
 contracts. A closed invalid website now opens before native validity reporting
 focuses it, and the native disclosure marker remains visible. Validation:
 integrated commit `7c7dbcada18e7954432227a39cda7e41d1489e1d`; focused checks,
 full validation (211/211), migration generation, production audit (zero
 vulnerabilities), instruction/plan/diff gates, and independent final review
 pass. The disposable compiled-Worker matrix covers absent, one-detail,
 eight-link, long/unbroken, closed-invalid, non-owner, and missing-owner states
 at 320/390/1440 pixels; actual save/reload at 390 preserves all three detail
 categories; DPR-4 reflow, coarse touch, reduced motion, forced colors, focus,
 no-overflow, 44-pixel targets, canary exclusion, and clean console are
 recorded. Residual uncertainty: the in-app controller did not prove a
 sequential hardware-Tab journey; native controls and focused keyboard/source
 contracts cover that boundary. No Site, hosted data, setting, access, DNS,
 domain, Hub, sibling, `main`, or deployment state changed.

- **TASK-187 — Refine safe owner-managed website replacement.** Defined the
  Aitta-specific, no-fork customization contract for eventually replacing an
  owner's conventional website: closed versioned `PageDocument`, `SiteShell`,
  and `SiteDesign` records; safe HTML/CSS import rather than raw rendering;
  mandatory system destinations; bounded routes, metadata, accessibility,
  publication, canonical, and privacy rules; and a separately approved
  same-origin normalized-raster asset boundary. Arbitrary JavaScript, remote
  fetch, generic plugins/templates, global unsafe styles, public uploads, and
  a generic media framework remain excluded. The one immediately useful next
  increment is TASK-188's owner-only HTML-fragment compilation and escaped
  preview; persistence, publication/routing, shell/home, design/CSS, and asset
  work remain deliberately unqueued until that evidence exists. Validation:
  rebased and integrated commit `ac8d612`; production build and 86 focused
  security, metadata, public, owner, and workflow tests pass; instruction
  check passes at 31,400 bytes; plan and diff checks pass; and independent Sol
  High architecture/security review found no P0/P1/P2 issue. No product code,
  schema, migration, Site, deployment, data, setting, access, DNS, domain,
  Hub, sibling, or hosted state changed.

- **TASK-186 — Refine the next parallel-safe server-source boundary
  improvement.** Mapped the current `app/api`, `lib`, and `db` module, import,
  and test seams outside active feature ownership. The reviewed conclusion is
  that no parallel-safe refactor is presently justified: generic private-write
  handlers, public-resource helpers, repository abstractions, and parser splits
  would either overlap active vertical slices or add framework without an
  independently useful behavior. Validation: rebased and integrated commit
  `86c98a8`, instruction and plan checks pass (15 active/79 completed at the
  task gate), diff checks pass, and independent Sol High review found no
  P0/P1/P2 issue. Residual uncertainty: reconsider only when a future accepted
  slice demonstrates repeated behavior with exclusive ownership. No production
  code, tests, contract, schema, migration, Worker/runtime, Site, deployment,
  data, setting, access, DNS, domain, Hub, or sibling state changed.

- **TASK-185 — Make compiled-Worker response-lifetime tests deterministic.**
  Repaired the existing Miniflare acceptance harnesses so every dispatched
  response is consumed, parsed, or explicitly cancelled before another request
  can invalidate its stream. Existing upgrade-preservation, presentation-accent,
  and public functional-matrix assertions and all product behavior remain
  unchanged. Validation: integrated commit `f4c2e9a69cfb296b9c9f1b5be2ce70da8d46c670`;
  the guarded affected suite passes 10/10, repeated guarded upgrade coverage
  passes, and `MINIFLARE_ASSERT_BODIES_CONSUMED=true npm run validate` passes
  211/211. Migration generation reports no schema change, `npm audit --omit=dev`
  reports zero vulnerabilities, and diff checks pass. No application, API,
  protocol, schema, migration, Worker/runtime, Site, deployment, data, setting,
  access, DNS, domain, Hub, sibling, or hosted state changed.

- **TASK-160 — Simplify basic private-draft composition and editing.** Made the
  sole-owner new/edit update journey compact and body-first, with clear private
  draft versus published context, one save action, native field-associated
  validation, and a reload-before-retry lock for 5xx or interrupted saves.
  Create/edit routes, all four stored kinds and values, API payloads, owner and
  same-origin enforcement, D1 behavior, draft privacy, and public contracts are
  unchanged. Validation: integrated commit `6c3a703`; focused composer,
  accessibility, assisted-runtime, owner-security, and public-regression
  coverage passes; the final guarded full repository validation passes 211/211,
  migration generation reports no schema change, `npm audit --omit=dev` reports
  zero vulnerabilities, and diff checks pass. Local preview evidence covers
  new, draft, published, long/unbroken, validation, definitive and unconfirmed
  failure/recovery, denial, private-canary, touch/focus, forced-colors,
  reduced-motion, and reflow cases. Residual uncertainty: the browser
  controller did not reproduce a sequential hardware-Tab journey, and rendered
  evidence used a local development preview rather than a hosted checkpoint.
  No Site, hosted data, setting, access, DNS, domain, Hub, sibling, `main`, or
  deployment state changed.

- **TASK-184 — Add maintainable TypeScript and React design guidance.** Added
  a compact `Maintainable TypeScript and React design` section to the root
  instructions, requiring small semantic units, feature-owned boundaries,
  narrow explicit typed dependencies, proportionate handler/strategy use,
  accessible focused React components, local effect isolation and tests, clear
  naming, and small existing-platform-first changes. The guidance explicitly
  preserves AittaSocial's direct Sites/D1 architecture and prohibition on
  generic frameworks, plugin systems, DI containers, and premature extension
  points. Validation: reviewed source commit `f064325`, independent Sol High
  review reports no P0/P1/P2 findings, `npm run agents:check` passes at 31,039
  bytes, plan and diff checks pass. Residual uncertainty: authenticated remote
  publication of this and the earlier multi-agent-policy commit remains
  TASK-183 after GitHub SSH authentication rejected the current key. No
  application, schema, migration, Site, deployment, data, setting, access,
  DNS, domain, Hub, sibling, or runtime state changed.

- **TASK-175 — Publish a truthful public Privacy page.** Added a D1-independent `/privacy` page with neutral noindex metadata and factual coverage of public projections, private drafts, sole-owner authorization, protected settings, ChatGPT Sites processing boundaries, the absence of a current Hub connection or app-owned analytics, and bounded retention limits. The shared public footer now always exposes Privacy and the official GitHub source while the existing owner preference hides only the optional `Powered by AittaSocial` attribution; its owner-facing label now states that exact effect. Validation: focused commit `8db92b0582a7a4e741dce7314080df2a2a49f279`, integrated as `33ae47c`; focused suites pass 33/33, full validation passes 204/204, migration generation reports no schema change, production audit reports zero vulnerabilities, diff checks pass, and independent Sol High review reports no P0–P2 findings. Rendered local Worker evidence passes 320×568, 390×844, and 1440×900 with semantic hierarchy, no horizontal overflow, and at least 44-pixel footer targets. Residual uncertainty: a browser-controller 400-percent page-scale attempt was interrupted, so the record claims only the equivalent 320-pixel rendered reflow and source contracts, not literal browser zoom. No API, schema, authorization, Site, hosted data, setting, access, domain, Hub, sibling, `main`, or deployment state changed.

Completed work moves here from [PLAN.md](PLAN.md). Each entry records decisive
validation evidence and residual uncertainty. Unscheduled possibilities remain
in [BACKLOG.md](BACKLOG.md) and are not capability claims.

## Unreleased

- **TASK-178 — Establish the prerelease v1 integration root and JSON boundary.** Added the first versioned integration discovery surface: D1-independent `GET /api/v1`, `GET /api/v1/schema`, and a JSON-only unknown-v1 boundary. Root and schema return the exact ordered hypermedia documents, `HEAD` mirrors headers without a body, non-GET methods return structured JSON `405` with `Allow: GET, HEAD`, and unsupported/malformed/excessive `Accept` returns bounded no-store JSON `406`. The root reads and normalizes only the protected canonical URL—throwing owner or Hub getters cannot affect it or trigger D1—and never derives links from request hosts. The configured manifest now additively advertises `endpoints.api` while its existing profile and entry resource shapes remain unchanged for TASK-179–181. `/api/v2` remains absent. Validation: independently reviewed candidate `3c6b8bf3a57cd0dcf124489dd0f9738ba7c02810` integrated directly; focused compiled-Worker coverage passed, full validation passed 222/222, migration generation reported no schema change, production audit reported zero vulnerabilities, and agent/plan/diff gates passed. No schema, Site, deployment, data, setting, access, DNS, domain, Hub, sibling, `main`, or external state changed.

- **TASK-170 — Finish Aitta terminology in the owner shell and home.** Replaced the remaining application-level `presence` wording in the owner shell, safe owner-access states, owner-home heading, readiness summary, and public preview action with concise `Aitta` language, including `Your Aitta`, `Aitta summary`, and `View Aitta`. Identity/profile wording, update-state and lifecycle actions, routes, internal identifiers, sole-owner authorization-before-D1 behavior, protected-setting secrecy, and public/private boundaries remain unchanged. Validation: integrated commit `74cff66` from independently reviewed candidate `27bfeeca983a27f4ce64496b7154008674e81e30`; focused owner coverage passed 67/67, full validation passed 213/213, migration generation reported no schema change, and production audit reported zero vulnerabilities. Disposable compiled-Worker/D1 browser evidence covered fresh, incomplete, zero/draft/published/many-update, unconfigured, non-owner, and missing-owner states at 320/390/1440 pixels plus DPR-4 320-CSS reflow equivalence, forced colors, reduced motion, focus, coarse-pointer navigation, 44-pixel targets, no overflow/private-canary leakage, and clean console logs. Residual uncertainty: no complete sequential-hardware-Tab traversal is claimed. No Site, hosted data, setting, access, domain, Hub, sibling, `main`, or deployment state changed.

- **TASK-164 — Clarify per-update publish lifecycle.** Made Draft and Published explicit in the shared per-update action group on the owner dashboard and edit page, added update-specific native publish confirmation, and kept publish/unpublish recovery honest: definitive failures remain retryable while an ambiguous result locks only publication-state actions and offers a fresh saved-state check. Edit and Delete intentionally remain available because they are separate owner operations. Publishing exposes the existing public permalink; unpublishing restores a private draft, whose public result is indistinguishable from an unknown update. Existing API/state endpoint, authorization-before-D1, same-origin, D1 transitions, cache, metadata, protocol, and draft privacy contracts remain unchanged. Validation: integrated commit `39d35fa` from independently reviewed candidate `3bf56bbbfaa584a8e3f583ea2346fd6ea083fa9d`; focused lifecycle coverage passed 17/17, full validation passed 213/213, migration generation reported no schema change, production audit reported zero vulnerabilities, and diff/agent/plan checks passed. Disposable compiled-Worker/D1 browser evidence covered dashboard and edit rows at 320/390/1440, native confirmation cancellation/acceptance, normal publish/unpublish, 400 and 500 recovery, non-owner/missing-owner states, private canaries, DPR-4 320-CSS reflow equivalence, forced colors, reduced motion, keyboard focus, a coarse-pointer navigation, 44-pixel targets, no overflow, and clean console logs. Residual uncertainty: no complete sequential-hardware-Tab traversal is claimed. No Site, hosted data, setting, access, domain, Hub, sibling, `main`, or deployment state changed.

- **TASK-189 — Refine JSON-first API, Sites trust, and machine access.** Recorded the complete endpoint inventory and protocol-1.0 compatibility boundary, selected a new JSON-only `/api/v2` successor rather than changing or HTML-negotiating `/api/v1`, and documented the closed hypermedia, error, media, pagination, cache, and relation conventions. Replaced the incompatible API-HTML rows with bounded v2 root/schema, profile, collection, and detail tasks; added a separately owner-approved Sites-ingress verification task; and scheduled one restricted, deployment-bound machine actor that can create only a private draft after its dependencies are complete. The machine path remains distinct from ChatGPT Sites browser identity, owner administration, and the Hub; no credential, migration, API route, secret, or hosted configuration was implemented. The recorded Sites boundary is intentionally unresolved pending explicit owner approval, authoritative origin inventory, and separate owner/non-owner sessions. Validation: integrated refinement commit `e796412` from reviewed candidate `295babab21ec9b5bdf59520622a1f7d0038bb978`; full validation passed 211/211, agent and plan checks passed (`AGENTS.md` 31,970 bytes), and diff checks passed. No external, hosted, deployment, data, setting, access, domain, Hub, sibling, or `main` mutation occurred.

- **TASK-176 — Add a human technical-information path and concise resource navigation.** Added a D1-independent `/technical` HTML guide to the existing protocol 1.0 manifest, public profile, and published-update resources; made Technical a real public-footer destination; and replaced the visible `Profile JSON` and `Updates JSON` labels with the concise Manifest, Profile, and Updates links while retaining permanent Privacy and GitHub access. The neutral page uses the shared public information composition, native links, noindex metadata, fixed CSP, and no runtime, profile, owner, request-host, D1, or private value. Every machine URL, JSON projection, status, error, cache, canonical, published-only, draft-unknown, API, authorization, schema, and migration contract remains unchanged. Validation: focused commit and integrated `develop` commit `b20511106674fd1e52d05be643878617421b4a49`; focused suites pass 32/32, full validation passes 207/207, migration generation reports no schema change, production audit reports zero vulnerabilities, diff checks pass, and independent Sol High review reports no P0–P2 findings. Rendered local Worker evidence passes 320×568, 390×844, and 1440×900 plus a 1280-physical/320-CSS DPR4 reflow-equivalent row with no horizontal overflow or offscreen control, at least 44-by-44 CSS-pixel targets, a one-line compact header, logical landmarks/headings, and zero warning/error console entries. Residual uncertainty: this is explicit reflow equivalence rather than literal browser zoom, and the controller did not synthesize sequential Tab traversal; native focus/source contracts remain covered without overclaim. No Site, hosted data, setting, access, domain, Hub, sibling repository, `main`, or deployment state changed.

- **TASK-159 — Simplify the core Identity save journey.** Reordered the authorized Identity editor around the four required profile fields and one server-derived readiness panel, added exact all-control saved-versus-unsaved comparison, truthful protected-runtime and saved-fallback explanations, field-associated definitive validation errors, and a locked reload-before-retry path for unconfirmed mutation results. Optional details, presentation controls, preview, exact payload, account-type compatibility, sole-owner and same-origin enforcement, D1 values, public projection, routes, schema, and APIs remain intact. Invalid stored canonical values—including whitespace-only legacy values—are omitted without being called saved, while only an exactly empty stored fallback is an exact empty baseline. Validation: focused commit `6351d54ee97bc7055b717e37fac2e2f591bb5805`, integrated as `e9ce492`; focused coverage passes 49/49, every repository gate passes with 201/201 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, and independent Sol High review reports PASS after reproducing the invalid/empty boundary. The compiled-Worker browser evidence covers 21 configured and six denial rows at 320/390/1440 pixels plus six final-source invalid-versus-empty rows, DPR-4 reflow equivalence, coarse touch, reduced motion, forced colors, focus, 44-pixel effective targets, definitive and unconfirmed failures, zero overflow/off-screen controls/private canaries, and clean console logs. Residual uncertainty: the in-app controller did not advance sequential Tab focus, so native controls, focus styling, source order, and automated keyboard contracts are recorded without claiming a hardware-Tab journey. No Site, hosted data, setting, access, DNS, domain, Hub, sibling repository, `main`, or deployment state changed.

- **TASK-169 — Use Aitta consistently in configured public browsing and metadata.** Replaced application-level `presence` wording across the configured public frame, empty update stream, published permalink, generic not-found route, and public metadata fallbacks with the accepted `Aitta` vocabulary while retaining owner-authored profile and update content unchanged. Signed-out and signed-in management links now identify local sole-owner Aitta administration without claiming authorization; profile-absent historical updates use only the bounded `Independent Aitta` fallback. Routes, protocol 1.0 envelopes and identifiers, API allowlists, canonical construction, robots, CSP/cache policy, draft/unknown parity, internal names, schema, migrations, and runtime bindings remain unchanged. Validation: focused commit `fa711ab9770f66fdfe7ce423de13c545a1a924ce`, integrated as `1a9afe2`; focused coverage passes 58/58, every repository gate passes with 198/198 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, and independent Sol High review found no P0/P1/P2 issue. The exact-source rendered matrix covered configured signed-out/signed-in, empty, profile-absent, canonical-absent, published, draft, unknown, and global not-found states at 320 CSS pixels plus a physical-1280/DPR-4 reflow-equivalent row: all had zero overflow, off-screen controls, private-canary leakage, or console warnings/errors, and effective targets were at least 44 CSS pixels high. Residual uncertainty: the in-app controller focused native anchors with the reviewed visible focus ring but did not dispatch Enter navigation, so pointer navigation and native-href/accessibility contracts are recorded without claiming controller-observed keyboard activation. No Site, hosted data, setting, access, DNS, domain, Hub, sibling repository, `main`, or deployment state changed.

- **TASK-168 — Introduce Aitta in the unconfigured setup and unavailable public journeys.** Replaced the fresh setup and storage-unavailable application copy with the accepted Aitta vocabulary while keeping `profile` as the optional outward presentation, retaining the exact owner/sign-in destinations, and making no Hub-connection claim. The 110-word reusable prompt preserves every private-first, reuse, sole-owner, D1, validation, review, and explicit publishing/access/domain approval boundary. Fresh and unavailable metadata are now distinct neutral `noindex, nofollow` projections with no canonical, sharing URL, image, request-host, runtime-canonical, error, or private-canary leak; a selective regression proves an entries-only D1 failure cannot combine an unavailable body with configured/indexable metadata. Validation: focused commit `e2197b4814698a05d290c128dc50f68366c4890b`, integrated as `ced4d3c`; focused metadata/privacy/prompt/CSP coverage passes 42/42, every repository gate passes with 197/197 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, and independent review reports no P0/P1/P2 finding. A disposable compiled-Worker browser row at 320 CSS pixels and a physical-1280/DPR-4 320-CSS-pixel reflow-equivalent row have zero horizontal overflow, contained selectable prompt content, at least 44-pixel effective controls, visible focus, and zero warning/error logs. Residual uncertainty: the in-app controller did not advance sequential Tab focus, so native focusability and source contracts are recorded without claiming a hardware-Tab journey; configured public terminology remains TASK-169. No Site, hosted data, setting, access, DNS, domain, schema, migration, protocol, API, Hub, sibling repository, `main`, or deployment state changed.

- **TASK-171 — Refine the additive Aitta Network event model into versioned contract work.** A read-only inventory of exact AittaSocial `12aa6ca9a0c31abafc175936428e7a966a99107a`, AittaSocial Hub `438a9e8d075bb1a34296a9f3cb37d7039a1e7784`, and AittaDB `581fcd3074696b615756aab25b73c53b48998d09` established the immutable event foundation: each Aitta is authoritative for events it creates, while a remote reader treats the claimed authoring Aitta as untrusted until verified; type defines meaning and root/parent eligibility; an optional parent defines structure only; permitted parentless events identify derived threads whose structurally valid descendants may span Aittas; feeds are access-controlled projections; visibility and delivery remain independent of parent structure; unknown types stay safe without inferred type semantics; remote ancestry and descendant traversal are untrusted and bounded; and Hub may authorize, discover, and route without storing authoritative participant content. Authoring-Aitta and creation-time values remain untrusted remote assertions, and identifiers, namespaces, types, and timestamps never prove authorship. Existing protocol 1.0 entries remain unchanged and are not automatically projected. The Hub repository now owns the shared source-only foundation through its active TASK-170 envelope, TASK-171 types, TASK-172 thread, TASK-173 feed, and TASK-174 compatibility contracts. This refinement adds durable local governance, `ROADMAP-009`, one acceptance record, and exact reserved AittaSocial TASK-172 through TASK-174 conformance, local-note, and public-projection rows behind Hub TASK-174 rather than activating a duplicate local contract. Validation: agent-size, plan-graph, migration-drift, full repository, production-audit, and diff gates pass with 10 active and 71 completed local tasks. Residual uncertainty: the Hub contracts, event authenticity/key rotation, private audiences/revocation, delivery, feed ordering, retention, entry projection, safe remote egress, and AittaDB conditional writes remain unfinished; no product source, protocol, API, schema, migration, Site, deployment, data, setting, access, DNS, domain, Hub, AittaDB, or sibling repository changed.

- **TASK-167 — Establish the canonical Aitta vocabulary in living repository guidance.** Defined `Aitta` as the branded owner-controlled AittaSocial application/local authority, distinguished an `Aitta deployment`, retained `profile` for optional outward presentation, and reserved `Hub connection` and `AittaSocial Hub` for their exact future network meanings. Living governance, setup, protocol explanation, security, privacy, deployment, development, presentation, reproducibility, upgrade, roadmap, and backlog guidance now share one exact first-use explanation, use bare deployment only for packaging/release/hosting operations, and explicitly state that the current POC has no Hub connection and public profile/published-update reads remain Hub-independent. Runtime labels are deliberately unchanged for TASK-168–170. Protocol 1.0 fields, values, envelopes, errors, routes, schema/migrations, internal identifiers, CHANGELOG, checkpoint, and all older acceptance records remain intact. Validation: focused commit `1d6e9a3aff2eb1f0d8ddea52a8f994059631d5aa`, integrated as `6a3559f`; post-rebase `npm run validate` passes 191/191, focused documentation/protocol coverage passes 33/33, `npm audit --omit=dev` reports zero vulnerabilities, the reviewed protocol digest is `4304e7e4551675d5c9e11d54814cbf4b83f7dc559970fa2a01b84964aa5889c0`, diff checks pass, and independent review found no P0/P1/P2 issue. Residual uncertainty: TASK-168, TASK-169, and TASK-170 own the setup/unavailable, configured public/metadata, and residual owner runtime terminology respectively; no product, protocol, schema, migration, Site, data, setting, access, DNS, domain, Hub, sibling repository, `main`, or deployment state changed.

- **TASK-166 — Refine canonical Aitta terminology into bounded implementation work.** Accepted `Aitta` as the branded noun for the owner-controlled AittaSocial application and local authority, with `Aitta deployment`, `profile`, `Hub connection`, and `AittaSocial Hub` as distinct terms. A read-only inventory of exact `develop` base `14692334bbc0605a83bff82432bfe249ff6d30db` classified 445 current `presence` occurrences across runtime/content, tests, living guidance, compatibility surfaces, and historical evidence. The result preserves protocol 1.0 fields and values, routes, API envelopes and errors, schema/migrations, internal identifiers, and past evidence; it corrects the proposed first-use wording so the current POC does not claim a Hub connection. TASK-167 through TASK-170 now own living guidance, unconfigured/setup journeys, configured public browsing/metadata, and residual owner shell/home language, while TASK-159, TASK-160, TASK-164, and TASK-165 own terminology only in the UI slices they already change. Validation: agent-size, plan-graph, and diff checks pass with 11 active and 69 completed tasks; no product source, protocol, schema, migration, Site, data, setting, access, DNS, domain, Hub, or sibling repository changed. Residual uncertainty: the four implementation slices remain active and must supply their own rendered, privacy, metadata, and full-validation evidence.

- **TASK-158 — Establish the shared AittaSocial visual vocabulary and compact owner home.** Replaced the authenticated owner's dark software-brand bar, desktop sidebar, wrapped phone grid, oversized serif hierarchy, and duplicated readiness panels with a neutral 60-pixel mobile-first frame, one non-wrapping three-destination route bar, one state-derived primary action, one concise next-step panel, compact status/count information, and the complete existing update list and lifecycle controls. Owner surfaces now reuse the bounded semantic surface, ink, line, focus, field, action, status, and 44-pixel-control vocabulary without introducing a generic component framework, runtime theme, setting, public/owner frame coupling, or authenticated ChatGPT-name display. Authorization still completes before D1 reads; public rendering, metadata, APIs, mutations, schema, configuration, routes, private-canary boundaries, and hosted state are unchanged. Validation: focused implementation commit `25104c030f9d2445209617c86c4fbdb5e05439e5`, integrated as `8fa9025`; the complete four-state by four-width browser matrix covers fresh/incomplete/complete, zero/one/many/long updates at 320/390/768/1440 pixels with equal client/scroll widths, one CTA, restrained headings, 44-pixel targets, focus, reduced motion, forced colors, DPR4 reflow equivalence, CSP/assets, clean console, and private-canary exclusion. A final 320/390 rerun proves the phone-footer safe-area correction; `npm run validate` passes 191/191, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero vulnerabilities, diff checks pass, and independent final review found no P0/P1/P2 issue. Residual uncertainty: the in-app controller could not reproduce hardware Tab/Enter or literal page zoom, and nonzero bottom-cutout emulation was unavailable; native-anchor/focus contracts, 320-CSS-pixel reflow, and the source-pinned safe-area rule remain decisive. No Site, hosted data, protected setting, access, DNS, domain, Hub, sibling repository, `main`, or deployment state changed.

- **TASK-157 — Deploy and verify the mobile-first presence redesign.** Reused the one existing public Site, synchronized its configured source branch to exact owner-reviewed `main` commit `18fa16dc967d8502c17afb2bd3cc28518039a172`, saved exactly one new version, and deployed Site version 8 successfully at `https://aittasocial.jaakko-heusala.chatgpt.site` while keeping `https://jhh.aitta.social` canonical. Both roots now show the compact one-line frame, graphical Identity field and initials tile, concise About area, and identity-linked chronological stream; old editorial labels, numbering, and generic `Read update` treatment are absent. Protocol 1.0 manifest and APIs, published-only privacy, canonical metadata, no-store HTML, fixed CSP, same-origin assets, signed-out owner dispatch, read-only owner views, retired Hub 404s, native public click navigation, 320/390/1440 layout, first-viewport content, 44-pixel targets, focus, reduced motion, forced colors, and a clean app console pass. Public access revision 4, the one owner grant, protected-environment revision 5 and value-safe metadata, `DB`/null-R2 binding, active custom hostname, public semantic projections, and provider-visible status were unchanged; no content, D1, access, setting, DNS, domain, or Hub mutation was made. Validation: exact deployed source passes every gate with 191/191 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, the reviewed migration matches the 105-file package, and terminal deployment status is `succeeded`. Residual uncertainty: Sites exposes no byte-level hosted-D1 or DNS checksum, a separate hosted non-owner session was unavailable, and the in-app controller did not reproduce native Enter or coarse-pointer activation; exact-source authorization and TASK-156 Chrome coverage remain decisive for those boundaries. The later evidence/tracker commit was not deployed and reaches `main` only through owner review.

- **TASK-156 — Prove the mobile-first public redesign across content and accessibility boundaries.** Completed the public-only responsive correction and rendered acceptance for the compact shared frame, graphical Identity/About area, identity-linked newest-first stream, and focused permalink. The complete 52-row local packaged-Worker matrix covered the representative home and permalink at seven requested viewports plus profileless, empty, one/many-update, maximum-content, missing-detail, eight-link, all-kind, attribution, published, draft, unknown, and not-found boundaries at 320×568 and 1440×900; an exact-final nine-row regression rerun covered the late compact setup and minimum-target corrections. Phone evidence shows the first source row and meaningful body content in the normal viewport, while wide streams remain bounded to 700 pixels; native keyboard/focus, 44-by-44-pixel targets, contrast, safe areas, 200-percent text, 400-percent reflow equivalence, reduced motion, forced colors, coarse touch, CSP/assets, APIs, metadata, cache, privacy canaries, and clean browser logs pass. Validation: focused rendered candidate `a3b5bcba319c24a7f924e9973af1a1a0a9187008`, integrated as `b835788eeed12b7947b6d3886deff831b4928e8a`; focused coverage passes 19/19, every repository gate passes with 191/191 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, and independent final review reports no remaining P0/P1/P2 finding. Residual uncertainty: deployment was prohibited, so the local fixture proves the exact Sites owner-dispatcher href/GET rather than a hosted authenticated lifecycle; literal browser page zoom was unavailable, so actual-320 and physical-1280/DPR-4 rows prove the required reflow equivalence; the exact-size phone comparison artifact comes from the source-equivalent focused candidate because the exact-final in-app capture excluded browser chrome, while exact-final geometry, selector reachability, a supplemental raster, and the exact-final desktop artifact are recorded explicitly. No public API, metadata, canonical, cache, CSP, schema, migration, runtime, owner-workspace, Site, hosted data, protected setting, access, DNS, domain, Hub, sibling repository, `main`, or deployment state changed.

- **TASK-155 — Make updates and permalinks one identity-linked public stream.** Replaced numbered editorial previews with one bounded newest-first stream whose updates repeat the derived identity tile, complete source name, linked human-readable time, and only useful non-note kind context. Notes now lead with their complete ordinary-scale body and keep an optional title as a quiet permalink affordance; titled articles, announcements, and links use a restrained 20–24-pixel hierarchy and bounded excerpt; complete external destinations remain safe wrapping anchors. Published permalinks reuse the compact frame and source row, keep notes body-first with one meaningful visually hidden h1, bound long-form reading to 66 characters, and retain native return and secondary JSON routes. Zero/one/many/all-kind fixtures, an explicitly out-of-order seed, neutral profile-absent rows, long/unbroken values, draft/unknown parity, safe destinations, private canaries, and the absence of ordinals, promotional calls, fake engagement/count/menu controls all pass. Validation: implementation commit `5f7489a35a526db24723ee253efbb94e400d7b38`, integrated as `aa73834`; focused coverage passes 57/57, every repository gate passes with 191/191 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, and independent acceptance review found no P0/P1/P2 issue. Residual uncertainty: TASK-156 supplies the requested exact-candidate rendered viewport, first-viewport, content-boundary, focus, navigation, contrast, motion, and visual-comparison proof; no public API, metadata, canonical, cache, CSP, schema, runtime, owner workspace, Site, hosted data, protected setting, access, DNS, domain, Hub, sibling repository, main, or deployment state changed.

- **TASK-154 — Establish the compact shared public frame and identity area.** Replaced the configured public opening with a mobile-first shared frame: a safe-area-aware 60-pixel one-line header, quiet short owner-management action with its complete accessible name, solid safe-accent identity field with two CSS-only tonal forms, derived initials tile, compact sans-serif identity copy, collapsing optional details, native long-About disclosure, and one secondary footer shared by the homepage and permalink. Empty optional fields reserve no layout, the existing unconfigured and unavailable states retain their meaning, and the private owner workspace, native routes, metadata, public APIs, CSP, protocol, and stored presentation values are unchanged. Validation: implementation commit `70354de102fd94c908c675fd3d61e5c15982c070`, integrated as `26be2db`; focused coverage passes 72/72, every repository gate passes with 190/190 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, and the task worktree and integrated diff are clean. Residual uncertainty: TASK-155 supplies the final identity-linked stream/permalink content treatment and TASK-156 supplies the requested rendered viewport, focus, navigation, contrast, motion, and visual-comparison matrix; no Site, hosted data, protected setting, access, DNS, domain, Hub, sibling repository, main, or deployment state changed.

- **TASK-061 — Save and inspect the approved presence-first Sites checkpoint.** Packaged the exact validated and pushed `develop` commit `a14fb61bd43c372d12fed02365020f4cc77c6b57`, saved it as Site version 7, and deployed it successfully to the one existing public Site at `https://aittasocial.jaakko-heusala.chatgpt.site`; the unchanged configured canonical presence remains `https://jhh.aitta.social`. Saved-version and terminal deployment inspection both report the exact commit, while `main` remains untouched. Provider-visible pre/post checks preserve public access revision 4, the one owner grant with no groups or external visitors, protected-environment revision 5 and its value-safe fingerprint, the same two protected keys, and the one active custom hostname with active provider/TLS status. Read-only owner/public observations found no semantic content change, public JSON remained published-only, and no hosted form or access, environment, D1, DNS, domain, or binding mutation was submitted; no private update existence, count, state, identifier, or text is recorded. The configured root and permalink, protocol 1.0 manifest, site/collection/detail APIs, canonical metadata, hosted sampled CSP, same-origin assets, signed-out redirect, signed-in owner dashboard/Identity/editor, and separate signed-in non-owner denial all pass; the setup prompt is absent, both retired Hub paths return generic non-redirecting 404s, the unconfigured challenge remains absent, and recent worker error logs are empty. Chrome proves native public and owner Enter navigation, the Display-name-to-Short-description Tab transition, effective 44-pixel targets, no overflow at 1280 and actual 320 pixels, a separate physical-1280/DPR-4 400-percent-reflow-equivalent row, coarse touch, reduced motion, forced-color focus, and zero fresh app console warnings/errors. Validation: every exact-source repository gate passes with 188/188 tests, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero production vulnerabilities, and post-deployment status remains `succeeded`. Residual uncertainty: Sites exposes no byte-level hosted-D1 or DNS-zone checksum, so preservation is bounded to unchanged provider-visible configuration, bounded semantic content checks, and the absence of mutation calls; browser evidence proves the required 400-percent reflow equivalence without claiming literal page-zoom control. The later evidence/tracker commit was not deployed, and promotion to `main` remains a future owner-reviewed pull request.

- **TASK-137 — Complete the rendered presence-first accessibility matrix.** Rebuilt the exact corrected candidate against fresh and historically populated real local D1 fixtures and inspected eleven public, permalink, error, owner-dashboard, Identity, and editor states at requested wide and actual 320-pixel widths. All 22 rows retained one main landmark, named navigation/regions/forms, ordered headings, labelled controls, at least 44-by-44-pixel effective targets, zero horizontal overflow or off-screen controls, and passing text/control contrast; four additional physical-1280/DPR-4 rows independently produced the 320-CSS-pixel 400-percent reflow-equivalent condition without mislabeling it as literal page zoom. Connected Chrome proved native Enter permalink navigation and Tab focus order; normal and forced-color focus, coarse-pointer touch mode, reduced motion, CSP-compatible assets, retired Hub 404s, and zero warning/error logs also pass. Validation: implementation commit `8905617787bb1089a6b0052ea072e721dfd7c3e5`, integrated as `c17cfc7a0bd6674e4397fa9c5ee7187305a0bdc2`; independent evidence audit passes, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero vulnerabilities, and every repository gate passes with 188/188 tests. Residual uncertainty: hosted identity, CDN, D1, canonical-domain, and deployment behavior remain only TASK-061; no Site, hosted data, protected setting, access, DNS, domain, schema, migration, protocol, or runtime configuration changed.

- **TASK-153 — Keep empty-state headings subordinate at narrow widths.** Reduced only the public and owner empty-update h3 scales so each remains visually subordinate to its existing Updates h2 without changing wording, semantic levels, the accepted primary headline scale, or populated/card typography. Chrome 151 measured public h2/h3 at 51.2/32 pixels wide and 32/26.4 pixels at an actual 320-pixel viewport, and owner h2/h3 at 32/25.6 pixels wide and 28/24 pixels narrow; the narrow headings wrapped within the viewport with no overflow, undersized visible targets, contrast failures, or warning/error logs. A 1280-pixel desktop at 400-percent reflow resolves the same tested 320-CSS-pixel cascade. Validation: implementation commit `383307f93397cefc2e9b86824d0ed638a31fe083`, integrated as `c7426396dc8eaba9f17830b45128afaae3bf7cb0`; focused coverage passes 2/2, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero vulnerabilities, and every repository gate passes with 188/188 tests. Residual uncertainty: the complete rendered motion, forced-color, keyboard, touch, and multi-route matrix remains TASK-137; no protocol, runtime configuration, hosting binding, Site, hosted data, protected setting, access, DNS, domain, schema, or migration changed.

- **TASK-060 — Complete the local presence-first functional journey.** Added one exact-source compiled-Worker matrix over fresh and historically populated real persisted D1 fixtures, covering unconfigured and configured public states; owner, non-owner, and missing-owner boundaries; fork-free Identity, constrained presentation, and complete draft/edit/publish/unpublish/delete persistence; draft privacy; storage failure; and isolation from retired Hub settings and routes while retaining only the public protocol challenge. Chrome 151 followed native public home/permalink and owner Identity/draft-editor journeys with zero relevant console or page/runtime errors. Validation: implementation commit `9bf596798b254d8eb4be90e45ade5667de65804e`, integrated as `1dc3411`; focused matrix 4/4, `npm run db:generate` with no schema change, production dependency audit with zero vulnerabilities, and every repository gate with 186/186 tests pass. Residual uncertainty: the exhaustive rendered accessibility matrix remains TASK-137 and hosted alignment remains TASK-061; no Site, hosted D1, protected setting, access, DNS, domain, schema, migration, or protocol change occurred.

- **TASK-152 — Establish `develop` as the main Git workspace.** Created local and remote `develop` at exact fetched `origin/main` commit `3d028321f26cda7ce1e4cdbffc64406bb52e4ff5`, documented it as the shared integration checkout, and required isolated feature branches to start from and rebase onto updated `origin/develop` before the integration owner serializes their validated commits and tracker updates. Release promotion to `main` remains an owner-reviewed rebase-merge pull request, followed by an owner refresh of `develop` from the resulting main history; an explicitly approved Sites checkpoint may meanwhile use an exact validated and pushed `develop` commit without relabeling it as `main`. Branch and GitHub review found no merge-ready branch requiring a rewrite: the current validated workspace already contained `develop` with a no-op rebase; TASK-060 and TASK-137 remain unfinished; older task refs are integrated or superseded; and the sole open PR is an older draft checkpoint PR that remains untouched. Validation: implementation commit `f54db810c6d6da806feedb75bc4c1fe53b8cc930`; the focused workflow contract passes, `develop...f54db81` is 0 behind/43 ahead, instruction and graph checks pass, `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero vulnerabilities, and the exact source passes every repository gate with 182/182 tests. The final tracker commit fast-forwards both local and remote `develop`, after which the root checkout uses `develop`. Residual uncertainty: future feature branches must be reassessed at their actual completion point; no runtime, schema, migration, protocol, hosting binding, deployment, data, setting, access, DNS, or domain change occurred.

- **TASK-151 — Reduce oversized primary headline typography.** Replaced the dominant public, setup, permalink, unavailable/access, and owner display sizes with restrained responsive bounds, removed the narrow breakpoint enlargement, kept owner page headings larger than their section headings, and bounded the repeated wordmark and owner header so maximum-length unbroken Identity text cannot widen the viewport. Update-card typography and semantic heading levels remain unchanged. Validation: implementation commits `676c339` and `28d5b4b`; focused tests pin every scale, hierarchy relation, shrink/wrap boundary, long public and owner content, and private-canary exclusion; Chrome 151 rendered the public, setup, permalink, error/access, and owner surfaces at requested 1280-by-900 and 320-by-900 viewports with zero overflow, off-screen headings, warnings, errors, or page exceptions. The final maximum-length owner-dashboard check measured h1/h2 at 44.8/32 pixels wide and 36/28 pixels narrow, with zero document overflow. `npm run db:generate` reports no schema change, `npm audit --omit=dev` reports zero vulnerabilities, and the exact candidate passes every repository gate with 181/181 tests. Residual uncertainty: the complete multi-state rendered accessibility matrix remains TASK-137; no schema, migration, protocol, runtime setting, hosting binding, deployment, data, access, DNS, or custom-domain change occurred.

- **TASK-148 — Keep every supported runtime accent readable.** Added one strict rendering-only resolver that preserves an exact six-digit owner preference when it already meets a 4.5:1 floor against the darkest supported light surface and otherwise deterministically blends it toward the reviewed default until it does. Public home, published permalinks, and saved/live owner previews use the same derived value, while D1 and protocol 1.0 retain the normalized raw preference and malformed legacy values are never repaired or admitted to a style sink. Validation: implementation commit `94ab193`; exact threshold, dark/light, saturated, malicious, persisted-reopen, no-clobber, upgrade, and private-canary cases pass; Chrome 151 rendered stored `#ffffff` as `#55736c` on all three surfaces at requested 1280-by-900 and 320-by-900 viewports with zero overflow or console errors; contrast measured 4.513:1 against the owner panel, 4.547:1 against public paper, and 5.179:1 against white button text; forced colors remained browser-owned; `npm run db:generate` reports no schema change; `npm audit --omit=dev` reports zero vulnerabilities; and the exact candidate passes every repository gate with 179/179 tests. Residual uncertainty: the complete multi-state rendered matrix remains TASK-137 after the requested TASK-151 headline correction; no schema, migration, protocol, runtime setting, hosting binding, deployment, data, access, DNS, or custom-domain change occurred.

- **TASK-150 — Remove the provisional credential-bearing Hub root probe.** Deleted the server probe implementation, retired private route, owner Hub page and client, navigation and now-empty Advanced label, obsolete styling, supported runtime/example keys, and current setup guidance without inventing replacement registration behavior. The public protocol 1.0 `AITTA_SOCIAL_HUB_CHALLENGE` to `hubVerificationChallenge` projection remains the sole intentional Hub-related runtime surface. Validation: implementation commit `1310e068b7f02839238ba7139bd72a0b9fe81e65`; identity-independent hostile requests to both retired paths return the same non-redirecting 404 without outbound calls or logs; focused security, owner, accessibility, and identity coverage passes 80/80; the retirement matrix passes 26/26; `npm run db:generate` reports no schema change; `npm audit --omit=dev` reports zero vulnerabilities; and the exact isolated commit passes the clean-source build, fresh-D1, inert-archive, and obsolete-key canary proof. The combined branch builds without either retired route and passes all 174 tests. Residual uncertainty: the existing hosted checkpoint retains its older source until separately approved TASK-061; no hosted setting was removed or read, and no deployment, data, access, DNS, or custom-domain change occurred.

- **TASK-149 — Add one fixed Content Security Policy to every application HTML response.** Added one Worker-owned policy to every handler-generated HTML response while retaining HTML no-store behavior and leaving JSON and Sites static-asset caching unchanged. The fixed directive set is default-deny, same-origin only for connections, fonts, forms, scripts, and styles, blocks framing, objects, mixed content, script attributes, wildcards, and evaluation, and documents the measured Vinext need for inline RSC/bootstrap scripts, inline font CSS, and constrained React style attributes. Validation: implementation commit `8295c07`; its exact source-equivalent tree was exercised in Chrome 151.0.0.0 at requested 1280-by-900 and actual 320-by-900 viewports across configured public, permalink, authorized owner, and owner Identity routes with zero overflow, warnings, errors, page errors, or CSP violations; native anchors received non-prevented Enter events and navigated through their local destinations; all emitted modules, 219 stylesheet rules, and 13 same-origin font faces loaded. Automated coverage proves the exact CSP on configured, unconfigured, owner, canonical, draft/unknown/error, and D1-failure HTML, hostile-markup escaping, private-canary exclusion, exact JSON caching, and immutable generated asset headers; the combined branch passes all 174 tests. Residual uncertainty: hosted alignment remains only the separately approved TASK-061 checkpoint; no schema, migration, protocol, runtime setting, hosting binding, deployment, data, access, DNS, or custom-domain change occurred.

- **TASK-147 — Supersede the owner-label-only contrast correction before integration.** The rendered matrix found that the small `Advanced` navigation label was marginally below the text-contrast threshold, but the newly accepted TASK-150 removes the only provisional Hub destination and therefore the now-empty label itself. The isolated color-only candidate was deliberately not integrated because it would immediately become dead product code; TASK-137 now depends on the durable Hub-removal outcome instead. Validation: the revised flat graph has no unknown, cyclic, or redundant dependency and the unchanged product source passes every repository gate with 166/166 tests. Residual uncertainty: TASK-150 must remove the label and obsolete styles, and TASK-137 must rerun the final rendered matrix afterward; no runtime, schema, migration, protocol, configuration, hosting, data, access, DNS, or custom-domain change occurred.

- Fixed the hosted owner Hub test so a browser POST represented by an empty transport stream is accepted as bodyless, while any non-empty browser-supplied content remains rejected before a Hub credential can be used. Validation: the hosted failure was reproduced, a compiled-Worker regression covers the empty-stream transport shape, the hostile-destination/body and credential-confinement tests remain green, and Site version 3 returns the safe unconfigured-Hub status from the corrected owner control. Residual uncertainty: none for the bodyless hosted control.

- **TASK-146 — Give owner title and checkbox controls full touch targets.** Raised the complete clickable area of owner update-title links and the enclosing attribution-checkbox label after the exact wide-browser matrix measured 30.5-pixel and 24.797-pixel heights. The title links retain anywhere wrapping and the checkbox remains a native associated input with unchanged alignment and forced-color behavior. Validation: implementation commit `f377af9`; a maximum-length unbroken-title fixture covers every update action and pins the enclosing checkbox-label structure, focused coverage passes 12/12, related owner/accessibility coverage passes 47/47, and the integrated branch passes every repository gate with 166/166 tests. Residual uncertainty: TASK-137 must rerun wide and 320-pixel target rectangles on this corrected commit; no schema, migration, protocol, runtime setting, hosting, data, access, DNS, or custom-domain change occurred.

- **TASK-145 — Keep populated owner update rows inside narrow viewports.** Added the missing shrink boundary to owner update copy and an anywhere break opportunity to its title link after the actual 320-pixel browser matrix found a 460-pixel document width and an off-screen action on a 305-pixel content viewport. The existing action group already had bounded wrapping, so no component behavior or redundant layout rule changed. Validation: implementation commit `7a7ca2f`; a maximum-length unbroken published-title fixture exercises all four actions, focused assisted-runtime coverage passes 11/11, related accessibility/owner/public coverage passes 57/57, and the integrated branch passes every repository gate with 165/165 tests. Residual uncertainty: TASK-137 must rerun the exact 320-pixel browser geometry on this corrected commit; no schema, migration, protocol, runtime setting, hosting, data, access, DNS, or custom-domain change occurred.

- **TASK-144 — Give form controls sufficient boundary contrast.** Replaced the shared input, select, and textarea border color after the rendered-accessibility preflight found that its 2.164:1 contrast against white could not meet the 3:1 non-text boundary. The corrected shared color reaches 3.265:1 against the white control fill and 3.040:1 against the owner canvas while retaining the existing two-layer focus indicator, forced-colors override, native checkbox rendering, and responsive presentation. Validation: implementation commit `db30e66`; focused public-hierarchy coverage passes 4/4, combined accessibility coverage passes 39/39, and the integrated branch passes every repository gate with 164/164 tests. Residual uncertainty: TASK-137 still must confirm the computed colors and complete control geometry in an actual local browser; no schema, migration, protocol, runtime setting, hosting, data, access, DNS, or custom-domain change occurred.

- **TASK-136 — Complete the local presence-first public-contract and privacy matrix.** Added a six-row fresh/upgraded and configured/profile-absent/canonical-absent matrix that makes 90 requests through the compiled Worker and real persisted local D1. It pins public HTML, manifest, site, collection, detail, permalink, status, content type, cache, envelope, link, deterministic pagination/order, normalized canonical authority, hostile-host non-authority, and draft-versus-unknown behavior while scanning bodies, headers, links, and errors for owner, identity, credential, row, and draft canaries. Validation: implementation commit `399400e99119d5c28367f1f7f8806ba79f695a01`; focused matrix 7/7 and combined public-contract/metadata/upgrade coverage 34/34 pass; `npm run db:generate` reports no drift; independent review found no defect; and the integrated branch passes the full build and 163/163 tests. Residual uncertainty: this is local compiled-Worker/D1 evidence; hosted alignment remains the separately approved TASK-061 checkpoint, and no Site, hosted data, setting, access, DNS, or custom-domain operation occurred.

- **TASK-143 — Limit the active plan to the next immediately usable release.** Kept only the local functional, public-contract/privacy, and rendered-accessibility acceptance matrices plus their one separately approved presence-first Sites checkpoint in `PLAN.md`. Returned 34 still-blocked Hub registration, discovery, Follow/Unfollow, reader, and connected-release tasks to five high-level directions in `ROADMAP-004` through `ROADMAP-008`, preserving every former task ID as unfinished deferral provenance; advanced optional lifecycle and suggestion ideas remain in `BACKLOG.md`. Added the durable rule that the active queue represents one smallest useful increment rather than the whole understood product roadmap. Validation: the graph checker reports 4 active and 49 completed records with known direct dependencies and no cycles or redundant edges; all 34 removed IDs are represented exactly once in the roadmap; instruction-size, focused plan/prompt, diff, and full 156-test repository gates pass. Residual uncertainty: TASK-137 still requires actual local browser evidence and TASK-061 still requires separate owner approval before any Sites deployment; no runtime, schema, migration, protocol, hosting, data, setting, access, DNS, or custom-domain change was made.

- **TASK-059 — Prove an in-place POC upgrade preserves deployment-owned state.** Added a frozen historical POC fixture and a production-equivalent local proof that applies the reviewed migration prefix, opens the persisted state under the current compiled Worker, applies the candidate migration tail, and compares exact schema, indexes, rows, owner/non-owner/missing-owner mutation outcomes, public API envelopes, canonical metadata, draft privacy, and fresh/unavailable prompt behavior before, after, and from a closed local backup copy. The proof checks every persisted SQLite file plus source-to-package migration inventory and hashes, while the upgrade guide records that this disposable copy is neither atomic nor a hosted backup or rollback mechanism. Validation: implementation commit `6439017db4b09572021ac8f3eef76d512ac5f7ca`; `npm run db:generate` reports no schema drift; independent acceptance found no gap; and the exact commit passes the full repository gate with 156/156 tests. Residual uncertainty: the candidate tail is intentionally empty because the deployed POC and current source share the same reviewed migration; no hosted D1 migration, provider backup, Sites deployment, production data, protected setting, access, DNS, or custom-domain operation was performed.

- **TASK-142 — Focus the active plan on the minimum meaningful product.** Kept the independently deployable presence, safe initial Hub registration and disconnect, verified discovery, explicit one-way Follow and Unfollow, private followed-update reader, decisive local acceptance, the presence-first Sites checkpoint, and four core network checkpoints in the active graph. Moved 52 advanced lifecycle, relationship-visibility, suggestion, and nonessential hosted-proof tasks into `BACKLOG-004` through `BACKLOG-016`, preserving every former task ID as unfinished deferral provenance and narrowing the connected acceptance and release gates to the retained social path. Synchronized repository scope language without claiming unfinished network capability. Validation: the graph checker reports 39 active and 47 completed records with known direct dependencies, no cycles or redundant edges; focused plan and README contract tests, instruction-size and diff checks, and the full 155-test repository gate pass. Residual uncertainty: the retained network tasks remain blocked on exact accepted Hub artifacts and compatible review services; no runtime, schema, migration, protocol, hosting, data, setting, access, DNS, or custom-domain change was made.

- **TASK-035 — Adopt presence-oriented language and a truthful local-owner entry.** Replaced human-facing account/profile/entry wording with presence, Identity, and updates across public and sole-owner surfaces; both public authentication states now lead through a native “Manage presence as owner” link whose accessible name begins with the visible label and identifies local sole-owner administration; owner-visible validation, not-found, and Hub status copy follows the same terms; and the manual challenge/root bearer path is unmistakably a provisional diagnostic rather than network authentication or a verified Hub connection. Preserved dispatcher-owned authentication, every server-side owner check, internal models and routes, protocol 1.0 field/resource names, and the current D1 schema and migration. Validation: focused authorization, privacy, rendering, private-error, and credential-confinement coverage passes within 85/85 tests; typecheck, lint, agent-size, build, migration, plan, and full repository checks pass; local wide and 320-pixel browser review found no horizontal overflow or console errors, the longer Hub label wraps coherently, native owner navigation works, and focused controls retain a visible 3-pixel outline and at least a 44-pixel target. Residual uncertainty: the public Site retains the previously deployed copy until the complete presence-first milestone receives separate owner-approved deployment under TASK-040; category-neutral setup and presence-derived metadata remain explicitly scoped to TASK-036 and TASK-037.
- **TASK-036 — Make ordinary identity setup category-neutral without breaking protocol 1.0.** Removed the owner category selector and public category label; new profiles receive the server-owned compatibility value `other`, private writes ignore caller-supplied `accountType`, and updates preserve any supported legacy stored value. Kept the required protocol 1.0 manifest and `/api/v1/site` projections on exact public allowlists without using the field for presentation, authorization, capability, or trust. Validation: migration generation reports no schema change; full repository validation passes with 92 tests covering neutral HTML, new and legacy persistence, exact JSON projections, owner/non-owner/missing-owner behavior, validation, canonical links, and privacy; local wide and 320-pixel browser review confirms no category control, no horizontal overflow, a 44-pixel save control, a 3-pixel focus outline, and no console errors. Residual uncertainty: the public Site retains the previous version until the complete presence-first milestone receives separate owner-approved deployment under TASK-040; presence-derived metadata remains under TASK-037.
- **TASK-037 — Make metadata and checked-in identity assets represent the presence.** Moved configured metadata to the public presence and published-permalink routes, projected only bounded public fields, derived canonical and sharing URLs only from normalized configuration, and kept owner, draft, unknown, invalid, and unconfigured states neutral and non-indexable. Adopted a truthful text-only default by deleting the generic one-megabyte software preview and unused runtime image optimizer, while documenting direct checked-in source customization without uploads, R2, or an asset resolver. Handler-produced HTML is `no-store, must-revalidate`; existing JSON/static caching and protocol 1.0 are unchanged. Validation: hostile-host, escaping, owner/credential/row/draft canary, article/non-article, orphan, cache, and source/package asset tests pass within 99/99; migration generation reports no schema change; build, type, lint, instruction, plan, runtime, migration, and full repository gates pass; local browser review confirms canonical text-only public metadata, neutral owner/unavailable metadata, no overflow, and no console errors. Residual uncertainty: the public Site retains the previous metadata until the complete presence-first milestone receives separate owner-approved deployment under TASK-040; any future identity image remains an owner-approved direct source customization with accurate alternative text.
- **TASK-056 — Put the plain-language deployment prompt first on GitHub.** Moved one 110-word `@Sites` prompt directly below the README title and removed the duplicate trailing prompt. It tells ChatGPT to reuse exactly one matching Site without duplication, stop on ambiguity, keep setup private, create private deployment-owned storage, configure one owner through protected Site settings without putting an email in the prompt or source, keep Hub optional, support signed-in runtime customization without a repository fork, and ask separately before source/deployment, public-access, or custom-domain changes. The detailed technical guidance remains below, and the README explicitly avoids promising automatic repository creation or synchronization. Validation: four focused documentation-contract tests pin every safety boundary, word limit, placement, sole occurrence, nontechnical wording, identity/secret exclusion, and no-fork claim; full validation passes with 103/103 tests and no runtime, schema, migration, protocol, hosting, or deployment change. Residual uncertainty: the equivalent unconfigured Site experience remains under TASK-057, and the GitHub default branch receives this README only through the owner-reviewed pull-request process.
- **TASK-038 — Establish an accessible strong public hierarchy and secondary technical context.** Ordered the public page as Identity, featured information, and recent updates; moved manifest and JSON resources into a labeled secondary footer; retained the intentional empty state and hideable attribution; and added focused wrapping, narrow-layout, target-size, focus, forced-colors, and reduced-motion corrections without changing the existing profile, update, D1, or protocol 1.0 models. Validation: route fixtures cover empty and populated states, all four update kinds, long and translated public values, draft/private canaries, semantic order, native destinations, Hub failure, and technical-link placement; numeric assertions prove the two focus layers at 14.59:1 and 16.61:1 contrast; full validation passes with 106/106 tests. Rendered local review at 1280 and 320 CSS pixels—including the effective layout width of a 1280-pixel viewport enlarged to 400 percent—found no horizontal overflow or off-screen content, all 17 public targets at least 44 pixels high, a visible keyboard focus treatment, reduced motion with no active animation, and no console warnings or errors; a temporary genuinely long Identity/hostname/text fixture was restored afterward. Residual uncertainty: the public Site retains its earlier hierarchy until the separately approved TASK-061 checkpoint.
- **TASK-039 — Guide the owner through completing Identity and previewing the presence.** Added server-derived fresh, incomplete, and complete Identity readiness from the authorized deployment-owned profile and normalized effective canonical URL; a transient four-field form preview that never masquerades as durable progress; one completed-state public-preview action; safe runtime-override versus stored-fallback explanation; and a separate Advanced label for provisional Hub setup. Public Identity is never derived from ChatGPT identity, request hosts, drafts, Hub state, or raw runtime values. Validation: focused production-render and mutation fixtures cover both fresh progress variants, degraded and complete state, canonical precedence and redaction, owner/non-owner/missing-owner boundaries, invalid-write non-mutation, D1 save/reload, Hub outage, private canaries, semantics, focus, motion, and narrow styling; full validation passes with 120/120 tests and migration generation reports no schema change. Local browser review confirms the complete dashboard and form at wide and 320-pixel layouts, no horizontal overflow or off-screen controls, every visible owner control at least 44 pixels high after a focused topbar correction, one primary preview action, normalized effective URL copy, transient preview updates, reload discarding unsaved text, restored local fixture values, and no console warnings or errors. Residual uncertainty: first-update guidance remains under TASK-055, the unconfigured public prompt under TASK-057, supervised ChatGPT operation under TASK-093, and hosted alignment under the separately approved TASK-061 checkpoint.
- **TASK-055 — Guide the owner through the first update and resumable completion.** Extended complete Identity into a server-derived empty, draft, or published first-update journey using the existing entry lifecycle and no onboarding record or browser state. The dashboard presents exactly one primary next action, preserves ordinary update management, and uses bounded prepared queries ordered by creation time and stable identifier so an early draft or publication remains truthful beyond the 200-row management list. Validation: lifecycle fixtures prove creation, interruption, stable resume, publication, public preview, unpublication, draft-indistinguishable privacy, creation-time ties, beyond-cap records, sole-owner access, non-owner and missing-owner denial, Hub isolation, exact action counts, native semantics, and existing responsive controls; full repository validation passes with 131/131 tests and migration generation reports no schema change. Residual uncertainty: supervised foreground ChatGPT operation and explicit pre-publication confirmation remain under TASK-093; hosted alignment remains under the separately approved TASK-061 checkpoint.
- **TASK-057 — Lead the unconfigured template with the plain-language deployment prompt.** Added one exact README-backed prompt as the first useful public setup experience only when no Identity exists, with a native read-only selection surface, a truthful sole-owner setup path, published-only updates, and a distinct safe unavailable state when D1 cannot be read. Configured deployments retain their represented Identity-first presentation and contain no setup prompt; Hub is never consulted. Validation: exact README/JSON/runtime equality, configured and unconfigured rendering, signed-out/owner/non-owner/missing-owner paths, D1 failure, native navigation, private canaries, published-only output, Hub isolation, responsive source contracts, and prompt placement pass within the full 140-test repository gate; migration generation reports no schema change. Rendered local review at 1280 and 320 CSS pixels—the reflow-equivalent width for a 1280-pixel viewport at 400 percent—found no horizontal overflow, all visible links and the prompt at least 44 pixels high, full keyboard selection of the 698-character read-only prompt, a visible high-contrast focus treatment, coarse-pointer touch mode, coherent wrapping, and no console exceptions or warnings. Residual uncertainty: supervised ChatGPT use of the owner controls remains under TASK-093; the configured public Site receives this experience only through the separately approved TASK-061 checkpoint.
- **TASK-093 — Prove fork-free ChatGPT-assisted runtime customization.** Kept the signed-in sole-owner browser as the only authority while making Identity, links, constrained presentation and update controls explicit and recoverable for supervised ChatGPT operation. Forms and update actions now retain state, clear busy indicators, distinguish definitive client rejection from an unconfirmed network or server result, and direct the owner to reload durable state before retrying; effective runtime canonical configuration is explained separately from the editable D1 fallback. Every update action has a collision-free accessible name, and publication requires an update-specific native confirmation without weakening any server check. Validation: the full 150-test repository gate covers owner/non-owner/missing-owner, CSRF, validation, 4xx/5xx/fetch outcomes, same-suffix identifiers, draft privacy, private canaries, canonical precedence, persistence and exact no-schema/no-protocol boundaries; migration generation reports no schema change. A disposable production-equivalent D1 browser journey saved and reloaded Identity, links, accent, compact density and hidden attribution; created and edited one stable draft; dismissed publication with no public disclosure; explicitly accepted publication and verified its permalink and public API; unpublishing restored draft-indistinguishable 404 behavior; signed-out rendering exposed only the published projection and redirected owner access to ChatGPT sign-in; an interrupted save retained input, re-enabled controls and showed native recovery; 1280- and actual 320-pixel touch layouts had no overflow, off-screen controls or sub-44-pixel actions, keyboard focus and reduced motion remained visible, console checks were clean, and Git bookends were unchanged. The disposable update was unpublished and deleted afterward; no hosted content, settings, deployment, access, DNS or custom domain changed. Residual uncertainty: clean-source reproducibility remains under TASK-040, and hosted alignment remains under the separately approved TASK-061 checkpoint.
- **TASK-094 — Enforce incremental plan granularity and direct dependencies.** Audited the accepted active graph before further implementation; preserved every stable task ID while narrowing independently blockable contracts, lifecycle operations, relationship controls, reader stages, suggestion controls, local matrices, and hosted proofs into vertical slices with new monotonically increasing IDs; removed transitive edges and recorded exact direct prerequisites. Replaced the durable planning rules with an explicit pre-delegation granularity audit, focused-commit and binary-DoD requirements, parallel worktree boundaries, and integration-owner tracker serialization. Validation: the plan checker exposes a tested graph validator and rejects malformed tasks, duplicate active or archived IDs, duplicate active titles, unstable active ordering, unknown, self, repeated, cyclic, and redundant transitive dependencies; three focused graph test groups and the full 153-test repository validation pass; the instruction budget and diff checks pass. Residual uncertainty: a later semantic audit found compound hosted relationship and suggestion proofs plus imprecise evidence wording; TASK-141 corrected those definitions and extended duplicate-archive coverage without changing runtime scope.
- **TASK-040 — Prove a clean bare-repository presence-first build is reproducible.** Added a deterministic clean-source verifier, focused negative fixtures, exact source and dependency provenance, fresh-D1 migration and schema inspection, migration hash checks, inert source/archive inventories, and protected-value scans across generated output. The verifier refuses active hosting identity, untracked environment files, stale generated state, non-bare or mismatched source provenance, force-tracked intermediate output, active project identifiers, and source or migration drift. Validation: candidate `d92add7b2597ebd43cc44deeefe8e8244b30fc55` was independently reproduced from a new local bare clone with only the tracked `.env.example`; `npm ci` installed 471 packages, the registry-backed production audit found zero vulnerabilities, all 152 candidate tests and a separate production build passed, a fresh D1 applied the reviewed migration with the expected tables, indexes and zero rows, generation produced no drift, and protected canaries were absent from `dist`, `.next`, `.vinext`, `.wrangler`, source and inert archives. The exact audited commit was integrated as `06ca2e1`; the combined feature source passes all 155 tests and every repository gate. No active binding was read or packaged and no Site, hosted D1, setting, access policy, DNS or custom domain changed. Residual uncertainty: the full development dependency audit reports 20 advisories outside the zero-advisory production tree; in-place upgrade proof remains TASK-059 and any exact Sites checkpoint remains separately approved TASK-061.
- **TASK-141 — Correct the planning granularity audit gaps.** Split hosted Follow/Unfollow from independently approved relationship-visibility mutation, and split read-only suggestion inspection from opt-out and suggestion-to-Follow mutations; removed an acting-session assertion from the public-directory proof that had no supporting dependency; made every release and acceptance matrix remain open on a failed named assertion; and corrected TASK-094's evidence language. Validation: the checker now has an explicit duplicate-completed-ID regression; its three focused graph test groups, the plan and instruction checks, and the full 155-test repository gate pass; `PLAN.md` is acyclic with 91 active tasks and 46 completed records and has no redundant dependency; diff checks pass. Residual uncertainty: Hub-contract and hosted-proof tasks retain their exact external prerequisites and separate owner approvals, while independent presence-first work remains unblocked.
- **TASK-001 — Established the AittaSocial product and repository contract.** Replaced starter README content with the one-deployment/one-account scope, protected setting keys, deliberate POC exclusions, repository guide, and reusable private-first `@Sites` prompt; added authoritative root `AGENTS.md`. Validation: reviewed every user-specified invariant against README/AGENTS, searched documentation for prohibited named-product comparisons, and `npm run agents:check` passes below the 32,000-byte limit. Residual uncertainty: implementation conformance remains under TASK-009 through TASK-024.
- **TASK-002 — Specified public protocol 1.0.** Documented the exact camelCase manifest, site and entry projections, nested links, public envelopes, optional-field omission, deterministic pagination, safe errors, privacy exclusions, and provisional private Hub probe in `docs/protocol.md`. Validation: cross-checked names and values against `lib/constants.ts`, public serializers, route paths, and the accepted account contract; all six fenced JSON examples parse. Residual uncertainty: route behavior and byte-for-field examples remain to be proven by TASK-018 through TASK-021 tests.
- **TASK-003 — Documented security and trust boundaries.** Defined dispatcher/account/D1/runtime/Hub/browser trust, sole-owner authorization, exact per-mutation controls, public projection allowlists, Hub credential confinement, safe failures, Worker constraints, and negative-test requirements in `docs/security.md`. Validation: mapped every requested security test category and protected setting to a named boundary and fail-closed behavior. Residual uncertainty: code-level CSRF/body limits, migration-only schema behavior, and Hub/log confinement remain to be verified under TASK-010, TASK-014, and TASK-022.
- **TASK-004 — Documented privacy and data handling.** Recorded D1 data, ephemeral authenticated identity, protected settings, public/private fields, optional Hub flow, retention/control semantics, logs, and deliberately absent data systems in `docs/privacy.md`. Validation: public allowlists were compared with the protocol projections and seeded-private-canary assertions were specified. Residual uncertainty: provider-level retention and the final hosted access policy require owner/platform confirmation outside application code.
- **TASK-005 — Documented reproducible local development.** Added clean install/start commands, ignored `.env.local` fixtures, production-equivalent identity cases, migration review, focused verification, preview states, and fake Hub testing in `docs/local-development.md`. Validation: commands match repository scripts and Cloudflare Vite behavior was confirmed to load `.env.local` when no `.dev.vars*` file exists. Residual uncertainty: clean-install and full-suite success remain part of TASK-024.
- **TASK-006 — Documented guarded ChatGPT Sites deployment.** Added unique existing-Site resolution, repository-source maintenance, checkout-local active binding, inert committed example, private D1 setup, protected settings, initial profile, ten-step optional Hub verification, preview review, private checkpoint, and explicit public/custom-domain gates in `docs/deployment.md`. Validation: reconciled the sequence with Sites build/hosting guidance and the accepted provisional Hub request contract. Residual uncertainty: the existing Site match, D1 provisioning, private URL, and deployment status are intentionally pending TASK-025 through TASK-027.
- **TASK-007 — Established planning, backlog, changelog, and license-decision records.** Created stable-ID current work tracking, a promotion-gated unscheduled network backlog, this evidence-bearing changelog, and a non-granting `LICENSE` placeholder without invented FSL terms. Validation: `npm run plan:check` passes with unique known IDs, valid direct dependencies, no cycles, and no task duplicated between PLAN and CHANGELOG; all relative Markdown links resolve; BACKLOG contains no partial implementation or current capability claim. Residual uncertainty: the owner must still supply exact FSL variant, parameters, and change license in TASK-008.
- **TASK-008 — Finalize the project license.** Replaced the non-granting placeholder with the exact owner-selected `FSL-1.1-MIT` text and notice used by the AittaDB repository, identified it without paraphrase in README/AGENTS, and added an exact-content repository check. Validation: the local `LICENSE` is byte-for-byte identical to the owner-selected source, `npm run license:check` verifies its SHA-256 and README identifier, and the full repository validation passes. Residual uncertainty: none for the selected terms; any future license change requires another explicit owner decision.
- **TASK-009 — Replaced the disposable starter shell.** Added the AittaSocial route shell, metadata, public and owner navigation, and safe setup states; removed starter preview files and unused dependencies. Validation: the production build lists only product routes, starter-absence tests pass, and strict TypeScript is clean. Residual uncertainty: none in the implemented POC shell.
- **TASK-010 — Established deployment-owned D1 through reviewed migrations.** Added the singleton profile and flexible entry schema, prepared D1 queries, useful indexes, inert checked-in binding example, and migration-only schema changes with no R2. Validation: the generated SQL was inspected, applied to local D1, journaled, and packaged byte-for-byte; migration and runtime-boundary checks pass. Residual uncertainty: hosted D1 application is verified with the private checkpoint tasks.
- **TASK-011 — Normalized canonical and public URLs.** Added bounded canonical HTTPS and public HTTP(S) parsers without a request-host canonical fallback. Validation: credential, scheme, query, fragment, trailing-separator, and hostile-input tests pass. Residual uncertainty: none for the documented 1.0 rules.
- **TASK-012 — Delivered the one-profile vertical slice.** Added explicit singleton profile reads/writes, constrained presentation settings, external links, public projection, and safe missing-profile behavior. Validation: sole-owner, normalization, validation, serialization, and private-canary tests pass. Residual uncertainty: the hosted initial profile remains under TASK-025.
- **TASK-013 — Delivered the public account homepage.** Added populated and intentional empty account presentations driven by the public profile and published entries, with hideable attribution. Validation: signed-out and published-only tests pass; wide and 375-pixel browser review found no overflow or private data. Residual uncertainty: hosted signed-out review remains under TASK-026.
- **TASK-014 — Enforced the sole-owner boundary.** Added server-side normalized ChatGPT-email matching, missing/invalid-owner fail-closed behavior, same-origin checks, bounded bodies, and a development-only identity fixture boundary. Validation: all six private mutation routes reject signed-out, non-owner, cross-origin, malformed, and oversized requests before D1 writes. Residual uncertainty: real Sites identity is exercised in TASK-025.
- **TASK-015 — Delivered owner navigation and dashboard.** Added guarded overview, entry counts and states, safe configuration guidance, navigation, and sign-out. Validation: owner/denied/signed-out rendering and semantic, keyboard, touch, wide, and narrow checks pass without exposing identity values. Residual uncertainty: hosted owner review remains under TASK-026.
- **TASK-016 — Delivered entry authoring and lifecycle.** Added draft creation/editing, publish, unpublish, delete, stable identifiers, and timestamp handling through prepared queries. Validation: the full authorized lifecycle and independent authorization/validation failures pass in the compiled Worker harness. Residual uncertainty: the focused harness uses a product-specific fake D1 in addition to local migration testing.
- **TASK-017 — Delivered public entry permalinks.** Added published-only HTML permalinks for every kind, safe external destinations, and draft-indistinguishable not-found behavior. Validation: published/draft/unknown tests and manual wide/narrow review pass; untitled entries use the neutral kind heading. Residual uncertainty: none in the local preview.
- **TASK-018 — Delivered discovery protocol 1.0.** Added the well-known manifest from an explicit field allowlist and conditional Hub challenge. Validation: exact schema, content type, configured/unconfigured challenge, and private-canary exclusion tests pass. Residual uncertainty: Hub verification remains optional and no Hub contract is assumed.
- **TASK-019 — Delivered `GET /api/v1/site`.** Added the documented public profile envelope and canonical links. Validation: signed-out, missing-profile, canonical, optional-field, status, content-type, and privacy tests pass. Residual uncertainty: framework-generated unsupported-method output is intentionally outside the application JSON contract.
- **TASK-020 — Delivered `GET /api/v1/entries`.** Added published-only deterministic pagination ordered by publication time and stable identifier, with resource and navigation links. Validation: defaults, bounds, malformed pages, ties, drafts, counts, beyond-end pages, and canonical links pass. Residual uncertainty: none for the documented POC limits.
- **TASK-021 — Delivered `GET /api/v1/entries/{id}`.** Added the documented single public-entry envelope with draft-indistinguishable safe errors. Validation: published, draft, unknown, malformed, omission, content-type, canonical-link, and canary tests pass. Residual uncertainty: none for protocol 1.0.
- **TASK-022 — Delivered optional Hub setup and confinement.** Added the owner setup sequence and bodyless server-side probe pinned to the configured HTTPS origin with manual redirects, timeout, unread body, and four safe statuses. Validation: origin, credential, body/destination rejection, redirect, timeout, safe-error, and public-availability tests pass. Residual uncertainty: a real Hub endpoint is deliberately not assumed or contacted.
- **TASK-023 — Completed the accessible restrained presentation.** Added responsive public and owner surfaces with semantic landmarks, visible focus, 44-pixel controls, reduced-motion support, coherent colors, no gradients, and useful empty states. Validation: automated semantic/CSS checks and manual wide/narrow review covered populated account, permalink, dashboard, profile, editor, and Hub pages with no console warnings or horizontal overflow. Residual uncertainty: automated axe testing is not part of the current harness.
- **TASK-024 — Completed repository validation.** Added instruction, plan, instance, runtime, migration, type, lint, build, and test gates and inspected packaged artifacts. Validation: `npm run validate` passes with 76 tests; the reviewed and packaged migration hashes match; client scans find no synthetic owner, draft canary, protected setting, runtime DDL, or starter content. Residual uncertainty: real ChatGPT identity, hosted D1, and final deployment are covered by TASK-025 through TASK-027.
- **TASK-025 — Reuse and configure the existing Site.** Reused the single matching AittaSocial/`aittasocial` Site without creating a duplicate, retained the ignored active binding and repository source, kept deployment-owned D1 with null R2, configured the protected owner/canonical keys, and saved the initial project profile. Validation: separate signed-in Chrome profiles prove owner access and non-owner denial, anonymous requests prove public access, hosted profile and entry writes prove D1 persistence, and `docs/checkpoint.md` records only identity-free evidence. Residual uncertainty: pull-request readiness remains under TASK-028 and the corrected final checkpoint remains under TASK-027; no custom domain is connected.
- **TASK-026 — Inspect the Sites agent preview.** Exercised public empty and populated states, note and article publication, draft-indistinguishable permalinks, missing-owner and non-owner denial, dashboard, profile, editor lifecycle, optional Hub states, and wide/narrow layouts; corrected the empty-request-stream Hub defect found during hosted review. Validation: hosted identity-free evidence is recorded in `docs/checkpoint.md`, a compiled-Worker regression exercises the shared public model for Note, Article, Link, and Announcement, and full validation passes with 78 tests without another access-policy or custom-domain change. Residual uncertainty: the corrected Hub control awaits the exact post-merge hosted deployment under TASK-027.
- **TASK-027 — Verify post-merge prompt deployment and checkpoint.** Started from the exact rebase-merged `main` commit, validated a clean checkout of the bare repository URL, packaged its reviewed migration and checkout-local binding, and deployed that provenance-bound source as Site version 3. Validation: clean `npm ci`, migration generation with no schema diff, and full validation pass with 78 tests; the packaged and reviewed migration hashes match; Sites reported a successful deployment; the corrected owner Hub control returns the safe setup status; anonymous HTML, discovery, and `/api/v1` checks expose the published note while the draft permalink returns 404 and public JSON contains no private fields; a signed-out owner request redirects to the dispatcher-owned sign-in route and an unauthenticated private probe returns 401. The owner-approved link-public access remained unchanged, exactly one allowed owner remained configured, no groups or external visitors were added, and no custom domain is connected. Residual uncertainty: optional Hub registration remains unconfigured by design; it is not required for public account operation.
- **TASK-028 — Prepare the prompt-deployable pull request.** Kept the reusable README prompt short and self-contained and assembled the complete application, exact owner-selected license, focused tests, and private-first deployment guidance on the feature branch. Validation: full validation passes with 78 tests at the pushed branch head and draft pull request [#1](https://github.com/aittadb/aitta-social/pull/1) targets `main` for owner review and rebase merge; no agent updated or merged `main`. Residual uncertainty: owner review and merge remain external, after which bare-repository and provenance-bound deployment proof continues under TASK-027 from a fresh branch.
- **TASK-029 — Link the public footer to official AittaSocial resources.** Added restrained links from the optional public attribution to the official AittaSocial website and maintained GitHub repository while preserving the owner's single hide-attribution control. Validation: compiled-route tests verify both exact links when enabled and the absence of the label and both destinations when hidden; the owner copy, privacy description, README, and durable instructions are synchronized; full repository validation passes with 79 tests. Residual uncertainty: the live Site will receive the links only after this owner-reviewed pull request is rebase-merged and the resulting `main` source is deployed.
- **TASK-030 — Establish the AittaSocial product roadmap.** Added a flat stable-ID `ROADMAP.md` for high-level product direction, with the completed account POC kept in CHANGELOG and concrete unscheduled network slices kept in BACKLOG. Validation: the repository roles follow the sibling Aitta convention, README and AGENTS link and define the roadmap, the instruction budget remains valid, and full repository validation passes. Residual uncertainty: roadmap entries are intentionally neither release commitments nor authority to implement.
- **TASK-031 — Clarify public sign-in navigation.** Replaced the public “Owner access” label with visitor-appropriate navigation copy while retaining dispatch-owned Sign in with ChatGPT and the independent server-side sole-owner decision. Validation: compiled-route tests prove signed-out visitors receive the exact Sign in destination, signed-in visitors receive the Dashboard destination without an authorization claim, the old label is absent, and full repository validation passes with 80 tests. Residual uncertainty: the live Site receives this copy only after the owner rebase-merges the review branch and the resulting `main` source is deployed.
- **TASK-032 — Adopt the owner-approved personal hostname.** Activated `https://jhh.aitta.social` as the hosted account's canonical origin and synchronized the protected runtime setting and stored profile without changing public access, owner authorization, D1 content ownership, or Hub configuration. Validation: the attached hostname reports active TLS and serves the personal account; the current merged Site version was redeployed successfully; site, entries, entry-resource, and discovery links use the custom origin; checkpoint documentation records the new state; exactly one custom hostname remains attached. Residual uncertainty: none for the canonical-host transition; the Sites-provided URL remains an operational fallback.
- **TASK-033 — Restore reliable native navigation on Sites.** Removed the client-intercepted framework link path that threw in the hosted Vinext runtime, adopted ordinary accessible links across the small server-rendered public, permalink, not-found, and owner surfaces, and preserved dispatcher-owned authentication plus independent server-side owner authorization. Validation: hosted Sign in, Dashboard, and entry clicks reproduced the Link prefetch/click exception and stalled navigation; the corrected local Dashboard click completed as a full-document request with no console warnings or errors; a documented source boundary prevents `next/link` from returning; the failing Link chunk is absent from the production build; full repository validation passes with 81 tests. Residual uncertainty: the live Site remains affected until the owner rebase-merges the repair pull request and the resulting `main` source is deployed.
- **TASK-034 — Deploy and verify the merged navigation repair.** Started from the exact owner-rebase-merged `main` source, synchronized and packaged that commit, deployed it to the existing public Site, and retained the established owner, D1, Hub, access, and custom-hostname configuration. Validation: Sites reported successful deployment; fresh hosted Dashboard and entry clicks completed through document navigation with no console warnings or errors; anonymous HTML exposed the exact Sign in link and its dispatcher route returned a redirect; public API and discovery links remained canonical and an unauthenticated private probe returned 401; full repository validation passes with 81 tests. Residual uncertainty: none for the reported navigation defect; optional Hub registration remains unconfigured by design.
