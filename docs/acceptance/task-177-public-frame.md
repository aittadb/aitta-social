# TASK-177 public frame acceptance

## Outcome

Every human-public route now composes the same fixed `PublicPageFrame`: the
one-line public header, `Manage` owner destination, public footer, and existing
global skip target remain consistent for configured and unconfigured home,
published updates, Privacy, Technical, storage-unavailable, and not-found
states. The private owner workspace remains outside this component.

The frame accepts only already-projected display name, identity destination,
optional profile attribution fields, and a management destination supplied by
the route. It performs no D1, runtime, authentication, authorization, request,
or metadata access. Privacy and Technical therefore remain D1-independent, and
not-found keeps draft/unknown parity without inferring profile attribution. A
route that already loaded a public profile applies the existing owner-selected
powered-by preference; GitHub, Privacy, and
Technical stay present in every footer.

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

The local compiled Worker journey must be observed at 320, 390, and 1440 CSS
pixels; 400-percent reflow; keyboard skip/header/footer focus; coarse touch;
forced colors; and reduced motion. Record no horizontal overflow, no sticky
obstruction, no private canary, and no console error before tracker
finalization. This task makes no hosted, data, configuration, schema,
migration, or deployment mutation.
