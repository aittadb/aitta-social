import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  entryRow,
  FakeD1,
  fetchApp,
  makeEnv,
  ownerHeaders,
  profileRow,
} from "./helpers/worker-harness.mjs";

const POLICY = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "block-all-mixed-content",
].join("; ");

const ownerEmail = "owner@example.test";

test("every application HTML response receives the one fixed CSP", async (t) => {
  const published = entryRow({ id: "csp-published", state: "published" });
  const draft = entryRow({ id: "csp-draft", state: "draft", published_at: null });
  const configured = makeEnv({
    db: new FakeD1({ entries: [published, draft] }),
    ownerEmail,
    canonicalUrl: "https://canonical.example/presence",
  });
  const unconfigured = makeEnv({ db: new FakeD1({ profile: null, entries: [] }), ownerEmail });
  const missingOwner = makeEnv({ db: new FakeD1({ entries: [published, draft] }) });
  const unavailable = makeEnv({
    db: { prepare() { throw new Error("PRIVATE_D1_FAILURE_CANARY"); } },
    ownerEmail,
  });

  const cases = [
    ["configured public home and canonical metadata", "/", configured, {}],
    ["authorized owner page", "/owner", configured, ownerHeaders(ownerEmail)],
    ["non-owner denial page", "/owner", configured, ownerHeaders("other@example.test")],
    ["missing-owner setup page", "/owner", missingOwner, ownerHeaders(ownerEmail)],
    ["unconfigured setup", "/", unconfigured, {}],
    ["published permalink", `/entries/${published.id}`, configured, {}],
    ["draft is the generic error page", `/entries/${draft.id}`, configured, {}],
    ["unknown is the generic error page", "/entries/unknown-csp-entry", configured, {}],
    ["plain framework route error", "/missing-csp-route", configured, {}],
    ["D1 failure is the safe unavailable page", "/", unavailable, {}],
  ];

  for (const [name, path, env, extraHeaders] of cases) {
    await t.test(name, async () => {
      const response = await fetchApp(path, {
        env,
        headers: { accept: "text/html", ...extraHeaders },
      });
      assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
      assert.equal(response.headers.get("content-security-policy"), POLICY);
      assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
      assert.doesNotMatch(await response.text(), /PRIVATE_D1_FAILURE_CANARY/);
    });
  }
});

test("the fixed policy permits only measured Vinext inline and same-origin asset needs", async () => {
  const response = await fetchApp("/", {
    env: makeEnv(),
    headers: { accept: "text/html" },
  });
  const html = await response.text();
  const policy = response.headers.get("content-security-policy") ?? "";

  assert.equal(policy, POLICY);
  assert.doesNotMatch(policy, /(?:^|[;\s])\*(?:[;\s]|$)|unsafe-eval|data:|blob:|https?:/i);
  assert.match(policy, /script-src 'self' 'unsafe-inline'/);
  assert.match(policy, /script-src-attr 'none'/);
  assert.match(policy, /style-src 'self' 'unsafe-inline'/);

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const externalScripts = scripts.filter((match) => /\bsrc=/.test(match[1]));
  const inlineScripts = scripts.filter((match) => !/\bsrc=/.test(match[1]) && match[2].trim());
  assert.ok(externalScripts.length >= 3, "Vinext module chunks must be present");
  assert.ok(inlineScripts.length >= 1, "Vinext dynamic inline bootstrap must be measured");
  for (const [, attributes] of externalScripts) {
    const source = attributes.match(/\bsrc="([^"]+)"/)?.[1];
    assert.match(source ?? "", /^\/_next\/static\//);
    assert.ok((await readFile(new URL(`../dist/client${source}`, import.meta.url))).byteLength > 0);
  }

  const inlineStyles = [...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)];
  assert.equal(inlineStyles.length, 1);
  assert.match(inlineStyles[0][1], /data-vinext-fonts/);
  assert.doesNotMatch(inlineStyles[0][2], /https?:\/\//i);
  const fontUrls = [...inlineStyles[0][2].matchAll(/url\(([^)]+)\)/gi)]
    .map((match) => match[1].replace(/["']/g, ""));
  assert.ok(fontUrls.every((url) => url.startsWith("/_next/static/_vinext_fonts/")));
  for (const fontUrl of fontUrls) {
    assert.ok((await readFile(new URL(`../dist/client${fontUrl}`, import.meta.url))).byteLength > 0);
  }
  assert.ok((html.match(/\sstyle=/gi) ?? []).length >= 1, "React accent style must remain supported");

  const assetLinks = [...html.matchAll(/<link\b[^>]+(?:href)="([^"]+)"[^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => href.includes("_next/static"));
  assert.ok(assetLinks.length >= 1);
  assert.ok(assetLinks.every((href) => href.startsWith("/_next/static/")));
  for (const assetUrl of assetLinks) {
    assert.ok((await readFile(new URL(`../dist/client${assetUrl}`, import.meta.url))).byteLength > 0);
  }

  assert.equal(
    await readFile(new URL("../dist/client/_headers", import.meta.url), "utf8"),
    [
      "# Cache content-hashed assets immutably (generated by vinext)",
      "/_next/static/*",
      "  Cache-Control: public, max-age=31536000, immutable",
      "",
    ].join("\n"),
  );
});

test("escaped hostile content cannot become executable markup or leak private canaries", async () => {
  const xss = `<script>globalThis.XSS_CANARY=true</script><img src=x onerror=alert(1)>`;
  const env = makeEnv({
    db: new FakeD1({
      profile: profileRow({
        display_name: xss,
        short_description: xss,
        private_canary: "PRIVATE_PROFILE_CSP_CANARY",
        owner_email: "PRIVATE_OWNER_CSP_CANARY@example.test",
      }),
      entries: [entryRow({
        id: "hostile-csp-entry",
        title: xss,
        body: xss,
        private_canary: "PRIVATE_ENTRY_CSP_CANARY",
      })],
    }),
  });

  for (const path of ["/", "/entries/hostile-csp-entry"]) {
    const response = await fetchApp(path, { env, headers: { accept: "text/html" } });
    const html = await response.text();
    assert.equal(response.headers.get("content-security-policy"), POLICY);
    assert.doesNotMatch(html, /<img\s+src=x\s+onerror=|<script>globalThis\.XSS_CANARY/i);
    assert.match(html, /&lt;script&gt;|\\u003cscript\\u003e/i);
    assert.doesNotMatch(html, /PRIVATE_PROFILE_CSP_CANARY|PRIVATE_OWNER_CSP_CANARY|PRIVATE_ENTRY_CSP_CANARY/);
  }
});

test("JSON and other non-HTML responses keep their own contracts without CSP", async () => {
  const env = makeEnv();
  const json = await fetchApp("/api/v1/site", { env });
  assert.match(json.headers.get("content-type") ?? "", /^application\/json\b/i);
  assert.equal(json.headers.get("content-security-policy"), null);
  assert.equal(json.headers.get("cache-control"), "public, max-age=60");
  const jsonBody = JSON.parse(await json.text());
  assert.deepEqual(Object.keys(jsonBody).sort(), ["actions", "data", "links"]);
  assert.deepEqual(Object.keys(jsonBody.data).sort(), ["attributes", "id", "type"]);
  assert.deepEqual(Object.keys(jsonBody.data.attributes).sort(), [
    "accountType",
    "canonicalUrl",
    "displayName",
    "externalLinks",
    "introduction",
    "location",
    "presentation",
    "shortDescription",
    "website",
  ]);

  const nonHtml = await fetchApp("/_next/static/missing-csp-fixture.css", { env });
  assert.equal(nonHtml.status, 404);
  assert.equal(nonHtml.headers.get("content-security-policy"), null);
  assert.equal(nonHtml.headers.get("cache-control"), null);
  assert.equal(nonHtml.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(await nonHtml.text(), "Not Found");
});

test("the Worker owns one literal policy and preserves native navigation boundaries", async () => {
  const [workerSource, publicSource, publicFrameSource, ownerShellSource] = await Promise.all([
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/_components/PublicPresenceFrame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/_components/OwnerShell.tsx", import.meta.url), "utf8"),
  ]);
  assert.equal((workerSource.match(/Content-Security-Policy/g) ?? []).length, 1);
  assert.match(workerSource, /\^text\\\/html\\b/);
  assert.match(workerSource, /if \(!\/\^text\\\/html\\b\/i\.test[\s\S]+return response;/);
  assert.match(workerSource, /headers\.set\("Content-Security-Policy", CONTENT_SECURITY_POLICY\)/);
  assert.doesNotMatch(`${publicSource}\n${publicFrameSource}\n${ownerShellSource}`, /next\/link|onKeyDown|tabIndex=\{-?\d+\}/);
  assert.match(publicSource, /<a[\s\S]+href=/);
  assert.match(publicFrameSource, /<a[\s\S]+href=/);
  assert.match(ownerShellSource, /<a[\s\S]+href=/);
});
