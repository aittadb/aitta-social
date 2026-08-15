import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

import { escapeRegExp } from "./helpers/regular-expression-literal.mjs";
import { deletionAcknowledgement } from "./helpers/deletion-acknowledgement-contract.mjs";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  profileRow,
  responseJson,
  validEntryInput,
  validProfileInput,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("one authorized browser journey customizes D1, reviews a draft, publishes, previews signed out, and rolls back", async () => {
  const draftCanary = "ASSISTED_PRIVATE_DRAFT_CANARY";
  const ownerIdentityCanary = "ASSISTED_CHATGPT_IDENTITY_CANARY";
  const publicBody = "A reviewed update made public only after owner confirmation.";
  const db = new FakeD1({ profile: null, entries: [] });
  const env = makeEnv({
    db,
    ownerEmail,
    canonicalUrl: " https://RUNTIME.example/presence/// ",
  });

  const identity = validProfileInput({
    displayName: "Assisted Field Notes",
    shortDescription: "A focused presence shaped through its owner controls.",
    introduction: "Identity, links, presentation, and updates remain in this deployment.",
    location: "Helsinki",
    website: "https://field-notes.example/about",
    externalLinks: [{ label: "Reference", url: "https://field-notes.example/reference" }],
    canonicalUrl: "https://stored.example/fallback///",
    accentColor: "#6a4b35",
    density: "compact",
    hidePoweredBy: true,
  });
  const identitySave = await fetchApp("/api/private/profile", {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(identity),
  });
  assert.equal(identitySave.status, 200);
  assert.equal(db.profile.display_name, identity.displayName);
  assert.equal(db.profile.short_description, identity.shortDescription);
  assert.equal(db.profile.introduction, identity.introduction);
  assert.equal(db.profile.location, identity.location);
  assert.equal(db.profile.website, identity.website);
  assert.deepEqual(JSON.parse(db.profile.external_links_json), identity.externalLinks);
  assert.equal(db.profile.canonical_url, "https://stored.example/fallback");
  assert.equal(db.profile.accent_color, identity.accentColor);
  assert.equal(db.profile.density, "compact");
  assert.equal(db.profile.hide_powered_by, 1);
  assert.equal(db.profile.account_type, "other");

  const reloadedIdentity = await ownerHtml("/owner/profile", env, {
    "oai-authenticated-user-full-name": encodeURIComponent(ownerIdentityCanary),
  });
  assert.match(reloadedIdentity, /Identity is ready/i);
  assert.match(reloadedIdentity, /Effective public URL · (?:<!-- -->)?protected runtime URL/i);
  assert.match(reloadedIdentity, /https:\/\/runtime\.example\/presence/i);
  assert.match(reloadedIdentity, /Canonical URL fallback/i);
  assert.match(reloadedIdentity, /value="https:\/\/stored\.example\/fallback"/i);
  assert.doesNotMatch(reloadedIdentity, new RegExp(ownerIdentityCanary, "i"));
  assert.match(reloadedIdentity, /<a[^>]+href="\/owner"[^>]+aria-label="Manage this Aitta’s local sole-owner administration"[^>]*>Manage<\/a>/i);

  const create = await fetchApp("/api/private/entries", {
    env,
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({ title: "Private working title", body: draftCanary })),
  });
  assert.equal(create.status, 201);
  const created = (await responseJson(create)).data;
  assert.equal(created.attributes.state, "draft");

  const edit = await fetchApp(`/api/private/entries/${created.id}`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({
      kind: "announcement",
      title: "First assisted update",
      body: publicBody,
    })),
  });
  assert.equal(edit.status, 200);
  assert.equal((await responseJson(edit)).data.attributes.state, "draft");

  const reloadedDraft = await ownerHtml(`/owner/entries/${created.id}`, env);
  assert.match(reloadedDraft, /First assisted update/i);
  assert.match(reloadedDraft, new RegExp(escapeRegExp(publicBody), "i"));
  assert.match(reloadedDraft, /Save private draft/i);
  await assertPubliclyUnknown(env, created.id, [draftCanary, publicBody]);

  const publish = await fetchApp(`/api/private/entries/${created.id}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "published" }),
  });
  assert.equal(publish.status, 200);
  assert.equal((await responseJson(publish)).data.attributes.state, "published");

  const [signedOutHome, signedOutPermalink, siteApi, entryApi] = await Promise.all([
    fetchApp("/", { env, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${created.id}`, { env, headers: { accept: "text/html" } }),
    fetchApp("/api/v1/site", { env }),
    fetchApp(`/api/v1/entries/${created.id}`, { env }),
  ]);
  assert.equal(signedOutHome.status, 200);
  assert.equal(signedOutPermalink.status, 200);
  const publicHtml = `${await signedOutHome.text()}\n${await signedOutPermalink.text()}`;
  assert.match(publicHtml, /Assisted Field Notes/i);
  assert.match(publicHtml, /First assisted update/i);
  assert.match(publicHtml, new RegExp(escapeRegExp(publicBody), "i"));
  assert.match(publicHtml, /density-compact/i);
  assert.match(publicHtml, /--accent:#6a4b35/i);
  assert.doesNotMatch(publicHtml, /Powered by AittaSocial/i);
  assert.doesNotMatch(publicHtml, new RegExp(`${draftCanary}|${ownerIdentityCanary}|owner@example\\.com`, "i"));

  const publicSite = (await responseJson(siteApi)).data.attributes;
  assert.equal(publicSite.canonicalUrl, "https://runtime.example/presence");
  assert.deepEqual(publicSite.presentation, {
    accentColor: "#6a4b35",
    density: "compact",
    showPoweredBy: false,
  });
  assert.deepEqual(publicSite.externalLinks, identity.externalLinks);
  assert.equal((await responseJson(entryApi)).data.attributes.body, publicBody);

  const unpublish = await fetchApp(`/api/private/entries/${created.id}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "draft" }),
  });
  assert.equal(unpublish.status, 200);
  assert.equal((await responseJson(unpublish)).data.attributes.state, "draft");
  const resumed = await ownerHtml("/owner", env);
  assert.match(resumed, new RegExp(`href="/owner/entries/${created.id}"[^>]*>Resume first draft`, "i"));
  await assertPubliclyUnknown(env, created.id, [draftCanary, publicBody]);

  const deletion = await fetchApp(`/api/private/entries/${created.id}`, {
    env,
    method: "DELETE",
    headers: mutationHeaders(ownerEmail),
  });
  assert.equal(deletion.status, 200);
  assert.deepEqual(await responseJson(deletion), deletionAcknowledgement(created.id));
  assert.equal(db.entries.some((entry) => entry.id === created.id), false);
  await assertPubliclyUnknown(env, created.id, [draftCanary, publicBody]);
});

test("assisted write fixtures fail closed for non-owner, missing owner, CSRF, and invalid input", async (t) => {
  await t.test("a different signed-in user cannot save Identity", async () => {
    const db = new FakeD1();
    const response = await fetchApp("/api/private/profile", {
      env: makeEnv({ db, ownerEmail }),
      method: "PUT",
      headers: mutationHeaders("other@example.com"),
      body: JSON.stringify(validProfileInput()),
    });
    assert.equal(response.status, 403);
    assert.equal(db.mutations.length, 0);
  });

  await t.test("a missing owner setting disables draft creation", async () => {
    const db = new FakeD1();
    const response = await fetchApp("/api/private/entries", {
      env: makeEnv({ db }),
      method: "POST",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validEntryInput()),
    });
    assert.equal(response.status, 503);
    assert.equal(db.mutations.length, 0);
  });

  await t.test("the same-origin gate rejects the owner before draft mutation", async () => {
    const db = new FakeD1();
    const response = await fetchApp("/api/private/entries", {
      env: makeEnv({ db, ownerEmail }),
      method: "POST",
      headers: {
        ...ownerHeaders(ownerEmail),
        origin: "https://attacker.example",
        "content-type": "application/json",
      },
      body: JSON.stringify(validEntryInput()),
    });
    assert.equal(response.status, 403);
    assert.equal(db.mutations.length, 0);
  });

  await t.test("strict validation rejects a malformed presentation and update", async () => {
    const db = new FakeD1();
    const env = makeEnv({ db, ownerEmail });
    const invalidIdentity = await fetchApp("/api/private/profile", {
      env,
      method: "PUT",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validProfileInput({ accentColor: "url(secret)", canonicalUrl: "http://unsafe.example" })),
    });
    const invalidUpdate = await fetchApp("/api/private/entries", {
      env,
      method: "POST",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validEntryInput({ kind: "link", destinationUrl: null })),
    });
    assert.equal(invalidIdentity.status, 422);
    assert.equal(invalidUpdate.status, 422);
    assert.equal(db.mutations.length, 0);
  });
});

test("effective canonical defaults never serialize an invalid stored fallback", async () => {
  const storedCanary = "INVALID_STORED_CANONICAL_CANARY";
  const response = await fetchApp("/owner/profile", {
    env: makeEnv({
      db: new FakeD1({ profile: profileRow({ canonical_url: `not-a-url-${storedCanary}` }) }),
      ownerEmail,
      canonicalUrl: " https://RUNTIME.example/normalized/// ",
    }),
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Effective public URL · (?:<!-- -->)?protected runtime URL/i);
  assert.match(html, /Canonical URL fallback/i);
  assert.match(html, /Saved profile loaded with a safe URL substitution/i);
  assert.match(html, /class="identity-save-state identity-save-state-loaded"/i);
  assert.match(html, /saved canonical fallback is invalid/i);
  assert.match(html, /effective protected runtime URL is prefilled below/i);
  assert.match(html, /Saving will replace the invalid D1 fallback/i);
  assert.match(html, /Prefilled from the effective protected runtime URL because no valid saved fallback is available/i);
  assert.match(html, /name="canonicalUrl"[^>]+value="https:\/\/runtime\.example\/normalized"/i);
  assert.doesNotMatch(html, new RegExp(storedCanary, "i"));
  assert.doesNotMatch(html, /not-a-url/i);
});

test("an invalid stored fallback without a valid runtime URL is explicitly omitted", async () => {
  const storedCanary = "INVALID_STORED_OMITTED_PRIVATE_CANARY";
  const runtimeCanary = "INVALID_RUNTIME_OMITTED_PRIVATE_CANARY";
  const response = await fetchApp("/owner/profile", {
    env: makeEnv({
      db: new FakeD1({ profile: profileRow({ canonical_url: `not-a-url-${storedCanary}` }) }),
      ownerEmail,
      canonicalUrl: `not-a-url-${runtimeCanary}`,
    }),
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Identity needs a valid public URL/i);
  assert.match(html, /Saved profile loaded without its invalid URL/i);
  assert.match(html, /class="identity-save-state identity-save-state-loaded"/i);
  assert.match(html, /saved canonical fallback is invalid and was omitted from this form/i);
  assert.match(html, /Other profile values were loaded from this Aitta/i);
  assert.match(html, /No URL is prefilled because the saved fallback is invalid/i);
  assert.match(html, /name="canonicalUrl"[^>]+value=""/i);
  assert.doesNotMatch(html, /identity-save-state-saved|Saved values loaded|form matches the profile values loaded/i);
  assert.doesNotMatch(html, new RegExp(`${storedCanary}|${runtimeCanary}|not-a-url`, "i"));
});

test("an empty stored fallback remains an exact empty saved baseline", async () => {
  const response = await fetchApp("/owner/profile", {
    env: makeEnv({
      db: new FakeD1({ profile: profileRow({ canonical_url: "" }) }),
      ownerEmail,
      canonicalUrl: "also-not-valid",
    }),
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Identity needs a valid public URL/i);
  assert.match(html, /class="identity-save-state identity-save-state-saved"/i);
  assert.match(html, /Saved values loaded/i);
  assert.match(html, /form matches the profile values loaded from this Aitta/i);
  assert.match(html, /name="canonicalUrl"[^>]+value=""/i);
  assert.doesNotMatch(html, /invalid URL|invalid saved fallback was omitted|invalid-stored-omitted/i);
});

test("a whitespace-only stored fallback is omitted rather than called an exact saved baseline", async () => {
  const privateCanary = "WHITESPACE_STORED_PRIVATE_CANARY";
  const response = await fetchApp("/owner/profile", {
    env: makeEnv({
      db: new FakeD1({
        profile: profileRow({ canonical_url: " \t\n ", private_canary: privateCanary }),
      }),
      ownerEmail,
      canonicalUrl: "also-not-valid",
    }),
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Identity needs a valid public URL/i);
  assert.match(html, /class="identity-save-state identity-save-state-loaded"/i);
  assert.match(html, /Saved profile loaded without its invalid URL/i);
  assert.match(html, /saved canonical fallback is invalid and was omitted from this form/i);
  assert.match(html, /name="canonicalUrl"[^>]+value=""/i);
  assert.doesNotMatch(html, /identity-save-state-saved|Saved values loaded|form matches the profile values loaded/i);
  assert.doesNotMatch(html, new RegExp(privateCanary, "i"));
});

test("owner mutation response policy treats 4xx as definitive and 5xx as unconfirmed", async () => {
  const moduleSource = await source("app/owner/_components/owner-mutation-outcome.ts");
  const compiled = ts.transpileModule(moduleSource, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const { classifyOwnerMutationResponse } = await import(
    `data:text/javascript,${encodeURIComponent(compiled)}`
  );

  for (const status of [200, 201, 204]) {
    assert.equal(classifyOwnerMutationResponse({ ok: true, status }), "success");
  }
  for (const status of [400, 401, 403, 404, 422, 499]) {
    assert.equal(classifyOwnerMutationResponse({ ok: false, status }), "definitive-error");
  }
  for (const status of [500, 502, 503, 599]) {
    assert.equal(classifyOwnerMutationResponse({ ok: false, status }), "unconfirmed");
  }
});

test("owner controls expose semantic, per-update actions, explicit publication confirmation, and honest recovery", async () => {
  const [
    actions,
    entryForm,
    profileForm,
    profilePage,
    dashboard,
    editPage,
    css,
    deploymentDoc,
    securityDoc,
    privacyDoc,
    presentationDoc,
    outcomePolicy,
  ] = await Promise.all([
    source("app/owner/_components/EntryActions.tsx"),
    source("app/owner/entries/EntryForm.tsx"),
    source("app/owner/profile/ProfileForm.tsx"),
    source("app/owner/profile/page.tsx"),
    source("app/owner/page.tsx"),
    source("app/owner/entries/[id]/page.tsx"),
    source("app/globals.css"),
    source("docs/deployment.md"),
    source("docs/security.md"),
    source("docs/privacy.md"),
    source("docs/presentation.md"),
    source("app/owner/_components/owner-mutation-outcome.ts"),
  ]);

  assert.match(actions, /function requestPublish\(\)[\s\S]*window\.confirm\([\s\S]*publicly readable on this Aitta at its permalink[\s\S]*if \(!confirmed\)[\s\S]*return;[\s\S]*void changeState\("published"\)/);
  assert.match(actions, /role="group"[^>]+aria-label=\{`Actions for \$\{updateLabel\}, update \$\{actionReference\}`\}/);
  for (const action of ["Edit", "Publish", "Open public permalink for", "Unpublish", "Delete"]) {
    assert.match(actions, new RegExp(`aria-label=\\{\\\`${escapeRegExp(action)}[^\\\`]+update \\$\\{actionReference\\}`));
  }
  assert.match(actions, /The publication result could not be confirmed\. Check this Aitta’s saved state before changing this update’s publication state again\./);
  assert.match(actions, /The unpublish result could not be confirmed\. Check this Aitta’s saved state before changing this update’s publication state again\./);
  assert.match(actions, /The deletion result could not be confirmed\. Check this Aitta’s saved state before deleting this update again\./);
  assert.match(actions, /href="\/owner"[^>]+aria-label=\{`Check current state/);
  assert.match(actions, /href="\/owner"[^>]+aria-label=\{`Check saved state/);
  assert.match(actions, /const actionReference = id;/);
  assert.doesNotMatch(actions, /boundedActionReference|slice\(-8\)/);
  assert.equal(countMatches(actions, /const outcome = classifyOwnerMutationResponse\(response\);/g), 0);
  assert.equal(countMatches(actions, /setMessage\(await safeError\(response\)\);\s*setBusy\(false\);/g), 0);
  assert.match(actions, /readPublicationStateResponse\(response, \{ id, state: nextState \}\)[\s\S]*if \(result\.outcome === "unconfirmed"\) \{\s*showUnconfirmedLifecycleResult\(nextState\);\s*return;\s*\}\s*setMessage\(lifecycleFailureMessage\(nextState, result\.message\)\);\s*setBusy\(false\);/);
  assert.match(actions, /const outcome = await readDeletionResponse\(response, id\);[\s\S]*if \(outcome\.outcome === "unconfirmed"\) \{\s*showUnconfirmedResult\("The deletion result could not be confirmed\.[^\n]+\);\s*return;\s*\}\s*setMessage\(`The server rejected this deletion request\. \$\{outcome\.message\}`\);\s*setBusy\(false\);/);
  assert.match(actions, /catch \{\s*showUnconfirmedLifecycleResult\(nextState\);\s*\}/);
  assert.match(actions, /catch \{\s*showUnconfirmedResult\("The deletion result could not be confirmed\.[^\n]+\);\s*\}/);
  assert.match(actions, /function showUnconfirmedResult\(message: string\) \{\s*setMessage\(message\);\s*setDeletionRecoveryRequired\(true\);\s*setBusy\(false\);\s*\}/);
  assert.match(actions, /setBusy\(true\);\s*setMessage\(nextState === "published" \? "Publishing this update…"/);
  assert.match(actions, /if \(lifecycleRecoveryRequired\) return;/);
  assert.equal(countMatches(actions, /disabled=\{busy \|\| lifecycleRecoveryRequired\}/g), 2);
  assert.match(dashboard, /<EntryActions id=\{entry\.id\} state=\{entry\.state\} label=\{entry\.title \?\? entry\.body\.slice\(0, 90\)\}/);
  assert.match(editPage, /<EntryActions id=\{entry\.id\} state=\{entry\.state\} label=\{entry\.title \?\? entry\.body\.slice\(0, 90\)\}/);

  assert.match(entryForm, /<form[^>]+aria-label=\{entry \? "Edit update" : "Create private draft"\}[^>]+aria-busy=\{busy\}/);
  assert.match(entryForm, /Save update[\s\S]*Save private draft/);
  assert.match(entryForm, /The save result is unknown\. Do not submit again from this page; the first request may have succeeded/);
  assert.match(entryForm, /href=\{entry \? `\/owner\/entries\/\$\{encodeURIComponent\(entry\.id\)\}` : "\/owner"\}/);
  assert.match(entryForm, /const result = await readEntryEditResponse\(response,[\s\S]*if \(result\.outcome === "unconfirmed"\) \{\s*showUnconfirmedSave\(\);\s*return;\s*\}[\s\S]*setFieldErrors\(result\.fieldErrors\);[\s\S]*focusFirstInvalidField\(formElement, result\.fieldErrors\);[\s\S]*\} catch \{\s*showUnconfirmedSave\(\);\s*return;\s*\}\s*setBusy\(false\);/);
  assert.match(entryForm, /function showUnconfirmedSave\(\) \{\s*setStatus\("The save result is unknown\.[^\n]+\);\s*setRecoveryRequired\(true\);\s*setBusy\(false\);\s*\}/);
  assert.match(entryForm, /if \(recoveryRequired\) return;/);
  assert.match(entryForm, /disabled=\{busy \|\| recoveryRequired\}/);
  assert.match(entryForm, /if \(!formElement\.checkValidity\(\)\)[\s\S]*formElement\.reportValidity\(\)/);
  assert.match(entryForm, /readEntryEditResponse\(response/);
  assert.match(profileForm, /<form[^>]+aria-label="Identity and profile settings"[^>]+aria-busy=\{busy\}/);
  assert.match(profileForm, /Canonical URL fallback/);
  assert.match(profileForm, /protected runtime URL remains effective and cannot be changed here/);
  assert.match(profileForm, /The Identity save result could not be confirmed\. Reload the saved Identity before retrying\./);
  assert.match(profileForm, /href="\/owner\/profile">Reload saved Identity before retrying/);
  assert.match(profileForm, /const result = await readProfileSaveResponse\(response\);[\s\S]*if \(result\.outcome === "unconfirmed"\) \{\s*showUnconfirmedSave\(\);\s*return;\s*\}[\s\S]*setFieldErrors\(result\.fieldErrors\);[\s\S]*setStatus\(result\.message\);[\s\S]*focusFirstInvalidField\(formElement, result\.fieldErrors\);[\s\S]*\} catch \{\s*showUnconfirmedSave\(\);\s*return;\s*\}\s*setBusy\(false\);/);
  assert.match(profileForm, /function showUnconfirmedSave\(\) \{\s*setStatus\("The Identity save result could not be confirmed\.[^\n]+\);\s*setRecoveryRequired\(true\);\s*setBusy\(false\);\s*\}/);
  assert.match(profileForm, /if \(recoveryRequired\) return;/);
  assert.match(profileForm, /disabled=\{busy \|\| recoveryRequired\}/);
  assert.match(profileForm, /readProfileSaveResponse\(response\)/);
  assert.match(profilePage, /storedCanonicalValue = profile\?\.canonicalUrl \?\? ""/);
  assert.match(profilePage, /normalizedCanonicalOrNull\(storedCanonicalValue\)/);
  assert.match(profilePage, /storedCanonical \?\? readiness\.canonicalUrl \?\? ""/);
  assert.match(profilePage, /storedCanonical[\s\S]*\? "stored"[\s\S]*readiness\.canonicalSource === "runtime"[\s\S]*\? "runtime-substitution"[\s\S]*storedCanonicalValue\.length > 0[\s\S]*\? "invalid-stored-omitted"[\s\S]*: "empty"/);
  assert.match(profileForm, /canonicalUrl: canonicalDefault/);
  assert.match(outcomePolicy, /if \(response\.ok\) return "success";/);
  assert.match(outcomePolicy, /response\.status >= 500 \? "unconfirmed" : "definitive-error"/);

  for (const clientSource of [actions, entryForm, profileForm]) {
    assert.doesNotMatch(clientSource, /Authorization|Bearer|AITTA_SOCIAL_OWNER_EMAIL|github\.com|localStorage|sessionStorage|\/api\/private\/(?:agent|source|deploy)/i);
  }
  assert.match(css, /\.button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.field input, \.field textarea, \.field select\s*\{[^}]*min-height:\s*48px/s);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px/s);
  const ownerShellCss = await readFile(new URL("../app/owner/_components/OwnerShell.module.css", import.meta.url), "utf8");
  assert.match(ownerShellCss, /@media\s*\(max-width:\s*640px\)[\s\S]*\.content\s*\{\s*width:\s*calc\(100% - 28px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.form-footer\s*\{[^}]*flex-direction:\s*column/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);

  assert.match(deploymentDoc, /browser-controlling ChatGPT must stop there[\s\S]*owner explicitly approves/i);
  assert.match(deploymentDoc, /For a publish or unpublish request, it locks another\s+publication-state change[\s\S]*Check this Aitta’s current saved state/i);
  assert.match(deploymentDoc, /server returns a 5xx response[\s\S]*A 4xx validation or\s+authorization response/i);
  assert.match(deploymentDoc, /do not fork or[\s\S]*edit GitHub source, redeploy the Site, change protected settings, change access,[\s\S]*or connect a domain/i);
  assert.match(securityDoc, /there is no agent[\s\S]*credential, agent route, prompt-derived permission/i);
  assert.match(securityDoc, /rejected fetch or 5xx response is ambiguous[\s\S]*reloads[\s\S]*before any retry[\s\S]*A 4xx validation or[\s\S]*authorization response/i);
  assert.match(privacyDoc, /application adds no agent identity, agent token, browser-storage record,[\s\S]*database field, log field, or outbound content request/i);
  assert.match(presentationDoc, /native,\s+update-specific confirmation[\s\S]*human owner's explicit approval/i);
  assert.match(presentationDoc, /complete collision-free stable entry identifier[\s\S]*exact bounded\s+JSON owner-entry document confirms the stable identifier and requested state[\s\S]*A 4xx\s+response gives a definitive rejected-request\s+outcome without claiming the update's current state[\s\S]*rejected fetch or 5xx response is\s+unknown/i);
});

test("repeated dashboard controls have distinct accessible names without leaking private configuration", async () => {
  const privateCanary = "REPEATED_ACTION_PRIVATE_CANARY";
  const firstId = "00000000-0000-4000-8000-0000deadbeef";
  const secondId = "11111111-1111-4111-8111-1111deadbeef";
  const db = new FakeD1({
    entries: [
      entryRow({ id: firstId, title: "Shared working title", body: privateCanary, state: "draft", published_at: null }),
      entryRow({ id: secondId, title: "Shared working title", body: privateCanary, state: "draft", published_at: null }),
    ],
  });
  const html = await ownerHtml("/owner", makeEnv({ db, ownerEmail }));
  assert.match(html, new RegExp(`aria-label="Actions for Shared working title, update ${firstId}"`, "i"));
  assert.match(html, new RegExp(`aria-label="Actions for Shared working title, update ${secondId}"`, "i"));
  assert.match(html, new RegExp(`aria-label="Publish Shared working title, update ${firstId}"`, "i"));
  assert.match(html, new RegExp(`aria-label="Publish Shared working title, update ${secondId}"`, "i"));
  assert.notEqual(firstId, secondId);
  assert.equal(firstId.slice(-8), secondId.slice(-8));
  assert.doesNotMatch(html, /owner@example\.com/i);
});

test("a maximum-length unbroken owner title and the full action set retain shrink and wrap source contracts", async () => {
  const entryId = "22222222-2222-4222-8222-222222222222";
  const unbrokenTitle = `${"OwnerUpdateTitle".repeat(12)}LongTest`;
  assert.equal(unbrokenTitle.length, 200);
  assert.equal(/\s/.test(unbrokenTitle), false);

  const [html, css] = await Promise.all([
    ownerHtml("/owner", makeEnv({
      db: new FakeD1({
        entries: [entryRow({ id: entryId, title: unbrokenTitle, state: "published" })],
      }),
      ownerEmail,
    })),
    source("app/globals.css"),
  ]);
  const row = html.match(/<article class="owner-entry-row"[\s\S]*?<\/article>/)?.[0];
  assert.ok(row, "the populated owner route must render its update row");
  assert.match(row, new RegExp(`<h3><a href="/owner/entries/${entryId}">${unbrokenTitle}</a></h3>`));
  assert.match(row, /<div class="entry-actions" role="group"/);
  for (const label of ["Edit", "Permalink", "Unpublish", "Delete"]) {
    assert.match(row, new RegExp(`>${label}</(?:a|button)>`));
  }
  assert.equal(countMatches(row, /class="button button-small/g), 4);

  assert.match(css, /\.owner-entry-copy\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.owner-entry-copy h3 a\s*\{[^}]*min-height:\s*var\(--control-min-height\)[^}]*display:\s*inline-flex[^}]*align-items:\s*center[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /\.entry-actions\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.public-nav-actions, \.button-row, \.entry-actions, \.form-footer\s*\{[^}]*flex-wrap:\s*wrap/s);
});

test("the complete native checkbox label retains its owner touch-target source contract", async () => {
  const [html, css] = await Promise.all([
    ownerHtml("/owner/profile", makeEnv({ db: new FakeD1(), ownerEmail })),
    source("app/globals.css"),
  ]);
  assert.match(
    html,
    /<label class="check-field">\s*<input(?=[^>]*name="hidePoweredBy")(?=[^>]*type="checkbox")[^>]*>\s*<span>Hide the restrained “Powered by AittaSocial” attribution<\/span>\s*<\/label>/is,
  );

  const labelRule = css.match(/\.check-field\s*\{([^}]*)\}/s);
  assert.ok(labelRule, "the enclosing checkbox label needs a shared source rule");
  assert.match(labelRule[1], /min-height:\s*var\(--control-min-height\)/);
  assert.match(labelRule[1], /display:\s*flex/);
  assert.match(labelRule[1], /align-items:\s*flex-start/);

  const nativeCheckboxRule = css.match(/\.check-field input\s*\{([^}]*)\}/s);
  assert.ok(nativeCheckboxRule, "the native checkbox needs its existing sizing rule");
  assert.doesNotMatch(nativeCheckboxRule[1], /\b(?:appearance|forced-color-adjust)\s*:/i);
});

async function ownerHtml(path, env, extraHeaders = {}) {
  const response = await fetchApp(path, {
    env,
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail), ...extraHeaders },
  });
  assert.equal(response.status, 200);
  return response.text();
}

async function assertPubliclyUnknown(env, id, canaries) {
  const [home, permalink, detail, collection] = await Promise.all([
    fetchApp("/", { env, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${id}`, { env, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${id}`, { env }),
    fetchApp("/api/v1/entries", { env }),
  ]);
  assert.equal(permalink.status, 404);
  assert.equal(detail.status, 404);
  const publicSource = `${await home.text()}\n${await permalink.text()}\n${JSON.stringify(await responseJson(detail))}\n${JSON.stringify(await responseJson(collection))}`;
  for (const canary of canaries) assert.doesNotMatch(publicSource, new RegExp(escapeRegExp(canary), "i"));
}

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}


function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}
