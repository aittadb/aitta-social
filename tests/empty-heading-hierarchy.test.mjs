import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  fetchApp,
  makeEnv,
  ownerHeaders,
  profileRow,
} from "./helpers/worker-harness.mjs";
import { assertOrdered } from "./helpers/ordered-text-assertion.mjs";

const PRIVATE_CANARY = "EMPTY_HEADING_PRIVATE_CANARY";

test("empty-state h3 scales remain below their Updates h2 at every review width", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.updates-section > h2\s*\{[^}]*font-size:\s*1\.5rem/s,
  );
  assert.match(
    css,
    /\.owner-section h2\s*\{[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*clamp\(1\.35rem, 2\.5vw, 1\.65rem\)/s,
  );
  assert.match(
    css,
    /\.empty-public h3\s*\{[^}]*font-size:\s*1rem[^}]*line-height:\s*1\.3[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /\.owner-empty h3\s*\{[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*1\.05rem[^}]*line-height:\s*1\.25[^}]*overflow-wrap:\s*anywhere/s,
  );

  for (const width of [320, 640, 900, 1280, 1600, 2560]) {
    const publicH2 = 1.5 * 16;
    const publicEmptyH3 = 1 * 16;
    const ownerH2 = clampPixels(1.35, 2.5, 1.65, width);
    const ownerEmptyH3 = 1.05 * 16;

    assert.ok(
      publicEmptyH3 < publicH2,
      `public empty h3 must remain below Updates h2 at ${width}px`,
    );
    assert.ok(
      ownerEmptyH3 < ownerH2,
      `owner empty h3 must remain below Updates h2 at ${width}px`,
    );
  }

  const narrowMedia = css.match(/@media\s*\(max-width:\s*640px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.doesNotMatch(
    narrowMedia,
    /(?:empty-public|owner-empty) h3[^}]*font-size:/,
    "the 320px and 400%-reflow-equivalent layout must keep the same relational scale",
  );

  assert.match(
    css,
    /\.presence-heading h1\s*\{[^}]*font-size:\s*1\.875rem[^}]*overflow-wrap:\s*anywhere/s,
    "the compact public Identity headline must remain bounded and wrapping",
  );
  assert.match(
    css,
    /\.update-title\s*\{[^}]*font-size:\s*clamp\(1\.25rem, 3vw, 1\.5rem\)/s,
    "article and announcement titles must stay moderate",
  );
  assert.match(
    css,
    /\.update-note-title\s*\{[^}]*font-size:\s*0\.84rem/s,
    "an optional note title must remain a quiet affordance",
  );
  assert.match(
    css,
    /\.owner-entry-copy h3\s*\{[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*1\.05rem/s,
    "populated owner-row typography must use the compact owner hierarchy",
  );
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
});

test("SSR keeps Updates h2 before the empty h3 without changing empty-state meaning", async () => {
  const ownerEmail = "owner@example.test";
  const profile = profileRow({ private_canary: PRIVATE_CANARY });
  const env = makeEnv({
    db: new FakeD1({ profile, entries: [] }),
    ownerEmail,
    canonicalUrl: "https://canonical.example/presence",
  });

  const publicResponse = await fetchApp("/", {
    env,
    headers: { accept: "text/html" },
  });
  assert.equal(publicResponse.status, 200);
  const publicHtml = await publicResponse.text();
  assertOrdered(
    publicHtml,
    '<h2 id="entries-title">Updates</h2>',
    '<div class="empty-public">',
    "<h3>No published updates yet</h3>",
  );
  assert.match(
    publicHtml,
    /<section class="updates-section" aria-labelledby="entries-title">/,
  );

  const ownerResponse = await fetchApp("/owner", {
    env,
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(ownerResponse.status, 200);
  const ownerHtml = await ownerResponse.text();
  assertOrdered(
    ownerHtml,
    '<h2 id="owner-entries-title">Updates</h2>',
    '<div class="owner-empty">',
    "<h3>Nothing to manage yet</h3>",
  );
  assert.match(
    ownerHtml,
    /<section class="owner-section" aria-labelledby="owner-entries-title">/,
  );

  for (const html of [publicHtml, ownerHtml]) {
    assert.doesNotMatch(html, new RegExp(PRIVATE_CANARY));
  }
});

function clampPixels(minRem, preferredVw, maxRem, width) {
  return Math.min(maxRem * 16, Math.max(minRem * 16, width * preferredVw / 100));
}
