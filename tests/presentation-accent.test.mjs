import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { resolvePresentationAccent } from "../lib/presentation-accent.ts";
import {
  entryRow,
  FakeD1,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  responseJson,
  validProfileInput,
} from "./helpers/worker-harness.mjs";
import {
  applyFixtureSql,
  applyMigrationSql,
  createCompiledWorker,
  OWNER_EMAIL,
  readRepositoryFile,
  rows,
} from "./helpers/local-d1-upgrade.mjs";

const DEFAULT_ACCENT = "#31554d";
const LIGHT_SURFACES = [
  "#eef0eb",
  "#f3f0e8",
  "#f7f7f3",
  "#fbfaf6",
  "#ffffff",
  "#fffcf5",
];
const PUBLISHED_ID = "accent-published";

test("the deterministic accent rule preserves safe colors and adjusts unsafe colors", () => {
  assert.equal(resolvePresentationAccent("#000000"), "#000000");
  assert.equal(resolvePresentationAccent("#31554d"), "#31554d");
  assert.equal(resolvePresentationAccent("#6d6d6d"), "#6d6d6d");
  assert.equal(resolvePresentationAccent("#6e6e6e"), "#6d6d6d");
  assert.equal(resolvePresentationAccent("#ffffff"), "#55736c");
  assert.equal(resolvePresentationAccent("#AABBCC"), "#547271");

  for (const value of [
    "#000000",
    "#31554d",
    "#6d6d6d",
    "#6e6e6e",
    "#ffffff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#aabbcc",
    "#fedcba",
  ]) {
    const rendered = resolvePresentationAccent(value);
    assert.match(rendered, /^#[0-9a-f]{6}$/);
    for (const surface of LIGHT_SURFACES) {
      assert.ok(
        contrastRatio(rendered, surface) >= 4.5,
        `${value} resolved to ${rendered}, which must contrast with ${surface}`,
      );
    }
  }

  assert.ok(contrastRatio("#6d6d6d", LIGHT_SURFACES[0]) >= 4.5);
  assert.ok(contrastRatio("#6e6e6e", LIGHT_SURFACES[0]) < 4.5);
  assert.equal(
    Math.min(...LIGHT_SURFACES.map(relativeLuminance)),
    relativeLuminance("#eef0eb"),
  );
});

test("invalid and malicious legacy accents fail closed before a style sink", () => {
  for (const value of [
    undefined,
    null,
    123,
    "",
    "#fff",
    "#gggggg",
    "red",
    "url(https://attacker.example/ACCENT_MALICIOUS_MARKER)",
    "#ffffff;--private-canary:url(https://attacker.example)",
    " #ffffff",
    "#ffffff ",
  ]) {
    assert.equal(resolvePresentationAccent(value), DEFAULT_ACCENT);
  }
});

test("an accepted accent stays exact in D1 and protocol while every rendered surface uses its safe derivative", async () => {
  const privateDraft = entryRow({
    id: "ACCENT_DRAFT_PRIVATE_CANARY",
    title: "ACCENT_DRAFT_TITLE_PRIVATE_CANARY",
    body: "ACCENT_DRAFT_BODY_PRIVATE_CANARY",
    state: "draft",
    published_at: null,
  });
  const published = entryRow({ id: PUBLISHED_ID });
  const db = new FakeD1({ entries: [published, privateDraft] });
  const env = makeEnv({ db, ownerEmail: "owner@example.test" });

  const save = await fetchApp("/api/private/profile", {
    env,
    method: "PUT",
    headers: mutationHeaders("owner@example.test"),
    body: JSON.stringify(validProfileInput({ accentColor: "#FFFFFF" })),
  });
  assert.equal(save.status, 204);
  assert.equal(db.profile.accent_color, "#ffffff");
  assert.equal(db.profile.account_type, "person");
  assert.equal(db.mutations.length, 1);

  const expectedRendered = resolvePresentationAccent("#ffffff");
  const beforeReads = structuredClone(db.profile);
  const [homeResponse, permalinkResponse, ownerResponse, siteResponse] = await Promise.all([
    fetchApp("/", { env, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${PUBLISHED_ID}`, { env, headers: { accept: "text/html" } }),
    fetchApp("/owner/profile", {
      env,
      headers: { accept: "text/html", ...ownerHeaders("owner@example.test") },
    }),
    fetchApp("/api/v1/site", { env }),
  ]);
  const [home, permalink, owner, site] = await Promise.all([
    homeResponse.text(),
    permalinkResponse.text(),
    ownerResponse.text(),
    responseJson(siteResponse),
  ]);

  assertRenderedAccent(home, "public-shell", expectedRendered);
  assertRenderedAccent(permalink, "permalink-shell", expectedRendered);
  assertRenderedAccent(owner, "identity-draft-preview", expectedRendered);
  assert.match(owner, /name="accentColor"[^>]*value="#ffffff"/i);
  assert.equal(site.data.attributes.presentation.accentColor, "#ffffff");
  assert.deepEqual(db.profile, beforeReads);
  assert.equal(db.mutations.length, 1, "read, preview, and reload paths must not clobber D1");

  for (const html of [home, permalink]) {
    assert.doesNotMatch(
      html,
      /ACCENT_DRAFT_(?:PRIVATE|TITLE_PRIVATE|BODY_PRIVATE)_CANARY|do-not-project@example\.test/,
    );
  }

  const reload = await fetchApp("/", { env, headers: { accept: "text/html" } });
  assertRenderedAccent(await reload.text(), "public-shell", expectedRendered);
  assert.deepEqual(db.profile, beforeReads);
  assert.equal(db.mutations.length, 1);
});

test("a malformed persisted legacy accent survives reopen without reaching public style attributes", {
  timeout: 120_000,
}, async (t) => {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "aitta-social-accent-upgrade-"));
  const persistPath = path.join(temporaryRoot, "persisted-d1");
  const legacyAccent = "#ffffff;--accent-private-marker:url(https://attacker.example)";
  let worker = await createCompiledWorker({ persistPath });

  t.after(async () => {
    if (worker) await worker.dispose();
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  await applyMigrationSql(
    worker.db,
    await readRepositoryFile("drizzle/0000_closed_talos.sql"),
  );
  await applyFixtureSql(
    worker.db,
    await readRepositoryFile("tests/fixtures/poc-upgrade-v0.sql"),
  );
  const setup = await worker.db
    .prepare("UPDATE profiles SET accent_color = ? WHERE id = ?")
    .bind(legacyAccent, 1)
    .run();
  assert.equal(setup.success, true);
  assert.equal(setup.meta.changes, 1);
  assert.deepEqual(await storedAccent(worker.db), [{ accent_color: legacyAccent }]);

  await worker.dispose();
  worker = null;
  worker = await createCompiledWorker({ persistPath });

  const homeResponse = await worker.fetch("/", { headers: { accept: "text/html" } });
  const home = await homeResponse.text();
  const permalinkResponse = await worker.fetch("/entries/poc-v0-published-update", {
    headers: { accept: "text/html" },
  });
  const permalink = await permalinkResponse.text();
  const ownerResponse = await worker.fetch("/owner/profile", {
    headers: { accept: "text/html", ...ownerHeaders(OWNER_EMAIL) },
  });
  const owner = await ownerResponse.text();
  const siteResponse = await worker.fetch("/api/v1/site");
  const site = await responseJson(siteResponse);

  assertRenderedAccent(home, "public-shell", DEFAULT_ACCENT);
  assertRenderedAccent(permalink, "permalink-shell", DEFAULT_ACCENT);
  assertRenderedAccent(owner, "identity-draft-preview", DEFAULT_ACCENT);
  assert.doesNotMatch(home, /accent-private-marker|attacker\.example/i);
  assert.doesNotMatch(permalink, /accent-private-marker|attacker\.example/i);
  for (const style of styleAttributes(owner)) {
    assert.doesNotMatch(style, /accent-private-marker|attacker\.example/i);
  }
  assert.doesNotMatch(home, /POC_V0_DRAFT_(?:TITLE|BODY)_PRIVATE_CANARY/);
  assert.doesNotMatch(permalink, /POC_V0_DRAFT_(?:TITLE|BODY)_PRIVATE_CANARY/);
  assert.equal(site.data.attributes.presentation.accentColor, legacyAccent);
  assert.deepEqual(await storedAccent(worker.db), [{ accent_color: legacyAccent }]);
});

test("the owner preview uses the shared rule and forced colors stay browser-owned", async () => {
  const [profileForm, publicPage, permalinkPage, css] = await Promise.all([
    readFile(new URL("../app/owner/profile/ProfileForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/entries/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  for (const source of [profileForm, publicPage, permalinkPage]) {
    assert.match(source, /resolvePresentationAccent\(/);
  }
  assert.match(profileForm, /style=\{\{ "--accent": resolvePresentationAccent\(preview\.accentColor\) \}/);
  assert.doesNotMatch(`${profileForm}\n${css}`, /preview-accent|safePreviewAccent/);
  assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
  assert.doesNotMatch(css, /forced-color-adjust:\s*none/i);
  assert.doesNotMatch(css, /--owner-(?:ink|panel)\s*:/);
  assert.equal(cssCustomProperty(css, "paper"), LIGHT_SURFACES[1]);
  assert.match(css, /\.owner-shell\s*\{[^}]*background:\s*var\(--paper\)[^}]*color:\s*var\(--ink\)/s);
  assert.equal(cssCustomProperty(css, "paper-raised"), LIGHT_SURFACES[3]);
  assert.match(css, /\.identity-draft-preview\s*\{[^}]*background:\s*var\(--paper-raised\)/s);
  assert.match(css, /\.owner-next-step\s*\{[^}]*border:\s*1px solid var\(--line\)[^}]*border-radius:\s*6px[^}]*background:\s*var\(--paper-raised\)/s);
  assert.match(css, /\.owner-summary\s*\{[^}]*border:\s*1px solid var\(--line\)[^}]*border-radius:\s*6px[^}]*background:\s*var\(--paper-raised\)/s);
  assert.match(css, /\.owner-empty\s*\{[^}]*border:\s*1px solid var\(--line\)[^}]*border-radius:\s*6px[^}]*background:\s*var\(--paper-raised\)/s);
  assert.equal(cssCustomProperty(css, "accent-contrast"), LIGHT_SURFACES[4]);
  assert.match(css, /\.button\s*\{[^}]*color:\s*var\(--accent-contrast\)/s);
  assert.match(css, /\.public-shell, \.permalink-shell\s*\{[^}]*--paper:\s*#f3f0e8[^}]*--paper-raised:\s*#fffcf5/s);
  assert.match(css, /\.presence-identity-tile\s*\{[^}]*background:\s*var\(--accent\)[^}]*color:\s*var\(--accent-contrast\)/s);
});

async function storedAccent(db) {
  return rows(db, "SELECT accent_color FROM profiles WHERE id = ?", 1);
}

function assertRenderedAccent(html, className, expected) {
  assert.match(
    html,
    new RegExp(`class="[^"]*${className}[^"]*"[^>]*style="--accent:${expected}"`, "i"),
  );
}

function styleAttributes(html) {
  return [...html.matchAll(/\sstyle="([^"]*)"/gi)].map((match) => match[1]);
}

function cssCustomProperty(css, name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(match, `missing --${name} CSS color`);
  return match[1].toLowerCase();
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4);
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}
