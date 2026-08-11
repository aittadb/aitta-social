# TASK-148 runtime accent acceptance

TASK-148 keeps fork-free accent customization while preventing an accepted or
legacy value from producing unreadable CSS. The owner preference remains the
authoritative D1 and protocol 1.0 value. Only rendering uses a derived color.

## Fixed rule

`lib/presentation-accent.ts` owns the one pure rule used by the public home,
published permalink, and saved/live owner preview:

1. Accept only an exact six-digit hex string at the rendering boundary;
   otherwise return `#31554d`.
2. Calculate WCAG relative luminance from linearized sRGB and the standard
   `(lighter + 0.05) / (darker + 0.05)` contrast ratio.
3. Keep a valid color tonally unchanged after lower-case normalization when it
   reaches 4.5:1 against `#eef0eb`.
4. Otherwise interpolate each 8-bit channel toward `#31554d` at integer step
   `n` from 1 through 255 using
   `Math.round(source + (target - source) * n / 255)`. For nonnegative channel
   values, an exact half tie therefore rounds upward. Return the first color at
   or above 4.5:1; the final fallback is the reviewed default.

`#eef0eb` is the darkest of the supported light canvases. Meeting the floor
there also meets it on public `#f3f0e8`, owner `#f7f7f3`, raised `#fbfaf6`, and
white surfaces. White is also the button foreground, and every derived dark
accent has greater contrast against white than against `#eef0eb`.

The resolver changes no saved value. A valid new write is still normalized by
the existing input parser and saved exactly; `/api/v1/site` returns that stored
value. Invalid historical rows also remain byte-identical in D1 and in the
existing public field, while every style property receives only the fixed
fallback. The application performs no read-time repair.

## Automated evidence

After a production build, `tests/presentation-accent.test.mjs` proves:

- `#000000`, `#ffffff`, safe/unsafe threshold neighbors, saturated colors, and
  fixed 8-bit interpolation outputs against all five light surfaces;
- strict fallback for malformed, whitespace-padded, short-hex, named, URL, and
  declaration-injection strings;
- one accepted `#FFFFFF` write becoming stored/protocol `#ffffff` while home,
  permalink, and owner preview all render the same safe `#55736c`;
- reload and all rendering reads leave D1 unchanged, and draft/owner private
  canaries stay outside public HTML;
- a malformed value inserted into a disposable historical D1 fixture survives
  Worker close/reopen and protocol projection while it cannot reach any public
  or owner style attribute; and
- the owner live-preview source invokes the same resolver on every input event,
  has no parallel preview-only color rule, and leaves forced-color adjustment
  enabled; and
- the test's five canvases and white button foreground are pinned directly to
  the current CSS tokens and component rules, so a palette change cannot leave
  the resolver's conservative-surface assumption silently stale.

`tests/upgrade-preservation.test.mjs` remains the complete frozen-fixture,
migration-tail, persisted-state, before/after behavior, authorization, backup,
and no-schema-drift proof. TASK-148 runs it unchanged in addition to the focused
malformed-legacy reopen case. `npm run db:generate` must report no generated
migration.

## Rendered evidence

Candidate `a2e25be6daeea978111d218e35f5a914c582c835` was built and opened against
one disposable loopback-only D1 fixture in Chrome 151.0.0.0 through the in-app
browser. No hosted resource or active hosting binding was used.

At a requested 1280-by-900 viewport (1265 CSS-pixel content width), the
configured public home, published `/entries/accent-rendered-update` permalink,
and authorized `/owner/profile` route all rendered stored `#ffffff` as derived
`#55736c`. The home identity-detail rule, permalink destination border, owner
preview border, and native progress accent computed to `rgb(85, 115, 108)`.
The permalink button retained white text on the same derived fill. The owner
color input itself retained raw `#ffffff`; changing it without saving to
`#000000` produced `#000000` in the live preview, and changing it back to
`#ffffff` immediately restored derived `#55736c`. The default owner save button
remained the safe fixed `#31554d` with white text.

The same three routes were repeated at a requested 320-by-900 viewport. Their
actual content widths were 305, 320, and 305 CSS pixels respectively, with
`scrollWidth` equal to `clientWidth` in every case. The raw owner control still
reported `#ffffff`, every presentation surface still reported `#55736c`, and
the progress and filled-button colors remained consistent. `#55736c` measures
4.513:1 against the conservative `#eef0eb` owner panel, 4.547:1 against the
public paper, and 5.179:1 against white button text.

With forced colors emulated as active, the preview, progress, button, and input
all retained browser-owned `forced-color-adjust: auto`; the browser replaced
the preview border and button colors with system colors rather than preserving
the custom accent. Native route controls remained actual anchors with their
existing 44-pixel target contract and no script keyboard handler. All six
wide/narrow route observations reached a complete document with zero horizontal
overflow and zero warning or error console entries; the forced-color pass also
reported zero such entries.

This task packages or deploys nothing and makes no Site, hosted D1, protected
setting, access, DNS, or custom-domain change.
