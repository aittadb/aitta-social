# TASK-182 owner shared chrome acceptance

## Outcome

Every authorized owner document now uses one maintained `OwnerShell` with a
clearly private Aitta header, exactly three owner routes, one content frame, and
one shared-resource footer. Home, Identity, New update, and existing-update
editing preserve their route behavior and apply one native current-page state.
`View Aitta` and the Sites-owned sign-out destination remain native links.

Non-owner and missing-owner results use the same private-context header and
footer without rendering the authorized owner navigation, form, update list,
or management destination. Their safe access decision still occurs before any
D1 read. Signed-out requests remain Sites navigation redirects and render no
application body.

The new `AittaFooterResources` is the only extracted shared component. It is a
fixed, effect-free navigation containing Privacy, Technical, the official
GitHub source, Manifest, Profile, and Updates. It accepts no children, links,
content, profile, identity, D1, request, runtime, authentication, or
authorization input. `PublicPresenceHeader` and `PublicFooter` remain private
to `PublicPageFrame`, which retains its fixed `/` identity link, `/owner`
management link, and profile-controlled attribution semantics.

## Automated evidence

`tests/owner-shared-chrome.test.mjs` exercises configured owner Home, Identity,
new-update, and existing-update documents; non-owner, missing-owner, and
signed-out outcomes for all four routes; exact redirects; authorization-before-
D1 read canaries; one main and skip target; header, navigation, footer, resource
links, active-page semantics, safe-state exclusions, exact sign-out path, pure
shared resources, private public-frame internals, 44-pixel CSS contracts, and
absence of sticky owner chrome. Existing accessibility, Identity, assisted
runtime, public-frame, CSP, owner-security, API, projection, and metadata tests
remain regression coverage for the unchanged boundaries.

## Rendered evidence

The exact compiled Worker from `cff764a175acb3c0978699fc884dd429ba8d3152`
was exercised through a disposable loopback-only fixture. It contained one
configured profile, one long unbroken private draft, non-owner and missing-owner
states whose D1 binding throws a private canary if read, and a signed-out state.
It used no hosted Site, active configuration, retained identity, or external
state.

At 320, 390, and 1440 CSS pixels, all 18 configured owner Home, Identity,
new-update, existing-update, non-owner, and missing-owner cells had exactly one
main landmark, one global skip target, one private header, one owner footer,
and all six fixed resource links. Configured pages had exactly one three-link
owner navigation and one current-page state; safe states had neither that
navigation nor owner forms or entry lists. Every visible control was at least
44 by 44 CSS pixels, no control was off-screen, no fixed or sticky owner chrome
obstructed content, and `scrollWidth` equalled `clientWidth`. The expected
vertical scrollbar reduced clients to 305, 375, and 1425 CSS pixels,
respectively, without horizontal overflow. Neither auth-result nor D1-failure
canaries appeared.

At 320 CSS pixels and device pixel ratio 4, the existing-update page passed
forced-colors, reduced-motion, coarse-pointer, and touch emulation with equal
305-pixel client and scroll widths, zero undersized or off-screen controls,
zero sticky/fixed obstruction, no nonzero transition or animation duration,
and `scroll-behavior: auto`. Direct native keyboard focus checks covered the
skip link, Manage, View Aitta, all three owner destinations, Privacy,
Technical, GitHub, and sign-out; each was visible and received the forced-color
3-pixel focus outline. The direct checks establish the shared chrome focus
treatment; a complete sequential-Tab traversal was not separately enumerated.
Under the same touch/coarse-pointer emulation, native `View Aitta` and Identity
link activation reached the public document and owner Identity document, and
the latter retained its current-page state. Browser warn/error logs were empty.

The signed-out browser request reached the exact Sites navigation URL
`/signin-with-chatgpt?return_to=%2Fowner` and rendered no owner frame or owner
navigation. Automated compiled-Worker tests additionally pin that redirect and
authorization-before-D1 behavior for all four owner routes without retaining a
private body.

The source gates for this exact runtime were `npm run validate` 288/288,
`npm run db:generate` with no schema change, `npm audit --omit=dev` with zero
vulnerabilities, and a clean diff check. This evidence-only record amendment
does not alter runtime source or tests. Independent review and final rebase
evidence are recorded by integration before task archival.

## Non-effects

TASK-188 subsequently adds Pages as a fourth bounded owner destination. That
later change does not alter the exact three-route runtime or rendered evidence
recorded above for TASK-182.

This presentation-only task adds no schema or migration, D1 operation, runtime
setting, auth decision, API or public route, mutation, client router, metadata,
CSP, cache policy, Hub behavior, hosting change, or external mutation.
