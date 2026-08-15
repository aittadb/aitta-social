import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

import {
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  responseJson,
} from "./helpers/worker-harness.mjs";
import { assertPrivateJson } from "./helpers/private-json-response.mjs";
import { throwingD1 } from "./helpers/throwing-d1.mjs";

const ownerEmail = "owner@example.com";
const safeInput = {
  schemaVersion: 1,
  title: "Reference page",
  description: "A representative normalized preview.",
  htmlFragment: [
    "<!-- discarded -->",
    "<h2>Opening</h2>",
    "<p>Plain <strong>strong</strong>, <em>emphasis</em>, and <code>code</code>.</p>",
    '<section data-aitta-fragment="work" data-aitta-layout="split">',
    "<h2>Work</h2>",
    '<p>See <a href="#contact">contact</a>.</p>',
    '<div data-aitta-layout="cards">',
    "<h3>Selected work</h3>",
    "<ul><li>First item</li><li>Second <strong>item</strong></li></ul>",
    "</div>",
    "</section>",
    '<section data-aitta-fragment="contact">',
    "<h2>Contact</h2>",
    '<p data-aitta-link-group><a href="/updates">Updates</a> <a href="https://example.com/contact">Website</a> <a href="mailto:hello@example.com">Email</a> <a href="tel:+3581234567">Call</a></p>',
    "</section>",
  ].join(""),
};

test("authorized import returns the exact closed PageDocumentV1 without storage", async () => {
  const response = await preview(safeInput, { env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }) });
  assertPrivateJson(response, 200, { caseInsensitiveContentType: false });
  assert.deepEqual(await responseJson(response), {
    data: {
      id: "page-preview",
      type: "page-preview",
      attributes: {
        document: {
          schemaVersion: 1,
          title: "Reference page",
          description: "A representative normalized preview.",
          sections: [
            {
              fragment: null,
              layout: "flow",
              blocks: [
                { type: "heading", level: 2, text: "Opening" },
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Plain " },
                    { type: "strong", content: [{ type: "text", text: "strong" }] },
                    { type: "text", text: ", " },
                    { type: "emphasis", content: [{ type: "text", text: "emphasis" }] },
                    { type: "text", text: ", and " },
                    { type: "code", text: "code" },
                    { type: "text", text: "." },
                  ],
                },
              ],
            },
            {
              fragment: "work",
              layout: "split",
              blocks: [
                { type: "heading", level: 2, text: "Work" },
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "See " },
                    { type: "link", label: "contact", destination: { kind: "fragment", fragment: "contact" } },
                    { type: "text", text: "." },
                  ],
                },
                {
                  type: "group",
                  layout: "cards",
                  blocks: [
                    { type: "heading", level: 3, text: "Selected work" },
                    {
                      type: "list",
                      ordered: false,
                      items: [
                        [{ type: "text", text: "First item" }],
                        [
                          { type: "text", text: "Second " },
                          { type: "strong", content: [{ type: "text", text: "item" }] },
                        ],
                      ],
                    },
                  ],
                },
              ],
            },
            {
              fragment: "contact",
              layout: "flow",
              blocks: [
                { type: "heading", level: 2, text: "Contact" },
                {
                  type: "linkGroup",
                  links: [
                    { label: "Updates", destination: { kind: "updates" } },
                    { label: "Website", destination: { kind: "external", url: "https://example.com/contact" } },
                    { label: "Email", destination: { kind: "external", url: "mailto:hello@example.com" } },
                    { label: "Call", destination: { kind: "external", url: "tel:+3581234567" } },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    links: [
      { rel: "self", href: "/api/private/pages/preview", mediaType: "application/json" },
      { rel: "alternate", href: "/owner/pages/import", mediaType: "text/html" },
    ],
    actions: [{
      rel: "preview",
      method: "POST",
      href: "/api/private/pages/preview",
      requestMediaType: "application/json",
    }],
  });
});

test("all untrusted markup, URL, tree, and fragment failures share one non-reflective error", async (t) => {
  const privateCanary = "IMPORT_PRIVATE_CANARY<script>alert(1)</script>";
  const cases = [
    ["full document", "<!doctype html><html><body><h2>Hi</h2></body></html>"],
    ["document wrapper", "<html><body><h2>Hi</h2></body></html>"],
    ["head", "<head><title>Hi</title></head><h2>Body</h2>"],
    ["body", "<body><h2>Body</h2></body>"],
    ["page main", "<main><h2>Body</h2></main>"],
    ["site header", "<header><h2>Body</h2></header>"],
    ["site navigation", "<nav><a href=/updates>Updates</a></nav>"],
    ["site footer", "<footer><p>Footer</p></footer>"],
    ["page h1", "<h1>Extra title</h1>"],
    ["script", `<p>${privateCanary}</p>`],
    ["style", "<style>body{display:none}</style><h2>Body</h2>"],
    ["form", "<form><button>Send</button></form>"],
    ["frame", "<iframe src=https://attacker.example></iframe>"],
    ["svg", "<svg><script>alert(1)</script></svg>"],
    ["foreign object namespace", "<svg><foreignObject><p>Body</p></foreignObject></svg>"],
    ["math", "<math><mi>x</mi></math>"],
    ["image", "<img src=https://attacker.example/x>"],
    ["unknown element", "<article><h2>Body</h2></article>"],
    ["event attribute", "<p onclick=alert(1)>Body</p>"],
    ["style attribute", "<p style=color:red>Body</p>"],
    ["clobbering id", "<p id=owner>Body</p>"],
    ["unknown data attribute", "<p data-private=canary>Body</p>"],
    ["duplicate attribute", '<section data-aitta-fragment="one" data-aitta-fragment="two"><h2>Hi</h2></section>'],
    ["unclosed element", "<p>Body"],
    ["mismatched tree", "<p><strong>Body</p>"],
    ["adoption agency repair", "<p><strong><em>Body</strong></em></p>"],
    ["table foster parenting", "<table><p>Moved outside table</p></table>"],
    ["unclosed comment", "<h2>Body</h2><!--"],
    ["javascript URL", '<p><a href="javascript:alert(1)">Bad</a></p>'],
    ["entity-obfuscated active URL", '<p><a href="java&#x73;cript:alert(1)">Bad</a></p>'],
    ["entity-obfuscated URL control", '<p><a href="https://example.com/&#x0a;owner">Bad</a></p>'],
    ["data URL", '<p><a href="data:text/html,bad">Bad</a></p>'],
    ["blob URL", '<p><a href="blob:https://example.com/x">Bad</a></p>'],
    ["file URL", '<p><a href="file:///etc/passwd">Bad</a></p>'],
    ["insecure URL", '<p><a href="http://example.com">Bad</a></p>'],
    ["protocol relative URL", '<p><a href="//example.com">Bad</a></p>'],
    ["relative page URL", '<p><a href="/about">Bad</a></p>'],
    ["query relative URL", '<p><a href="?next=/owner">Bad</a></p>'],
    ["credential URL", '<p><a href="https://user:pass@example.com">Bad</a></p>'],
    ["encoded control URL", '<p><a href="https://example.com/%0aowner">Bad</a></p>'],
    ["malformed URL", '<p><a href="https://[invalid">Bad</a></p>'],
    ["duplicate fragment", '<section data-aitta-fragment="same"><h2>One</h2></section><section data-aitta-fragment="same"><h2>Two</h2></section>'],
    ["reserved fragment", '<section data-aitta-fragment="aitta-owner"><h2>One</h2></section>'],
    ["noncanonical fragment", '<section data-aitta-fragment="Mixed_Case"><h2>One</h2></section>'],
    ["unknown fragment target", '<p><a href="#missing">Missing</a></p>'],
    ["heading skip", "<h2>Two</h2><h4>Four</h4>"],
    ["link group prose", '<p data-aitta-link-group><a href="/updates">Updates</a> not a link</p>'],
    ["group without layout", "<div><p>Body</p></div>"],
    ["empty group", '<div data-aitta-layout="flow"></div>'],
    ["mixed-case document wrappers", "<HtMl><BoDy><h2>Body</h2></BoDy></HtMl>"],
  ];

  for (const [label, htmlFragment] of cases) {
    await t.test(label, async () => {
      const response = await preview({ ...safeInput, htmlFragment });
      assertPrivateJson(response, 422, { caseInsensitiveContentType: false });
      const body = await responseJson(response);
      assert.deepEqual(body, {
        data: null,
        error: {
          code: "import_rejected",
          message: "The HTML fragment could not be safely imported.",
        },
        links: [],
      });
      assert.doesNotMatch(JSON.stringify(body), /IMPORT_PRIVATE_CANARY|script|javascript|attacker/u);
    });
  }
});

test("field, request, and output bounds fail closed without truncation", async (t) => {
  const fieldCases = [
    ["title", { ...safeInput, title: "x".repeat(201) }],
    ["description", { ...safeInput, description: "x".repeat(501) }],
    ["unknown input field", { ...safeInput, privateCanary: "FIELD_PRIVATE_CANARY" }],
    ["future schema", { ...safeInput, schemaVersion: 2 }],
  ];
  for (const [label, input] of fieldCases) {
    await t.test(label, async () => {
      const response = await preview(input);
      assertPrivateJson(response, 422, { caseInsensitiveContentType: false });
      const body = await responseJson(response);
      assert.equal(body.error.code, "validation_failed");
      assert.doesNotMatch(JSON.stringify(body), /FIELD_PRIVATE_CANARY/u);
    });
  }

  const importCases = [
    ["heading text", `<h2>${"x".repeat(201)}</h2>`],
    ["one text node", `<h2>Title</h2><p>${"x".repeat(10_001)}</p>`],
    ["fragment", `<section data-aitta-fragment="${`a${"b".repeat(64)}`}"><h2>Title</h2></section>`],
    ["external URL", `<p><a href="https://example.com/${"x".repeat(2_048)}">Link</a></p>`],
    ["sections", Array.from({ length: 65 }, (_, index) => `<section><h2>Section ${index}</h2></section>`).join("")],
    ["nodes", `<h2>Title</h2>${Array.from({ length: 1_024 }, () => "<p>x</p>").join("")}`],
    ["depth", "<p><strong><em><strong><em><strong>Too deep</strong></em></strong></em></strong></p>"],
    ["text total", `<h2>Title</h2>${Array.from({ length: 11 }, () => `<p>${"x".repeat(9_999)}</p>`).join("")}`],
    ["links", `<h2>Title</h2>${Array.from({ length: 129 }, () => '<p><a href="/updates">Link</a></p>').join("")}`],
    ["normalized JSON", `<h2>Title</h2>${Array.from({ length: 25 }, (_, index) => `<p>${index}${"x".repeat(4_090)}</p>`).join("")}`],
  ];
  for (const [label, htmlFragment] of importCases) {
    await t.test(label, async () => {
      const response = await preview({ ...safeInput, htmlFragment });
      assertPrivateJson(response, 422, { caseInsensitiveContentType: false });
      assert.equal((await responseJson(response)).error.code, "import_rejected");
    });
  }

  await t.test("request body bytes", async () => {
    const response = await preview({ ...safeInput, htmlFragment: `<p>${"x".repeat(192 * 1024)}</p>` });
    assertPrivateJson(response, 400, { caseInsensitiveContentType: false });
    assert.equal((await responseJson(response)).error.code, "request_too_large");
  });
});

test("same-origin and sole-owner denials precede negotiation, media, body, and D1", async () => {
  const cases = [
    {
      label: "cross origin",
      env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
      headers: { ...ownerHeaders(ownerEmail), origin: "https://attacker.example" },
      status: 403,
      code: "authorization_denied",
    },
    {
      label: "signed out",
      env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
      headers: { origin: "https://account.example" },
      status: 401,
      code: "authentication_required",
    },
    {
      label: "non-owner",
      env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
      headers: { ...ownerHeaders("other@example.com"), origin: "https://account.example" },
      status: 403,
      code: "authorization_denied",
    },
    {
      label: "missing owner",
      env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY") }),
      headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example" },
      status: 503,
      code: "owner_unavailable",
    },
  ];
  for (const fixture of cases) {
    const response = await fetchApp("/api/private/pages/preview", {
      env: fixture.env,
      method: "POST",
      headers: { ...fixture.headers, accept: "text/html", "content-type": "text/plain" },
      body: "AUTH_BODY_PRIVATE_CANARY",
    });
    assertPrivateJson(response, fixture.status, { caseInsensitiveContentType: false });
    const body = await responseJson(response);
    assert.equal(body.error.code, fixture.code, fixture.label);
    assert.doesNotMatch(JSON.stringify(body), /AUTH_BODY_PRIVATE_CANARY/u);
  }
});

test("JSON negotiation, media, syntax, and methods are explicit and bounded", async (t) => {
  for (const accept of [undefined, "*/*", "application/*", "application/json"]) {
    const response = await preview(safeInput, {
      headers: accept === undefined ? {} : { accept },
    });
    assertPrivateJson(response, 200, { caseInsensitiveContentType: false });
  }
  for (const accept of ["text/html", "application/json;q=0", "application/json,", "application/json;q=2"]) {
    const response = await preview(safeInput, { headers: { accept } });
    assertPrivateJson(response, 406, { caseInsensitiveContentType: false });
    assert.equal((await responseJson(response)).error.code, "not_acceptable");
  }

  for (const contentType of [null, "text/plain", "application/json; charset=iso-8859-1", "application/json; profile=preview"]) {
    const headers = mutationHeaders(ownerEmail);
    if (contentType === null) delete headers["content-type"];
    else headers["content-type"] = contentType;
    const response = await fetchApp("/api/private/pages/preview", {
      env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
      method: "POST",
      headers,
      body: JSON.stringify(safeInput),
    });
    assertPrivateJson(response, 415, { caseInsensitiveContentType: false });
    assert.equal((await responseJson(response)).error.code, "unsupported_media_type");
  }

  for (const body of ["", "{", "\ud800"]) {
    const response = await fetchApp("/api/private/pages/preview", {
      env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
      method: "POST",
      headers: mutationHeaders(ownerEmail),
      body,
    });
    assertPrivateJson(response, 400, { caseInsensitiveContentType: false });
    assert.equal((await responseJson(response)).error.code, "invalid_json");
  }

  for (const method of ["GET", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    for (const acceptCase of [
      { label: "missing Accept", value: undefined },
      { label: "JSON Accept", value: "application/json" },
      { label: "HTML Accept", value: "text/html" },
      { label: "malformed Accept", value: "application/json," },
      { label: "oversized Accept", value: "x".repeat(9_000) },
    ]) {
      await t.test(`${method} returns JSON 405 with ${acceptCase.label}`, async () => {
        const headers = {
          ...ownerHeaders(ownerEmail),
          origin: "https://account.example",
        };
        if (acceptCase.value !== undefined) headers.accept = acceptCase.value;
        const response = await fetchApp("/api/private/pages/preview", {
          env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
          method,
          headers,
        });
        assertPrivateJson(response, 405, { caseInsensitiveContentType: false });
        assert.equal(response.headers.get("allow"), "POST");
        assert.equal((await responseJson(response)).error.code, "method_not_allowed");
      });
    }
  }

  for (const method of ["GET", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    await t.test(`${method} remains owner protected before negotiation`, async () => {
      const response = await fetchApp("/api/private/pages/preview", {
        env: makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
        method,
        headers: { accept: "text/html" },
      });
      assertPrivateJson(response, 403, { caseInsensitiveContentType: false });
      assert.equal((await responseJson(response)).error.code, "authorization_denied");
    });
  }
});

test("the owner journey renders only the closed document and keeps raw source in its textarea", async () => {
  const [form, fields, renderer, route, shell, stylesheet] = await Promise.all([
    readFile(new URL("../app/owner/pages/import/PageImportForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/pages/import/PageImportFields.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/pages/import/PageDocumentPreview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/private/pages/preview/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/_components/OwnerShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/pages/import/page-preview.module.css", import.meta.url), "utf8"),
  ]);
  const sources = `${form}\n${fields}\n${renderer}\n${route}`;
  assert.doesNotMatch(sources, /dangerouslySetInnerHTML|srcDoc|innerHTML|outerHTML|eval\(|new Function/u);
  assert.doesNotMatch(route, /getProfile|createEntry|update|delete|fetch\(/u);
  assert.match(form, /import \{ previewPageRequest \} from "\.\/page-preview-request"/u);
  assert.match(form, /import \{ PageImportTextField, PageImportTextareaField \} from "\.\/PageImportFields"/u);
  assert.doesNotMatch(form, /\bfetch\s*\(/u);
  assert.doesNotMatch(fields, /\bfetch\s*\(/u);
  assert.match(fields, /export function PageImportTextField/u);
  assert.match(fields, /export function PageImportTextareaField/u);
  assert.match(fields, /<label className=\{styles\.field\}>/u);
  assert.match(fields, /const errorId = suppliedErrorId \?\? `page-preview-\$\{name\}-error`/u);
  assert.match(fields, /const helpId = help \? suppliedHelpId \?\? `page-preview-\$\{name\}-help` : undefined/u);
  assert.match(fields, /aria-describedby=\{error \? errorId : undefined\}/u);
  assert.match(fields, /const describedBy = \[helpId, error \? errorId : undefined\]\.filter\(Boolean\)\.join\(" "\) \|\| undefined/u);
  assert.match(fields, /className=\{variant === "source" \? styles\.source : undefined\}/u);
  assert.match(fields, /\{help && helpId \? <span className=\{styles\.help\} id=\{helpId\}>/u);
  assert.match(fields, /\{error \? <span className=\{styles\.error\} id=\{errorId\}>/u);
  assert.match(form, /<PageImportTextField\s+disabled=\{busy\}\s+error=\{fieldErrors\.title\}\s+label="Page title"\s+maxLength=\{200\}\s+name="title"\s+onInput=\{clearFieldError\}\s+required\s+\/>/u);
  assert.match(form, /<PageImportTextareaField\s+disabled=\{busy\}\s+error=\{fieldErrors\.description\}\s+label="Description"\s+maxLength=\{500\}\s+name="description"\s+onInput=\{clearFieldError\}\s+optional\s+required=\{false\}\s+rows=\{3\}\s+\/>/u);
  assert.match(form, /<PageImportTextareaField\s+disabled=\{busy\}\s+error=\{fieldErrors\.htmlFragment\}\s+errorId="page-preview-fragment-error"\s+help="Accepted content: sections, h2–h4 headings, paragraphs, lists, emphasis, code, safe links, and annotated flow, split, or cards groups\."\s+helpId="page-preview-fragment-help"\s+label="HTML fragment"\s+name="htmlFragment"\s+onInput=\{clearFieldError\}\s+required\s+rows=\{16\}\s+spellCheck=\{false\}\s+variant="source"\s+\/>/u);
  assert.match(form, /name="title"/u);
  assert.match(form, /name="description"/u);
  assert.match(form, /name="htmlFragment"/u);
  assert.match(form, /JSON\.stringify\(document, null, 2\)/u);
  assert.match(form, /aria-busy=\{busy\}/u);
  assert.match(form, /requestAnimationFrame\(\(\) => focusFirstInvalidField/u);
  assert.match(form, /previewHeadingRef\.current\?\.focus\(\)/u);
  assert.match(form, /excludes the raw HTML still visible in the source textarea/u);
  assert.match(renderer, /switch \(block\.type\)/u);
  assert.match(renderer, /switch \(inline\.type\)/u);
  assert.match(renderer, /switch \(destination\.kind\)/u);
  assert.match(renderer, /href\.startsWith\("mailto:"\) \|\| href\.startsWith\("tel:"\)/u);
  assert.match(renderer, /opens in a new tab/u);
  assert.match(shell, /href="\/owner\/pages\/import"/u);
  assert.match(shell, />Pages</u);
  assert.match(stylesheet, /@media \(max-width: 640px\)/u);
  assert.match(stylesheet, /@media \(forced-colors: active\)/u);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/u);
});

test("the client response reader bounds allocation and rejects invalid response bytes", async () => {
  const source = await readFile(
    new URL("../lib/custom-pages/bounded-json-response.ts", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const { readBoundedPagePreviewJson } = await import(
    `data:text/javascript,${encodeURIComponent(compiled)}`
  );
  assert.deepEqual(
    await readBoundedPagePreviewJson(Response.json({ ok: true })),
    { ok: true },
  );
  assert.equal(
    await readBoundedPagePreviewJson(new Response("{", {
      headers: { "Content-Type": "application/json" },
    })),
    null,
  );
  assert.equal(
    await readBoundedPagePreviewJson(new Response(JSON.stringify({ value: "x".repeat(160 * 1024) }), {
      headers: { "Content-Type": "application/json" },
    })),
    null,
  );
  assert.equal(
    await readBoundedPagePreviewJson(new Response("{}", {
      headers: { "Content-Type": "application/json", "Content-Length": String(160 * 1024 + 1) },
    })),
    null,
  );
  assert.equal(
    await readBoundedPagePreviewJson(new Response("not json", {
      headers: { "Content-Type": "text/plain" },
    })),
    null,
  );
  assert.equal(
    await readBoundedPagePreviewJson(new Response("{}", {
      headers: { "Content-Type": "application/json-seq" },
    })),
    null,
  );
});

async function preview(input, options = {}) {
  return fetchApp("/api/private/pages/preview", {
    env: options.env ?? makeEnv({ db: throwingD1("STORAGE_PRIVATE_CANARY"), ownerEmail }),
    method: "POST",
    headers: { ...mutationHeaders(ownerEmail), ...options.headers },
    body: options.body ?? JSON.stringify(input),
  });
}
