import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolvePresentationAccent } from "../lib/presentation-accent.ts";
import { inlineStyleAttributeValues } from "./helpers/inline-style-attribute-values.mjs";
import {
  FakeD1,
  fetchApp,
  makeEnv,
  ownerHeaders,
  profileRow,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("saved appearance preview reflects the exact constrained profile choices", async (t) => {
  await t.test("comfortable spacing and visible attribution", async () => {
    const html = await ownerProfileHtml(profileRow({
      accent_color: "#31554d",
      density: "comfortable",
      hide_powered_by: 0,
    }));

    assertAppearancePreview(html, {
      accent: "#31554d",
      density: "comfortable",
      densityLabel: "Comfortable",
      attributionLabel: "Visible",
    });
    assert.match(html, /<strong>Saved appearance<\/strong>/i);
    assert.match(html, /class="identity-appearance-sample-attribution">Powered by AittaSocial<\/p>/i);
    assert.match(html, /name="accentColor"[^>]+value="#31554d"/i);
    assert.match(html, /<option value="comfortable" selected="">Comfortable<\/option>/i);
    assert.doesNotMatch(html, /<input(?=[^>]*name="hidePoweredBy")(?=[^>]*checked)[^>]*>/i);
  });

  await t.test("compact spacing and hidden attribution", async () => {
    const html = await ownerProfileHtml(profileRow({
      accent_color: "#ffffff",
      density: "compact",
      hide_powered_by: 1,
    }));

    assertAppearancePreview(html, {
      accent: resolvePresentationAccent("#ffffff"),
      density: "compact",
      densityLabel: "Compact",
      attributionLabel: "Hidden",
    });
    assert.match(html, /name="accentColor"[^>]+value="#ffffff"/i);
    assert.match(html, /<option value="compact" selected="">Compact<\/option>/i);
    assert.match(html, /<input(?=[^>]*name="hidePoweredBy")(?=[^>]*checked)[^>]*>/i);
    assert.doesNotMatch(html, /identity-appearance-sample-attribution/);
  });
});

test("invalid historical accents fail closed only at the preview style boundary", async () => {
  const legacyAccent = "#ffffff;--TASK162_PRIVATE_CANARY:url(https://attacker.example)";
  const html = await ownerProfileHtml(profileRow({ accent_color: legacyAccent }));

  assertAppearancePreview(html, {
    accent: "#31554d",
    density: "comfortable",
    densityLabel: "Comfortable",
    attributionLabel: "Visible",
  });
  for (const style of inlineStyleAttributeValues(html)) {
    assert.doesNotMatch(style, /TASK162_PRIVATE_CANARY|attacker\.example/i);
  }
  assert.match(html, /name="accentColor"[^>]+value="#31554d"/i);
  assert.match(html, /<input[^>]+id="profile-accentColor"[^>]+aria-invalid="true"[^>]*>/i);
  assert.match(html, /historical saved accent cannot be shown safely/i);
  assert.match(html, /Choose a replacement before saving; reload leaves the stored value unchanged/i);
});

test("appearance input stays transient and distinguishes saved, unsaved, and new states", async () => {
  const source = await readFile(
    new URL("../app/owner/profile/ProfileForm.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /setPreview\(\{[\s\S]*accentColor:[\s\S]*density:[\s\S]*hidePoweredBy:/);
  assert.match(source, /className=\{`identity-draft-preview identity-appearance-preview density-\$\{previewDensity\(preview\.density\)\}`\}/);
  assert.match(source, /dirty \? "Unsaved preview" : profile \? "Saved appearance" : "Appearance not saved"/);
  assert.match(source, /temporary until Save Identity succeeds/);
  assert.match(source, /window\.location\.assign\("\/owner\/profile"\)/);
  assert.match(source, /Reload saved Identity before retrying/);
  assert.match(source, /function previewDensity\([\s\S]*value === "compact" \? "compact" : "comfortable"/);
  assert.match(source, /resolvePresentationAccent\(preview\.accentColor\)/);
  assert.match(source, /historicalAccentReplacementNeeded = Boolean\(profile && !isValidAccentPreference\(profile\.accentColor\)\)/);
  assert.match(source, /accentReplacementRequired = historicalAccentReplacementNeeded && !historicalAccentReplacementChosen/);
  assert.match(source, /replacementSelected = historicalAccentReplacementNeeded &&[\s\S]*historicalAccentReplacementChosen \|\| fieldName === "accentColor"/);
  assert.match(source, /setDirty\(!sameFormValues\(formValues\(form\), loadedValues\) \|\| replacementSelected\)/);
  assert.match(source, /if \(fieldName === "accentColor"\) setHistoricalAccentReplacementChosen\(true\)/);
  assert.match(source, /if \(accentReplacementRequired\)[\s\S]*Choose an accent color before saving this historical profile[\s\S]*focusFirstInvalidField\(formElement, accentErrors\)[\s\S]*return;/);
  assert.match(source, /function editableAccentPreference\([\s\S]*isValidAccentPreference\(value\) \? value\.toLowerCase\(\) : defaultAccentPreference/);
  assert.match(source, /function initialFormValues\([\s\S]*accentColor: editableAccentPreference\(profile\?\.accentColor\)/);
  assert.match(source, /name="accentColor"[\s\S]*name="density"[\s\S]*name="hidePoweredBy"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|styleText|customCss|themeName|appearancePreset/i);
});

test("appearance remains absent from denial states and keeps private canaries confined", async (t) => {
  const privateCanary = "TASK162_DENIED_PROFILE_PRIVATE_CANARY";
  const db = new FakeD1({
    profile: profileRow({
      display_name: privateCanary,
      accent_color: `#ffffff;--${privateCanary}:red`,
      density: "compact",
      hide_powered_by: 1,
    }),
  });

  await t.test("different signed-in user", async () => {
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({ db, ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders("different@example.com") },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.doesNotMatch(html, new RegExp(privateCanary, "i"));
    assert.doesNotMatch(html, /identity-appearance-preview|name="accentColor"/i);
    assert.equal(db.queries.length, 0, "authorization denial must happen before profile storage");
  });

  await t.test("missing owner configuration", async () => {
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({ db }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.doesNotMatch(html, new RegExp(privateCanary, "i"));
    assert.doesNotMatch(html, /identity-appearance-preview|name="accentColor"/i);
    assert.equal(db.queries.length, 0, "missing-owner denial must happen before profile storage");
  });
});

test("appearance CSS is compact, responsive, motion-safe, and system-color compatible", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.identity-appearance-layout\s*\{[^}]*grid-template-columns:\s*minmax\(220px, 0\.6fr\) minmax\(0, 1\.4fr\)/s);
  assert.match(css, /\.identity-appearance-preview-state\s*\{[^}]*border:\s*1px solid var\(--line\)/s);
  assert.match(css, /\.identity-appearance-preview-unsaved\s*\{[^}]*border-left:\s*4px solid var\(--accent\)/s);
  assert.match(css, /\.identity-appearance-preview\.density-compact \.identity-appearance-sample-update\s*\{[^}]*padding-block:\s*0\.6rem/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.identity-appearance-layout, \.identity-appearance-preview\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(forced-colors:\s*active\)[\s\S]*\.identity-draft-preview\s*\{[^}]*border-left-color:\s*CanvasText/s);
  assert.match(css, /\.field input, \.field textarea, \.field select\s*\{[^}]*min-height:\s*48px/s);
  assert.match(css, /\.check-field\s*\{[^}]*min-height:\s*var\(--control-min-height\)/s);
  assert.doesNotMatch(css, /forced-color-adjust:\s*none|(?:linear|radial|conic)-gradient\s*\(/i);
});

async function ownerProfileHtml(profile) {
  const response = await fetchApp("/owner/profile", {
    env: makeEnv({ db: new FakeD1({ profile }), ownerEmail }),
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(response.status, 200);
  return response.text();
}

function assertAppearancePreview(html, {
  accent,
  density,
  densityLabel,
  attributionLabel,
}) {
  assert.match(
    html,
    new RegExp(
      `class="identity-draft-preview identity-appearance-preview density-${density}"[^>]*style="--accent:${accent}"`,
      "i",
    ),
  );
  assert.match(html, new RegExp(`Spacing ·[\\s\\S]{0,24}${densityLabel}`, "i"));
  assert.match(html, new RegExp(`Attribution ·[\\s\\S]{0,24}${attributionLabel}`, "i"));
  assert.equal((html.match(/class="identity-appearance-sample-update"/gi) ?? []).length, 2);
}
