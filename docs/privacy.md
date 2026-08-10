# Privacy and data handling

One AittaSocial deployment controls and stores one presence's data. It uses its
own ChatGPT Sites D1 database. It does not send Identity or update content to a
shared content store and does not require another database or external
infrastructure.

This document describes the POC's application-level behavior. A deployment
owner remains responsible for the content they publish, their public privacy
notice where one is required, and any hosting-level retention or access-policy
choices.

## Data inventory

### Stored in the deployment's D1 database

- one profile: display name, the protocol 1.0 `accountType` compatibility
  value, short description, longer introduction, optional location, optional
  website, optional external links, canonical deployment URL, constrained
  visual preferences, and the choice to show the restrained AittaSocial
  attribution and official project links;
- entries: stable identifier, kind, optional title, body, optional destination
  URL, draft/published state, optional publication time, creation time, and
  update time; and
- only minimal local configuration that genuinely needs durable storage.

Drafts and unpublished entries are private owner content. D1 is authoritative;
browser storage and Hub are not content stores for this deployment.

### Processed from protected runtime settings

| Value | Use | Public effect |
| --- | --- | --- |
| `AITTA_SOCIAL_OWNER_EMAIL` | Exact normalized local owner authorization | None; never disclosed |
| `AITTA_SOCIAL_CANONICAL_URL` | Canonical public resource URLs | The normalized canonical URL is public |
| `AITTA_SOCIAL_HUB_URL` | Pins the optional server-side Hub destination | Only a coarse transport result is shown to the owner |
| `AITTA_SOCIAL_HUB_CHALLENGE` | Allows Hub to verify deployment control | Public in the manifest only while explicitly configured |
| `AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL` | Authenticates the deployment's provisional server-side Hub probe | None; never disclosed |

Protected runtime values are not persisted to profile or entry tables. Do not
copy them into source, migrations, committed fixtures, screenshots, URLs, or
support messages.

The owner Identity view shows only the normalized effective canonical public
URL and the safe fact that either protected runtime configuration or the stored
profile fallback selected it. It does not send the raw runtime value to the
browser. A malformed protected value is ignored by the resolver and never
echoed; a valid stored URL may remain visible to its authorized owner as the
editable durable fallback.

### Processed during Sign in with ChatGPT

The ChatGPT Sites dispatcher may provide an authenticated user identifier,
email, and optional name to server code. The POC needs only the authenticated
email to decide whether the current request belongs to the configured local
owner. It does not store that identity in D1, publish it, use it as the public
Identity, or present it as AittaSocial network authentication or membership.

The POC does not implement its own OAuth/OIDC provider, identity database,
passwords, or authentication cookies. Dispatch-owned sign-in behavior and
hosting access policy remain separate platform concerns.

### Public template prompt

The short `@Sites` creation prompt is public source content, not a D1 record or
runtime setting. It contains no owner identity, protected setting name,
credential, draft, hosting identifier, or Hub response. The public page renders
it only after a successful D1 read confirms that no profile exists. A storage
failure instead produces a fixed unavailable state, so an operational problem
does not disclose private values or masquerade as first-time setup.

The prompt's owner link may reflect only whether the visitor is signed in by
choosing the normal sign-in or `/owner` destination. It does not reveal whether
that visitor is authorized. The owner route repeats the server-side sole-owner
check, and missing owner configuration keeps every write disabled. Selecting or
copying the read-only prompt grants no authority and writes no browser or server
state.

## Public data

The following is intentionally public after the Site owner approves public
access:

- the configured public profile fields and constrained presentation values;
- updates in published state and their public timestamps and links (public
  protocol 1.0 retains the stable `entry` resource name);
- stable public entry identifiers and canonical URLs;
- document title and description derived from the public display name and short
  description, plus a bounded public update title or body excerpt on a
  published permalink and public publication/update timestamps for article
  metadata;
- manifest protocol/software versions, canonical endpoints, and the stored
  protocol 1.0 `accountType` compatibility value; and
- the current Hub verification challenge only when explicitly configured.

Ordinary Identity setup and public HTML do not request or display a category.
A new profile stores the server-owned value `other`; later profile edits do not
accept or modify the field, so an earlier supported stored value is preserved.
The manifest and `/api/v1/site` expose that stored value. This field is retained
solely for protocol 1.0 compatibility and must not be interpreted as verified
identity, authorization, capability, or network membership. It remains in
exact public allowlists; no other private profile or storage field becomes
public with it.

Publishing makes content retrievable without sign-in through HTML and JSON.
Unpublishing removes it from this deployment's public surfaces but cannot
recall copies already cached, indexed, quoted, or saved elsewhere.

The same limit applies to public document metadata. Handler-produced HTML is
served with `no-store` and `must-revalidate`, but a search, sharing, or preview
service may retain a previously fetched title, description, excerpt, timestamp,
or canonical URL. Missing valid profile/canonical setup and owner-only pages use
neutral `noindex, nofollow` metadata without a canonical or image URL;
request-host headers and private configuration are not fallback identity data.

The default template publishes no logo, favicon, or social-preview image and
stores no identity media. If an owner later approves a source customization, a
direct checked-in asset becomes public with the Site and should contain no
private metadata. Such a source asset is not D1 content, an upload, or a Hub
identity claim.

Public serializers use explicit allowlists documented in
[protocol.md](protocol.md). They do not include owner email, ChatGPT identity,
drafts, internal state, deployment credentials, runtime secrets, Hub response
bodies, database identifiers, hosting identifiers, or private route data.

## Private data

Owner-only surfaces may display profile drafts, draft entries, local editing
state retrieved from D1, and safe setup/connection categories. A signed-in
visitor who is not the configured owner receives none of that data.

The Identity form's live preview and required-field count are transient
in-memory browser state. They are not written to D1, browser storage, Hub, a
runtime setting, or a new onboarding record. Reloading before a successful save
discards them. Fresh, incomplete, and complete readiness is recalculated on the
server after authorization from the current profile and effective canonical
URL; it reveals no owner email, ChatGPT identity, credential, draft, Hub
response, or request-host value.

The owner dashboard's first-update state is likewise a server-rendered view of
the existing D1 profile and entries after authorization. Bounded prepared
queries select the earliest applicable record by creation time and stable
identifier even when it falls outside the capped management list. Leaving and
reopening the dashboard therefore resumes the same stored draft identifier; no
completion flag, browser-storage value, onboarding row, or Hub record is
created. A draft stays owner-only until the owner publishes it, and
unpublishing returns that same record to the private resumable state. Public
HTML and JSON continue to treat its identifier exactly like an unknown
identifier.

When the owner asks ChatGPT to operate this interface, ChatGPT can process the
owner-only fields visible in that already authenticated foreground browser.
The application adds no agent identity, agent token, browser-storage record,
database field, log field, or outbound content request for that assistance.
The owner should not ask the assistant to expose protected settings or other
secrets; those settings are not part of the owner forms. The publish
confirmation is shown to the owner before public visibility changes, and the
assistant must wait for explicit owner approval before accepting it.

An interrupted response or 5xx response does not establish whether the D1 write
committed. The interface retains current inputs and provides a saved-state
reload link; the owner checks the server-rendered state before retrying. This
recovery behavior stores no extra history. Identity saves replace the current
profile, draft edits replace the current draft text, unpublishing retains the
same entry privately, and deletion remains subject to hosting-provider backup
limitations.

Missing owner configuration disables all writes. It does not cause the
application to reveal expected configuration values or treat the first visitor
as an owner.

## Optional Hub data flow

Public presence reads do not contact Hub.

During the owner-initiated provisional transport test, server code sends only
an HTTP request to the exact configured HTTPS Hub origin. The deployment
credential is confined to the server-side `Authorization` header. The presence
does not send profile content, entries, drafts, owner email, ChatGPT identity,
or a browser-chosen destination. It does not read or retain the response body;
the interface receives only a coarse safe status category.

The public verification manifest lets Hub retrieve the configured challenge.
That challenge is intentionally public and is not personal identity or an
authentication session. This manual setup is not a verified Hub connection and
must remain provisional until an accepted versioned Hub contract replaces it.
Hub's own network-user registration, directory, credentials, and future
sessions are separate Hub data handling.

## Retention and control

- Profile changes replace the stored profile values used by this deployment.
- Drafts remain in D1 until published or deleted by the owner.
- Unpublishing retains an entry privately in D1 while removing it from all
  public queries.
- Deleting an entry removes the application record. Hosting backups or
  provider-level recovery retention, if any, are outside this application's
  direct control.
- Removing the Hub challenge setting removes it from the next deployed
  manifest. Removing the deployment credential disables authenticated probes.
- Deleting or decommissioning the Site and its D1 resource is a hosting-level
  owner operation and should be checked against the owner's retention needs.

The automated [in-place upgrade proof](upgrade.md) copies a disposable local D1
persistence directory only after its Worker has closed, then reopens the copy to
check state and behavior. That copy is not atomic, is unsafe as a live-copy
procedure, and is not a hosted backup, export, snapshot, or retention promise.
The proof neither reads nor mutates hosted D1 data. Hosted migration recovery
must use separately reviewed provider facilities and explicit owner approval.

The application has no additional administrators, team access, invitations,
followers, messages, comments, reactions, notifications, payments, advertising,
analytics subsystem, or media store in this POC.

Supported Identity, link, update, accent, density, and attribution changes are
stored through explicit owner-authorized controls in deployment-owned D1. They
survive reload without a repository fork or Hub connection. The template prompt
adds no generic settings record, browser storage, remote asset, or new outbound
data flow.

## Logs and errors

Application logs and browser errors must not contain email addresses,
authentication headers, Hub credentials, runtime setting values, request
bodies, entry drafts, SQL text with values, or Hub response bodies. Safe errors
use fixed categories and may include a generated correlation identifier that
contains no embedded user data.

Tests use obvious private canary values and assert that public HTML, JSON,
headers, errors, and logs do not contain them. Production authorization is not
relaxed for fixtures.

## Data minimization checklist

Before adding a field or outbound request, determine whether the current POC
needs it, where it is stored, who can retrieve it, how it is deleted, and which
test proves its boundary. Do not add speculative identity, analytics, network,
upload, or generic configuration data.
