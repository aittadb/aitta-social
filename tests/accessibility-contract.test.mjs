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
    assert.match(html, /<header[^>]+aria-label="Presence navigation"/i);
    assert.match(html, /<section[^>]+aria-labelledby="account-name"/i);
    assert.match(html, /<aside[^>]+aria-label="Presence details"/i);
    assert.match(html, /<section[^>]+aria-labelledby="entries-title"/i);
    assert.match(html, /<time[^>]+datetime=/i);
    assert.match(
      html,
      /href="\/signin-with-chatgpt\?return_to=%2Fowner"[^>]+aria-label="Manage presence as owner — sign in with ChatGPT for local sole-owner administration"[^>]*>Manage presence as owner<\/a>/i,
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
    assert.doesNotMatch(html, /https:\/\/github\.com\/aittadb\/aitta-social/i);
  });

  await t.test("a signed-in visitor gets a management destination, not an authorization claim", async () => {
    const response = await fetchApp("/", {
      env: makeEnv({ db: new FakeD1() }),
      headers: { accept: "text/html", ...ownerHeaders("visitor@example.com") },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /href="\/owner"[^>]+aria-label="Manage presence as owner — open local sole-owner administration"[^>]*>Manage presence as owner<\/a>/i);
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
    assert.match(html, /<form[^>]+class="owner-form"/i);
    assert.match(html, /<fieldset>/i);
    assert.match(html, /<legend>Identity<\/legend>/i);
    assert.match(html, /<label[^>]*>.*Display name.*<input[^>]+name="displayName"/is);
    assert.doesNotMatch(html, /name="accountType"|>Presence type</i);
    assert.doesNotMatch(html, /(?:&quot;|\\?")accountType(?:&quot;|\\?")/i);
    assert.match(html, /<textarea[^>]+name="shortDescription"[^>]+required/i);
    assert.match(
      html,
      /<input(?=[^>]*name="canonicalUrl")(?=[^>]*type="url")(?=[^>]*required)[^>]*>/i,
    );
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
    assert.match(html, /<button[^>]+type="submit"[^>]*>Create draft<\/button>/i);
  });
});

test("presence language and provisional Hub copy do not overclaim identity or connection", async (t) => {
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
    assert.match(publicHtml, />Read update<\/a>/i);
    assert.match(publicHtml, />Manage presence as owner<\/a>/i);
    assert.doesNotMatch(publicHtml, />Entries<\/h2>|>Read entry<\/a>|>Sign in<\/a>/i);

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
  });

  await t.test("the owner sees only a provisional Hub diagnostic", async () => {
    const response = await fetchApp("/owner/hub", {
      env: makeEnv({ ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /<h1>Provisional Hub setup<\/h1>/i);
    assert.match(html, /manual challenge and root probe do not establish a trusted Hub connection or network identity/i);
    assert.match(html, /successful root response is not a completed Hub connection/i);
    assert.match(html, /<button[^>]+type="button"[^>]*>Run provisional Hub probe<\/button>/i);
    assert.doesNotMatch(html, /<h1>AittaSocial Hub setup<\/h1>|>Test Hub connection<\/button>/i);
  });

  await t.test("a different signed-in user cannot see Hub settings or the provisional control", async () => {
    const response = await fetchApp("/owner/hub", {
      env: makeEnv({ ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders("other@example.com") },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /This presence is not yours to administer/i);
    assert.doesNotMatch(html, /Protected setting status|Provisional setup sequence|Run provisional Hub probe/i);
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
  assert.match(css, /\.owner-nav\s*>\s*a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.field-grid-two,\s*\.runtime-grid\s*\{\s*grid-template-columns:\s*1fr/s);
  assert.match(css, /\.owner-page-header\s*\{[^}]*flex-direction:\s*column/s);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});

test("client mutation controls announce status and use semantic form controls", async () => {
  const [actions, entryForm, profileForm, hubTest] = await Promise.all([
    readFile(new URL("../app/owner/_components/EntryActions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/entries/EntryForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/profile/ProfileForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/hub/HubTest.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of [actions, entryForm, profileForm, hubTest]) {
    assert.match(source, /role="status"/);
    assert.match(source, /aria-live="polite"/);
  }
  assert.match(actions, /<button[^>]+type="button"/);
  assert.match(actions, /disabled=\{busy\}/);
  assert.match(entryForm, /<form[^>]+onSubmit=\{submit\}/);
  assert.match(entryForm, /<fieldset>/);
  assert.match(entryForm, /<legend>Update<\/legend>/);
  assert.match(profileForm, /<fieldset>/);
  assert.match(profileForm, /<legend>Identity<\/legend>/);
  assert.match(profileForm, /<legend>Public details<\/legend>/);
  assert.match(profileForm, /<legend>Presentation<\/legend>/);
  assert.doesNotMatch(profileForm, /accountType|name="accountType"|>Presence type/);
  assert.match(hubTest, /Provisional probe result:/);
  assert.match(hubTest, /catch \{ setStatus\("Provisional probe result:/);
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
