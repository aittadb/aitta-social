# TASK-060 local functional journey

Status: **pass.** The compiled-Worker matrix, exact-candidate native browser
journeys, migration review, and full repository validation all pass.

This proof is local-only. It does not read or package the ignored active
hosting binding, deploy a Site, mutate hosted D1 data or runtime settings,
change access, DNS, or a custom domain, or contact Sites, Hub, or another
application endpoint. The production dependency audit is the sole read-only
external registry check.

## Candidate provenance

- Exact authoritative source base:
  `ac350fa6ac1acc3a61139b44b18e030f15f8aa53` on `develop`.
- TASK-060 adds only this record and
  `tests/presence-functional-matrix.test.mjs`; it changes no application,
  Worker, schema, migration, runtime configuration, or hosting file.
- Node.js: `24.16.0`; npm: `11.13.0`.
- Compiled runtime: the production `vinext build` Worker under `dist/server`,
  executed through Miniflare with real persisted D1 databases.
- D1 binding: the packaged `DB` declaration for `site-creator-d1`; reviewed
  migrations are applied before runtime access. The upgrade fixture is loaded
  after its historical migration and before any later migration.
- Browser fixture: built from the same source base, allowed only these two
  untracked TASK-060 evidence files, bound four disposable servers to
  `127.0.0.1`, and found no active `.openai/hosting.json`.

| Reviewed input | SHA-256 |
| --- | --- |
| `db/schema.ts` | `8917fdac637f7a5ae4c96df0ecbed770ca881c218136e6067196fc3216bc1b67` |
| `drizzle/0000_closed_talos.sql` | `95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a` |
| `tests/fixtures/poc-upgrade-v0.sql` | `bde6241fd75d84b729a0b84401ffe671df2e505fc7f42c6e23e7d4fbd5755ac9` |
| `package-lock.json` | `1fd75c48473016371545d02ae8599379031111e46fc960976fdc7e3cc18f3eb9` |

The functional test pins those digests and enumerates every numbered migration
in filename order. A digest change or missing compiled Worker fails the proof.

## Route, viewer, and state matrix

| Fixture/state | Viewer or condition | Routes and operation | Decisive result |
| --- | --- | --- | --- |
| Fresh, migrated, empty | Anonymous | `/` | The deployment prompt leads the page and no configured public Identity is claimed. |
| Fresh, migrated, empty | Owner | `/owner` | Identity is the leading journey; native links reach Identity, new update, and the public presence, with no retired Hub control. |
| Fresh | Owner | `PUT /api/private/profile` | Identity, canonical fallback, links, accent, compact density, and hidden attribution persist in D1; the new row receives server-owned protocol value `other`. |
| Fresh, configured, reopened | Anonymous and owner | `/`, `/owner` | Saved Identity and presentation survive restart, the deployment prompt is absent, and the private-first-draft journey is available. |
| Fresh, configured | Owner | `POST /api/private/entries` | A draft receives a stable ID and persists; public home, permalink, detail API, and collection all omit its private canary. |
| Fresh draft, reopened | Owner | `/owner/entries/:id`, `PUT /api/private/entries/:id` | Native management navigation resolves and the edited kind, title, and body replace the stored draft. |
| Edited draft | Owner, then anonymous | `PUT /api/private/entries/:id/state`, `/`, `/entries/:id` | Explicit publication makes the edited update public at home and its stable permalink without exposing its former private body. |
| Published update, reopened | Anonymous | `/entries/:id` | Published state, text, and permalink survive a Worker restart. |
| Published update | Owner, then anonymous | `PUT /api/private/entries/:id/state` | Explicit unpublishing returns it to draft and every public surface treats it as unknown. |
| Unpublished update, reopened | Owner | `DELETE /api/private/entries/:id` | The draft is deleted; after another restart the Identity remains and the update count is zero. |
| Historical populated upgrade | Anonymous | `/`, public resources | The legacy Identity and published update remain visible, draft canaries remain absent, and the deployment prompt is absent. |
| Historical populated upgrade | Owner | `/owner` and native management routes | The private draft and published update remain manageable after migration, with no retired Hub navigation. |
| Historical populated upgrade | Different signed-in user | `/owner`, denied Identity write | No private draft is rendered, the write returns `403`, and the exact D1 snapshot is unchanged. |
| Historical populated upgrade | Owner setting missing | `/owner`, denied Identity write | Administration is safely disabled, the write returns `503`, private draft data is absent, public content remains available, and D1 is unchanged. |
| Historical populated upgrade | Retired Hub settings plus a local outage sentinel | `/`, `/api/v1/site`, manifest, `/owner`, retired Hub paths, `/api/v1/entries` | Public and owner reads remain available; the public protocol challenge appears only in the manifest; retired paths are identity-independent `404` responses without redirects; private runtime values stay absent; zero outbound requests occur; and D1 is unchanged. |
| Empty, unmigrated storage | Anonymous | `/` | A neutral unavailable state appears and the deployment prompt does not, so storage failure is not mistaken for a new presence. |

Every accepted internal navigation target in this matrix is asserted from
rendered HTML as an ordinary `<a href>` target. The output is also scanned for
client-router markers, preserving the native full-document navigation
boundary.

## Browser and console checkpoint

The browser exercised the exact source base through disposable populated
fixtures at `http://127.0.0.1:50646` (public) and
`http://127.0.0.1:50647` (owner).

| Browser assertion | Result |
| --- | --- |
| Engine | Chrome `151.0.0.0` on `MacIntel`. |
| Public home → published permalink → public home | At `/`, title `Legacy Person Presence`, the rendered native `Read update` anchor had `href="/entries/poc-v0-published-update"`; clicking it performed a full-document navigation to that exact URL with title `A preserved public update · Legacy Person Presence`. The native `Return to presence` anchor had `href="/"` and returned to the exact root URL and title. |
| Owner home → Identity → owner home → draft editor | At `/owner`, the native `Identity` anchor had `href="/owner/profile"` and reached the Identity form. The native `Your presence` anchor had `href="/owner"` and returned to the owner home. The rendered private draft-title anchor had `href="/owner/entries/poc-v0-draft-private"` and reached `Edit update` with the existing private draft. |
| Relevant console warnings/errors | Public journey: `0`; owner journey: `0`. |
| Page/runtime errors | `0`; every expected document loaded and no navigation was blocked. |

No product defect was found. Any failed route, non-native navigation, warning,
error, or runtime exception would have kept TASK-060 open rather than being
accepted as a recorded correction.

## Security, privacy, and external-state review

- The fresh draft body canary and historical draft identifier, title, and body
  canaries are checked across public HTML, unknown permalinks, detail JSON,
  and collection JSON.
- Owner and missing-owner denial paths are checked before and after attempted
  mutation against an exact D1 snapshot.
- Retired Hub origin and credential canaries are hostile inert inputs. They
  appear in no response or redirect and produce no outbound request. The
  protocol 1.0 verification challenge remains an explicit manifest-only public
  value.
- The test creates and removes only disposable local directories and loopback
  servers. No schema, migration, protocol, production data, deployment,
  setting, access, DNS, or domain change is part of this task.

## Validation

```bash
npm run build
node --test --test-reporter=spec tests/presence-functional-matrix.test.mjs
npx eslint tests/presence-functional-matrix.test.mjs
npm run db:generate
npm run validate
npm audit --omit=dev
git diff --check
```

Final result on the exact source base: the focused matrix passed 4 tests with
0 failures; `npm run validate` passed all instruction, license, plan, instance,
runtime, migration, type, lint, production-build, and 186-test gates; migration
generation reported no schema change; and the production dependency audit
reported 0 vulnerabilities. The final staged diff check passed.
