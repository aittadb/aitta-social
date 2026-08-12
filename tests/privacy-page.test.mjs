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
  "PRIVACY_OWNER_PRIVATE_CANARY@example.test",
  "PRIVACY_RUNTIME_PRIVATE_CANARY",
  "privacy-request-host-private-canary.example",
  "PRIVACY_D1_PRIVATE_CANARY",
  "PRIVACY_HUB_CHALLENGE_PRIVATE_CANARY",
];

test("privacy is a truthful D1-independent human page with neutral metadata", async () => {
  const response = await fetchApp("/privacy", {
    origin: `https://${privateCanaries[2]}`,
    headers: {
      accept: "text/html",
      "x-forwarded-host": privateCanaries[2],
      "x-forwarded-proto": "http",
    },
    env: makeEnv({
      db: { prepare() { throw new Error("PRIVACY_D1_PRIVATE_CANARY"); } },
      ownerEmail: privateCanaries[0],
      canonicalUrl: `https://${privateCanaries[1].toLowerCase()}.example`,
      hubChallenge: "PRIVACY_HUB_CHALLENGE_PRIVATE_CANARY",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  const html = await response.text();

  assert.match(html, /<title>Privacy · Independent Aitta<\/title>/i);
  assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/i);
  assert.doesNotMatch(html, /<link rel="canonical"|<meta property="og:url"|<meta[^>]+(?:image|icon)/i);
  assert.match(html, /<main class="public-shell privacy-shell">/i);
  assert.match(html, /<article class="public-information-page" aria-labelledby="privacy-title">/i);
  assert.match(html, /<h1 id="privacy-title">How this Aitta handles data<\/h1>/i);
  for (const heading of [
    "What is public",
    "What stays private",
    "Protected settings",
    "ChatGPT Sites boundary",
    "Network and analytics",
    "Retention and owner control",
  ]) {
    assert.match(html, new RegExp(`<h2[^>]*>${heading}</h2>`, "i"));
  }
  assert.match(html, /currently has no Hub connection/i);
  assert.match(html, /adds no analytics subsystem/i);
  assert.match(html, /outside this application(?:&#x27;|&apos;|')s direct control/i);
  for (const canary of privateCanaries) assert.equal(html.includes(canary), false);
  assert.doesNotMatch(html, /mailto:|accept cookies|privacy consent form|we promise|data protection officer/i);
});

test("public footer always exposes Privacy and GitHub while hiding only powered-by attribution", async () => {
  for (const hidePoweredBy of [0, 1]) {
    const response = await fetchApp("/", {
      env: makeEnv({
        db: new FakeD1({ profile: profileRow({ hide_powered_by: hidePoweredBy }) }),
      }),
      headers: { accept: "text/html" },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /href="\/privacy"[^>]*>Privacy<\/a>/i);
    assert.match(
      html,
      /href="https:\/\/github\.com\/aittadb\/aitta-social"[^>]*rel="noopener noreferrer"[^>]*aria-label="AittaSocial source on GitHub"/i,
    );
    if (hidePoweredBy) {
      assert.doesNotMatch(html, /Powered by|href="https:\/\/aitta\.social"/i);
    } else {
      assert.match(html, /Powered by\s*<strong><a href="https:\/\/aitta\.social" rel="noopener noreferrer">AittaSocial<\/a>/i);
    }
  }
});

test("privacy presentation keeps narrow, enlarged-text, touch, focus, and motion contracts", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.public-information-page\s*\{[^}]*max-width:\s*732px[^}]*padding:[^}]*max\(16px, env\(safe-area-inset-right\)\)[^}]*max\(16px, env\(safe-area-inset-left\)/s);
  assert.match(css, /\.public-information-page h1\s*\{[^}]*font-size:\s*clamp\(2rem, 6vw, 2\.5rem\)[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.public-information-section p\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.public-attribution a, \.technical-links a\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});
