import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  ownerHeaders,
  profileRow,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("public and owner HTML expose useful landmarks, labels, and keyboard paths", async (t) => {
  await t.test("public presence semantics", async () => {
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
    assert.match(html, /<header[^>]+aria-label="Aitta navigation"/i);
    assert.match(html, /<section[^>]+aria-labelledby="account-name"/i);
    assert.match(html, /<aside[^>]+aria-label="Profile details"/i);
    assert.match(html, /<section[^>]+aria-labelledby="entries-title"/i);
    assert.match(html, /<time[^>]+datetime=/i);
    assert.match(
      html,
      /href="\/signin-with-chatgpt\?return_to=%2Fowner"[^>]+aria-label="Manage Aitta as owner — sign in with ChatGPT for local sole-owner administration"[^>]*>Manage<\/a>/i,
    );
    assert.doesNotMatch(html, />Sign in<\/a>|Owner access/i);
    assert.match(html, /<strong>\s*<a[^>]+href="https:\/\/aitta\.social"[^>]*>AittaSocial<\/a>\s*<\/strong>/i);
    assert.match(
      html,
      /href="https:\/\/github\.com\/aittadb\/aitta-social"[^>]*aria-label="AittaSocial source on GitHub"/i,
    );
  });

  await t.test("the owner can hide the complete software attribution", async () => {
    const response = await fetchApp("/", {
      env: makeEnv({ db: new FakeD1({ profile: profileRow({ hide_powered_by: 1 }) }) }),
      headers: { accept: "text/html" },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.doesNotMatch(html, /Powered by/i);
    assert.doesNotMatch(html, /https:\/\/aitta\.social/i);
    assert.match(
      html,
      /href="https:\/\/github\.com\/aittadb\/aitta-social"[^>]*rel="noopener noreferrer"[^>]*aria-label="AittaSocial source on GitHub"/i,
    );
    assert.match(html, /href="\/privacy"[^>]*>Privacy<\/a>/i);
  });

  await t.test("a signed-in visitor gets a management destination, not an authorization claim", async () => {
    const response = await fetchApp("/", {
      env: makeEnv({ db: new FakeD1() }),
      headers: { accept: "text/html", ...ownerHeaders("visitor@example.com") },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /href="\/owner"[^>]+aria-label="Manage Aitta as owner — open local sole-owner administration"[^>]*>Manage<\/a>/i);
    assert.doesNotMatch(html, /Owner access|>Sign in<\/a>/i);
  });

  await t.test("owner profile form semantics", async () => {
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({ db: new FakeD1({ profile: profileRow({ account_type: "project" }) }), ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<main[^>]+class="owner-shell/i);
    assert.match(html, /<nav[^>]+aria-label="Owner navigation"/i);
    assert.match(html, /aria-current="page"[^>]*>Identity</i);
    assert.match(html, /<header class="owner-topbar"><a[^>]+href="\/owner"[^>]*>Manage<\/a><a[^>]+href="\/"[^>]*>View presence<\/a><\/header>/i);
    assert.match(html, /<nav class="owner-nav"[^>]*><a href="\/owner"[^>]*>Home<\/a><a href="\/owner\/profile"[^>]*>Identity<\/a><a href="\/owner\/entries\/new"[^>]*>New update<\/a><\/nav>/i);
    assert.match(html, /<footer class="owner-footer">[\s\S]*Private owner workspace[\s\S]*Sign out/i);
    assert.doesNotMatch(html, /Test Owner|owner-session|owner-user/i);
    assert.match(html, /<form[^>]+class="owner-form"/i);
    assert.match(html, /<fieldset class="identity-primary-fields">/i);
    assert.match(html, /<legend>Required Identity<\/legend>/i);
    assert.match(html, /<label[^>]*>.*Display name.*<input[^>]+name="displayName"/is);
    assert.doesNotMatch(html, /name="accountType"|>Presence type</i);
    assert.doesNotMatch(html, /(?:&quot;|\\?")accountType(?:&quot;|\\?")/i);
    assert.match(html, /<textarea[^>]+name="shortDescription"[^>]+required/i);
    assert.match(
      html,
      /<input(?=[^>]*name="canonicalUrl")(?=[^>]*type="url")(?=[^>]*required)[^>]*>/i,
    );
    assert.match(html, /class="identity-save-state identity-save-state-saved"[^>]+aria-live="polite"/i);
    assert.match(html, /role="status"[^>]+aria-live="polite"/i);
  });

  await t.test("owner update editor semantics", async () => {
    const response = await fetchApp("/owner/entries/new", {
      env: makeEnv({ db: new FakeD1(), ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<legend>Update<\/legend>/i);
    assert.match(html, /<select[^>]+name="kind"/i);
    assert.match(html, /<textarea[^>]+name="body"[^>]+required[^>]+maxlength="50000"/i);
    assert.match(html, /<form[^>]+aria-label="Create private draft"[^>]+aria-busy="false"/i);
    assert.match(html, /<button[^>]+type="submit"[^>]*>Create private draft<\/button>/i);
  });
});

test("presence and update language stays clear without obsolete Hub controls", async (t) => {
  await t.test("public and owner surfaces use presence and update language", async () => {
    const env = makeEnv({
      db: new FakeD1({ entries: [entryRow()] }),
      ownerEmail,
    });
    const publicResponse = await fetchApp("/", {
      env,
      headers: { accept: "text/html" },
    });
    assert.equal(publicResponse.status, 200);
    const publicHtml = await publicResponse.text();
    assert.match(publicHtml, />Updates<\/h2>/i);
    assert.match(publicHtml, /href="\/entries\/entry-1"[^>]+aria-label="Open update published [^"]+"/i);
    assert.match(publicHtml, /<a class="update-source-identity" href="#account">/i);
    assert.match(publicHtml, /aria-label="Manage Aitta as owner — sign in with ChatGPT for local sole-owner administration"[^>]*>Manage<\/a>/i);
    assert.doesNotMatch(publicHtml, />Entries<\/h2>|>Read (?:entry|update)<\/a>|>Sign in<\/a>/i);

    const ownerResponse = await fetchApp("/owner", {
      env,
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(ownerResponse.status, 200);
    const ownerHtml = await ownerResponse.text();
    assert.match(ownerHtml, />Your presence<\/p>/i);
    assert.match(ownerHtml, />Updates<\/h2>/i);
    assert.match(ownerHtml, />Create update<\/a>/i);
    assert.match(ownerHtml, /aria-label="Presence summary"/i);
    assert.doesNotMatch(ownerHtml, /Deployment overview|Account summary|>Entries<\/h2>|>Create entry<\/a>/i);
    assert.doesNotMatch(ownerHtml, /owner\/hub|Advanced|Provisional Hub setup|Hub probe/i);
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
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({ ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders("other@example.com") },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /not yours to administer/i);
    assert.match(html, /does not match the sole owner/i);
    assert.doesNotMatch(html, /class="owner-form"|name="accountType"/i);
    assert.doesNotMatch(html, /owner@example\.com/i);
  });

  await t.test("owner setting missing", async () => {
    const response = await fetchApp("/owner/profile", {
      env: makeEnv(),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Administration is safely disabled/i);
    assert.match(html, /protected runtime settings/i);
    assert.match(html, /every write operation remains disabled/i);
    assert.doesNotMatch(html, /class="owner-form"|name="accountType"/i);
    assert.doesNotMatch(html, /owner@example\.com/i);
  });
});

test("CSS preserves responsive, reduced-motion, focus, touch-target, and no-gradient constraints", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /:focus-visible\s*\{[^}]*outline:/s);
  assert.match(css, /\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/s);
  assert.match(css, /\.button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /--control-min-height:\s*44px/);
  assert.match(css, /\.owner-nav\s*>\s*a\s*\{[^}]*min-height:\s*var\(--control-min-height\)/s);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.field-grid-two\s*\{\s*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.identity-draft-preview\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  assert.match(css, /\.identity-draft-preview > \*\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.identity-draft-preview p:not\(\.eyebrow\)\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.owner-page-header\s*\{[^}]*flex-direction:\s*column/s);
  assert.match(css, /\.owner-topbar\s*\{[^}]*min-height:\s*calc\(60px \+ env\(safe-area-inset-top\)\)[^}]*padding-top:\s*env\(safe-area-inset-top\)/s);
  assert.match(css, /\.owner-nav\s*\{[^}]*overflow-x:\s*auto[^}]*white-space:\s*nowrap/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.owner-nav\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.owner-footer\s*\{[^}]*padding-bottom:\s*max\(0\.5rem,\s*env\(safe-area-inset-bottom\)\)/s);
  assert.match(css, /\.owner-summary\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.owner-summary > div\s*\{[^}]*padding-inline:\s*0\.65rem[^}]*\}[\s\S]*\.owner-summary strong\s*\{[^}]*font-size:\s*0\.95rem/s);
  assert.doesNotMatch(css, /\.owner-nav[^}]*flex-wrap:\s*wrap|grid-template-columns:\s*220px/);
  assert.doesNotMatch(css, /owner-nav-label|runtime-grid|runtime-status|setup-steps|hub-test|setting-(?:ready|needed)|safe-note/);
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
  assert.match(entryForm, /<legend>Update<\/legend>/);
  assert.match(profileForm, /<fieldset className="identity-primary-fields">/);
  assert.match(profileForm, /<legend>Required Identity<\/legend>/);
  assert.match(profileForm, /<legend>Optional public details<\/legend>/);
  assert.match(profileForm, /<legend>Presentation<\/legend>/);
  assert.doesNotMatch(profileForm, /accountType|name="accountType"|>Presence type/);
});

test("route navigation stays native and cannot be intercepted by the hosted client router", async () => {
  const appDirectory = new URL("../app/", import.meta.url);
  const routeFiles = (await readdir(appDirectory, { recursive: true }))
    .filter((path) => path.endsWith(".tsx"));
  const sources = await Promise.all(
    routeFiles.map(async (path) => ({ path, source: await readFile(new URL(path, appDirectory), "utf8") })),
  );

  assert.ok(sources.length > 0);
  for (const { path, source } of sources) {
    assert.doesNotMatch(source, /from\s+["']next\/link["']/, `${path} must use native anchors`);
    assert.doesNotMatch(source, /<\/?Link(?:\s|>)/, `${path} must not restore intercepted Link elements`);
  }
});
