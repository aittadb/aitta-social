# Hosted test checkpoint evidence

This record contains safe evidence for the owner-approved presence at
`https://jhh.aitta.social`. The Sites-provided checkpoint URL is
`https://aittasocial.jaakko-heusala.chatgpt.site`. It contains no protected
setting values, authenticated email addresses, credentials, database IDs, Site
project IDs, deployment IDs, source-repository credentials, or private update
text. The owner-approved personal hostname is the only connected custom domain.

## Presence-first checkpoint — 2026-08-11

### Source, deployment, and preserved state

- The one existing Site was reused. Sites saved and successfully deployed
  version 7 from exact validated and pushed `develop` commit
  `a14fb61bd43c372d12fed02365020f4cc77c6b57`; the saved version and final
  deployment status both report that exact source. The later evidence/tracker
  commit is not the deployed source, and `main` was not merged or updated.
- The Sites checkpoint URL and the existing custom hostname both return the
  same current module and stylesheet paths. Requests through either hostname
  retain `https://jhh.aitta.social` as the configured canonical authority.
- Public access stayed public at access-policy revision 4. The same one allowed
  owner remains configured, with no group or external-visitor grant. The
  protected-environment revision stayed 5 and its value-safe comparison was
  unchanged; only the existing owner and canonical keys are present. No
  protected value is reproduced here.
- The sole custom hostname remained active with active provider and TLS status.
  The checkout-local binding still names deployment-owned D1 as `DB` and leaves
  R2 null. No access, environment, D1, DNS, domain, or binding mutation tool was
  called.
- Read-only public and owner observations found no semantic content change, and
  the public collection still contains only its published projection. No
  private update existence, count, state, identifier, or text is recorded here,
  and no hosted form was submitted. This proves provider-visible configuration
  and bounded semantic preservation, not a byte-level D1 or DNS-zone checksum.

### Public contract, metadata, and Hub independence

- Both checkpoint and canonical roots return `200` configured HTML with
  `no-store, must-revalidate`; the deployment/setup prompt is absent. The
  bounded title, description, canonical link, and Open Graph URL use the
  configured public Identity and canonical origin rather than either request
  host.
- The discovery manifest, `/api/v1/site`, `/api/v1/entries`, selected detail
  API, and published permalink return their documented status, content type,
  cache, envelopes, and canonical resource links. Protocol `aitta-social` 1.0
  remains unchanged, the collection reports one published update, and the
  optional Hub verification challenge is absent because it is not configured.
  JSON responses have no HTML CSP.
- A signed-out `/owner` request returns a dispatcher-owned `307` redirect to
  `/signin-with-chatgpt?return_to=%2Fowner` without identity data. A separate
  signed-in non-owner profile receives the safe denial with no form, stored
  value, owner navigation, or administration control. The signed-in owner
  dashboard, Identity form, and an existing editor all load read-only with the
  expected local state.
- `/owner/hub` and `/api/private/hub/test` now return generic non-redirecting
  `404` HTML without credential wording. Public HTML, manifest, and APIs remain
  available with no Hub configuration, and recent production error logs are
  empty. Exact-source local TASK-060/TASK-150 evidence separately proves the
  retired implementation cannot make an outbound Hub request or leak an old
  credential through code, bundles, responses, redirects, or logs.
- Hosted root, permalink, and retired-route HTML carries the fixed policy; the
  exact-source automated matrix separately covers owner and denial HTML:

  `default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; block-all-mixed-content`

  Current scripts and styles are same-origin, return `200`, and the checkpoint
  and canonical hosts expose the same asset paths.

### Hosted interaction and accessibility smoke proof

- Chrome exercised native Enter navigation from the public update link to its
  permalink and from the native return link back to the presence. It also used
  native Enter for owner dashboard-to-Identity navigation and Tab from Display
  name to Short description without changing a value.
- At `1280×900` and an actual `320×900` viewport, the configured public root and
  owner dashboard retain one main landmark, one h1, named navigation/regions,
  ordered headings, no unnamed control, no off-screen control, no horizontal
  overflow, and effective targets at least 44 by 44 CSS pixels. Text contrast
  passes; the 320-pixel Identity form additionally has no control-boundary or
  target failure.
- A separate physical-1280/DPR-4 run produced the 320-CSS-pixel
  400-percent-reflow-equivalent Identity layout with the same passing geometry.
  This is recorded as reflow equivalence, not as literal browser page-zoom
  control.
- Coarse-pointer touch emulation reported coarse and any-coarse pointers with
  no hover, no overflow, and the same effective target contract. Reduced-motion
  emulation removed nonzero animation and transition durations. Forced-colors
  mode retained a visible three-pixel system-colored focus outline with
  `forced-color-adjust: auto`. Every temporary browser override was reset.
- Fresh public, owner, and non-owner app tabs completed with zero console
  warnings or errors. Every inspected document reached the complete ready
  state; current modules loaded from the configured origin, fonts reported
  loaded, and no CSP failure appeared in the observed console evidence.

### Validation and residual boundary

- Before packaging, `npm run validate` passed all repository gates with 188/188
  tests, `npm run db:generate` reported no schema change, and
  `npm audit --omit=dev` reported zero production vulnerabilities. The exact
  source ref, archive, saved version, and successful deployment all identify
  `a14fb61bd43c372d12fed02365020f4cc77c6b57`.
- Provider-visible pre/post checks preserve access mode and revision, owner
  grant count, protected-environment revision and value-safe fingerprint, and
  the active custom-domain status. The source has no new schema, migration,
  protocol, runtime configuration, or R2 behavior.
- Residual uncertainty is deliberately narrow: Sites does not expose an
  authoritative byte checksum for hosted D1 rows or the DNS zone, and the
  available browser controllers prove 400-percent reflow equivalence rather
  than literal page-zoom UI. No mutation call was used to compensate for either
  limitation. Promotion from `develop` to `main` remains a later owner-reviewed
  pull request.

## Historical checkpoint — Site version 6 (`main` 3d028321)

The evidence below records the earlier source and behavior as it was observed.
Its provisional Hub-control statements are historical and are not claims about
the version 7 product.

### Site and storage

- Exactly one existing Site matched the AittaSocial name, `aittasocial` slug,
  repository, and checkout-local binding. It was reused; no duplicate was
  created.
- The active binding remains ignored and checkout-local. The committed example
  is inert, declares only the deployment-owned `DB` binding, and leaves R2 null.
- The reviewed D1 migration is packaged with the Site. A saved profile and
  entry lifecycle persisted across separate hosted requests.
- The active custom hostname, protected canonical setting, and stored profile
  canonical URL all use `https://jhh.aitta.social`.

### Access and public privacy proof

- The owner explicitly approved link-public access for this test Site. An
  anonymous request reaches the account without Sign in with ChatGPT.
- Two separate signed-in Chrome profiles were exercised. One reached the owner
  dashboard; the other received the safe non-owner denial and no administration
  controls. Their identities are intentionally not recorded here.
- The initial project profile was saved through the owner surface. The public
  account rendered the configured allowlisted profile fields and an intentional
  no-entry state.
- A draft returned the same public 404 presentation as an unknown entry. After
  publication it appeared on the account, its permalink, and the JSON API;
  unpublishing removed it from public access, and republishing restored it.
- Anonymous JSON checks returned the versioned site and entries projections and
  the discovery manifest. They contained neither owner identity nor draft state.
- The public and owner surfaces each rendered one `main` and one `h1` without
  horizontal overflow at a 375-pixel viewport. The temporary viewport overrides
  were reset after review.

### Validation and deployed source proof

- Pull requests [#1](https://github.com/aittadb/aitta-social/pull/1),
  [#2](https://github.com/aittadb/aitta-social/pull/2), and
  [#3](https://github.com/aittadb/aitta-social/pull/3), and
  [#4](https://github.com/aittadb/aitta-social/pull/4) were owner-reviewed and
  rebase-merged. The deployed source is the resulting `main` commit
  `3d028321f26cda7ce1e4cdbffc64406bb52e4ff5`.
- The exact default-branch source had a clean worktree and contained no tracked
  active hosting binding. `npm run validate` passed with 81 focused tests; the
  navigation boundary added by the repair is included in that suite.
- The exact main-derived source, reviewed migration, and ignored checkout-local
  binding were packaged. The packaged and reviewed migration hashes match, the
  Sites source ref was synchronized to that commit, and Site version 6 reached
  successful deployment status.
- The corrected hosted owner Hub control now returns the safe setup status when
  the optional Hub URL and credential are absent; it no longer reports the
  empty-request-stream body error.
- Anonymous checks returned 200 for the account, published permalink, manifest,
  site API, and entries API. The draft permalink returned 404, the entries API
  contained only the published note, and the manifest and API projections
  contained no private fields or unconfigured verification challenge. A
  signed-out owner request redirected to the dispatcher-owned sign-in route,
  and an unauthenticated owner-only Hub probe returned 401.
- The owner-approved link-public access remained unchanged. Exactly one allowed
  owner remains configured, no groups or external visitors were added, and no
  custom hostname other than `jhh.aitta.social` is connected.
- Anonymous requests to the custom hostname return the personal account. The
  site API, entry API, entry resource links, and discovery manifest all emit
  `https://jhh.aitta.social` as their canonical origin.

### Post-merge navigation proof

- A fresh hosted page load produced no console warnings or errors. The signed-in
  Dashboard link reached `/owner`, and a public entry link reached its stable
  permalink through ordinary document navigation.
- An anonymous request to `https://jhh.aitta.social` rendered the exact Sign in
  link and no obsolete Owner access label. Requesting that link reached the
  dispatcher-owned authentication route with a redirect response.
- The public site, entries, and discovery responses remained available and used
  `https://jhh.aitta.social` for account-owned canonical links. The entries API
  returned the one published entry, and an unauthenticated private Hub probe
  returned 401.
- Public access, the sole-owner setting, profile and entry data, optional Hub
  settings, D1, and the single active custom hostname were not changed during
  this release.

The optional Hub origin, verification challenge, and deployment credential are
not configured. Public account operation remains independent of Hub.
