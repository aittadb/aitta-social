# TASK-175 public Privacy acceptance

## Outcome

`/privacy` is a D1-independent human page that describes only the current
application behavior recorded in `docs/privacy.md`. It covers public profile
and published-update projections, private drafts, sole-owner authorization,
protected runtime settings, the ChatGPT Sites processing boundary, the current
lack of a Hub connection, retention limits, and the absence of an app-owned
analytics subsystem. It deliberately supplies no operator identity, contact
address, consent system, or legal promise.

The page has fixed neutral metadata: `noindex, nofollow`, no canonical URL, no
Open Graph URL, and no image metadata. A failed D1 binding, hostile request
host, owner setting, canonical setting, or Hub challenge does not select or
enter the response. Handler-produced HTML retains `no-store, must-revalidate`
and the fixed application CSP.

The public footer now exposes a native `/privacy` link. The owner preference
continues to hide only the restrained `Powered by AittaSocial` attribution;
the GitHub source link remains visible and uses `noopener noreferrer`. The
owner form now names only that attribution, matching the unchanged stored
preference and public rendering behavior. No route, API payload, D1 query,
schema, migration, authorization decision, runtime setting, or external state
changed.

## Focused automated evidence

- `tests/privacy-page.test.mjs` proves D1 independence, exact neutral metadata,
  required truthful content, hostile host and protected-value isolation,
  permanent Privacy and GitHub links in both attribution states, safe external
  link semantics, 44-pixel footer targets, wrapping, focus, reduced-motion,
  and no-gradient source contracts.
- `tests/accessibility-contract.test.mjs` proves the hidden-attribution public
  journey keeps GitHub and Privacy while hiding the powered-by link and copy.
- `tests/assisted-runtime-journey.test.mjs` proves the complete owner checkbox
  retains its semantic 44-pixel label after its wording is narrowed to the
  attribution it actually controls.

The focused build and the three focused suites passed with 33 tests and zero
failures before full repository validation.

## Rendered evidence

The built local Worker was rendered in the in-app browser at these CSS
viewports:

| Viewport | Evidence |
| --- | --- |
| `320×568` | One-line 61-pixel header; h1 wrapped to two lines; document width stayed within the layout viewport; all footer links measured at least 44 CSS pixels high and at least 44 CSS pixels wide. |
| `390×844` | H1 and every h2 stayed inside the 16-pixel gutters; document width stayed within the layout viewport; public copy remained readable and naturally wrapped. |
| `1440×900` | The human content remained centered at 732 CSS pixels rather than stretching across the desktop; the h1 stayed on one line and the footer remained full-width. |

The semantic snapshot exposed the skip link, one main landmark, one h1, six
labeled h2 regions, native return navigation, Privacy, GitHub, and the existing
machine-resource links in logical source order. Screenshots showed no clipping
or horizontal overflow. The temporary responsive override was isolated to the
test tab. A bounded attempt to drive browser-level 400-percent page scale did
not return before the browser controller was interrupted, so this record does
not claim an observed CDP zoom result. The equivalent 320-pixel reflow contract
is covered by the rendered narrow view and focused CSS assertions; a later
common-frame acceptance pass may repeat native 400-percent zoom in a stable
controller.

## Validation and review

The focused commit was rebased without conflict onto
`7a5c059ce61fcbf23466b757be2cbb09e3ff22b6`, the exact current
`origin/develop` used for validation. `npm run validate` passed every agent,
license, plan, instance, runtime, migration-drift, type, lint, build, and test
gate with 204 tests and zero failures. `npm audit --omit=dev` reported zero
vulnerabilities. Final clean-source, diff, and independent review results are
reported with the commit handoff.

No hosted Site, domain, access policy, database, protected setting, Hub,
sibling repository, or other external state was read or changed by this task.
