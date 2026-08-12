# TASK-168 Aitta setup and unavailable journeys

TASK-168 introduces the accepted Aitta vocabulary only in the unconfigured
setup, copyable deployment prompt, unavailable-storage state, and their neutral
metadata. Configured public and owner wording remains owned by later tasks.

## Definition of done audit

The task remains one focused vertical outcome. The fresh setup explanation,
prompt, action names, unavailable-storage distinction, and neutral metadata are
one first-visit contract: splitting them could describe the same empty or
failed read inconsistently. The outcome requires no schema, migration, protocol,
route, API, protected setting, hosting binding, or external-state change.

## Accepted behavior

- After a successful empty D1 read, the public setup page gives the full
  approved first-use explanation: an Aitta is independently controlled and
  remains authoritative for its identity, content, configuration, and locally
  stored data whether public, private, or disconnected from AittaSocial Hub.
- The page says that a profile is an Aitta's optional outward identity
  presentation, identifies this Aitta as having no profile and no current Hub
  connection, and keeps the first Identity guidance private-first.
- The labeled read-only prompt uses the same normalized 110-word value in the
  runtime and README. It still requires exact-Site reuse, duplicate avoidance,
  ambiguity escalation, private-first access, Aitta-owned storage, one owner
  through protected Site settings, no owner email in prompt or source, no
  current Hub connection, normal signed-in owner controls without a fork, and
  separate approval for later source/deployment, public access, and domain
  operations.
- A failed D1 read says that Aitta storage is unavailable and never shows the
  setup prompt or implies that the Aitta is new. Signed-out visitors retain the
  Sign in with ChatGPT owner destination; every signed-in visitor retains the
  ordinary `/owner` destination without a public owner-match claim.
- Empty and failed reads have distinct neutral metadata. Both remain
  `noindex, nofollow`, omit canonical and `og:url` sharing URLs and image
  metadata, ignore request and forwarding hosts, and retain dynamic HTML
  `no-store, must-revalidate` caching and the fixed application CSP.

## Privacy, authorization, and compatibility evidence

Compiled-Worker tests cover signed-out, signed-in owner, signed-in non-owner,
missing-owner, published-update beside empty profile, configured profile,
unavailable D1, hostile-host, runtime-canonical, prompt-copy, and private-canary
states. A selective entries-query failure also proves that a successful
configured-profile read cannot leave indexable or canonical metadata on the
unavailable body. Public setup never reports an authorization result. The owner
and non-owner destinations are unchanged, and the protected owner route still
performs its own server-side authorization. Draft, owner, storage-error,
profile-row, runtime-canonical, and authenticated-email canaries remain absent
from public HTML, metadata, headers, links, and errors.

Internal component, CSS, fixture, and test identifiers remain stable. Public
JSON, discovery, entry routes, D1 models, migrations, protocol 1.0, owner
mutations, CSP, static-asset caching, and configured public rendering are
unchanged. No Site, package, deployment, hosted D1, setting, access policy, DNS,
custom domain, Hub, or sibling repository was read or mutated.

## Rendered browser evidence

A disposable migrated local D1 and the development Worker rendered the
signed-out fresh setup page in the Codex in-app Chromium browser. At a
320-by-900 CSS-pixel viewport, `innerWidth` was 320; the scrollbar-reduced
document client and scroll widths were both 305, so there was no horizontal
overflow. The textarea stayed within the content column, every visible link or
textarea measured at least 44 CSS pixels high, and the console contained no
warning or error.

The browser then used a device scale factor of 4 with a 320-by-900 CSS-pixel
layout: the measured physical width was 1280 pixels, document client and scroll
widths again matched at 305, all visible controls remained inside the viewport,
and the minimum control height remained 44 CSS pixels. The viewport metadata
remained `width=device-width, initial-scale=1`. Keyboard-dispatched focus on the
setup link, prompt textarea, and Manifest link showed the existing solid
3-pixel, 3-pixel-offset focus indicator. Selecting and copying the prompt from
the textarea produced the exact rendered 110-word value, with a clean console.

The in-app controller did not advance sequential focus when raw Tab events were
sent to the page body, so this evidence does not claim a controller-observed
end-to-end Tab order. It does prove native focusability and the rendered focus
indicator on representative first, middle, and later controls; source and
automated accessibility assertions separately retain native anchors, the
labeled textarea, focus rules, and absence of client-side navigation or
clipboard code. Signed-in identity states and the forced D1-failure state were
covered through production-equivalent compiled-Worker fixtures rather than by
injecting identity or breaking storage in the browser.

## Validation

The focused direct suite passes 44 tests, and the listener-backed fresh,
upgrade, and unavailable D1 suite passes 5 tests. Migration generation reports
no schema drift; the complete repository gate passes all 197 tests; the
production dependency audit reports zero vulnerabilities; and the diff check
passes. Final commit evidence is recorded by the integration owner when this
task is integrated.
