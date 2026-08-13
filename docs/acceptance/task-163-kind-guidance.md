# TASK-163 — Update-kind composer guidance

## Scope

This record covers the owner update composer only. It adds kind-specific,
plain-language guidance without changing entry payloads, routes, authorization,
storage, validation authority, or public projections.

## Acceptance checks

- Text remains the first and required composer field.
- Note, Article, Announcement, and Link each explain their purpose and which
  fields are required or optional. Link explicitly requires its destination
  URL and native validation reflects that requirement.
- Switching kinds changes guidance only. Body, title, and destination inputs
  stay mounted with their values intact.
- Existing private-draft wording, definitive validation recovery, unknown-save
  recovery, owner authorization, and public draft isolation remain unchanged.

## Automated evidence

`tests/update-composer.test.mjs` renders every kind through the compiled owner
routes and asserts the exact guidance, Link requirement, body-first order,
uncontrolled value-bearing fields, and the controlled selector boundary that
updates guidance without a field key/remount. It also retains the existing
four-kind create/edit, validation, denial-before-mutation, public-canary, long
content, error-focus, and recovery assertions.

## Rendered evidence

The reviewed exact candidate ran through the compiled Worker behind a
temporary, local-only fixture proxy at
`http://127.0.0.1:43166/new/owner/entries/new`. The proxy loaded the reviewed
`dist/server` Worker with a disposable D1, the existing migration, synthetic
owner headers, and no Site, hosted-D1, or external mutation. It supplied
separate synthetic new, draft-Link edit, published Announcement, long Article,
unconfirmed-save, non-owner, and missing-owner fixtures.

At 320, 390, and 1440 CSS-pixel viewports, client and scroll widths were
equal (305/305, 375/375, and 1425/1425 after the browser scrollbar), the form
was bounded to 277, 347, and 760 pixels respectively, no visible interactive
control was offscreen, and the smallest visible target was 44 CSS pixels.
The body remained first. The interactive new-draft review entered body, title,
and destination values, then changed Article, Announcement, Link, and Note:
each exact kind explanation and Link's native required state changed as
expected while all three values remained unchanged. The Kind control had the
shared visible three-pixel solid focus outline and three-pixel offset.

One additional exact-candidate controller pass verified DPR-4 at a 320 CSS
pixel viewport (320 viewport pixels, 305/305 client/scroll pixels), with no
horizontal overflow, undersized effective target, or private canary. It also
verified active forced colors with system-visible button colors and the same
three-pixel Kind focus outline; reduced motion had no nonzero transition or
animation duration and used `scroll-behavior: auto`; and coarse-pointer and
any-pointer modes retained no overflow or target below 44 pixels. The
non-owner and missing-owner routes showed neither form nor their synthetic
private canaries at 1280 pixels.

The final exact-candidate failure fixture retained an entered body through a
synthetic `500` response. Its local evidence endpoint recorded exactly one
received POST. The page stayed on the failure route, showed the exact
unknown-result recovery status, disabled Save, and exposed the existing `Check
saved updates before retrying` recovery link. This confirms no automatic retry
or second save is offered after an unconfirmed result. The final failure tab
had no browser warning or error log entries.

The empty-Link review produced the browser's required-destination validation
message. The controller did not expose an active focused element for that
native-validation submission, so this record does not make a focus-placement
claim for it.

The browser controller did not advance its active element through sequential
Tab in this review, so this record makes no sequential-Tab observation claim.
Source order, native labels, visible focus styling, and the focused regression
coverage remain the evidence for that keyboard contract.
