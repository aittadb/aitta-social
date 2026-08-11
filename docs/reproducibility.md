# Clean-source reproducibility

This procedure proves the maintained AittaSocial template from a fresh local
clone without resolving, packaging, creating, or deploying a Site. It does not
read or copy an active `.openai/hosting.json`, contact Hub, change hosted D1,
settings, access, DNS, or a custom domain, or run `npm run sites:package`.

The proof applies to one exact commit. Record that commit with the evidence;
never relabel a feature-branch result as `develop` or `main` after a rebase
merge. Reproduce the actual resulting integration or release commit separately.

## Fresh-clone procedure

Create a disposable bare repository from the exact reviewed source, then make a
new clone from that bare repository. Before installation, record and inspect:

```bash
git rev-parse HEAD
git remote -v
git status --short --branch
git status --porcelain --ignored
node --version
npm --version
shasum -a 256 package-lock.json drizzle/*.sql drizzle/meta/*.json
```

The initial ignored inventory must contain no `node_modules`, `dist`,
`.wrangler`, `.env*`, or `.openai/hosting.json`. The only committed Sites shape
is `.openai/hosting.example.json`, exactly:

```json
{
  "project_id": null,
  "d1": "DB",
  "r2": null
}
```

Install only the lock, query the npm registry for the production graph, and run
the normal repository gates and a separate production build:

```bash
npm ci
npm audit --omit=dev
npm run validate
npm run build
npm run reproducibility:check
```

`npm audit --omit=dev` must complete successfully against the registry; a
cached, skipped, or network-failed result is not audit proof. Record the exact
Node and npm versions, lockfile SHA-256, direct production versions and
integrities, and the production-lock graph digest printed by
`reproducibility:check`. Do not run `npm audit fix`: reproducibility verifies the
reviewed lock rather than mutating it.

`reproducibility:check` also requires the clone's `origin` to be a
credential-free local bare repository whose `HEAD` is the exact checked-out
commit. It prints that local origin and both commit values as source provenance.
This prevents an ordinary worktree or an ambiguous moving remote from being
presented as the clean-clone proof.

The reproducibility check generates migrations and requires no schema,
snapshot, journal, or SQL change. It applies the reviewed migration to a new
temporary local D1, checks the two product tables, two justified indexes,
constraints, applied migration name, and zero initial profile/update rows, then
deletes that disposable database. Review the printed before/after migration
hashes against the committed files. No request or runtime module may create or
repair schema.

The check refuses any pre-existing `.env*` file except the committed inert
`.env.example`, then builds with fresh synthetic *values* in every protected
setting, not merely the setting names. It proves those values are absent from
the final `dist`, intermediate `.next` and `.vinext` output, local `.wrangler`
tool output, a `git archive` of the exact commit, and a temporary inert
dist-archive rehearsal. That rehearsal adds only the committed null
`project_id` example to a temporary copy of `dist`; it is not a Sites package.
The real inert build must contain reviewed migrations, the Worker and client
assets, a placeholder local D1 declaration, no active hosting file, no R2
binding, no generic `public/og.png`, and no ignored source or stale build
directories.

Finish by proving the source bookend:

```bash
git rev-parse HEAD
git status --short --branch
git status --porcelain
```

The final commit must equal the initial commit and the tracked status must be
clean. Generated `node_modules`, `dist`, and `.wrangler` paths are ignored local
artifacts and may be deleted with the disposable clone; they are never copied
to the maintained checkout or a deployment.

## Fresh-presence acceptance

The compiled-Worker acceptance fixtures start with a new empty D1 interface and
prove these release boundaries together:

- signed-out public HTML leads with the exact short deployment prompt only
  while Identity is absent;
- a signed-in visitor still cannot write when the protected owner setting is
  missing, and the owner surface explains that administration is disabled;
- a successful empty-D1 read is distinct from D1 failure, which shows a safe
  temporary unavailable state rather than the creation prompt;
- saving Identity and constrained presentation through the authorized owner
  endpoint persists in D1 and removes the setup prompt without changing Git;
- a configured presence with no updates remains intentional and public;
- a draft and its private canary remain indistinguishable from an unknown
  update, while only an explicitly published update reaches public HTML and
  `/api/v1`; and
- reload reads the saved D1 values without a fork, source edit, redeployment,
  Hub connection, browser storage, or alternate authorization path.

This is local source and application proof. It does not establish hosted
upgrade/browser acceptance (TASK-059) or an exact Sites checkpoint and source
provenance result (TASK-061). Those remain separate work, and TASK-061 still
requires explicit owner approval before any packaging or deployment.
