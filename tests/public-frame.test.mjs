import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  profileRow,
} from "./helpers/worker-harness.mjs";

const draftId = "public-frame-draft";
const publishedId = "public-frame-published";

test("every human public state uses the fixed Manage header and common footer", async (t) => {
  const configured = makeEnv({
    db: new FakeD1({
      profile: profileRow({ display_name: "Public frame Aitta" }),
      entries: [
        entryRow({ id: publishedId }),
        entryRow({ id: draftId, state: "draft", published_at: null }),
      ],
    }),
  });
  const unconfigured = makeEnv({ db: new FakeD1({ profile: null }) });
  const unavailable = makeEnv({ db: { prepare() { throw new Error("PUBLIC_FRAME_D1_CANARY"); } } });

  const cases = [
    ["configured home", "/", configured],
    ["unconfigured home", "/", unconfigured],
    ["storage unavailable", "/", unavailable],
    ["published permalink", `/entries/${publishedId}`, configured],
    ["draft permalink", `/entries/${draftId}`, configured],
    ["unknown permalink", "/entries/public-frame-unknown", configured],
    ["global not found", "/public-frame-unknown", configured],
    ["Privacy", "/privacy", unavailable],
    ["Technical", "/technical", unavailable],
  ];

  for (const [name, path, env] of cases) {
    await t.test(name, async () => {
      const response = await fetchApp(path, { env, headers: { accept: "text/html" } });
      assert.ok([200, 404].includes(response.status));
      const html = await response.text();

      assert.equal((html.match(/<main\b/gi) ?? []).length, 1);
      assert.match(html, /<main[^>]+class="public-shell(?:\s|")/i);
      assert.match(html, /<header[^>]+class="public-nav"[^>]+aria-label="Aitta navigation"/i);
      assert.match(html, /<nav[^>]+class="public-nav-actions"[^>]+aria-label="Aitta actions"/i);
      assert.match(html, /class="public-nav-action"[^>]+aria-label="Manage Aitta as owner — [^"]+"[^>]*>Manage<\/a>/i);
      assert.match(html, /<footer class="public-footer">/i);
      assert.match(html, /href="\/privacy"[^>]*>Privacy<\/a>/i);
      assert.match(html, /href="\/technical"[^>]*>Technical<\/a>/i);
      assert.match(html, /href="https:\/\/github\.com\/aittadb\/aitta-social"[^>]+aria-label="AittaSocial source on GitHub"/i);
      assert.doesNotMatch(html, /PUBLIC_FRAME_D1_CANARY|All updates|>Set up<\/a>|>Aitta<\/a>/i);
    });
  }
});

test("the page frame is pure and preserves the owner-hideable attribution boundary", async () => {
  const source = await readFile(new URL("../app/_components/PublicPresenceFrame.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(source, /export function PublicPageFrame/);
  assert.match(source, /manageHref = "\/owner"/);
  assert.match(source, /label="Aitta navigation"/);
  assert.match(source, /label: "Manage"/);
  assert.match(source, /showPoweredBy = !profile\?\.hidePoweredBy/);
  assert.doesNotMatch(source, /getProfile|getChatGPTUser|next\/headers|process\.env|DB\b/);
  assert.match(css, /\.public-state-shell\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column/s);
  assert.match(css, /\.public-state-page\s*\{[^}]*min-height:\s*360px[^}]*flex:\s*1 0 auto/s);
  assert.match(css, /\.public-state-page h1\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test("only a configured profile controls the public attribution", async () => {
  const hidden = await fetchApp("/", {
    env: makeEnv({ db: new FakeD1({ profile: profileRow({ hide_powered_by: 1 }) }) }),
    headers: { accept: "text/html" },
  });
  const staticPage = await fetchApp("/privacy", {
    env: makeEnv({ db: { prepare() { throw new Error("FRAME_STATIC_D1_CANARY"); } } }),
    headers: { accept: "text/html" },
  });

  assert.doesNotMatch(await hidden.text(), /Powered by|href="https:\/\/aitta\.social"/i);
  const staticHtml = await staticPage.text();
  assert.match(staticHtml, /Powered by\s*<strong><a href="https:\/\/aitta\.social"/i);
  assert.doesNotMatch(staticHtml, /FRAME_STATIC_D1_CANARY/);
});
