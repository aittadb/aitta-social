# TASK-192 — Private Identity JSON acceptance

## Contract and boundary

TASK-192 normalizes only `PUT /api/private/profile` and the authorized Identity
client. It adds no public or versioned resource, discovery link, machine
authority, schema, migration, alternate private route, hosting setting, or
external mutation.

The route preserves its security order: exact same-origin first, current sole
owner second, then bounded Accept/media/body processing, domain validation, and
D1. Every response is JSON with `Cache-Control: no-store` and `Vary: Accept`.
Missing, wildcard, and JSON-compatible Accept values select JSON; an explicit
JSON exclusion is `406`. Missing or unsupported Content-Type is `415`, malformed
or over-64-KiB JSON is `400`, valid domain-invalid JSON is `422`, and every
unsupported method is `405` with exactly `Allow: PUT`. Authorization, storage,
and unexpected failures use fixed safe structured errors.

Success is `200` with one explicit `owner-profile` resource. Its attributes are
only the editable profile fields. Links point canonically to the private JSON
resource, owner Identity page, and public profile; the one `edit` action is
present only because the request has already verified the browser owner. The
response omits protocol `accountType`, timestamps, owner/runtime configuration,
authentication headers, raw D1 rows, drafts, and machine or Hub state. Public
profile and v1 projections remain unchanged.

The client sends explicit JSON Accept/Content-Type and validates the returned
success type and allowlisted attribute shape before treating a response as
confirmed. Structured 4xx fields focus the matching control and permit a
corrected retry. Fetch failure, 5xx, an unexpected success status, wrong media,
or malformed success remains unconfirmed; another save is disabled until the
owner reloads server state.

## Automated evidence

`tests/private-profile-json.test.mjs` exercises the compiled Worker success
document, canonical-host independence, editable-field allowlist, current edit
action, Accept and Content-Type matrices, streaming body bound, malformed JSON,
domain validation, authorization-before-body/D1 order, exact methods and Allow,
safe storage failure, an unexpected protected-owner-setting failure before D1,
private canaries, and the client's confirmed/definitive/unconfirmed parser. The
unexpected-failure regression also verifies that the compiled Worker emits no
canary through console error logging. Updated Identity, security, validation, accent,
reproducibility, assisted-runtime, presence, and upgrade suites retain save/
reload, D1, category-neutrality, public projection, and no-D1 denial evidence.
Migration review is no schema change.
The full repository validation passes 270/270 tests, `npm run db:generate`
reports no schema change, `npm audit --omit=dev` reports zero production
vulnerabilities, and type, lint, build, runtime, instance, agent, plan,
license, migration, and diff checks pass.

## Disposable compiled-Worker browser evidence

On 2026-08-13, the in-app Browser exercised the production build through two
loopback-only proxies over freshly migrated disposable D1 databases. The proxy
supplied only the existing explicit owner fixture and served the exact compiled
client assets; it did not read active hosting configuration or contact a Site.

At 390 configured pixels (375 CSS-pixel document width), changing Display name
immediately produced **Unsaved changes** and **Unsaved preview** while retaining
`375 = 375` client/scroll width. Saving consumed the route's JSON `200`,
navigated once to `/owner/profile`, and reloaded **Saved values loaded** with the
new exact value. A separate manual reload retained that D1 value.

Entering an invalid external-link scheme produced the structured `422` path:
the page announced **Identity was not saved. Correct the highlighted fields and
try again.**, focused `#profile-externalLinks`, showed the safe domain message,
kept Save enabled, did not navigate, and did not reflect the submitted canary.
Correcting the link then saved and reloaded successfully.

A second fixture returned a synthetic safe JSON `500` without dispatching the
write. The hydrated client retained the unsaved value, announced the exact
unconfirmed-save guidance, disabled Save, and exposed **Reload saved Identity
before retrying**. That native link reloaded the original server-saved value and
re-enabled Save. At 320, 390, and 1440 configured widths the recovered document
reported respectively `305 = 305`, `375 = 375`, and `1425 = 1425` client/scroll
widths with no off-screen interactive control. Browser warning/error logs were
empty and no private canary appeared.

No hosted data, Site, deployment, setting, access, DNS, domain, Hub, sibling,
`main`, or production state changed.
