# TASK-136 public-contract and privacy acceptance

TASK-136 is accepted as a local, read-only proof of the public presence
boundary. It exercises the compiled Worker against disposable persisted D1
databases only. It does not package, deploy, read or write a hosted Site, use
the ignored active hosting binding, mutate production data or settings, or
change access, DNS, or a custom domain.

## Provenance

- Accepted prerequisite commit:
  `20082d06e20981cf1fc3954deca1e3f24d3c0690`.
- Public protocol: AittaSocial protocol and API `1.0`.
- Application version: `0.1.0`.
- Worker under test: `dist/server/index.js` produced from the accepted source by
  `npm run build` and loaded as an explicit compiled-module inventory by the
  TASK-059 helper.
- D1 modes: current migrations on an empty database, and the frozen POC 0.1
  fixture followed by every migration after its historical migration.

The test pins these reviewed inputs and fails closed if one changes:

| Input | SHA-256 |
| --- | --- |
| `db/schema.ts` | `8917fdac637f7a5ae4c96df0ecbed770ca881c218136e6067196fc3216bc1b67` |
| `docs/protocol.md` | `72240d08f2d03a9c22aa07e6f12dc5a0daea097b029e3960854066eb4c2e3e43` |
| `drizzle/0000_closed_talos.sql` | `95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a` |
| `package-lock.json` | `1fd75c48473016371545d02ae8599379031111e46fc960976fdc7e3cc18f3eb9` |
| `tests/fixtures/poc-upgrade-v0.sql` | `bde6241fd75d84b729a0b84401ffe671df2e505fc7f42c6e23e7d4fbd5755ac9` |
| `tests/helpers/local-d1-upgrade.mjs` | `89e2fc30bfe9609ba4e77d0af7ccfafc320ccb782683cb32fab6e74a323e1bc5` |
| `tests/public-contract-privacy-matrix.test.mjs` | `5ca113cfbbe7fef67db0f16078d3711d37740d6c068c8558af6b037ccebb0cf6` |

The migration inventory at acceptance is exactly
`drizzle/0000_closed_talos.sql`. A changed input or added migration requires a
deliberate review and updated acceptance evidence rather than silently reusing
this result.

## Exact case matrix

Each row makes 15 public requests: the home page; published, draft, and unknown
HTML permalinks; manifest; site resource; collection pages 1–4 plus a repeated
page 1; one invalid collection page; and published, draft, and unknown JSON
details. Six rows therefore cover 90 public responses.

| Case | D1 lineage | Readiness | Canonical authority | Required public result |
| --- | --- | --- | --- | --- |
| `fresh-configured` | All current migrations on empty D1, then current seed | Complete profile | Normalized protected runtime URL overrides a different stored URL | Indexable HTML and exact successful JSON envelopes use only `https://fresh-runtime.example/presence` |
| `upgraded-configured` | Historical migration and frozen POC fixture, then migration tail | Complete profile | Normalized stored fallback with no runtime URL | Indexable HTML and exact successful JSON envelopes use only `https://legacy-person.example/presence` |
| `fresh-profile-absent` | Fresh current D1 with public and draft entries retained | No profile row | A runtime URL exists but cannot make an absent profile configured | Neutral `noindex, nofollow` HTML; public JSON endpoints return exact `profile_not_configured` errors |
| `upgraded-profile-absent` | Upgraded POC D1 with its profile removed and entries retained | No profile row | A runtime URL exists but cannot make an absent profile configured | Same neutral HTML and exact `profile_not_configured` JSON boundary as the fresh case |
| `fresh-canonical-absent` | Fresh current D1 | Profile exists, no valid runtime or stored URL | No request header may become canonical authority | Profile HTML remains readable but neutral and non-indexable; public JSON endpoints return exact `canonical_url_unconfigured` errors |
| `upgraded-canonical-absent` | Upgraded POC D1 | Profile exists, no valid runtime or stored URL | No request header may become canonical authority | Same neutral HTML and exact `canonical_url_unconfigured` JSON boundary as the fresh case |

The configured collection contains six published rows and one draft. Pages of
two prove `published_at DESC, id DESC`, including three rows with the same
publication timestamp. Page 4 is the deterministic empty page. A repeated page
1 must match the first response exactly.

## Contract assertions

| Surface | Success | Unconfigured behavior | Exact contract headers |
| --- | --- | --- | --- |
| Public home | `200` HTML with published-only content | `200` with neutral metadata; an absent profile shows setup, while an invalid canonical URL leaves the saved profile readable | `text/html; charset=utf-8`; `no-store, must-revalidate`; no redirect |
| Published permalink | `200` HTML with the public update | Still readable, but `noindex, nofollow` and without canonical or Open Graph URL metadata | `text/html; charset=utf-8`; `no-store, must-revalidate`; no redirect |
| Draft and unknown permalinks | The same generic `404` public page after normalizing only the requested opaque path segment | Identical to the configured result | `text/html; charset=utf-8`; `no-store, must-revalidate`; no redirect |
| Manifest and site resource | Exact `200` allowlisted envelopes and canonical links | Exact `404 profile_not_configured` or `503 canonical_url_unconfigured` envelope | `application/json`; success `public, max-age=60`; error `no-store`; no redirect |
| Entries pages | Exact published-only resources, pagination, and canonical `self`, `previous`, `next`, and `site` links | The same exact setup error on every valid page | `application/json`; success `public, max-age=30`; error `no-store`; no redirect |
| Entry detail | Exact published resource; exact identical `404 entry_not_found` for draft and unknown identifiers | The same exact setup error for published, draft, and unknown identifiers | `application/json`; success `public, max-age=60`; error `no-store`; no redirect |
| Invalid pagination | Exact `400 invalid_pagination` in every matrix row | Independent of setup state | `application/json`; `no-store`; no redirect |

Every successful JSON body is compared to the complete expected object. This
proves the field and link envelopes by rejecting omitted, renamed, or extra
properties. Optional `title` and `destinationUrl` omissions are represented by
the untitled oldest note. Metadata assertions pin title, description, robots,
canonical, and Open Graph URL behavior where each field is permitted.

Every response body and every response header is scanned for sentinel values
placed in the protected owner setting, authenticated identity headers,
deployment credential, Hub URL, private profile columns, and draft fields.
Request URL, `Host`, `Forwarded`, and `X-Forwarded-Host` use separate hostile
sentinels. None may occur in HTML, JSON, headers, resource links, metadata, or
errors. The configured link envelopes are instead compared to the normalized
runtime or stored canonical URL named in the matrix.

## Validation evidence

- `npm run build`: passed and produced the compiled Worker used by the matrix.
- `node --test --test-reporter=spec tests/public-contract-privacy-matrix.test.mjs`:
  passed 7/7 tests, including all six matrix rows.
- `node --test --test-reporter=spec tests/public-contract.test.mjs tests/metadata-contract.test.mjs tests/upgrade-preservation.test.mjs tests/public-contract-privacy-matrix.test.mjs`:
  passed 34/34 tests.
- `npm run db:generate`: passed with no schema or generated-migration change.
- `npm run validate`: passed, including production build and 163/163 tests.
- `git diff --check`: passed.

No product defect was found by the accepted matrix. Residual uncertainty is
explicitly hosted: this task proves the compiled release candidate locally and
does not claim a Sites deployment, hosted D1 state, CDN behavior, custom-domain
behavior, or browser observation. Those outcomes require their separately
approved hosted checkpoint tasks.
