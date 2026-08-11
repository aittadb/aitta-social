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

const ownerCanary = "HIERARCHY_OWNER_PRIVATE_CANARY@example.test";
const longVisibleHost = `${"public-presence-segment.".repeat(8)}example.test`;
const longUnbrokenCopy = "pitkajulkinenpaivitysteksti".repeat(14);

test("the public presence leads with its compact graphical identity and About content", async () => {
  const entries = [
    entryRow({
      id: "hierarchy-note",
      kind: "note",
      title: "Lyhyt huomio yhteistyöstä",
      body: longUnbrokenCopy,
      published_at: "2026-08-04T12:00:00.000Z",
    }),
    entryRow({
      id: "hierarchy-article",
      kind: "article",
      title: "A deliberately long article heading that remains readable across narrow public layouts",
      body: "A public long-form explanation.",
      published_at: "2026-08-03T12:00:00.000Z",
    }),
    entryRow({
      id: "hierarchy-link",
      kind: "link",
      title: "Reference material",
      body: "A useful public destination.",
      destination_url: `https://destination.example/${"very-long-public-resource-segment/".repeat(9)}`,
      published_at: "2026-08-02T12:00:00.000Z",
    }),
    entryRow({
      id: "hierarchy-announcement",
      kind: "announcement",
      title: "Public announcement",
      body: "A public announcement body.",
      published_at: "2026-08-01T12:00:00.000Z",
    }),
    entryRow({
      id: "hierarchy-draft",
      kind: "article",
      title: "HIERARCHY_DRAFT_TITLE_PRIVATE_CANARY",
      body: "HIERARCHY_DRAFT_BODY_PRIVATE_CANARY",
      state: "draft",
      published_at: null,
    }),
  ];
  const response = await fetchApp("/", {
    env: makeEnv({
      db: new FakeD1({
        profile: profileRow({
          display_name: `Pohjoisen tutkimus- ja yhteistyökollektiivi ${"erittainpitkaidentiteettisana".repeat(4)}`,
          short_description: `Työskentelemme pitkäjänteisesti yhteisten kysymysten äärellä. ${longUnbrokenCopy}`,
          introduction: `Featured context stays useful before the newest public material.\nTämä esittely toimii myös käännetyllä tekstillä.\n${longUnbrokenCopy}`,
          location: "Helsinki — Helsingfors",
          website: `https://${longVisibleHost}/erittain/pitka/julkinen/polku`,
          external_links_json: JSON.stringify([
            {
              label: "Erittäin pitkä julkinen viitelinkki ilman yksityisiä tietoja",
              url: `https://reference.example/${"documented-public-path/".repeat(10)}`,
            },
            ...Array.from({ length: 7 }, (_, index) => ({
              label: `Public reference ${index + 2}`,
              url: `https://reference-${index + 2}.example/resource`,
            })),
          ]),
          private_canary: "HIERARCHY_PROFILE_PRIVATE_CANARY",
        }),
        entries,
      }),
      ownerEmail: ownerCanary,
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  const html = await response.text();

  const navigation = html.indexOf('<header class="public-nav"');
  const identity = html.indexOf('<section class="presence-identity"');
  const identityField = html.indexOf('class="presence-identity-field"', identity);
  const identityTile = html.indexOf('class="presence-identity-tile"', identityField);
  const identityHeading = html.indexOf('id="account-name"', identity);
  const details = html.indexOf('aria-label="Presence details"', identityHeading);
  const about = html.indexOf('id="about-title"', details);
  const updates = html.indexOf('id="entries-title"', about);
  const firstUpdate = html.indexOf("Lyhyt huomio yhteistyöstä", updates);
  const technical = html.indexOf('aria-label="Technical resources"', firstUpdate);

  for (const marker of [navigation, identity, identityField, identityTile, identityHeading, details, about, updates, firstUpdate, technical]) {
    assert.notEqual(marker, -1);
  }
  assert.ok(navigation < identity);
  assert.ok(identity < identityField);
  assert.ok(identityField < identityTile);
  assert.ok(identityTile < identityHeading);
  assert.ok(identityHeading < details);
  assert.ok(details < about);
  assert.ok(about < updates);
  assert.ok(updates < firstUpdate);
  assert.ok(firstUpdate < technical);

  assert.match(html, /<header[^>]+class="public-nav"[^>]+aria-label="Presence navigation"/i);
  assert.match(html, /<nav[^>]+class="public-nav-actions"[^>]+aria-label="Presence actions"/i);
  assert.match(html, /<aside[^>]+aria-label="Presence details"/i);
  const detailRegion = html.slice(html.indexOf('<aside class="presence-details"'), html.indexOf("</aside>") + 8);
  assert.equal(detailRegion.match(/<p class="presence-detail">/g)?.length, 10);
  assert.equal(detailRegion.match(/rel="me noopener noreferrer"/g)?.length, 9);
  assert.match(html, /<span class="presence-identity-tile" aria-hidden="true">PE<\/span>/i);
  assert.match(html, /<h2 id="about-title">About<\/h2>/i);
  assert.match(html, /<details>.*<summary>Read full About<\/summary>.*Tämä esittely toimii myös käännetyllä tekstillä.*<\/details>/is);
  assert.match(html, /<ol[^>]+class="entry-list"/i);
  assert.match(
    html,
    /<nav[^>]+class="technical-links"[^>]+aria-label="Technical resources"[^>]*>.*href="\/\.well-known\/aitta-social\.json".*href="\/api\/v1\/site".*href="\/api\/v1\/entries".*<\/nav>/is,
  );

  const publicHeader = html.slice(html.indexOf("<header"), html.indexOf("</header>") + 9);
  const updatesHeading = html.slice(html.indexOf('<div class="section-heading"'), html.indexOf('<ol class="entry-list"'));
  assert.doesNotMatch(publicHeader, /Manifest|JSON API|api\/v1/i);
  assert.doesNotMatch(updatesHeading, /JSON API|api\/v1/i);
  assert.doesNotMatch(html, />Public presence<|>Featured information<|>Introduction<|class="section-index"/i);

  for (const kind of ["note", "article", "link", "announcement"]) {
    assert.match(html, new RegExp(`>${kind}<`, "i"));
  }
  assert.match(html, /Tämä esittely toimii myös käännetyllä tekstillä/);
  assert.ok(html.includes(longVisibleHost));
  assert.ok(html.includes(longUnbrokenCopy));
  assert.match(html, /Erittäin pitkä julkinen viitelinkki ilman yksityisiä tietoja/);
  assert.match(html, new RegExp("very-long-public-resource-segment/".repeat(9)));
  assert.doesNotMatch(
    html,
    /HIERARCHY_(?:DRAFT_TITLE|DRAFT_BODY|PROFILE|OWNER)_PRIVATE_CANARY/i,
  );
  assert.doesNotMatch(html, />Company presence|>Presence type|accountType/i);
});

test("missing optional details and an empty historical introduction reserve no region", async () => {
  const response = await fetchApp("/", {
    env: makeEnv({
      db: new FakeD1({
        profile: profileRow({
          introduction: "",
          location: null,
          website: null,
          external_links_json: "[]",
        }),
      }),
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /class="presence-identity"/i);
  assert.doesNotMatch(html, /class="presence-details"|class="presence-about"|id="about-title"/i);
});

test("the homepage and permalink use the same compact public frame and quiet resources", async () => {
  const env = makeEnv({ db: new FakeD1({ entries: [entryRow({ id: "shared-frame-update" })] }) });
  const home = await fetchApp("/", { env, headers: { accept: "text/html" } });
  const permalink = await fetchApp("/entries/shared-frame-update", {
    env,
    headers: { accept: "text/html" },
  });

  assert.equal(home.status, 200);
  assert.equal(permalink.status, 200);
  for (const html of [await home.text(), await permalink.text()]) {
    assert.match(html, /<header class="public-nav"/i);
    assert.match(html, /<div class="public-frame public-nav-inner">/i);
    assert.match(html, /<footer class="public-footer">/i);
    assert.match(html, /aria-label="Technical resources"/i);
    assert.match(html, /href="\/\.well-known\/aitta-social\.json"/i);
    assert.match(html, /href="\/api\/v1\/site"/i);
    assert.match(html, /href="\/api\/v1\/entries"/i);
  }
});

test("an empty presence stays intentional without Hub", async () => {
  const response = await fetchApp("/", {
    env: makeEnv({
      db: new FakeD1({ entries: [] }),
      ownerEmail: ownerCanary,
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Ada Account/);
  assert.match(html, />About</);
  assert.match(html, />Recent</);
  assert.match(html, /No published updates yet/);
  assert.match(html, /presence already stands on its own/i);
  assert.match(html, /aria-label="Technical resources"/);
  assert.doesNotMatch(html, /HIERARCHY_OWNER_PRIVATE_CANARY/i);
});

test("public hierarchy CSS preserves contrast, focus, touch, narrow-layout, zoom, and motion boundaries", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--focus-dark\)[^}]*outline-offset:\s*3px[^}]*box-shadow:\s*0 0 0 6px var\(--focus-light\)/s);
  assert.match(css, /@media\s*\(forced-colors:\s*active\)\s*\{[^}]*:focus-visible\s*\{[^}]*outline-color:\s*Highlight[^}]*box-shadow:\s*none/s);

  const focusDark = customProperty(css, "focus-dark");
  const focusLight = customProperty(css, "focus-light");
  const paper = customProperty(css, "paper");
  const ownerInk = customProperty(css, "owner-ink");
  assert.ok(contrastRatio(focusDark, paper) >= 3, "dark focus ring must contrast with the light public canvas");
  assert.ok(contrastRatio(focusLight, ownerInk) >= 3, "light focus halo must contrast with dark owner surfaces");
  assert.ok(contrastRatio(focusDark, focusLight) >= 3, "the two focus layers must remain distinguishable");
  assert.match(css, /\.wordmark\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.text-link\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.public-nav-action\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.presence-detail a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.presence-about summary\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.public-attribution a,\s*\.technical-links a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.presence-heading h1\s*\{[^}]*font-size:\s*2rem[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.presence-summary\s*\{[^}]*white-space:\s*pre-wrap[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.presence-about-copy\s*\{[^}]*white-space:\s*pre-wrap[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.public-nav-inner\s*\{[^}]*min-height:\s*60px[^}]*flex-wrap:\s*nowrap/s);
  assert.match(css, /\.public-frame, \.public-presence-column, \.public-wide-content, \.permalink-content\s*\{[^}]*safe-area-inset-left[^}]*safe-area-inset-right/s);
  assert.match(css, /\.presence-identity-field\s*\{[^}]*height:\s*108px[^}]*background:\s*var\(--accent\)/s);
  assert.match(css, /\.presence-identity-field::before\s*\{[^}]*background:\s*rgb\(255 255 255 \/ 18%\)/s);
  assert.match(css, /\.presence-identity-field::after\s*\{[^}]*background:\s*rgb\(0 0 0 \/ 12%\)/s);
  assert.match(css, /\.presence-identity-tile\s*\{[^}]*width:\s*88px[^}]*height:\s*88px[^}]*background:\s*var\(--accent\)[^}]*color:\s*var\(--accent-contrast\)/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.entry-card\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});

test("normal form-control boundaries preserve non-text contrast", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const sharedControls = css.match(
    /\.field input, \.field textarea, \.field select\s*\{[^}]*border:\s*1px solid (#[0-9a-f]{6})[^}]*background:\s*(#[0-9a-f]{6}|#[0-9a-f]{3})[^}]*\}/is,
  );
  const ownerCanvas = css.match(/\.owner-shell\s*\{[^}]*background:\s*(#[0-9a-f]{6})/i);
  assert.ok(sharedControls, "missing the shared input, textarea, and select colors");
  assert.ok(ownerCanvas, "missing the adjacent owner canvas color");
  const controlBorder = sharedControls[1];
  const controlFill = expandHex(sharedControls[2]);
  assert.ok(
    contrastRatio(controlBorder, controlFill) >= 3,
    "shared control border must contrast with its fill",
  );
  assert.ok(
    contrastRatio(controlBorder, ownerCanvas[1]) >= 3,
    "shared control border must contrast with the owner canvas",
  );
  assert.doesNotMatch(sharedControls[0], /\b(?:filter|opacity|forced-color-adjust)\s*:/i);

  assert.match(
    css,
    /\.deployment-prompt textarea\s*\{[^}]*border:\s*1px solid var\(--ink\)[^}]*background:\s*var\(--paper-raised\)/s,
  );
  const promptBorder = customProperty(css, "ink");
  assert.ok(
    contrastRatio(promptBorder, customProperty(css, "paper-raised")) >= 3,
    "prompt border must contrast with its fill",
  );
  assert.ok(
    contrastRatio(promptBorder, customProperty(css, "paper")) >= 3,
    "prompt border must contrast with the public canvas",
  );

  const nativeCheckbox = css.match(/\.check-field input\s*\{([^}]*)\}/s);
  assert.ok(nativeCheckbox, "missing native checkbox sizing rule");
  assert.doesNotMatch(
    nativeCheckbox[1],
    /\b(?:appearance|background|border|forced-color-adjust)\s*:/i,
  );
});

function customProperty(css, name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `missing --${name} color token`);
  return match[1];
}

function expandHex(value) {
  return value.length === 4
    ? `#${value.slice(1).split("").map((channel) => channel.repeat(2)).join("")}`
    : value;
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4);
  return (0.2126 * linear[0]) + (0.7152 * linear[1]) + (0.0722 * linear[2]);
}
