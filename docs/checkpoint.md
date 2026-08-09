# Hosted test checkpoint evidence

This record contains only safe, identity-free evidence for the owner-approved
link-public test Site at
`https://aittasocial.jaakko-heusala.chatgpt.site`. It contains no protected
setting values, authenticated email addresses, credentials, database IDs, Site
project IDs, deployment IDs, or source-repository credentials. No custom domain
is connected.

## Site and storage

- Exactly one existing Site matched the AittaSocial name, `aittasocial` slug,
  repository, and checkout-local binding. It was reused; no duplicate was
  created.
- The active binding remains ignored and checkout-local. The committed example
  is inert, declares only the deployment-owned `DB` binding, and leaves R2 null.
- The reviewed D1 migration is packaged with the Site. A saved profile and
  entry lifecycle persisted across separate hosted requests.

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

## Validation and current source gate

- `npm run validate` passes with 77 focused tests after the hosted Hub-test
  regression fix. The suite covers every private write boundary, sole-owner
  matching, missing-owner failure, draft privacy, public allowlists, pagination,
  URL validation, Hub credential confinement, responsive semantics, and the
  empty browser request-stream shape found during hosted review.
- The deployed saved version still predates that Hub-test fix. Sites correctly
  refused to save an archive for a commit that is not the configured source
  branch's current `main` HEAD. The validated feature branch must be promoted to
  `main` with explicit owner approval before the corrected checkpoint can be
  saved and deployed.

The optional Hub origin, verification challenge, and deployment credential are
not configured. Public account operation remains independent of Hub.
