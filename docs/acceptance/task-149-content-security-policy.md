# TASK-149 content security policy acceptance

## Boundary and decision

`worker/index.ts` attaches one fixed `Content-Security-Policy` value only after
the application handler has produced a `text/html` response. The same wrapper
already owns the HTML `no-store, must-revalidate` rule, so configured,
unconfigured, owner, permalink, safe-unavailable, and framework 404 HTML cannot
silently bypass either boundary. JSON and static assets retain their existing
headers and caching.

The policy is:

```text
default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; block-all-mixed-content
```

The two inline allowances are deliberate and measured, not generic extension
points. The current Vinext render contains same-origin module chunks plus
dynamic inline RSC/bootstrap scripts whose contents include route and rendered
data. It also contains one inline font stylesheet and React style attributes
for the constrained accent. A fixed hash cannot cover those content-dependent
scripts. A secure nonce design would require a fresh unpredictable value on
every response and on every emitted script and style; the fixed header and
current Vinext output provide no such attachment boundary, and a reused fixed
nonce would not be safe. The policy therefore keeps inline script and style
execution only while blocking script attributes, evaluation, wildcards,
data/blob sources, objects, external framing, mixed content, and every unlisted
resource class. When Vinext emits
font URLs they must stay beneath `/_next/static/_vinext_fonts/`; its local
font-family-only fallback is also compatible because it requests no external
resource. An artifact that references an external font origin does not satisfy
this task.

This is a Worker response-header change only. It adds no schema or migration,
runtime setting, public protocol field, authentication behavior, external
origin, hosting binding, or deployment operation.

## Automated evidence

`tests/content-security-policy.test.mjs` proves:

- the exact policy and existing HTML cache rule on configured and unconfigured
  public pages, an authorized owner page, a published permalink, draft and
  unknown 404 pages, and the safe D1-unavailable page;
- the measured inline bootstrap/font/style needs, same-origin chunk, CSS, and
  preload paths, plus same-origin packaged-font paths whenever this exact build
  emits font URLs;
- rejection of wildcard, evaluation, data/blob, and external policy sources;
- React escaping of hostile profile and published-update markup while owner,
  profile-row, and entry-row canaries remain absent;
- the exact JSON cache/envelope and the Worker’s non-HTML pass-through; every
  referenced static file exists in `dist/client`, and the generated `_headers`
  file retains immutable caching for `/_next/static/*` outside the
  application-handler HTML wrapper; and
- native anchor navigation with no `next/link`, event-keyboard route shim, or
  positive-tab-order override.

## Rendered acceptance

Before TASK-149 is archived, the exact integrated candidate must be opened in
the in-app browser at wide and actual 320 CSS-pixel viewports. Public,
permalink, and owner navigation must remain native and keyboard focusable; the
packaged scripts, styles, and fonts must load; CSP violation, console warning,
and page-error counts must be zero. Record the browser version, exact commit,
routes, viewport dimensions, and console counts with the final task evidence.

No Site, hosted D1 data, protected setting, access policy, DNS record, or custom
domain is read or changed by this local acceptance work.
