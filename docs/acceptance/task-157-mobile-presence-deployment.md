# TASK-157 mobile-presence deployment evidence

Date: 2026-08-11

## Exact source and deployment

- The one existing AittaSocial Site was reused. No Site, database, binding, or
  domain was created.
- The deployed source is the owner-reviewed `main` commit
  `18fa16dc967d8502c17afb2bd3cc28518039a172`. This is the exact commit that
  contains TASK-154 through TASK-156 and was validated and packaged.
- The existing Sites source branch was synchronized from its prior reviewed
  source to that exact rebase-merged commit with a lease-protected update. This
  did not modify GitHub `main` or `develop`.
- Sites saved exactly one new version, version 8, from that commit. The saved
  archive contains 105 files and reports provider content hash
  `sha256:f7f49a36c0a78fb4ed0d7dc1e79dbde08534440942cdffbba301c7908337271e`.
- The local package SHA-256 was
  `818c171351da17e58b12d92312b00f433b7e9edcc59ae4ac354c9441687ff9e6`.
  It contained the Worker, 26 emitted assets, the `DB` binding, null R2, and the
  reviewed `0000_closed_talos.sql` migration. Source, staged, and packaged
  migration SHA-256 values all matched
  `95455a11b0795cfbfeb4ad0edfa07c2e75d076b14b142c9dfb1feb1c849e3c8a`.
- The version 8 deployment reached terminal `succeeded` status at
  `https://aittasocial.jaakko-heusala.chatgpt.site`. The configured canonical
  presence remains `https://jhh.aitta.social`.

## Preserved hosted boundaries

- Before and after deployment, access remained public at policy revision 4,
  with the same one allowed owner and no group or external-visitor grant.
- The protected environment remained at revision 5 with the same two keys and
  value-safe fingerprints: `AITTA_SOCIAL_CANONICAL_URL` and the secret
  `AITTA_SOCIAL_OWNER_EMAIL`. No protected value was copied into this record.
- The sole custom hostname remained active with active provider and TLS status.
  The binding remained deployment-owned D1 as `DB`, with R2 null.
- No access, grant, environment, D1, content, binding, DNS, domain, Hub, or
  GitHub-branch mutation was made as part of the Site deployment. Public
  manifest, site, and fully paginated entry projections were semantically
  identical before and after deployment.
- Read-only owner views loaded without submitting a form. The public collection
  remained published-only, and a privately checked non-public permalink was
  indistinguishable from an unknown entry without recording its identifier,
  content, state, or count.

## Hosted public result

- Both Site and canonical roots returned `200` and rendered the compact
  one-line frame, solid graphical identity field, initials tile, concise About
  area, and identity-linked chronological update stream.
- The former `Public presence`, numbered editorial Introduction, entry sequence
  number, and generic `Read update` treatment were absent.
- The discovery manifest, `/api/v1/site`, collection, selected detail API, and
  published permalink retained protocol 1.0, documented JSON envelopes,
  published-only projection, content types, cache behavior, and canonical
  `https://jhh.aitta.social` resource links.
- Dynamic HTML retained `no-store, must-revalidate` and the exact fixed CSP:

  `default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; block-all-mixed-content`

- All seven assets referenced by the current root were same-origin and returned
  `200`. Public time-link navigation reached the permalink and the native
  return link reached the presence with an empty fresh browser console.
- Signed-out `/owner` retained the dispatcher-owned `307` sign-in redirect.
  The signed-in owner dashboard and Identity form loaded read-only. A separate
  hosted non-owner session was not available; the exact-source authorization
  suite remains the decisive non-owner denial proof.
- Retired `/owner/hub` and `/api/private/hub/test` routes returned generic,
  non-redirecting `404` responses. No current application asset failed after
  cutover and the observed Worker requests completed without exceptions.

## Rendered acceptance

- At requested `390×844`, the document had no horizontal overflow or off-screen
  target. The 61-pixel header, 96-pixel identity field, 80-pixel tile, 30-pixel
  name, complete About area, Updates heading, 44-pixel source row, and meaningful
  first body content all appeared in the first viewport. Eleven visible targets
  had a minimum effective rectangle of approximately `44.125×44` CSS pixels.
- At requested `320×568`, the browser content area was 305 CSS pixels wide; the
  complete first source row and beginning of the first body remained visible,
  with no horizontal overflow, off-screen control, or sub-44-pixel target.
- At `1440×900`, the identity and stream stayed bounded to 700 pixels, the
  primary name was 38 pixels, and the same target and overflow checks passed.
- Reduced-motion mode matched and removed nonzero animation and transition
  durations. Forced-colors mode hid decorative shapes, retained the identity
  field boundary, kept browser color adjustment enabled, and showed a
  three-pixel system-colored focus outline with a three-pixel offset.
- Normal keyboard focus was visible on the skip and Manage links with the
  expected three-pixel outline and offset. The in-app controller did not invoke
  the browser's default Enter navigation, so hosted evidence does not claim
  that synthetic activation. Exact-source TASK-156 Chrome evidence covers
  native Enter and coarse-pointer behavior, while this checkpoint proves hosted
  hrefs, focus, touch-size geometry, and native click navigation.
- Browser media and viewport overrides were reset and task-created tabs were
  closed. Fresh application console output was empty.

## Validation and residual uncertainty

- On the exact deployed source, `npm run validate` passed every repository gate
  with 191/191 tests, `npm run db:generate` produced no migration change,
  `npm audit --omit=dev` reported zero production vulnerabilities, and the
  tracked tree was clean before packaging.
- Sites does not expose byte-level hosted-D1 or DNS-zone checksums. Preservation
  is therefore bounded to unchanged provider-visible configuration, identical
  public semantic projections, read-only owner observations, and the absence of
  any mutation call.
- This evidence/tracker commit is later than, and is not mislabeled as, the
  deployed source. Promotion of the evidence on `develop` to GitHub `main`
  remains an owner-reviewed pull request.
