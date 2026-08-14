import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { escapeRegExp } from "./helpers/regular-expression-literal.mjs";
import { publicFooter } from "./helpers/public-footer-contract.mjs";

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

  const sectionMatches = [...html.matchAll(/<section class="public-information-section" aria-labelledby="([^"]+)">[\s\S]*?<\/section>/gi)];
  assert.deepEqual(
    sectionMatches.map((match) => match[1]),
    ["technical-manifest", "technical-profile", "technical-updates", "technical-usage"],
  );

  for (const [index, id, heading, paragraph, href, label] of [
    [0, "technical-manifest", "Manifest", /The discovery manifest identifies the protocol version, this Aitta(?:&apos;|&#x27;|')s canonical address, and the public profile and updates endpoints when the Aitta is configured\./, "/.well-known/aitta-social.json", "Open the discovery manifest"],
    [1, "technical-profile", "Profile", /The profile resource contains the configured outward identity and restrained presentation choices through an explicit public field list\./, "/api/v1/site", "Open the public profile resource"],
    [2, "technical-updates", "Updates", /The updates resource lists published updates in deterministic newest-first pages\. Drafts and unpublished updates are never part of the public collection\./, "/api/v1/entries", "Open the published updates resource"],
  ]) {
    const section = sectionMatches[index][0];
    assert.match(section, new RegExp(`<section class="public-information-section" aria-labelledby="${id}">\\s*<h2 id="${id}">${heading}</h2>`, "i"));
    assert.match(section, new RegExp(`<p>\\s*${paragraph.source}\\s*</p>`, "i"));
    assert.match(
      section,
      new RegExp(`<a class="public-information-link" href="${escapeRegExp(href)}">\\s*${label}\\s*</a>`, "i"),
    );
  }
  const usageSection = sectionMatches[3][0];
  assert.match(usageSection, /<h2 id="technical-usage">Using the resources<\/h2>/i);
  assert.match(usageSection, /<p>\s*These routes currently return JSON with the protocol 1\.0 response shapes and cache behavior documented by this application\. Resource links use the configured canonical Aitta URL, not the incoming request host\.\s*<\/p>/i);
  assert.doesNotMatch(usageSection, /href=/i);
  assert.match(
    html,
    /expose public protocol,\s*configured profile, and published-update information; owner details\s*and drafts stay out/i,
  );
  assert.match(html, /configured canonical Aitta URL, not the incoming request host/i);
  assert.doesNotMatch(html, /<pre\b|\{\s*&quot;protocol&quot;|private owner workspace|sign out/i);
  for (const canary of privateCanaries) assert.equal(html.includes(canary), false);
});

test("technical page composes all information sections through the focused child", async () => {
  const source = await readFile(new URL("../app/technical/page.tsx", import.meta.url), "utf8");
  const sectionSource = await readFile(new URL("../app/technical/TechnicalInformationSection.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ TechnicalInformationSection \} from "\.\/TechnicalInformationSection"/);
  assert.equal((source.match(/<TechnicalInformationSection\b/g) ?? []).length, 4);
  assert.equal((sectionSource.match(/<section className="public-information-section" aria-labelledby=\{headingId\}>/g) ?? []).length, 1);
  assert.match(sectionSource, /<h2 id=\{headingId\}>\{title\}<\/h2>/);
  assert.doesNotMatch(source, /<section className="public-information-section"/);
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
