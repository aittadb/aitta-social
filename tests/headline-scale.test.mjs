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

const PRIVATE_CANARY = "HEADLINE_PRIVATE_CANARY";
const LONG_NAME = "N".repeat(200);
const LONG_TITLE = "T".repeat(200);

test("primary headings use one restrained responsive scale", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(
    css,
    /\.state-page h1, \.owner-access-state h1\s*\{[^}]*font-size:\s*clamp\(2\.5rem, 5vw, 4\.5rem\)[^}]*line-height:\s*0\.92[^}]*text-wrap:\s*balance[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /\.presence-heading h1\s*\{[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*1\.875rem[^}]*line-height:\s*1\.06[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /@media\s*\(min-width:\s*768px\)[\s\S]*\.presence-heading h1\s*\{[^}]*font-size:\s*2\.375rem/s,
  );
  assert.match(
    css,
    /\.template-introduction h1\s*\{[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*clamp\(1\.875rem, 4vw, 2\.375rem\)[^}]*line-height:\s*1\.06[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /\.state-page h1\s*\{[^}]*font-size:\s*clamp\(2\.25rem, 4vw, 3\.75rem\)/s,
  );
  assert.match(
    css,
    /\.owner-access-state h1\s*\{[^}]*font-size:\s*clamp\(2\.25rem, 4vw, 3\.75rem\)/s,
  );
  assert.match(
    css,
    /\.owner-page-header h1\s*\{[^}]*font-size:\s*clamp\(2\.25rem, 3\.5vw, 3\.5rem\)[^}]*text-wrap:\s*balance[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /\.owner-page-header > div:first-child\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*760px/s,
    "a maximum-length owner Identity must shrink and wrap inside the header",
  );
  assert.doesNotMatch(
    css,
    /@media\s*\(max-width:\s*640px\)[\s\S]*?(?:presence-heading|template-introduction|permalink-entry) h1[^}]*font-size:/,
    "the narrow layout must not enlarge a primary heading",
  );
  assert.match(
    css,
    /\.permalink-entry h1:not\(\.visually-hidden\)\s*\{[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*clamp\(1\.35rem, 3vw, 1\.5rem\)[^}]*line-height:\s*1\.25[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /\.wordmark\s*\{[^}]*flex:\s*1 1 auto[^}]*min-width:\s*0[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s,
    "a maximum-length Identity must not expand public navigation",
  );

  assert.match(
    css,
    /\.updates-section > h2\s*\{[^}]*font-size:\s*1\.5rem/s,
  );
  assert.match(
    css,
    /\.update-title\s*\{[^}]*font-size:\s*clamp\(1\.25rem, 3vw, 1\.5rem\)/s,
  );
  assert.match(
    css,
    /\.owner-section h2\s*\{[^}]*font-size:\s*clamp\(1\.75rem, 2\.5vw, 2\.5rem\)/s,
  );

  for (const width of [320, 640, 900, 1024, 1280, 1600, 2560]) {
    const ownerH1 = clampPixels(2.25, 3.5, 3.5, width);
    const ownerH2 = clampPixels(1.75, 2.5, 2.5, width);
    const publicH1 = width < 768 ? 1.875 * 16 : 2.375 * 16;
    assert.ok(publicH1 >= 30 && publicH1 <= 40, `public Identity h1 must stay within its compact range at ${width}px`);
    assert.ok(ownerH1 > ownerH2, `owner h1 must exceed h2 at ${width}px`);
  }
});

test("every primary headline surface keeps semantic text and private values out", async () => {
  const ownerEmail = "owner@example.test";
  const profile = profileRow({
    display_name: LONG_NAME,
    private_canary: PRIVATE_CANARY,
  });
  const published = entryRow({
    id: "headline-published",
    kind: "article",
    title: LONG_TITLE,
    private_canary: PRIVATE_CANARY,
  });
  const configuredEnv = makeEnv({
    db: new FakeD1({ profile, entries: [published] }),
    ownerEmail,
    canonicalUrl: "https://canonical.example/presence",
  });

  const home = await html("/", configuredEnv);
  const permalink = await html("/entries/headline-published", configuredEnv);
  const owner = await html("/owner/profile", configuredEnv, ownerHeaders(ownerEmail));
  const denied = await html(
    "/owner",
    configuredEnv,
    ownerHeaders("not-owner@example.test"),
  );
  const missing = await html("/entries/not-public", configuredEnv);
  const setup = await html(
    "/",
    makeEnv({ db: new FakeD1({ profile: null }), ownerEmail }),
  );

  assert.match(home, new RegExp(`<h1 id="account-name">${LONG_NAME}</h1>`));
  assert.match(permalink, new RegExp(`<h1>${LONG_TITLE}</h1>`));
  assert.match(owner, /<h1>Identity<\/h1>/);
  assert.match(denied, /<h1>This presence is not yours to administer<\/h1>/);
  assert.match(missing, /<h1>This update is not public<\/h1>/);
  assert.match(setup, /<h1 id="template-title">Create your own presence<\/h1>/);

  for (const html of [home, permalink, owner, denied, missing, setup]) {
    assert.doesNotMatch(html, new RegExp(PRIVATE_CANARY));
  }
});

async function html(path, env, headers = {}) {
  const response = await fetchApp(path, {
    env,
    headers: { accept: "text/html", ...headers },
  });
  return response.text();
}

function clampPixels(minRem, preferredVw, maxRem, width) {
  return Math.min(maxRem * 16, Math.max(minRem * 16, width * preferredVw / 100));
}
