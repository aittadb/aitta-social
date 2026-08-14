# Privacy and data handling

One independently controlled top-level Aitta controls and stores its own data
in its Aitta deployment's ChatGPT Sites D1 database. One deployment currently
runs one Aitta; a profile is only its optional outward identity presentation.
It does not send Identity or update content to a shared content store and does
not require another database or external infrastructure.

This document describes the POC's application-level behavior. The Aitta owner
remains responsible for the content they publish, their public privacy
notice where one is required, and any hosting-level retention or access-policy
choices.

The application publishes a concise, D1-independent human summary at
`/privacy`. It describes only these current application facts, uses neutral
`noindex, nofollow` metadata without a canonical or image URL, and does not
invent an operator identity, contact address, consent system, or legal promise.
The shared public footer links to it. That footer's GitHub source link remains
available when the owner hides only the restrained `Powered by AittaSocial`
attribution.

## Data inventory

### Stored in the Aitta-owned D1 database

- one profile: display name, the protocol 1.0 `accountType` compatibility
  value, short description, longer introduction, optional location, optional
  website, optional external links, canonical Aitta deployment URL, constrained
  visual preferences, and the choice to show the restrained AittaSocial
  attribution and official project links;
- entries: stable identifier, kind, optional title, body, optional destination
  URL, draft/published state, optional publication time, creation time, and
  update time; and
- only minimal local configuration that genuinely needs durable storage.

Drafts and unpublished entries are private owner content. D1 is authoritative;
browser storage and Hub are not content stores for this Aitta.

### Processed from protected runtime settings

| Value | Use | Public effect |
| --- | --- | --- |
| `AITTA_SOCIAL_OWNER_EMAIL` | Exact normalized local owner authorization | None; never disclosed |
| `AITTA_SOCIAL_CANONICAL_URL` | Canonical public resource URLs | The normalized canonical URL is public |
| `AITTA_SOCIAL_HUB_CHALLENGE` | Allows Hub to verify deployment control | Public in the manifest only while explicitly configured |

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
Identity, or present it as Aitta Network authentication or membership.

Current Sites Sign in with ChatGPT is therefore only local sole-owner
administration. Future member identity or Aitta Network membership requires an
exact accepted Hub contract and is not a current data flow; see
[strategy.md](strategy.md) for the future direction.

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

An update is a **Draft** while only its owner can read it. Publishing makes it
**Published** and retrievable without sign-in through HTML and JSON.
Unpublishing returns the same update to a private draft and removes it from this
Aitta's public surfaces, but cannot recall copies already cached, indexed,
quoted, or saved elsewhere.

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
drafts, internal state, runtime secrets, database identifiers, hosting
identifiers, or private route data.

## Private data

Owner-only surfaces may display profile drafts, draft entries, and local editing
state retrieved from D1. A signed-in
visitor who is not the configured owner receives none of that data.

The Identity form's dirty marker, live preview, required-field count, and
field-error presentation are transient in-memory browser state. They are not
authoritative readiness and are not written to D1, browser storage, Hub, a
runtime setting, or a new onboarding record. Reloading before a successful save
discards them. Fresh, incomplete, and complete readiness is recalculated on the
server after authorization from the current profile and effective canonical
URL; it reveals no owner email, ChatGPT identity, credential, draft, Hub
response, or request-host value.

The saved/unsaved marker compares the current required, optional,
presentation, and attribution controls with their exact initially rendered
values. Returning every control to that baseline clears the marker; the first
input event is not treated as permanent evidence of a change. When an invalid
stored canonical fallback is replaced in the form by the normalized effective
runtime URL, the authorized view identifies that substitution and the
consequence of saving rather than calling it saved profile data. When no valid
runtime substitution exists, the authorized view leaves the canonical field
empty, identifies the invalid saved fallback as omitted, and treats the form as
loaded with an omission rather than an exact saved-state match. It never sends
the raw invalid stored or runtime value. Only an exactly empty saved fallback
remains an exact empty form baseline; whitespace-only stored input is omitted
and identified as invalid.

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
committed. The Identity interface retains current inputs, disables another save
from that uncertain page, and provides a saved-state reload link; the owner
checks the server-rendered state before retrying. A definitive 4xx instead
associates recognized safe validation details with the relevant fields and
does not expose a recovery link. This recovery behavior stores no extra
history. Identity saves replace the current profile, draft edits replace the
current draft text, unpublishing retains the same entry privately, and deletion
remains subject to hosting-provider backup limitations.

Missing owner configuration disables all writes. It does not cause the
application to reveal expected configuration values or treat the first visitor
as an owner.

## Optional Hub verification data

Public profile reads do not contact Hub. The POC has no Hub connection,
configured Hub destination, deployment credential, outbound probe,
registration, or connection data flow.

The public verification manifest exposes the configured challenge when present.
That challenge is intentionally public, proves only control of this Aitta
deployment at verification time, and is not personal identity, authentication,
a network session, or a trusted connection. Hub's own future registration,
directory, credentials, and sessions require a separately accepted contract and
are not this Aitta's current data handling. Current protocol 1.0 entries remain
publishing resources rather than Network events or app roots; no event or
member data is stored or sent by this POC.

## Retention and control

- Profile changes replace the stored profile values used by this Aitta.
- Drafts remain in D1 until published or deleted by the owner.
- Unpublishing retains an entry privately in D1 while removing it from all
  public queries.
- Deleting an entry removes the application record. Hosting backups or
  provider-level recovery retention, if any, are outside this application's
  direct control.
- Removing the Hub challenge setting removes it from the next deployed
  manifest.
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
stored through explicit owner-authorized controls in Aitta-owned D1. They
survive reload without a repository fork or Hub connection. The template prompt
adds no generic settings record, browser storage, remote asset, or new outbound
data flow.

## Logs and errors

Application logs and browser errors must not contain email addresses,
authentication headers, runtime secrets, runtime setting values, request
bodies, entry drafts, or SQL text with values. Safe errors use fixed categories
and may include a generated correlation identifier that contains no embedded
user data.

Tests use obvious private canary values and assert that public HTML, JSON,
headers, errors, and logs do not contain them. Production authorization is not
relaxed for fixtures.

## Data minimization checklist

Before adding a field or outbound request, determine whether the current POC
needs it, where it is stored, who can retrieve it, how it is deleted, and which
test proves its boundary. Do not add speculative identity, analytics, network,
upload, or generic configuration data.
