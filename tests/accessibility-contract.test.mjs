import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  ownerHeaders,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("public and owner HTML expose useful landmarks, labels, and keyboard paths", async (t) => {
  await t.test("public account semantics", async () => {
    const response = await fetchApp("/", {
      env: makeEnv({ db: new FakeD1({ entries: [entryRow()] }) }),
      headers: { accept: "text/html" },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<html[^>]+lang="en"/i);
    assert.match(html, /class="skip-link"[^>]+href="#main-content"/i);
    assert.match(html, /id="main-content"/i);
    assert.match(html, /<main[^>]+class="public-shell/i);
    assert.match(html, /<header[^>]+aria-label="Account navigation"/i);
    assert.match(html, /<section[^>]+aria-labelledby="account-name"/i);
    assert.match(html, /<aside[^>]+aria-label="Account details"/i);
    assert.match(html, /<section[^>]+aria-labelledby="entries-title"/i);
    assert.match(html, /<time[^>]+datetime=/i);
  });

  await t.test("owner profile form semantics", async () => {
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({ db: new FakeD1(), ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<main[^>]+class="owner-shell/i);
    assert.match(html, /<nav[^>]+aria-label="Owner navigation"/i);
    assert.match(html, /aria-current="page"[^>]*>Profile</i);
    assert.match(html, /<form[^>]+class="owner-form"/i);
    assert.match(html, /<fieldset>/i);
    assert.match(html, /<legend>Identity<\/legend>/i);
    assert.match(html, /<label[^>]*>.*Display name.*<input[^>]+name="displayName"/is);
    assert.match(html, /<textarea[^>]+name="shortDescription"[^>]+required/i);
    assert.match(
      html,
      /<input(?=[^>]*name="canonicalUrl")(?=[^>]*type="url")(?=[^>]*required)[^>]*>/i,
    );
    assert.match(html, /role="status"[^>]+aria-live="polite"/i);
  });

  await t.test("owner entry editor semantics", async () => {
    const response = await fetchApp("/owner/entries/new", {
      env: makeEnv({ db: new FakeD1(), ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<legend>Entry<\/legend>/i);
    assert.match(html, /<select[^>]+name="kind"/i);
    assert.match(html, /<textarea[^>]+name="body"[^>]+required[^>]+maxlength="50000"/i);
    assert.match(html, /<button[^>]+type="submit"[^>]*>Create draft<\/button>/i);
  });
});

test("owner-only pages redirect signed-out visitors and explain denied/configuration states safely", async (t) => {
  await t.test("signed out", async () => {
    const response = await fetchApp("/owner", {
      env: makeEnv({ ownerEmail }),
      headers: { accept: "text/html" },
    });
    assert.ok([303, 307, 308].includes(response.status));
    const location = response.headers.get("location") ?? "";
    assert.match(location, /^\/signin-with-chatgpt\?return_to=%2Fowner$/);
    assert.doesNotMatch(location, /owner%40example|owner@example/i);
  });

  await t.test("different signed-in user", async () => {
    const response = await fetchApp("/owner", {
      env: makeEnv({ ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders("other@example.com") },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /not yours to administer/i);
    assert.match(html, /does not match the sole owner/i);
    assert.doesNotMatch(html, /owner@example\.com/i);
  });

  await t.test("owner setting missing", async () => {
    const response = await fetchApp("/owner", {
      env: makeEnv(),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Administration is safely disabled/i);
    assert.match(html, /protected runtime settings/i);
    assert.match(html, /every write operation remains disabled/i);
    assert.doesNotMatch(html, /owner@example\.com/i);
  });
});

test("CSS preserves responsive, reduced-motion, focus, touch-target, and no-gradient constraints", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /:focus-visible\s*\{[^}]*outline:/s);
  assert.match(css, /\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/s);
  assert.match(css, /\.button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.owner-nav\s*>\s*a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.field-grid-two,\s*\.runtime-grid\s*\{\s*grid-template-columns:\s*1fr/s);
  assert.match(css, /\.owner-page-header\s*\{[^}]*flex-direction:\s*column/s);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});

test("client mutation controls announce status and use semantic form controls", async () => {
  const [actions, entryForm, profileForm] = await Promise.all([
    readFile(new URL("../app/owner/_components/EntryActions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/entries/EntryForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/profile/ProfileForm.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of [actions, entryForm, profileForm]) {
    assert.match(source, /role="status"/);
    assert.match(source, /aria-live="polite"/);
  }
  assert.match(actions, /<button[^>]+type="button"/);
  assert.match(actions, /disabled=\{busy\}/);
  assert.match(entryForm, /<form[^>]+onSubmit=\{submit\}/);
  assert.match(entryForm, /<fieldset>/);
  assert.match(entryForm, /<legend>Entry<\/legend>/);
  assert.match(profileForm, /<fieldset>/);
  assert.match(profileForm, /<legend>Identity<\/legend>/);
  assert.match(profileForm, /<legend>Public details<\/legend>/);
  assert.match(profileForm, /<legend>Presentation<\/legend>/);
});
