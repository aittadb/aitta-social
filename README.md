# AittaSocial

AittaSocial is independently hosted social software for ChatGPT Sites. One
deployment represents one independently controlled account: a person, company,
project, community, publication, AI agent, or another kind of entity.

Project website: [aitta.social](https://aitta.social) · Maintained source:
[GitHub](https://github.com/aittadb/aitta-social)

Each deployment owns its public identity, canonical URL, profile, entries,
database, design, runtime configuration, and local behavior. A deployment can
operate publicly without AittaSocial Hub. It uses its own ChatGPT Sites D1
database directly and requires no separate database or external infrastructure.

## Proof-of-concept scope

The first version is intentionally small:

- a public account page and public entry permalinks;
- one configurable profile;
- notes, articles, links, and announcements in draft or published state;
- Sign in with ChatGPT for one local owner;
- a private owner dashboard, profile settings, entry editing, and Hub setup;
- deployment-owned D1 persistence;
- `/.well-known/aitta-social.json` discovery;
- read-only public JSON endpoints under `/api/v1`; and
- an optional, failure-isolated connection to AittaSocial Hub.

The POC does not include multiple local accounts or administrators, follows,
timelines, comments, reactions, resharing, messages, notifications,
recommendations, advertising, payments, federation, plugins, general themes,
media uploads, a general OAuth/OIDC client, or shared runtime packages. R2 is
left unconfigured.

## Owner authorization

ChatGPT sign-in identifies a visitor to this deployment; it does not grant
administrative access by itself. Server-side code authorizes writes only when
the normalized authenticated ChatGPT email matches the protected
`AITTA_SOCIAL_OWNER_EMAIL` runtime setting. Version one supports exactly one
owner.

If that setting is absent, every write is disabled and the owner surfaces show
safe setup guidance. The configured owner email is not stored in content,
exposed through public HTML, the public API, or the manifest, or committed to
this repository. Configure it only in the Site's protected runtime settings.

Keep the Site private until the protected owner setting and initial profile
have been configured and the owner, non-owner, and signed-out cases have been
tested. Public release and custom-domain connection both require explicit
owner approval.

## Runtime settings

Configure hosted values through the Site's protected runtime settings, never in
source control.

| Setting | Required | Purpose |
| --- | --- | --- |
| `AITTA_SOCIAL_OWNER_EMAIL` | Required for writes | Sole local owner's verified ChatGPT email. Its absence safely disables administration. |
| `AITTA_SOCIAL_CANONICAL_URL` | Recommended for deployment | Canonical public HTTPS deployment URL used to construct public resource links. |
| `AITTA_SOCIAL_HUB_URL` | Optional | Configured HTTPS origin of AittaSocial Hub. |
| `AITTA_SOCIAL_HUB_CHALLENGE` | Optional | Current verification challenge. It is included in the manifest only when explicitly set. |
| `AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL` | Optional secret | Deployment credential sent only by server-side code to the configured Hub origin. |

The verification challenge is public proof that the deployment could be
modified at verification time; it is not authentication. The deployment
credential is secret. Hub availability never gates public profile or entry
reads.

## Application surfaces

| Path | Surface |
| --- | --- |
| `/` | Public account page and published entries |
| `/entries/{id}` | Public permalink for one published entry |
| `/owner` | Owner dashboard |
| `/owner/profile` | Profile and constrained presentation settings |
| `/owner/entries/new` and `/owner/entries/{id}` | Draft creation and entry editing |
| `/owner/hub` | Optional Hub setup and safe connection status |
| `/.well-known/aitta-social.json` | Public discovery manifest |
| `/api/v1/site`, `/api/v1/entries`, and `/api/v1/entries/{id}` | Versioned public JSON resources |

Owner pages and every private write enforce authorization on the server. Route
visibility or a browser control never grants access.

## Development

Prerequisite: Node.js `>=22.13.0`.

```bash
npm ci
npm run db:migrate:local
npm run dev
```

Use non-production fixture values only in an ignored local environment file.
Do not commit an owner's email, a Hub credential, or other runtime values.

Useful checks:

```bash
npm test
npm run lint
npm run build
npm run db:generate
npm run validate
```

Generate and inspect a migration whenever `db/schema.ts` changes. The
deployment owns the resulting D1 database. Browser storage is never the source
of truth for profiles, entries, or authorization.

Changes reach `main` through an owner-reviewed pull request using **Rebase and
merge**. Do not update `main` directly. After a successful rebase merge, start
follow-up work on a fresh branch from the updated `main` so source and Sites
checkpoint provenance remain exact.

See [local development](docs/local-development.md) for fixtures and validation,
and [ChatGPT Sites deployment](docs/deployment.md) for the private-first setup
flow.

## Public interfaces and safety

- [Public protocol and JSON API](docs/protocol.md)
- [Security and trust boundaries](docs/security.md)
- [Privacy and data handling](docs/privacy.md)
- [Hosted test checkpoint evidence](docs/checkpoint.md)
- [Product roadmap](ROADMAP.md)
- [Implementation plan](PLAN.md)
- [Post-POC backlog](BACKLOG.md)
- [Changelog](CHANGELOG.md)
- [Durable contributor instructions](AGENTS.md)

Public JSON is built from explicit allowlists so drafts, owner identity,
credentials, runtime secrets, and hosting identifiers cannot enter responses by
accidental object serialization.

## Reusable deployment prompt

```text
@Sites Deploy AittaSocial from https://github.com/aittadb/aitta-social. Reuse
the existing Site linked to this repository; do not create a duplicate. Keep
setup private, use its own D1, and guide me through protected sole-owner setup,
the initial profile, and access checks. Ask before public access or a custom
domain.
```

## License

AittaSocial is licensed under `FSL-1.1-MIT`. [LICENSE](LICENSE) contains the
exact owner-selected terms and notice.
