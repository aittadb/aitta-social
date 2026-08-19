# TASK-197 — Private update deletion JSON acceptance

## Scope and decision

This slice normalizes only `DELETE /api/private/entries/{id}` and the confirmed
owner deletion client. It adds no schema, migration, machine authority, public
v1 behavior, Hub behavior, hosting change, or external mutation.

An authorized deletion returns exactly:

```json
{
  "data": {
    "id": "requested-id",
    "type": "owner-entry-deletion",
    "attributes": { "deleted": true }
  },
  "links": [
    { "rel": "collection", "href": "/owner", "mediaType": "text/html" },
    { "rel": "recovery", "href": "/owner", "mediaType": "text/html" }
  ],
  "actions": []
}
```

The two `/owner` links are intentionally distinct relations for the existing
saved-update dashboard and recovery destination. There is no deleted self
link or new private collection endpoint.

## Automated evidence

`tests/private-entry-delete-json.test.mjs` proves both draft and published
deletions, exact body/headers/cache/Vary, public unknown parity, missing,
wildcard, compatible, excluded, malformed, and oversized Accept, every
unsupported method's `405 Allow: PUT, DELETE`, same-origin/signed-out/non-owner/
missing-owner precedence ahead of Accept/parameters/D1/body, bodyless handling,
safe unknown/storage results, private-canary redaction, and exact 4xx versus
unconfirmed client parsing including redirects, malformed JSON, wrong IDs,
links/actions, and oversized response streams.

Existing lifecycle, edit, owner-access, public-projection, and deletion tests
are updated only where their former `204` or status-only delete assertion was
made stale. They preserve publication behavior, native confirmation/cancel,
fixed recovery, one request/no retry, and edit/lifecycle availability after an
unconfirmed deletion result.

## Browser evidence

The fresh disposable Miniflare/D1 fixture at `http://127.0.0.1:43201` served
the compiled `84582ad920f44b879a4b7ee1c6fc8fa8152c5836` candidate. It used
only synthetic records and one-shot local faults; no protected setting, Site,
deployment D1, access, domain, public content, or external service changed.

- Safari showed the native confirmation for the exact published label and full
  stable identifier. With the user's action-time approval, confirming the
  synthetic published deletion navigated to the fixed `/owner`: the published
  count became zero, the published row and its permalink were absent, and the
  independently retained draft still exposed Edit, Publish, and Delete.
- Cancelling Safari's published-row confirmation retained that Published row,
  Edit, public permalink, Unpublish, and Delete, and rendered `Deletion
  cancelled. This update was not deleted.`. A synthetic structured `422`
  retained the draft and left Delete available with the structured
  rejected-request result.
- Against the published record, one-shot `500`, malformed `200`, malformed
  `422`, and a dropped connection each rendered the row as Published and kept
  Edit, public permalink, and Unpublish available. Only Delete was disabled;
  each showed `The deletion result could not be confirmed. Check this Aitta’s
  saved state before deleting this update again.` and the recovery link resolved
  to `/owner`.
- The synthetic non-owner owner page rendered `This Aitta is not yours to
  administer` and no owner navigation or entry controls. The missing-owner
  surface rendered `Administration is safely disabled`, protected-setting and
  redeploy guidance, and no entry controls.

The in-app browser ran the same compiled candidate with no warnings or errors
(`[]`). Its actual measurements were:

| State | Observed result |
| --- | --- |
| Normal `320×800` | `document/client` widths `305/305`; every control was at least 44 CSS pixels. No control was off screen except the pre-existing owner-navigation horizontal scroller: **Pages** spanned `274.7–341.4` while the document remained 305 pixels wide. |
| Normal `390×844` and `1440×900` | `document/client` widths `375/375` and `1425/1425`; all controls were at least 44 CSS pixels and none was off screen. |
| Emulated DPR 4 at `320×800` | `inner/client/document` widths `320/320/320`, DPR `4`, all controls at least 44 CSS pixels, and Delete rectangles visible. |
| Forced colors and reduced motion | Both media queries matched; Delete transition and animation durations were `0s`; controls remained at least 44 CSS pixels. Forced focus rendered a solid `3px rgba(0, 230, 255, 0.8)` outline with `3px` offset. |
| Coarse touch and ordinary focus | `pointer` and `any-pointer` were coarse; `document/client` widths were `305/305` and the minimum target stayed 44 CSS pixels. Programmatic Delete focus rendered a `3px` solid outline with `3px` offset. |

The browser evidence makes no literal browser-zoom or sequential-Tab traversal
claim. The automated strict-reader matrix separately covers wrong link/action/
ID, oversized stream, and private-canary cases.

## Final validation

After recording the evidence, `npm run validate` passed all instruction,
license, plan, instance, runtime, migration-presence, type, lint, production
build, and test gates (`499/499`). `npm run db:generate` reported no schema
changes, `npm audit --omit=dev` found zero vulnerabilities, and `git diff
--check` was clean. The fixture remained local and disposable.
