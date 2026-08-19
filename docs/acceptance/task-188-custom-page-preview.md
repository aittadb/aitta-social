# TASK-188 safe custom-page import preview

## Outcome and boundary

The sole owner can open `/owner/pages/import`, enter a title, optional
description, and one page-body HTML fragment, and inspect both the normalized
`PageDocumentV1` JSON and the same document rendered through a closed React
renderer. The operation stores and publishes nothing. It has no D1 query,
outbound request, public route, custom-path resolver, shell, design, CSS import,
asset, or deployment behavior.

The input HTML is visible only as the escaped value of the owner textarea. It
is never put into an HTML, style, script, hydration, log, database, URL, or
response field. A successful response contains only the normalized closed
document and fixed relative owner links. The client validates that complete
shape and its semantic bounds again before rendering it.

## Parser and dependency decision

The compiler uses exact-pinned `parse5@8.0.1`, with its production dependency
`entities@8.0.0`, because the Worker runtime has no DOM parser and a regex or
ad-hoc tokenizer is not an accepted HTML security boundary. Both packages are
ES modules. Inspection found no runtime Node built-in import in their shipped
code, and the production Worker/RSC/client build succeeds with the parser.

The compiler performs a standards-aware fragment parse with source locations
and rejects any reported parse error. It separately performs a source-located
full-document parse because the HTML fragment algorithm intentionally discards
`html`, `head`, `body`, and doctype wrappers. An explicitly sourced wrapper or
doctype is therefore rejected before the fragment tree is compiled.

Every accepted element must be in the HTML namespace and have explicit start
and end tags. Exact tag and attribute allowlists compile only the v1 section,
heading, paragraph, list, link-group, group, inline emphasis/code, and link
unions. Comments are discarded. Unknown, active, foreign, shell, document,
malformed, implicitly repaired, or unclosed markup fails as the same fixed
`import_rejected` error without reflecting source.

Links compile only as:

- a canonical same-page fragment that resolves to a unique section fragment;
- exact `/updates`;
- a bounded credential-free absolute `https:` URL without raw or encoded
  control characters; or
- a deliberately narrow `mailto:` or `tel:` contact URL.

All other relative, protocol-relative, active, malformed, credential-bearing,
or unsupported URLs reject the whole import. Page-ID targets remain unavailable
until a later persisted-page resolver is accepted.

The request is capped while streaming at 192 KiB. The closed output is capped
at 128 KiB JSON, 64 sections, 1,024 block/inline nodes, depth five, 100,000 text
characters, and 128 links, with the accepted field, text-node, label, URL, and
fragment limits. Bounds reject rather than truncate. Duplicate or reserved
fragments, unresolved fragment links, and a heading-level skip reject.
Compiler and normalized-document failures use the one fixed, non-reflective
`import_rejected` error. The outer JSON request-envelope limit is a transport
boundary and uses the distinct fixed `request_too_large` error; invalid title,
description, schema, or input shape uses a structured, fixed
`validation_failed` error. None includes submitted values or source markup.

## Private endpoint

`POST /api/private/pages/preview` checks exact same origin and current sole-owner
authorization before Accept negotiation, media inspection, body streaming, or
parsing. It accepts only bounded JSON with optional UTF-8 charset and returns
JSON with `Cache-Control: no-store` and `Vary: Accept`. Every unsupported method
passes through the same authorization boundary before returning `405` with
`Allow: POST`. Missing, non-owner, and unconfigured owner states return their
existing safe distinctions; raw identity values are never returned.

The route imports no repository or storage service. Focused tests use a D1
substitute that throws on access, proving both successful and rejected previews
perform no storage query or mutation. The compiler calls no fetch or remote
resource API.

## Rendered acceptance

A disposable local production-build fixture served exact runtime commit
`6e239d398edb6c43c0093e05091bc65ecbe4c50c`. It injected only synthetic owner
identity and one-shot response faults and made no hosting or external mutation.
At 390 CSS pixels, one representative document exercised flow, split, cards,
same-page fragment, `/updates`, HTTPS, mail, and telephone links. The result
announced `Preview ready.` and focused its preview heading. The fragment was
scoped to `#page-preview-contact`; `/updates`, `mailto:`, and `tel:` remained
same-context native links; HTTPS used `_blank` with `noopener noreferrer` and
the accessible suffix `(opens in a new tab)`. The normalized JSON textbox said
explicitly that it excludes the raw source.

Long allowed content with 400 repetitions of an unbroken token was rendered at
320, 390, and 1,440 CSS pixels. The respective client/document widths were
305/305, 375/375, and 1,425/1,425. Each state had one main, a ready preview, no
off-screen production control outside the intentionally scrollable owner route
bar, and a 44-pixel minimum interactive height. The
JSON textbox scrolled internally while the document did not overflow. At 320,
the non-wrapping owner route bar scrolled internally without creating document
overflow: it measured 305 CSS pixels client width and 353 CSS pixels scroll
width within a 305 CSS-pixel document. Pages was initially clipped within that
bounded route bar, as intended, while the document remained 305/305. The
browser controller could not demonstrate a native keyboard-focus reveal, so
this evidence makes no such claim.

WCAG 2.2 SC 1.4.10 defines 320 CSS pixels as the reflow width equivalent to a
1,280 CSS-pixel viewport at 400-percent zoom. The measured 320 CSS-pixel result
therefore supplies the required 400-percent-reflow-equivalent evidence: one
main, no exterior horizontal overflow, the normalized JSON confined to its
internal scroller, and production targets at least 44 pixels high. Literal
browser zoom was also observed independently in external Chrome on this exact
fixture: after the eighth View → Zoom In level, Chrome accessibility output
reported `Zoom: 400%`. The screenshot showed the owner header and import
content reflowed vertically; the owner route bar retained its intentional
horizontal scroller with Pages clipped at the right, while the accessibility
tree retained all four route links and every import control. That literal-zoom
observation did not collect numeric document widths, computed target heights,
JSON scrolling, console state, or a complete sequential keyboard traversal;
those claims remain grounded only in the named 320 CSS-pixel and other rendered
measurements above. Chrome was reset through View → Actual Size and reported
`Zoom: 100%`. Separately, a DPR-4,
1,280-physical-pixel emulation measured
1,280/1,265/1,265 for outer/client/document width and retained the same control
and overflow result; DPR is recorded only as high-density evidence, never as
browser zoom.

A real compiler rejection of `<script>SERVER_PRIVATE_CANARY</script>` returned
the fixed import error, focused the HTML fragment control, set `aria-invalid`,
and associated both help and error text. The canary remained only in the
textarea value and was absent from the body preview. One-shot 500 and malformed
200 responses retained source, rendered no preview or canary, re-enabled the
form, and announced respectively the fixed temporary-unavailable and
unable-to-verify recovery messages. During an 800-millisecond response delay,
the form was busy, all three source controls and submit were disabled, and the
status was `Normalizing the page fragment…`; completion restored the form and focused
the `Slow snapshot` preview heading.

Synthetic non-owner and missing-owner requests rendered one main, the six
fixed footer resources, and their correct safe headings, with no owner
navigation, import form, or private canary. With forced colors and reduced
motion active at 320, the focused title had a visible three-pixel solid outline,
transitions and animations measured zero seconds, there was no overflow, and
the submit control remained 44 pixels high. Coarse touch emulation retained
44-pixel, on-screen production controls, although the browser did not expose a
readable coarse-pointer navigator value. The console contained no warnings or
errors after reset. One native Tab focus was observed; this evidence does not
claim a complete sequential-tab traversal.

## Validation record

The exact source candidate was rebased directly on
`7e3d689fbddfbec1a2936365502051ea1fbec100`. Focused parser, private-route,
owner-chrome, accessibility, and identity tests passed 143/143. The full
repository validation passed 472/472, the production dependency audit found
zero vulnerabilities, the production build succeeded, migration generation
reported no schema change, and diff checks were clean. Final independent
security and accessibility review is recorded against the frozen commit before
integration. No migration was added because this slice deliberately has no
persistence. No hosting, deployment, Hub, R2, D1, domain, or other external
mutation was authorized or performed.
