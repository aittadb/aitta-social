# AittaSocial Aitta setup and deployment operations

Deploy AittaSocial private-first. Reuse the existing Site linked to this source
when there is one, give the Aitta its own D1 database, configure its sole
owner through protected runtime settings, and verify a private checkpoint
before considering public access.

When the D1 profile read succeeds and no Identity exists, the public template
leads with the same short prompt shown at the top of the README. The prompt is
selectable in a labeled read-only field, so it can be copied without running a
browser write or granting authority. A configured Site never shows that prompt:
it leads with the represented Identity. A D1 read failure shows a temporary
unavailable state and must never be described as a new or unconfigured Site.

Do not publish publicly or connect a custom domain without the Aitta owner's
explicit approval.

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
Sites provisions and wires the Aitta-owned D1 resource. Do not add an
external database, shared content storage, an object bucket, or media
infrastructure.

Package and deploy only the tested repository source, its reviewed generated
migrations, and the resolved checkout-local binding. Keep source-write
credentials, active hosting identity, temporary packages, and protected
settings out of source control and user-visible output.

For an existing Aitta deployment, review the
[local in-place upgrade proof](upgrade.md) before packaging. It verifies the
reviewed historical-prefix-to-candidate-tail transition against persisted local
D1 state, owner authorization, draft privacy, canonical metadata, public APIs,
and fresh-versus-upgraded prompt behavior. Its closed-Worker local file copy is
neither atomic nor a hosted backup or restore. Before any approved hosted schema
change, separately verify the current provider backup/export and recovery
facilities; do not infer hosted rollback from the local fixture.

`develop` is the shared integration workspace. Feature branches start from and
rebase onto `origin/develop`; only the integration owner serializes their
complete validated commits and tracker updates there. A release promotes
`develop` to `main` through an owner-reviewed pull request using **Rebase and
merge**; an agent must not merge or directly update `main`. Post-feature work
begins on a fresh `codex/*` branch from updated `origin/develop`. After a
release merge, checkpoint work waits until the owner refreshes
`origin/develop` from updated `origin/main`; it never reuses the pre-merge
branch or labels its commit as the merged source.

`develop` is also an accepted maintained Sites source branch. Once a checkpoint
has its own explicit approval, its exact validated and pushed `develop` commit
may be packaged and deployed without waiting for the later pull request to
`main`. Record the configured branch and commit truthfully; never label that
checkpoint as `main`.

## 3. Create the first private checkpoint

Save and deploy a private version. Wait for Sites deployment status to report a
successful result; a version-save response alone is not deployment proof.
Record the exact private URL returned by the successful status for setup and
review.

If the selected hosting path cannot deploy privately, stop and ask the owner
before using any shared or public access level. Do not choose a broader access
level to complete a test.

The first private checkpoint may show the public creation prompt because the
profile does not yet exist. That is expected only after a successful empty D1
read: it must not grant the first visitor write access, reveal whether a signed-
in visitor matches the owner, or expose protected configuration. The owner path
still performs its normal server-side authorization before displaying controls.

## 4. Configure protected runtime settings

Use the selected Site's protected runtime-settings control. Do not ask the
owner to paste their email or any credential into a prompt, issue, commit,
source file, migration, screenshot, or chat response.

| Setting | Setup action |
| --- | --- |
| `AITTA_SOCIAL_OWNER_EMAIL` | Owner enters their verified ChatGPT email directly in protected settings. Required for all writes. Do not infer it from the Site owner/access record; that hosting identity may differ. |
| `AITTA_SOCIAL_CANONICAL_URL` | Set to the normalized canonical HTTPS Aitta deployment URL. Use the private Sites URL until the owner later approves and configures another canonical domain. |
| `AITTA_SOCIAL_HUB_CHALLENGE` | Optional current verification challenge. It becomes public in discovery after redeployment. |

Redeploy privately after a runtime-setting change that must reach the deployed
server. Verify status again before testing. Never print a setting value while
checking that its key is configured.

## 5. Complete the initial Identity and first update

1. Open the private Site and choose the local owner-management entry to use Sign
   in with ChatGPT. This sign-in administers only this Aitta; it does not
   join or sign in to the AittaSocial network.
2. Confirm that the authenticated email matches the protected owner setting by
   reaching the owner workspace, not by displaying either email.
3. Open `/owner/profile` and configure Identity: display name, short
   description, longer introduction, optional location/website/external links,
   canonical URL, accent color, density, and attribution preference. Ordinary
   setup does not ask for or display an identity category.
4. Use the temporary form preview to check the display name, short description,
   accent, and required-field progress. The preview is not saved progress:
   reload discards unsaved form changes, and only a successful **Save identity**
   write creates or updates the durable D1 profile.
5. Return to the owner workspace after saving. It derives one of
   three states on every request: fresh when no profile exists, incomplete when
   a stored profile has no valid effective canonical URL, and complete only
   when both the profile and effective canonical URL exist.
6. Save and reopen the public profile. It should look intentional with no
   updates and should describe the represented identity rather than AittaSocial.
   Inspect its document metadata: title and description come from the public
   Identity, and canonical/sharing URLs use the normalized configured canonical
   URL rather than the request host.
7. With complete Identity and no updates, the owner workspace leads to **Create
   first draft**. Save the draft, leave the editor, and return to the owner
   workspace. It must offer to resume that same stable draft identifier and
   state clearly that the draft remains private until publication.
8. Publish the test update. The owner workspace then marks the first-update
   journey complete and offers both the public preview and the stable
   `/entries/{id}` permalink while retaining the normal edit, unpublish, and
   delete controls. Unpublish it and confirm the same D1 record becomes the
   resumable private draft again and disappears from every public HTML,
   metadata, and JSON route.

The effective canonical URL follows one server-owned rule: a valid normalized
`AITTA_SOCIAL_CANONICAL_URL` takes precedence, otherwise the normalized URL
stored with Identity is the fallback. The owner workspace may show that
normalized effective public URL and whether the protected runtime override or
stored fallback selected it. It never prints an invalid/raw runtime value.
There is no current owner Hub control or connection state, and Hub does not
participate in Identity readiness or public preview.

Identity and update writes use the stable profile and entry models in this
Aitta's D1 database and do not require another deployment after each edit.
The signed-in owner can also change the supported accent, density, public links,
and attribution visibility through those existing controls. These ordinary
changes persist in D1 across reloads and do not require a repository fork,
source edit, or Hub connection. The creation prompt provides no separate agent
token, write endpoint, or authorization path.

### Supervised ChatGPT-assisted owner controls

An owner may ask ChatGPT to operate the normal owner interface in the same
foreground browser session. The human owner first establishes the Sites-owned
sign-in session; the application then performs its ordinary server-side owner
and same-origin checks for every save. ChatGPT receives no separate identity,
token, endpoint, or authority. It may navigate, fill Identity and presentation
fields, create or edit a private draft, and use preview or unpublish controls
only while the owner supervises that signed-in browser.

Publishing is the deliberate stop point. Choosing **Publish** opens a native
confirmation that identifies the update and states that it will become public.
A browser-controlling ChatGPT must stop there, show the request to the human
owner, and accept the confirmation only after the owner explicitly approves
that publication. A deployment request, prior approval to make the Site public,
an earlier publication, or permission to edit a draft is not publish approval.

If a browser request loses its response, or the server returns a 5xx response,
the interface describes the result as unknown, keeps current form inputs in
place, and offers a native link to reload the applicable saved Identity, update,
or dashboard state. Reload before retrying: the server may have committed the
first request, so an immediate retry could create a second draft or reverse the
wrong state. A 4xx validation or authorization response re-enables the control
and shows its safe server message without adding the ambiguous-result recovery
link.

Rollback stays within the existing product model. Reloading before a successful
Identity save discards its transient preview. A saved Identity or presentation
choice can be replaced by saving the previous explicit values; there is no
version history. Unpublishing returns the same update to its private draft
state, and deleting remains a separate destructive confirmation. Saved draft
edits likewise have no revision history, so preserve text separately before a
destructive replacement when recovery matters.

These controls modify only Aitta-owned D1 content. They do not fork or
edit GitHub source, redeploy the Site, change protected settings, change access,
or connect a domain. Any source change, deployment, public-access change, or
custom-domain action remains a separately reviewed and explicitly approved
operation outside this assisted runtime workflow.

For protocol 1.0 compatibility, a new profile stores the neutral `accountType`
value `other`, while later edits neither accept nor modify the field and
therefore preserve an existing supported value. The stored value remains
readable only through the public manifest and `/api/v1/site`; it is not a setup
choice or trust claim. No D1 migration or protocol-version change is required.
The readiness, resumable first-update guidance, and preview UI are derived on
each authorized server request from the existing profile and entries. Two
bounded prepared reads select the earliest draft and published entry by
creation time and stable identifier, independently of the 200-row management
list. They add no onboarding record, persistent field, browser storage,
private endpoint, schema migration, publication behavior, or public protocol
change. Hub configuration and availability do not select or block a
first-update state.

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

- signed-out public profile, published-update, manifest, and `/api/v1` behavior
  using automated production-equivalent request fixtures;
- matching-owner access to the owner workspace and every write;
- a different signed-in identity receiving no administrative access;
- missing-owner behavior disabling every write;
- draft and private-canary absence from HTML, JSON, headers, links, errors, and
  pagination;
- profile- and published-update-derived document metadata, neutral unconfigured
  `noindex, nofollow` metadata, hostile request-host rejection, and absence of
  image references when no direct checked-in identity asset exists; and
- public profile reads without any Hub request or configuration.

A private Sites access policy may prevent anonymous traffic from reaching the
application at all. Do not temporarily publish the Site to work around that
boundary. Use the local/automated signed-out fixture until the owner explicitly
approves public access. Hosting privacy and application authorization are both
required during setup.

## 7. Optional public verification challenge

The Aitta remains fully readable without this setting. The POC has no Hub
connection, Hub registration, private Hub control, configured Hub destination,
deployment credential, or outbound probe. Do not invent any of those behaviors
without a separately accepted versioned contract.

Leave `AITTA_SOCIAL_HUB_CHALLENGE` empty unless a separately accepted
verification process supplies an opaque current challenge. If one is supplied,
save it in protected runtime settings, redeploy privately, and verify that
`/.well-known/aitta-social.json` exposes exactly that value and no protected
data. The public challenge proves only that someone could modify the Aitta
deployment at verification time. It is not authentication, registration, network
membership, a session, or a trusted connection. Remove it and redeploy when it
is no longer current.

## 8. Inspect and save the review checkpoint

Start the Sites agent preview and inspect at least:

- public profile with no updates;
- public profile with representative published updates at wide and narrow
  widths;
- each public update kind and a permalink;
- keyboard navigation, visible focus, labels, errors, contrast, text zoom, touch
  targets, and reduced-motion behavior;
- missing-owner guidance;
- the owner workspace, Identity form, update editor, state transitions, delete
  confirmation, and native owner navigation; and
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

Use the keyboard to move focus through the skip link, profile display name, owner
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
