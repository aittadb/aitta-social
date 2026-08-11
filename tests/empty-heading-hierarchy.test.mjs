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

const PRIVATE_CANARY = "EMPTY_HEADING_PRIVATE_CANARY";

test("empty-state h3 scales remain below their Updates h2 at every review width", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.introduction h2, \.section-heading h2, \.owner-section h2\s*\{[^}]*font-size:\s*clamp\(2rem, 4vw, 3\.4rem\)/s,
  );
  assert.match(
    css,
    /\.owner-section h2\s*\{[^}]*font-size:\s*clamp\(1\.75rem, 2\.5vw, 2\.5rem\)/s,
  );
  assert.match(
    css,
    /\.empty-public h3\s*\{[^}]*font-size:\s*clamp\(1\.65rem, 2\.5vw, 2\.25rem\)[^}]*line-height:\s*1\.15[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /\.owner-empty h3\s*\{[^}]*font-size:\s*clamp\(1\.5rem, 2vw, 1\.75rem\)[^}]*line-height:\s*1\.15[^}]*overflow-wrap:\s*anywhere/s,
  );

  for (const width of [320, 640, 900, 1280, 1600, 2560]) {
    const publicH2 = clampPixels(2, 4, 3.4, width);
    const publicEmptyH3 = clampPixels(1.65, 2.5, 2.25, width);
    const ownerH2 = clampPixels(1.75, 2.5, 2.5, width);
    const ownerEmptyH3 = clampPixels(1.5, 2, 1.75, width);

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
    /\.identity-main h1, \.template-introduction h1, \.permalink-entry h1, \.state-page h1, \.owner-access-state h1\s*\{[^}]*font-size:\s*clamp\(2\.5rem, 5vw, 4\.5rem\)/s,
    "the accepted primary headline scale must stay unchanged",
  );
  assert.match(
    css,
    /\.entry-card h3\s*\{[^}]*font-size:\s*clamp\(1\.7rem, 3vw, 2\.8rem\)/s,
    "published card typography must stay unchanged",
  );
  assert.match(
    css,
    /\.entry-card h3\.entry-note-title\s*\{[^}]*font-size:\s*1\.32rem/s,
    "published note typography must stay unchanged",
  );
  assert.match(
    css,
    /\.owner-entry-copy h3\s*\{[^}]*font-size:\s*1\.4rem/s,
    "populated owner-row typography must stay unchanged",
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
    /<section class="entries-section" aria-labelledby="entries-title">/,
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

function assertOrdered(source, ...needles) {
  let position = -1;
  for (const needle of needles) {
    const nextPosition = source.indexOf(needle, position + 1);
    assert.ok(nextPosition > position, `${needle} must follow the preceding semantic element`);
    position = nextPosition;
  }
}
