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
const credentialCanary = "HIERARCHY_CREDENTIAL_PRIVATE_CANARY";
const longVisibleHost = `${"public-presence-segment.".repeat(8)}example.test`;
const longUnbrokenCopy = "pitkajulkinenpaivitysteksti".repeat(14);

test("the public presence leads with identity, featured information, and recent updates", async () => {
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
          ]),
          private_canary: "HIERARCHY_PROFILE_PRIVATE_CANARY",
        }),
        entries,
      }),
      ownerEmail: ownerCanary,
      hubUrl: "https://unavailable-hub.example",
      deploymentCredential: credentialCanary,
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  const html = await response.text();

  const identity = html.indexOf('<section class="identity-block"');
  const identityHeading = html.indexOf('id="account-name"', identity);
  const featured = html.indexOf(">Featured information<", identityHeading);
  const introduction = html.indexOf('id="introduction-title"', featured);
  const recent = html.indexOf(">Recent<", introduction);
  const updates = html.indexOf('id="entries-title"', recent);
  const firstUpdate = html.indexOf("Lyhyt huomio yhteistyöstä", updates);
  const technical = html.indexOf('aria-label="Technical resources"', firstUpdate);

  for (const marker of [identity, identityHeading, featured, introduction, recent, updates, firstUpdate, technical]) {
    assert.notEqual(marker, -1);
  }
  assert.ok(identity < identityHeading);
  assert.ok(identityHeading < featured);
  assert.ok(featured < introduction);
  assert.ok(introduction < recent);
  assert.ok(recent < updates);
  assert.ok(updates < firstUpdate);
  assert.ok(firstUpdate < technical);

  assert.match(html, /<header[^>]+class="public-nav"[^>]+aria-label="Presence navigation"/i);
  assert.match(html, /<nav[^>]+class="public-nav-actions"[^>]+aria-label="Presence actions"/i);
  assert.match(html, /<aside[^>]+aria-label="Presence details"/i);
  assert.match(html, /<ol[^>]+class="entry-list"/i);
  assert.match(
    html,
    /<nav[^>]+class="technical-links"[^>]+aria-label="Technical resources"[^>]*>.*href="\/\.well-known\/aitta-social\.json".*href="\/api\/v1\/site".*href="\/api\/v1\/entries".*<\/nav>/is,
  );

  const publicHeader = html.slice(html.indexOf("<header"), html.indexOf("</header>") + 9);
  const updatesHeading = html.slice(html.indexOf('<div class="section-heading"'), html.indexOf('<ol class="entry-list"'));
  assert.doesNotMatch(publicHeader, /Manifest|JSON API|api\/v1/i);
  assert.doesNotMatch(updatesHeading, /JSON API|api\/v1/i);

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
    /HIERARCHY_(?:DRAFT_TITLE|DRAFT_BODY|PROFILE|OWNER|CREDENTIAL)_PRIVATE_CANARY/i,
  );
  assert.doesNotMatch(html, />Company presence|>Presence type|accountType/i);
});

test("an empty presence stays intentional and independent of optional Hub availability", async () => {
  const response = await fetchApp("/", {
    env: makeEnv({
      db: new FakeD1({ entries: [] }),
      ownerEmail: ownerCanary,
      hubUrl: "https://unavailable-hub.example",
      deploymentCredential: credentialCanary,
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Ada Account/);
  assert.match(html, />Featured information</);
  assert.match(html, />Recent</);
  assert.match(html, /No published updates yet/);
  assert.match(html, /presence already stands on its own/i);
  assert.match(html, /aria-label="Technical resources"/);
  assert.doesNotMatch(html, /unavailable-hub|HIERARCHY_(?:OWNER|CREDENTIAL)_PRIVATE_CANARY/i);
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
  assert.match(css, /\.identity-details a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.public-attribution a,\s*\.technical-links a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.identity-main h1[^{]*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.prose-copy,\s*\.entry-body\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /@media\s*\(max-width:\s*900px\)\s*\{[^}]*\.identity-block\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.public-nav\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.public-nav-actions,\s*\.public-nav-actions \.button\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.introduction\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*?\.entry-card\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});

function customProperty(css, name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `missing --${name} color token`);
  return match[1];
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
