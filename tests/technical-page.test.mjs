import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  fetchApp,
  makeEnv,
  profileRow,
} from "./helpers/worker-harness.mjs";

const privateCanaries = [
  "TECHNICAL_OWNER_PRIVATE_CANARY@example.test",
  "TECHNICAL_RUNTIME_PRIVATE_CANARY",
  "technical-request-host-private-canary.example",
  "TECHNICAL_D1_PRIVATE_CANARY",
  "TECHNICAL_HUB_PRIVATE_CANARY",
];

test("technical information is D1-independent, neutral, and points to the three public resources", async () => {
  const response = await fetchApp("/technical", {
    origin: `https://${privateCanaries[2]}`,
    headers: {
      accept: "text/html",
      "x-forwarded-host": privateCanaries[2],
      "x-forwarded-proto": "http",
    },
    env: makeEnv({
      db: { prepare() { throw new Error(privateCanaries[3]); } },
      ownerEmail: privateCanaries[0],
      canonicalUrl: `https://${privateCanaries[1].toLowerCase()}.example`,
      hubChallenge: privateCanaries[4],
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'none'/);
  const html = await response.text();

  assert.match(html, /<title>Technical · Independent Aitta<\/title>/i);
  assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/i);
  assert.doesNotMatch(html, /<link rel="canonical"|<meta property="og:url"|<meta[^>]+(?:image|icon)/i);
  assert.match(html, /<main class="public-shell technical-shell">/i);
  assert.match(html, /<article class="public-information-page" aria-labelledby="technical-title">/i);
  assert.match(html, /<h1 id="technical-title">Public resources for this Aitta<\/h1>/i);

  for (const [heading, href, label] of [
    ["Manifest", "/.well-known/aitta-social.json", "Open the discovery manifest"],
    ["Profile", "/api/v1/site", "Open the public profile resource"],
    ["Updates", "/api/v1/entries", "Open the published updates resource"],
  ]) {
    assert.match(html, new RegExp(`<h2[^>]*>${heading}</h2>`, "i"));
    assert.match(
      html,
      new RegExp(`href="${escapeRegExp(href)}"[^>]*>\\s*${label}\\s*</a>`, "i"),
    );
  }
  assert.match(
    html,
    /expose public protocol,\s*configured profile, and published-update information; owner details\s*and drafts stay out/i,
  );
  assert.match(html, /configured canonical Aitta URL, not the incoming request host/i);
  assert.doesNotMatch(html, /<pre\b|\{\s*&quot;protocol&quot;|private owner workspace|sign out/i);
  for (const canary of privateCanaries) assert.equal(html.includes(canary), false);
});

test("the public footer makes Technical real and uses concise resource labels", async () => {
  for (const hidePoweredBy of [0, 1]) {
    const response = await fetchApp("/", {
      env: makeEnv({
        db: new FakeD1({ profile: profileRow({ hide_powered_by: hidePoweredBy }) }),
      }),
      headers: { accept: "text/html" },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    const footer = publicFooter(html);

    assert.match(
      footer,
      /<nav[^>]+class="technical-links"[^>]+aria-label="Technical resources"[^>]*>.*href="\/privacy"[^>]*>Privacy<\/a>.*href="\/technical"[^>]*>Technical<\/a>.*href="\/\.well-known\/aitta-social\.json"[^>]*>Manifest<\/a>.*href="\/api\/v1\/site"[^>]*>Profile<\/a>.*href="\/api\/v1\/entries"[^>]*>Updates<\/a>.*<\/nav>/is,
    );
    assert.doesNotMatch(footer, />\s*(?:Profile|Updates) JSON\s*</i);
    assert.match(footer, /href="https:\/\/github\.com\/aittadb\/aitta-social"/i);
    if (hidePoweredBy) {
      assert.doesNotMatch(footer, /Powered by|href="https:\/\/aitta\.social"/i);
    } else {
      assert.match(footer, /Powered by/i);
    }
  }
});

function publicFooter(html) {
  return /<footer class="public-footer">[\s\S]*?<\/footer>/i.exec(html)?.[0] ?? "";
}

test("technical information reuses responsive information-page and interaction contracts", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.public-information-page\s*\{[^}]*max-width:\s*732px[^}]*padding:[^}]*max\(16px, env\(safe-area-inset-right\)\)[^}]*max\(16px, env\(safe-area-inset-left\)/s);
  assert.match(css, /\.public-information-page h1\s*\{[^}]*font-size:\s*clamp\(2rem, 6vw, 2\.5rem\)[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.public-information-link\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px[^}]*max-width:\s*100%[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.public-attribution a, \.technical-links a\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
