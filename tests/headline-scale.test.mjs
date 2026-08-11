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
    /\.identity-main h1, \.template-introduction h1, \.permalink-entry h1, \.state-page h1, \.owner-access-state h1\s*\{[^}]*font-size:\s*clamp\(2\.5rem, 5vw, 4\.5rem\)[^}]*line-height:\s*0\.92[^}]*text-wrap:\s*balance[^}]*overflow-wrap:\s*anywhere/s,
  );
  assert.match(
    css,
    /\.template-introduction h1\s*\{[^}]*font-size:\s*clamp\(2\.5rem, 4\.5vw, 4rem\)/s,
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
    /\.owner-page-header h1\s*\{[^}]*font-size:\s*clamp\(2\.25rem, 3\.5vw, 3\.5rem\)/s,
  );
  assert.doesNotMatch(
    css,
    /@media\s*\(max-width:\s*640px\)[\s\S]*?(?:identity-main|template-introduction|permalink-entry) h1[^}]*font-size:/,
    "the narrow layout must not enlarge a primary heading",
  );
  assert.match(
    css,
    /\.wordmark\s*\{[^}]*max-width:\s*min\(45vw, 36rem\)[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s,
    "a maximum-length Identity must not expand public navigation",
  );

  assert.match(
    css,
    /\.introduction h2, \.section-heading h2, \.owner-section h2\s*\{[^}]*font-size:\s*clamp\(2rem, 4vw, 3\.4rem\)/s,
  );
  assert.match(
    css,
    /\.entry-card h3\s*\{[^}]*font-size:\s*clamp\(1\.7rem, 3vw, 2\.8rem\)/s,
  );
});

test("every primary headline surface keeps semantic text and private values out", async () => {
  const ownerEmail = "owner@example.test";
  const profile = profileRow({
    display_name: LONG_NAME,
    private_canary: PRIVATE_CANARY,
  });
  const published = entryRow({
    id: "headline-published",
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
