# AittaSocial

```text
@Sites Deploy AittaSocial from https://github.com/aittadb/aitta-social. Reuse
the existing Site if exactly one matches; never create a duplicate, and stop
to ask me if more than one Site could match. Keep it private first, give this
Aitta its own storage, and guide me to set up one owner
through protected Site settings without putting their email in this prompt or
source. No current Hub connection exists; public use works without one. After
sign-in, customize its optional outward Identity profile, links, updates,
accent, density, and attribution through owner controls without a GitHub fork.
Ask before any later source change or deployment, and ask separately before
public access and before a custom domain.
```

An Aitta is your independently controlled AittaSocial application. It remains
authoritative for its identity, content, configuration, and locally stored
data, whether it is publicly reachable, private, or disconnected from the
AittaSocial Hub.

An **Aitta deployment** is a particular running installation of an Aitta. A
**profile** is an Aitta's optional outward identity presentation. A **Hub
connection** is the owner-authorized relationship between an Aitta and the
**AittaSocial Hub**, the network authority and coordination service. The
current POC has no Hub connection. Public profile and published-update reads
remain Hub-independent.

AittaSocial is independently hosted social software for ChatGPT Sites. One
Aitta deployment runs one independently controlled Aitta for a person, company,
project, community, publication, AI agent, or another kind of entity. Use
**Aitta** and plural **Aittas** as branded nouns; **AittaSocial app** is the
generic explanation for a first-time reader.

Project website: [aitta.social](https://aitta.social) · Maintained source:
[GitHub](https://github.com/aittadb/aitta-social)

Each Aitta owns its public identity, canonical URL, profile, updates, database,
design, runtime configuration, and local behavior. An Aitta deployment can
operate publicly without AittaSocial Hub. It uses its own ChatGPT Sites D1
database directly and requires no separate database or external infrastructure.

## Proof-of-concept scope

The first version is intentionally small:

- a public profile and public update permalinks;
- one configurable, category-neutral Identity profile;
- note, article, link, and announcement updates in draft or published state;
- Sign in with ChatGPT for sole-owner administration of this Aitta;
- private Aitta administration, Identity, and update editing surfaces;
- Aitta-owned D1 persistence;
- `/.well-known/aitta-social.json` discovery;
- read-only public JSON endpoints under `/api/v1`.

The completed Aitta-first POC does not yet include a Hub connection, Hub
registration, verified discovery, Follow and Unfollow, or a private
followed-update reader.
Those are future roadmap increments; the active plan first finishes and checks
the immediately usable Aitta-first release. Multiple Aittas in one
Aitta deployment, additional administrators, automatic or reciprocal
relationships, popularity counts, public graphs, recommendations, comments,
reactions, resharing, messages, notifications, advertising, payments,
federation, plugins, general themes, media uploads, a general OAuth/OIDC client,
and shared runtime packages remain excluded or deferred. R2 is left
unconfigured.

## Owner authorization

ChatGPT sign-in identifies a visitor to this Aitta deployment; it neither joins
the AittaSocial network nor grants administrative access by itself. Server-side
code authorizes writes only when
the normalized authenticated ChatGPT email matches the protected
`AITTA_SOCIAL_OWNER_EMAIL` runtime setting. Version one supports exactly one
owner of this Aitta.

If that setting is absent, every write is disabled and the owner-only workspace
shows safe setup guidance. The configured owner email is not stored in content,
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
| `AITTA_SOCIAL_CANONICAL_URL` | Recommended for an Aitta deployment | Canonical public HTTPS Aitta deployment URL used to construct public resource links. |
| `AITTA_SOCIAL_HUB_CHALLENGE` | Optional | Current verification challenge. It is included in the manifest only when explicitly set. |

The verification challenge is public proof that the Aitta deployment could be
modified at verification time; it is not authentication, network registration,
membership, a session, or a trusted connection. The POC has no outbound Hub
probe or deployment credential. Hub availability never gates public profile or
update reads.

## Application surfaces

| Path | Surface |
| --- | --- |
| `/` | Public profile and published updates |
| `/entries/{id}` | Public permalink for one published update |
| `/owner` | Owner-only local Aitta administration |
| `/owner/profile` | Identity and constrained presentation settings |
| `/owner/entries/new` and `/owner/entries/{id}` | Draft update creation and editing |
| `/.well-known/aitta-social.json` | Public discovery manifest |
| `/api/v1` and `/api/v1/schema` | Versioned JSON integration discovery and schema profile |
| `/api/v1/site`, `/api/v1/entries`, and `/api/v1/entries/{id}` | Versioned public JSON resources |

Owner pages and every private write enforce authorization on the server. Route
visibility or a browser control never grants access.

The signed-in owner can use these controls to change Identity text and links,
publish or edit updates, and choose the accent, density, and attribution
visibility. These supported runtime changes require no GitHub fork. The
template neither creates nor assumes an automatically synchronized fork;
advanced source or Site edits remain separate review and deployment work.

Canonical human-facing guidance uses Aitta for the owner-controlled
application, profile for its optional outward identity presentation, and
updates for its published content. Public protocol 1.0 and the existing
implementation retain the stable
`profile`, `entry`, `/entries`, `accountType`, and `/api/v1/site` names. This
technical compatibility does not add a category choice or label to ordinary
Identity setup or public HTML. A new profile uses the neutral `accountType`
value `other`; later edits do not accept or modify this field, so an existing
profile's earlier supported value remains readable in the manifest and
`/api/v1/site`. The public field remains required in protocol 1.0 and is not an
authorization, capability, or network-identity claim. This category-neutral
change requires no D1 schema migration or protocol-version change.

## Profile metadata and source customization

Public document metadata represents the configured profile. After Identity is
complete, the public profile page uses its bounded display name and short description
for the document title and description. Its canonical, Open Graph, and sharing
URLs come only from the normalized configured canonical URL. A published update
permalink adds that update's bounded public title or body excerpt; article
metadata also uses its public publication and update timestamps. Draft and
unknown updates have the same non-public metadata result.

The request `Host` and forwarding headers never select public identity or a
canonical URL. Without a valid public profile and canonical URL, the application
uses neutral Aitta setup metadata; a storage-read failure uses separate neutral
unavailable metadata. Both mark the response `noindex, nofollow` and emit no
canonical, sharing, or image URL. Owner-only pages use the same neutral robots
boundary. All handler-produced HTML is rendered dynamically with `no-store` and
`must-revalidate`; the documented public JSON cache headers and static-asset
handling are unchanged. External preview or search services may nevertheless
retain public information they have already fetched.

The reusable template intentionally ships with a typographic identity and
text-only sharing metadata. It does not ship a generic logo, favicon, or social
preview image that would describe AittaSocial instead of the configured profile.
An owner can later ask ChatGPT to add a supplied identity asset directly to the
maintained source and wire that exact checked-in file into metadata, with useful
alternative text where an image is exposed. For example:

```text
Use the attached image as this Aitta's checked-in favicon and social preview.
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
Do not commit an owner's email, a runtime secret, or other runtime values.

Useful checks:

```bash
npm test
npm run lint
npm run build
npm run db:generate
npm run validate
```

Generate and inspect a migration whenever `db/schema.ts` changes. The
Aitta owns the resulting D1 database. Browser storage is never the source
of truth for profiles, entries, or authorization.

`develop` is the shared Git workspace. Feature branches start from and rebase
onto it; the integration owner serializes only complete validated task commits
and tracker updates there. Releases promote `develop` to `main` through an
owner-reviewed pull request using **Rebase and merge**; do not update `main`
directly. After feature integration, start follow-up work on a fresh branch
from updated `develop`. After a release merge, wait until the owner refreshes
`develop` from updated `main` so source and Sites checkpoint provenance remain
exact. An explicitly approved Sites checkpoint may use an exact validated and
pushed `develop` commit before that later `main` pull request; it must be
recorded as `develop`, not relabeled as `main`.

See [local development](docs/local-development.md) for fixtures and validation,
[in-place upgrade preservation](docs/upgrade.md) for the local historical-state
proof, [clean-source reproducibility](docs/reproducibility.md) for the isolated
release proof, and [ChatGPT Sites deployment](docs/deployment.md) for the
private-first setup flow.

## Public interfaces and safety

- [Public protocol and JSON API](docs/protocol.md)
- [Public profile presentation](docs/presentation.md)
- [Security and trust boundaries](docs/security.md)
- [Privacy and data handling](docs/privacy.md)
- [In-place upgrade preservation](docs/upgrade.md)
- [Clean-source reproducibility](docs/reproducibility.md)
- [Hosted test checkpoint evidence](docs/checkpoint.md)
- [Product roadmap](ROADMAP.md)
- [Implementation plan](PLAN.md)
- [Post-POC backlog](BACKLOG.md)
- [Changelog](CHANGELOG.md)
- [Durable contributor instructions](AGENTS.md)

Public JSON is built from explicit allowlists so drafts, owner identity,
credentials, runtime secrets, and hosting identifiers cannot enter responses by
accidental object serialization.

## License

AittaSocial is licensed under `FSL-1.1-MIT`. [LICENSE](LICENSE) contains the
exact owner-selected terms and notice.
