import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  profileRow,
  responseJson,
  validProfileInput,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("authorized owner sees truthful fresh, incomplete, and complete Identity states", async (t) => {
  await t.test("fresh state is derived from an absent profile and survives no unsaved fiction", async () => {
    const response = await fetchApp("/owner", {
      env: makeEnv({ db: new FakeD1({ profile: null }), ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Complete your identity/i);
    assert.match(html, /Set up your public Identity/i);
    assert.match(html, /Identity readiness:[\s\S]{0,40}0[\s\S]{0,40}of 2 requirements complete/i);
    assert.match(html, /href="\/owner\/profile"[^>]*>Set up identity</i);
    assert.equal((html.match(/<a class="button"/gi) ?? []).length, 1);
    assert.doesNotMatch(html, /Identity is saved|Ready for public review/i);
  });

  await t.test("fresh state counts a valid protected canonical URL independently", async () => {
    const response = await fetchApp("/owner", {
      env: makeEnv({
        db: new FakeD1({ profile: null }),
        ownerEmail,
        canonicalUrl: "https://RUNTIME.example/presence///",
      }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Complete your identity/i);
    assert.match(html, /A protected public URL is ready/i);
    assert.match(html, /Identity readiness:[\s\S]{0,40}1[\s\S]{0,40}of 2 requirements complete/i);
    assert.match(html, /https:\/\/runtime\.example\/presence/i);
    assert.doesNotMatch(html, /https:\/\/RUNTIME\.example\/presence\/\/\//);
    assert.doesNotMatch(html, /owner-next-step-complete|Ready for public review/i);
  });

  await t.test("stored profile without an effective canonical URL is incomplete", async () => {
    const response = await fetchApp("/owner", {
      env: makeEnv({
        db: new FakeD1({ profile: profileRow({ canonical_url: "not-a-valid-url" }) }),
        ownerEmail,
        canonicalUrl: "also-not-valid",
      }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail), host: "hostile.example" },
      origin: "https://hostile-request.example",
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Finish your identity/i);
    assert.match(html, /Add a canonical URL/i);
    assert.match(html, /Identity readiness:[\s\S]{0,40}1[\s\S]{0,40}of 2 requirements complete/i);
    assert.equal((html.match(/<a class="button"/gi) ?? []).length, 1);
    assert.doesNotMatch(html, /hostile\.example|hostile-request\.example|also-not-valid|Effective public URL/i);
  });

  await t.test("saved profile plus effective canonical URL is complete", async () => {
    const response = await fetchApp("/owner", {
      env: makeEnv({ db: new FakeD1(), ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Create your first update/i);
    assert.match(html, /Identity readiness:[\s\S]{0,40}2[\s\S]{0,40}of 2 requirements complete/i);
    assert.match(html, /Public URL/i);
    assert.match(html, /https:\/\/account\.example/i);
    assert.match(html, /href="\/owner\/entries\/new"[^>]*>Create first draft</i);
    assert.equal((html.match(/<a class="button"/gi) ?? []).length, 1);
  });
});

test("Identity form shows normalized effective canonical precedence without exposing raw settings", async (t) => {
  await t.test("valid runtime canonical takes precedence over the stored fallback", async () => {
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({
        db: new FakeD1({ profile: profileRow({ canonical_url: "https://stored.example/fallback" }) }),
        ownerEmail,
        canonicalUrl: "  https://RUNTIME.example/public///  ",
      }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Identity is complete/i);
    assert.match(html, /normalized canonical URL from protected runtime settings/i);
    assert.match(html, /Effective public URL/i);
    assert.match(html, /https:\/\/runtime\.example\/public/i);
    assert.doesNotMatch(html, /RUNTIME\.example|public\/\/\//);
    assert.match(html, /name="canonicalUrl"[^>]+value="https:\/\/stored\.example\/fallback"/i);
  });

  await t.test("an invalid protected value is not serialized and stored canonical remains effective", async () => {
    const protectedCanary = "RUNTIME_SECRET_CANARY";
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({
        db: new FakeD1({ profile: profileRow({ canonical_url: "https://stored.example/presence" }) }),
        ownerEmail,
        canonicalUrl: `https://user:${protectedCanary}@runtime.example/path?token=${protectedCanary}`,
      }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /canonical URL saved with this Identity/i);
    assert.match(html, /https:\/\/stored\.example\/presence/i);
    assert.doesNotMatch(html, new RegExp(protectedCanary, "i"));
    assert.doesNotMatch(html, /user:|token=/i);
  });
});

test("Identity authorization and validation fail closed without mutation or private derivation", async (t) => {
  await t.test("non-owner sees no Identity form or stored values", async () => {
    const privateCanary = "PROFILE_PRIVATE_CANARY_FOR_IDENTITY";
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({
        db: new FakeD1({ profile: profileRow({ display_name: privateCanary }) }),
        ownerEmail,
      }),
      headers: { accept: "text/html", ...ownerHeaders("other@example.com") },
    });
    const html = await response.text();
    assert.match(html, /not yours to administer/i);
    assert.doesNotMatch(html, new RegExp(privateCanary, "i"));
    assert.doesNotMatch(html, /class="owner-form"|Effective public URL/i);
  });

  await t.test("missing owner keeps Identity disabled and hides stored values", async () => {
    const privateCanary = "MISSING_OWNER_PROFILE_CANARY";
    const response = await fetchApp("/owner/profile", {
      env: makeEnv({ db: new FakeD1({ profile: profileRow({ display_name: privateCanary }) }) }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    const html = await response.text();
    assert.match(html, /Administration is safely disabled/i);
    assert.doesNotMatch(html, new RegExp(privateCanary, "i"));
    assert.doesNotMatch(html, /class="owner-form"|Effective public URL/i);
  });

  await t.test("invalid owner write does not mutate D1", async () => {
    const db = new FakeD1({ profile: null });
    const response = await fetchApp("/api/private/profile", {
      env: makeEnv({ db, ownerEmail }),
      method: "PUT",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validProfileInput({ canonicalUrl: "https://user:secret@example.com/?private=yes" })),
    });
    assert.equal(response.status, 400);
    assert.deepEqual(Object.keys((await responseJson(response)).details), ["canonicalUrl"]);
    assert.equal(db.profile, null);
    assert.equal(db.mutations.length, 0);
  });
});

test("successful save resumes from D1 and never derives public Identity from ChatGPT or drafts", async () => {
  const db = new FakeD1({
    profile: null,
    entries: [entryRow({ state: "draft", title: "DRAFT_IDENTITY_CANARY", body: "DRAFT_BODY_CANARY", published_at: null })],
  });
  const env = makeEnv({
    db,
    ownerEmail,
    canonicalUrl: "https://CANONICAL.example/presence///",
  });
  const input = validProfileInput({
    displayName: "Saved Presence Identity",
    canonicalUrl: "https://stored.example/fallback///",
  });
  const save = await fetchApp("/api/private/profile", {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(input),
  });
  assert.equal(save.status, 204);

  const profileResponse = await fetchApp("/owner/profile", {
    env,
    headers: {
      accept: "text/html",
      ...ownerHeaders(ownerEmail),
      "oai-authenticated-user-full-name": encodeURIComponent("CHATGPT_IDENTITY_CANARY"),
    },
  });
  assert.equal(profileResponse.status, 200);
  const profileHtml = await profileResponse.text();
  assert.match(profileHtml, /Saved Presence Identity/i);
  assert.match(profileHtml, /https:\/\/canonical\.example\/presence/i);
  assert.match(profileHtml, /name="canonicalUrl"[^>]+value="https:\/\/stored\.example\/fallback"/i);
  assert.doesNotMatch(profileHtml, /DRAFT_IDENTITY_CANARY|DRAFT_BODY_CANARY/i);

  const publicResponse = await fetchApp("/", {
    env,
    headers: { accept: "text/html" },
    origin: "https://hostile-request.example",
  });
  assert.equal(publicResponse.status, 200);
  const publicHtml = await publicResponse.text();
  assert.match(publicHtml, /Saved Presence Identity/i);
  assert.doesNotMatch(publicHtml, /CHATGPT_IDENTITY_CANARY|owner@example\.com|DRAFT_IDENTITY_CANARY|DRAFT_BODY_CANARY|hostile-request\.example/i);
});

test("Identity journey remains semantic, touch-friendly, responsive, and motion-safe", async () => {
  const [formSource, shellSource, css] = await Promise.all([
    readFile(new URL("../app/owner/profile/ProfileForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/_components/OwnerShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(formSource, /<aside[\s\S]*aria-labelledby="identity-draft-preview-title"/);
  assert.match(formSource, /<progress[^>]+max="4"[^>]+value=\{requiredCount\(preview\)\}/);
  assert.match(formSource, /onInput=\{updatePreview\}/);
  assert.match(formSource, /temporary until Save identity succeeds/i);
  assert.doesNotMatch(formSource, /localStorage|sessionStorage|accountType|next\/link/i);
  assert.match(shellSource, /<a className="owner-wordmark" href="\/owner">Manage<\/a>/);
  assert.match(shellSource, /<a className="owner-public-link" href="\/">View presence<\/a>/);
  assert.match(shellSource, /<OwnerNavLink href="\/owner"[^>]*>Home<\/OwnerNavLink>[\s\S]*<OwnerNavLink href="\/owner\/profile"[^>]*>Identity<\/OwnerNavLink>[\s\S]*<OwnerNavLink href="\/owner\/entries\/new"[^>]*>New update<\/OwnerNavLink>/);
  assert.match(shellSource, /<footer className="owner-footer">[\s\S]*Private owner workspace[\s\S]*Sign out/);
  assert.doesNotMatch(shellSource, /\{displayName\}|owner-user|owner-session|Owner workspace/);
  assert.doesNotMatch(shellSource, /Advanced|owner\/hub|Provisional Hub setup|current:\s*[^;]*"hub"/);
  assert.match(css, /\.field input, \.field textarea, \.field select\s*\{[^}]*min-height:\s*48px/s);
  assert.match(css, /\.text-link\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.owner-wordmark, \.owner-topbar \.owner-public-link, \.owner-footer a\s*\{[^}]*min-height:\s*var\(--control-min-height\)/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.identity-readiness[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.owner-content\s*\{[^}]*width:\s*calc\(100% - 28px\)/);
  assert.match(css, /\.owner-nav\s*\{[^}]*overflow-x:\s*auto[^}]*white-space:\s*nowrap/s);
  assert.doesNotMatch(css, /\.owner-nav[^}]*flex-wrap:\s*wrap|grid-template-columns:\s*220px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:/s);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});
