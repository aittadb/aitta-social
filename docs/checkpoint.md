# Hosted test checkpoint evidence

This record contains only safe public evidence for the owner-approved account
at `https://jhh.aitta.social`. The Sites-provided URL remains
`https://aittasocial.jaakko-heusala.chatgpt.site`. This record contains no
protected setting values, authenticated email addresses, credentials, database
IDs, Site project IDs, deployment IDs, or source-repository credentials. The
owner-approved personal hostname is the only connected custom domain.

## Site and storage

- Exactly one existing Site matched the AittaSocial name, `aittasocial` slug,
  repository, and checkout-local binding. It was reused; no duplicate was
  created.
- The active binding remains ignored and checkout-local. The committed example
  is inert, declares only the deployment-owned `DB` binding, and leaves R2 null.
- The reviewed D1 migration is packaged with the Site. A saved profile and
  entry lifecycle persisted across separate hosted requests.
- The active custom hostname, protected canonical setting, and stored profile
  canonical URL all use `https://jhh.aitta.social`.

## Access and public privacy proof

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

## Validation and deployed source proof

- Pull requests [#1](https://github.com/aittadb/aitta-social/pull/1) and
  [#2](https://github.com/aittadb/aitta-social/pull/2) were owner-reviewed and
  rebase-merged. The deployed source is the resulting `main` commit
  `465dc3370744e25306f88f8732e66589be1a8346`.
- A clean checkout from the bare repository URL selected that default branch
  source and contained no active hosting binding. `npm ci`, migration
  generation, and `npm run validate` passed with 79 focused tests, and migration
  generation produced no schema diff.
- The exact main-derived source, reviewed migration, and ignored checkout-local
  binding were packaged. The packaged and reviewed migration hashes match, the
  Sites source ref was synchronized to that commit, and Site version 4 reached
  successful deployment status. The same saved version was redeployed after
  the protected canonical setting changed.
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

The optional Hub origin, verification challenge, and deployment credential are
not configured. Public account operation remains independent of Hub.
