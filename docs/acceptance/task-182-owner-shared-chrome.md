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

Rendered compiled-Worker evidence will be recorded against the exact validated
task commit before integration. It must cover configured owner Home, Identity,
new-update, and existing-update pages plus non-owner and missing-owner safe
states at 320, 390, and 1440 CSS pixels; the signed-out redirect; 320 CSS pixels
at device pixel ratio 4; native keyboard focus; 44-pixel targets; touch input;
forced colors; reduced motion; overflow, obstruction, private-canary, and
console checks. No hosted Site or external state is used.

## Non-effects

This presentation-only task adds no schema or migration, D1 operation, runtime
setting, auth decision, API or public route, mutation, client router, metadata,
CSP, cache policy, Hub behavior, hosting change, or external mutation.
