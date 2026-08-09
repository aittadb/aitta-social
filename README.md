# AittaSocial

AittaSocial is independently hosted social software for ChatGPT Sites. One
deployment represents one independently controlled presence for a person,
company, project, community, publication, AI agent, or another kind of entity.

Project website: [aitta.social](https://aitta.social) · Maintained source:
[GitHub](https://github.com/aittadb/aitta-social)

Each deployment owns its public identity, canonical URL, profile, updates,
database, design, runtime configuration, and local behavior. A deployment can
operate publicly without AittaSocial Hub. It uses its own ChatGPT Sites D1
database directly and requires no separate database or external infrastructure.

## Proof-of-concept scope

The first version is intentionally small:

- a public presence and public update permalinks;
- one configurable, category-neutral Identity profile;
- note, article, link, and announcement updates in draft or published state;
- Sign in with ChatGPT for sole-owner administration of this presence;
- private Your presence, Identity, update editing, and provisional Hub setup
  surfaces;
- deployment-owned D1 persistence;
- `/.well-known/aitta-social.json` discovery;
- read-only public JSON endpoints under `/api/v1`; and
- an optional, failure-isolated provisional Hub transport probe.

The POC does not include multiple presences in one deployment or additional administrators, follows,
timelines, comments, reactions, resharing, messages, notifications,
recommendations, advertising, payments, federation, plugins, general themes,
media uploads, a general OAuth/OIDC client, or shared runtime packages. R2 is
left unconfigured.

## Owner authorization

ChatGPT sign-in identifies a visitor to this deployment; it neither joins the
AittaSocial network nor grants administrative access by itself. Server-side
code authorizes writes only when
the normalized authenticated ChatGPT email matches the protected
`AITTA_SOCIAL_OWNER_EMAIL` runtime setting. Version one supports exactly one
owner.

If that setting is absent, every write is disabled and the owner-only “Your
presence” area shows safe setup guidance. The configured owner email is not
stored in content,
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
credential is secret. The current manual challenge and root bearer probe are
provisional setup, not network registration, membership, a session, or a
trusted connection. Hub availability never gates public profile or update
reads.

## Application surfaces

| Path | Surface |
| --- | --- |
| `/` | Public presence and published updates |
| `/entries/{id}` | Public permalink for one published update |
| `/owner` | Owner-only “Your presence” area |
| `/owner/profile` | Identity and constrained presentation settings |
| `/owner/entries/new` and `/owner/entries/{id}` | Draft update creation and editing |
| `/owner/hub` | Provisional manual Hub setup and coarse probe status |
| `/.well-known/aitta-social.json` | Public discovery manifest |
| `/api/v1/site`, `/api/v1/entries`, and `/api/v1/entries/{id}` | Versioned public JSON resources |

Owner pages and every private write enforce authorization on the server. Route
visibility or a browser control never grants access.

Human-facing pages call the deployment a presence and its published content
updates. Public protocol 1.0 and the existing implementation retain the stable
`profile`, `entry`, `/entries`, `accountType`, and `/api/v1/site` names. This
technical compatibility does not add a category choice or label to ordinary
Identity setup or public HTML. A new profile uses the neutral `accountType`
value `other`; later edits do not accept or modify this field, so an existing
profile's earlier supported value remains readable in the manifest and
`/api/v1/site`. The public field remains required in protocol 1.0 and is not an
authorization, capability, or network-identity claim. This category-neutral
change requires no D1 schema migration or protocol-version change.

## Presence metadata and source customization

Public document metadata represents the configured presence. After Identity is
complete, the presence page uses its bounded display name and short description
for the document title and description. Its canonical, Open Graph, and sharing
URLs come only from the normalized configured canonical URL. A published update
permalink adds that update's bounded public title or body excerpt; article
metadata also uses its public publication and update timestamps. Draft and
unknown updates have the same non-public metadata result.

The request `Host` and forwarding headers never select public identity or a
canonical URL. Without a valid public profile and canonical URL, the application
uses neutral setup metadata, marks it `noindex, nofollow`, and emits no canonical
or image URL. Owner-only pages use the same neutral robots boundary. All
handler-produced HTML is rendered dynamically with `no-store` and
`must-revalidate`; the documented public JSON cache headers and static-asset
handling are unchanged. External preview or search services may nevertheless
retain public information they have already fetched.

The reusable template intentionally ships with a typographic identity and
text-only sharing metadata. It does not ship a generic logo, favicon, or social
preview image that would describe AittaSocial instead of the deployed presence.
An owner can later ask ChatGPT to add a supplied identity asset directly to the
maintained source and wire that exact checked-in file into metadata, with useful
alternative text where an image is exposed. For example:

```text
Use the attached image as this presence's checked-in favicon and social preview.
Keep the display name and short description as the metadata text, add useful
alternative text, and do not add uploads, R2, a media manager, remote image URLs,
or a runtime asset setting. Validate the source change and ask before deploying.
```

That source-only customization requires a reviewed source change and deployment;
it is not an Identity-form setting and stores nothing new in D1. The text-only
metadata work changes neither the D1 schema nor public protocol 1.0.

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
the initial Identity and sole-owner/non-owner/signed-out access
checks. Make clear that local Sign in is only presence administration and that
Hub setup is optional and provisional. Ask before public access or a custom
domain.
```

## License

AittaSocial is licensed under `FSL-1.1-MIT`. [LICENSE](LICENSE) contains the
exact owner-selected terms and notice.
