# ChatGPT Sites deployment and setup

Deploy AittaSocial private-first. Reuse the existing Site linked to this source
when there is one, give it its own D1 database, configure the sole owner through
protected runtime settings, and verify a private checkpoint before considering
public access.

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

## 5. Complete the initial profile

1. Open the private Site and use Sign in with ChatGPT.
2. Confirm that the authenticated email matches the protected owner setting by
   observing owner access, not by displaying either email.
3. Open `/owner/profile` and configure the display name, account type, short
   description, longer introduction, optional location/website/external links,
   canonical URL, accent color, density, and attribution preference.
4. Save and reopen the public account page. It should look intentional with no
   entries and should describe the deployed account rather than AittaSocial.
5. Create a draft at `/owner/entries/new`; verify it is visible to the owner but
   returns the same public not-found result as an unknown entry.
6. Publish a test entry, open its `/entries/{id}` permalink, then unpublish it
   and confirm it disappears from every public HTML and JSON route.

Profile and entry writes go directly to this deployment's D1 database and do
not require another deployment after each edit.

## 6. Test access without broadening it

Before public release, verify:

- signed-out public account, published-entry, manifest, and `/api/v1` behavior
  using automated production-equivalent request fixtures;
- matching-owner dashboard and every write;
- a different signed-in identity receiving no administrative access;
- missing-owner behavior disabling every write;
- draft and private-canary absence from HTML, JSON, headers, links, errors, and
  pagination; and
- public account reads while the optional Hub test times out or fails.

A private Sites access policy may prevent anonymous traffic from reaching the
application at all. Do not temporarily publish the Site to work around that
boundary. Use the local/automated signed-out fixture until the owner explicitly
approves public access. Hosting privacy and application authorization are both
required during setup.

## 7. Optional AittaSocial Hub setup

The account remains fully readable without this section. AittaSocial Hub is a
separate service and must treat every account deployment as an untrusted
external website.

1. Configure and privately deploy this account, including its owner and
   canonical URL.
2. Open AittaSocial Hub separately.
3. Sign in with ChatGPT at Hub; that Hub sign-in, not this account's local
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
    and run the owner-only connection test at `/owner/hub`.

The POC connection test is provisional because Hub has no established API
contract for it. `POST /api/private/hub/test` accepts no request body or
destination. Server code sends a short-timeout `GET` to the configured HTTPS
origin root with `Accept: application/json` and the deployment credential in an
`Authorization: Bearer ...` header. It does not follow redirects with the
credential and does not read, return, or log the response body.

The owner sees only `connected`, `credentialRejected`, `reachable`, or
`unavailable`. These categories describe transport/credential-probe results;
they are not trusted network authentication and do not affect public account
operation.

## 8. Inspect and save the review checkpoint

Start the Sites agent preview and inspect at least:

- public account with no entries;
- public account with representative published entries at wide and narrow
  widths;
- each public entry kind and a permalink;
- keyboard navigation, visible focus, labels, errors, contrast, text zoom, touch
  targets, and reduced-motion behavior;
- missing-owner guidance;
- owner dashboard, profile form, entry editor, state transitions, delete
  confirmation, and Hub setup/status; and
- a signed-in non-owner and signed-out public response using the safe test
  boundary described above.

Correct functional, responsive, accessibility, and visual problems, rerun the
checks, then save one final private version. Poll Sites deployment status until
it succeeds and use that returned private URL for owner review.

The handoff must state what is implemented, what is intentionally excluded,
which protected setting keys remain required, the private checkpoint URL, and
open owner decisions. It must not include setting values, credentials, internal
hosting/database identifiers, or claim that the Site is public.

## Public release is a separate approval

After private review, ask explicitly before either:

- changing access from private to public; or
- connecting a custom domain.

Approval for one does not imply approval for the other. Re-test canonical URLs,
signed-out reads, draft privacy, discovery, JSON responses, and owner-only
writes after any approved access or domain change.

The reusable `@Sites` prompt for repeating this guarded flow is maintained in
the repository [README](../README.md#reusable-deployment-prompt).
