# TASK-177 public frame acceptance

## Outcome

Every human-public route now composes the same fixed `PublicPageFrame`: the
one-line public header, context-neutral `Manage` link to `/owner`, public footer, and existing
global skip target remain consistent for configured and unconfigured home,
published updates, Privacy, Technical, storage-unavailable, and not-found
states. The private owner workspace remains outside this component.

The frame accepts only already-projected display name and optional profile
attribution fields. It owns the fixed identity destination `/` and fixed
management destination `/owner`, and performs no D1, runtime, authentication,
authorization, request, or metadata access. Privacy and Technical therefore
remain D1-independent, and not-found keeps draft/unknown parity without
inferring profile attribution or hardcoding an attribution exception. A route
that already loaded a public profile applies the existing owner-selected
powered-by preference; all profile-null public states retain the normal visible
attribution. GitHub, Privacy, and Technical stay present in every footer.

The frame itself owns the fixed `/owner` destination and
`Manage this Aitta’s local sole-owner administration` accessible name. This
identifies the local single-owner boundary without implying AittaSocial network
identity or membership. Public routes do not inspect ChatGPT identity or
construct a sign-in URL: Sites owns any sign-in redirect from `/owner`.
Permalink-local update actions use a labelled navigation region, leaving the
shared `PublicFooter` as the page's only footer landmark.

## Automated evidence

`tests/public-frame.test.mjs` covers configured/unconfigured/unavailable home,
published/draft/unknown permalinks, global not-found, Privacy, and Technical.
It pins one public main landmark, fixed `Manage` header, common footer links,
safe D1-failure rendering, draft privacy, frame purity, and attribution
selection. Existing public contract, accessibility, Privacy, Technical,
metadata, CSP, and navigation tests continue to cover response headers,
allowlists, native links, the global skip target, 44-pixel controls, reduced
motion, forced colors, and private-canary exclusion.

## Rendered evidence

The exact compiled Worker from `ae40b4d0fbbc1cd50d5dd280f22ab09000b82e12`
was exercised only through a disposable local Miniflare/D1 fixture at 320, 390,
and 1440 CSS pixels. The fixture had one configured published article plus a
private draft-canary row, neutral unconfigured and storage-unavailable states,
an owner-hidden-attribution profile, and long unbroken profile/update values.
It did not use a hosted Site, active configuration, identity, or persisted
data.

At all 36 state/viewport cells—configured and unconfigured home,
storage-unavailable home, published permalink, draft and unknown permalink
404s, global 404, Privacy, Technical, hidden attribution, long home, and long
permalink—the rendered page had exactly one main landmark, one public
navigation header, and one shared public footer. The visible `Manage` link
always targeted `/owner` and exposed the exact accessible name `Manage this
Aitta’s local sole-owner administration`. Every visible interactive control was
at least 44 by 44 CSS pixels, none was off-screen, and `scrollWidth` equalled
`clientWidth`. The expected scrollbar reduced static-page clients to
305/375/1425 CSS pixels at 320/390/1440, respectively, but never introduced
horizontal overflow. The shared Powered by attribution appeared everywhere
except the explicit owner-hidden fixture. Neither private draft canary appeared
in any public DOM.

At 320 CSS pixels with device pixel ratio 4, forced colors, reduced motion,
and coarse pointer/touch emulation, the configured page retained equal 320
client and scroll widths, zero undersized or off-screen controls, and no
sticky/fixed header or main obstruction. Forced-colors native keyboard focus on
the Manage link was visible as a 3-pixel outline; its transition and animation
durations were `0s` and the document scroll behavior was `auto`. Native Tab
input also visibly focused the header Manage link and footer Privacy and
Updates links, each with the normal 3-pixel focus outline. The direct native
focus checks establish the shared header/footer focus treatment; a complete
sequential-Tab traversal was not separately enumerated. Browser warn/error
logs were empty after the matrix.

The final source gates for this exact runtime were `npm run validate` 282/282,
focused public-frame checks 85/85, `npm run db:generate` with no schema change,
`npm audit --omit=dev` with zero vulnerabilities, and clean diff checks. An
independent Sol review of `ae40b4d` found no P0, P1, or P2 issue. This
evidence-only record amendment does not alter the compiled runtime or tests.
No hosted, data, configuration, schema, migration, or deployment mutation was
made.
