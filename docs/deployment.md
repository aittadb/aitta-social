# AittaSocial presence deployment and setup

Deploy AittaSocial private-first. Reuse the existing Site linked to this source
when there is one, give the presence its own D1 database, configure its sole
owner through protected runtime settings, and verify a private checkpoint
before considering public access.

Do not publish publicly or connect a custom domain without the deployment
owner's explicit approval.

## 1. Resolve the Site before changing it

1. Search the owner's ChatGPT Sites for the exact name **AittaSocial**, the slug
   `aittasocial`, the GitHub repository
   `https://github.com/aittadb/aitta-social`, and any `project_id` already
   recorded in `.openai/hosting.json`.
2. If exactly one Site matches those signals, reuse it.
3. If more than one Site could match, stop without changing or creating a Site
   and ask the owner which one to use.
4. Create a Site only after confirming that no existing Site matches. Never
   work around a name or slug conflict by silently creating a variant.
5. Confirm that the selected Site uses this GitHub repository as its maintained
   source project. Do not leave the deployed version attached only to a
   generated copy or unrelated repository.

Keep the selected Site private throughout setup. Preserve its existing project
identity and access policy.

## 2. Validate the source and storage declaration

Before saving a hosted version:

```bash
npm ci
npm run db:generate
npm run validate
npm run sites:package
```

Inspect the generated migration rather than accepting it mechanically. The
maintained repository commits only the inert
`.openai/hosting.example.json` shape:

```json
{
  "project_id": null,
  "d1": "DB",
  "r2": null
}
```

The ignored, checkout-local `.openai/hosting.json` carries the exact project
identifier for the single reused Site with the same `DB`/null-R2 declarations.
Resolve it through Sites and never stage, commit, print, or copy it into the
example. Package that exact local binding only for the private Sites deployment.
Sites provisions and wires the deployment-owned D1 resource. Do not add an
external database, shared content storage, an object bucket, or media
infrastructure.

Package and deploy only the tested repository source, its reviewed generated
migrations, and the resolved checkout-local binding. Keep source-write
credentials, active hosting identity, temporary packages, and protected
settings out of source control and user-visible output.

Repository changes reach `main` only through an owner-reviewed pull request
using **Rebase and merge**. An agent must not push or merge directly to `main`.
Because a rebase merge creates new commit identifiers, post-merge packaging and
checkpoint work begins on a fresh `codex/*` branch from the updated
`origin/main`; it never reuses the pre-merge feature branch as provenance.

## 3. Create the first private checkpoint

Save and deploy a private version. Wait for Sites deployment status to report a
successful result; a version-save response alone is not deployment proof.
Record the exact private URL returned by the successful status for setup and
review.

If the selected hosting path cannot deploy privately, stop and ask the owner
before using any shared or public access level. Do not choose a broader access
level to complete a test.

The first private checkpoint may show safe unconfigured guidance because the
owner setting and profile do not yet exist. That is expected: it must not grant
the first visitor write access.

## 4. Configure protected runtime settings

Use the selected Site's protected runtime-settings control. Do not ask the
owner to paste their email or any credential into a prompt, issue, commit,
source file, migration, screenshot, or chat response.

| Setting | Setup action |
| --- | --- |
| `AITTA_SOCIAL_OWNER_EMAIL` | Owner enters their verified ChatGPT email directly in protected settings. Required for all writes. Do not infer it from the Site owner/access record; that hosting identity may differ. |
| `AITTA_SOCIAL_CANONICAL_URL` | Set to the normalized canonical HTTPS deployment URL. Use the private Sites URL until the owner later approves and configures another canonical domain. |
| `AITTA_SOCIAL_HUB_URL` | Optional HTTPS Hub origin; no path, credentials, query, or fragment. |
| `AITTA_SOCIAL_HUB_CHALLENGE` | Optional current verification challenge. It becomes public in discovery after redeployment. |
| `AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL` | Optional protected secret issued by Hub. It never becomes public. |

Redeploy privately after a runtime-setting change that must reach the deployed
server. Verify status again before testing. Never print a setting value while
checking that its key is configured.

## 5. Complete the initial Identity and first update

1. Open the private Site and choose the local owner-management entry to use Sign
   in with ChatGPT. This sign-in administers only this presence; it does not
   join or sign in to the AittaSocial network.
2. Confirm that the authenticated email matches the protected owner setting by
   reaching Your presence, not by displaying either email.
3. Open `/owner/profile` and configure Identity: display name, short
   description, longer introduction, optional location/website/external links,
   canonical URL, accent color, density, and attribution preference. Ordinary
   setup does not ask for or display an identity category.
4. Use the temporary form preview to check the display name, short description,
   accent, and required-field progress. The preview is not saved progress:
   reload discards unsaved form changes, and only a successful **Save identity**
   write creates or updates the durable D1 profile.
5. Return to **Your presence** after saving. The owner workspace derives one of
   three states on every request: fresh when no profile exists, incomplete when
   a stored profile has no valid effective canonical URL, and complete only
   when both the profile and effective canonical URL exist.
6. Save and reopen the public presence. It should look intentional with no
   updates and should describe the represented identity rather than AittaSocial.
   Inspect its document metadata: title and description come from the public
   Identity, and canonical/sharing URLs use the normalized configured canonical
   URL rather than the request host.
7. Create a draft update at `/owner/entries/new`; verify it is visible to the
   owner but returns the same public not-found result as an unknown entry.
8. Publish a test update, open its `/entries/{id}` permalink, then unpublish it
   and confirm it disappears from every public HTML, metadata, and JSON route.

The effective canonical URL follows one server-owned rule: a valid normalized
`AITTA_SOCIAL_CANONICAL_URL` takes precedence, otherwise the normalized URL
stored with Identity is the fallback. The owner workspace may show that
normalized effective public URL and whether the protected runtime override or
stored fallback selected it. It never prints an invalid/raw runtime value. Hub
setup remains a separately labeled advanced, provisional destination and does
not participate in Identity readiness or public preview.

Identity and update writes use the stable profile and entry models in this
deployment's D1 database and do not require another deployment after each edit.
For protocol 1.0 compatibility, a new profile stores the neutral `accountType`
value `other`, while later edits neither accept nor modify the field and
therefore preserve an existing supported value. The stored value remains
readable only through the public manifest and `/api/v1/site`; it is not a setup
choice or trust claim. No D1 migration or protocol-version change is required.
The readiness and preview UI adds no persistent field, private endpoint, or
public protocol change.

### Optional source-only identity assets

The template's default identity is typographic and its sharing metadata is
text-only. It deliberately includes no generic software logo, favicon, or
social-preview image. If the owner supplies an identity asset, make it a normal,
directly checked-in source file, reference only that reviewed file, and add a
useful text alternative wherever an image is exposed. Do not accept a remote
image URL from a request, add a runtime asset resolver or setting, or provision
an upload UI, media manager, R2 bucket, or new storage subsystem.

This customization is an ordinary reviewed repository change followed by a
separately approved deployment. It does not modify the Identity record, D1
schema, or public JSON protocol. Before packaging, confirm the intended source
asset exists in the build output and that removed or superseded assets do not.

## 6. Test access without broadening it

Before public release, verify:

- signed-out public presence, published-update, manifest, and `/api/v1` behavior
  using automated production-equivalent request fixtures;
- matching-owner access to Your presence and every write;
- a different signed-in identity receiving no administrative access;
- missing-owner behavior disabling every write;
- draft and private-canary absence from HTML, JSON, headers, links, errors, and
  pagination;
- profile- and published-update-derived document metadata, neutral unconfigured
  `noindex, nofollow` metadata, hostile request-host rejection, and absence of
  image references when no direct checked-in identity asset exists; and
- public presence reads while the optional Hub test times out or fails.

A private Sites access policy may prevent anonymous traffic from reaching the
application at all. Do not temporarily publish the Site to work around that
boundary. Use the local/automated signed-out fixture until the owner explicitly
approves public access. Hosting privacy and application authorization are both
required during setup.

## 7. Optional provisional AittaSocial Hub setup

The presence remains fully readable without this section. AittaSocial Hub is a
separate service and must treat every presence deployment as an untrusted
external website.

This is a manual challenge and root bearer probe only. It does not register the
presence, establish network membership or a session, or create a trusted Hub
connection. Keep it visibly provisional until an accepted versioned Hub
contract replaces the entire flow; do not extend it by guessing Hub endpoints,
claims, or credential semantics.

1. Configure and privately deploy this presence, including its owner and
   canonical URL.
2. Open AittaSocial Hub separately.
3. Sign in with ChatGPT at Hub; that Hub sign-in, not this presence's local
   sign-in, establishes any network-user identity.
4. Submit this deployment's canonical URL to Hub.
5. Receive an opaque verification challenge from Hub.
6. Save the challenge as `AITTA_SOCIAL_HUB_CHALLENGE` in this Site's protected
   runtime settings.
7. Redeploy privately and verify that
   `/.well-known/aitta-social.json` exposes exactly the current challenge and no
   protected values.
8. Ask Hub to retrieve and verify the manifest.
9. Receive a deployment credential from Hub and save it as the protected
   `AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL` secret. Never paste it into the owner
   page or browser.
10. Configure `AITTA_SOCIAL_HUB_URL` as the exact HTTPS Hub origin, redeploy,
    and run the owner-only transport probe at `/owner/hub`.

The POC transport test is provisional because Hub has no established API
contract for it. `POST /api/private/hub/test` accepts no request body or
destination. Server code sends a short-timeout `GET` to the configured HTTPS
origin root with `Accept: application/json` and the deployment credential in an
`Authorization: Bearer ...` header. It does not follow redirects with the
credential and does not read, return, or log the response body.

The internal result is one of `connected`, `credentialRejected`, `reachable`,
or `unavailable`. These categories describe transport/credential-probe results;
even `connected` is not a verified connection or trusted network
authentication. They do not affect public presence operation.

## 8. Inspect and save the review checkpoint

Start the Sites agent preview and inspect at least:

- public presence with no updates;
- public presence with representative published updates at wide and narrow
  widths;
- each public update kind and a permalink;
- keyboard navigation, visible focus, labels, errors, contrast, text zoom, touch
  targets, and reduced-motion behavior;
- missing-owner guidance;
- Your presence, Identity form, update editor, state transitions, delete
  confirmation, and provisional Hub setup/status; and
- a signed-in non-owner and signed-out public response using the safe test
  boundary described above.

Correct functional, responsive, accessibility, and visual problems, rerun the
checks, then save one final review version under the Site's current
owner-approved access. A Site that is still private stays private. If the owner
has already explicitly approved broader access, preserve that exact access
without broadening it further. Poll Sites deployment status until it succeeds
and use the returned checkpoint URL for owner review.

The handoff must state what is implemented, what is intentionally excluded,
which protected setting keys remain required, the checkpoint URL and its actual
access level, and open owner decisions. It must not include setting values,
credentials, or internal hosting/database identifiers.

### Focused public hierarchy review

Use empty and populated local fixtures; the populated fixture should contain
all four update kinds, a translated introduction, a genuinely long visible
hostname, and long unbroken public text. At a 320 CSS-pixel viewport, confirm
that the document `scrollWidth` does not exceed its `clientWidth`, public
navigation and content are single-column, and each visible public link or
button has a target box at least 44 CSS pixels high. Repeat at a 1280-pixel
desktop viewport enlarged to 400 percent, whose effective layout viewport is
320 CSS pixels.

Use the keyboard to move focus through the skip link, presence name, owner
management action, update links, attribution, and technical links. Confirm the
two-layer focus indicator is visible on both light and dark surfaces; with
forced colors active it must use the system highlight. With reduced motion
enabled, confirm smooth scrolling, transitions, and animations are disabled.
Record separately what was measured in a rendered browser and what was covered
only by automated route or source assertions; do not present source matching as
rendered geometry evidence.

## Public release is a separate approval

After private review, ask explicitly before either:

- changing access from private to public; or
- connecting a custom domain.

Approval for one does not imply approval for the other. Re-test canonical URLs,
signed-out reads, draft privacy, discovery, JSON responses, and owner-only
writes after any approved access or domain change.

The reusable `@Sites` prompt for repeating this guarded flow is maintained in
the repository [README](../README.md#reusable-deployment-prompt).
