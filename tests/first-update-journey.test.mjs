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
  validEntryInput,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("complete Identity leads from a new draft through public preview and back to the same private draft", async () => {
  const privateCanary = "FIRST_UPDATE_PRIVATE_CANARY";
  const db = new FakeD1({ entries: [] });
  const env = makeEnv({
    db,
    ownerEmail,
  });

  const emptyDashboard = await ownerPage(env);
  assert.match(emptyDashboard, /Create your first update/i);
  assert.match(emptyDashboard, /href="\/owner\/entries\/new"[^>]*>Create first draft/i);
  assert.equal(countMatches(ownerPageHeader(emptyDashboard), /<a class="button"/gi), 1);
  assert.equal(countMatches(emptyDashboard, />Create first draft<\/a>/gi), 1);
  assert.equal(countMatches(emptyDashboard, /<a class="button"/gi), 1);
  assert.doesNotMatch(emptyDashboard, />Create update<\/a>|>Create the first draft<\/a>/i);
  const emptyPanel = nextStepPanel(emptyDashboard);
  assert.equal(countMatches(emptyPanel, /<a /gi), 0);
  assert.doesNotMatch(emptyPanel, /owner\/entries\/new|Create first draft|class="button"/i);
  assert.equal(db.mutations.length, 0);

  const createdResponse = await fetchApp("/api/private/entries", {
    env,
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({
      title: "A private first draft",
      body: privateCanary,
    })),
  });
  assert.equal(createdResponse.status, 201);
  const created = (await responseJson(createdResponse)).data;
  assert.equal(created.state, "draft");

  const leaveDashboard = await fetchApp("/owner/profile", {
    env,
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(leaveDashboard.status, 200);

  const resumedDashboard = await ownerPage(env);
  assert.match(resumedDashboard, /Continue your first draft/i);
  assert.match(resumedDashboard, /stored in this Aitta and remains private until you publish it/i);
  assert.match(resumedDashboard, /remains private until you publish it/i);
  assert.match(
    resumedDashboard,
    new RegExp(`href="/owner/entries/${created.id}"[^>]*>Resume first draft`, "i"),
  );
  assert.equal(countMatches(ownerPageHeader(resumedDashboard), /<a class="button"/gi), 1);
  assert.equal(countMatches(resumedDashboard, />Resume first draft<\/a>/gi), 1);
  assert.equal(countMatches(nextStepPanel(resumedDashboard), /<a /gi), 0);

  await assertDraftIsPubliclyUnknown(env, created.id, privateCanary);

  const publishedResponse = await fetchApp(`/api/private/entries/${created.id}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "published" }),
  });
  assert.equal(publishedResponse.status, 200);
  assert.equal((await responseJson(publishedResponse)).data.state, "published");

  const publishedDashboard = await ownerPage(env);
  assert.match(publishedDashboard, /Your first update is public/i);
  assert.match(publishedDashboard, /href="\/"[^>]*>Preview public Aitta/i);
  assert.equal(countMatches(ownerPageHeader(publishedDashboard), /<a class="button"/gi), 1);
  assert.equal(countMatches(publishedDashboard, />Preview public Aitta<\/a>/gi), 1);
  const publishedPanel = nextStepPanel(publishedDashboard);
  assert.equal(countMatches(publishedPanel, /<a /gi), 0);
  assert.doesNotMatch(publishedPanel, /class="button"/i);
  assert.match(publishedDashboard, />Edit<|>Unpublish</i);

  const [publicHome, publicPermalink, publicApi] = await Promise.all([
    fetchApp("/", { env, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${created.id}`, { env, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${created.id}`, { env }),
  ]);
  assert.equal(publicHome.status, 200);
  assert.match(await publicHome.text(), new RegExp(privateCanary));
  assert.equal(publicPermalink.status, 200);
  assert.match(await publicPermalink.text(), new RegExp(privateCanary));
  assert.equal(publicApi.status, 200);
  assert.equal((await responseJson(publicApi)).data.id, created.id);

  const unpublishedResponse = await fetchApp(`/api/private/entries/${created.id}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "draft" }),
  });
  assert.equal(unpublishedResponse.status, 200);
  assert.equal((await responseJson(unpublishedResponse)).data.state, "draft");

  const resumedAfterUnpublish = await ownerPage(env);
  assert.match(resumedAfterUnpublish, /Continue your first draft/i);
  assert.match(
    resumedAfterUnpublish,
    new RegExp(`href="/owner/entries/${created.id}"[^>]*>Resume first draft`, "i"),
  );
  assert.equal(countMatches(ownerPageHeader(resumedAfterUnpublish), /<a class="button"/gi), 1);
  assert.equal(countMatches(nextStepPanel(resumedAfterUnpublish), /<a /gi), 0);
  await assertDraftIsPubliclyUnknown(env, created.id, privateCanary);
});

test("Identity remains the primary journey until its server-derived requirements are complete", async () => {
  const draftCanary = "INCOMPLETE_IDENTITY_DRAFT_CANARY";
  const db = new FakeD1({
    profile: profileRow({ canonical_url: "invalid-canonical" }),
    entries: [entryRow({ state: "draft", title: draftCanary, published_at: null })],
  });
  const env = makeEnv({ db, ownerEmail, canonicalUrl: "still-invalid" });
  const html = await ownerPage(env);

  assert.match(html, /Finish your identity/i);
  assert.match(html, /Add a canonical URL/i);
  assert.match(html, /href="\/owner\/profile"[^>]*>Finish identity/i);
  assert.equal(countMatches(ownerPageHeader(html), /<a class="button"/gi), 1);
  assert.doesNotMatch(html, /Resume your saved draft|Create a private first draft/i);
  assert.equal(countMatches(nextStepPanel(html), /<a /gi), 0);
  assert.equal(db.queries.filter(isBoundedFirstStateQuery).length, 0);
  assert.equal(db.mutations.length, 0);
});

test("first-update resume and permalink selection stay stable across edits and creation-time ties", async () => {
  const draftDb = new FakeD1({
    entries: [
      entryRow({
        id: "draft-later",
        state: "draft",
        published_at: null,
        created_at: "2026-02-01T00:00:00.000Z",
        updated_at: "2030-01-01T00:00:00.000Z",
      }),
      entryRow({
        id: "draft-b",
        state: "draft",
        published_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      }),
      entryRow({
        id: "draft-a",
        state: "draft",
        published_at: null,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }),
    ],
  });
  const draftHtml = await ownerPage(makeEnv({ db: draftDb, ownerEmail }));
  assert.match(draftHtml, /href="\/owner\/entries\/draft-a"[^>]*>Resume first draft/i);
  assert.doesNotMatch(draftHtml, /href="\/owner\/entries\/draft-(?:b|later)"[^>]*>Resume first draft/i);

  const publishedDb = new FakeD1({
    entries: [
      entryRow({
        id: "published-b",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2030-01-01T00:00:00.000Z",
      }),
      entryRow({
        id: "published-a",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      }),
      entryRow({
        id: "private-earlier",
        state: "draft",
        published_at: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2031-01-01T00:00:00.000Z",
      }),
    ],
  });
  const publishedHtml = await ownerPage(makeEnv({ db: publishedDb, ownerEmail }));
  assert.match(publishedHtml, /Your first update is public/i);
  assert.equal(publishedDb.queries.filter(isBoundedFirstStateQuery).length, 2);
});

test("bounded state queries keep the journey truthful beyond the 200-row management list", async (t) => {
  const newerDrafts = Array.from({ length: 201 }, (_, index) => entryRow({
    id: `newer-draft-${String(index).padStart(3, "0")}`,
    state: "draft",
    title: `Newer draft ${index}`,
    published_at: null,
    created_at: `2026-02-${String((index % 27) + 1).padStart(2, "0")}T00:00:00.000Z`,
    updated_at: `2030-02-${String((index % 27) + 1).padStart(2, "0")}T00:00:00.000Z`,
  }));

  await t.test("an earliest draft excluded from the capped list remains the resume target", async () => {
    const db = new FakeD1({
      entries: [
        ...newerDrafts,
        entryRow({
          id: "beyond-cap-first-draft",
          state: "draft",
          title: "Beyond-cap first draft",
          published_at: null,
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-01-01T00:00:00.000Z",
        }),
      ],
    });
    const html = await ownerPage(makeEnv({ db, ownerEmail }));
    assert.match(html, /href="\/owner\/entries\/beyond-cap-first-draft"[^>]*>Resume first draft/i);
    assert.doesNotMatch(html, /Beyond-cap first draft/i);
    assert.equal(db.queries.filter(isBoundedFirstStateQuery).length, 2);
  });

  await t.test("an older published entry excluded from the capped list still completes the journey", async () => {
    const db = new FakeD1({
      entries: [
        ...newerDrafts,
        entryRow({
          id: "beyond-cap-published",
          title: "Beyond-cap published update",
          created_at: "2025-01-01T00:00:00.000Z",
          updated_at: "2025-01-01T00:00:00.000Z",
          published_at: "2025-01-02T00:00:00.000Z",
        }),
      ],
    });
    const html = await ownerPage(makeEnv({ db, ownerEmail }));
    assert.match(html, /Your first update is public/i);
    assert.doesNotMatch(html, /Beyond-cap published update/i);
    assert.equal(db.queries.filter(isBoundedFirstStateQuery).length, 2);
  });
});

test("only the configured owner sees the D1-backed first-update journey and page reads never mutate", async (t) => {
  const privateCanary = "OWNER_ONLY_FIRST_UPDATE_CANARY";

  await t.test("configured owner can resume without Hub", async () => {
    const db = new FakeD1({
      entries: [entryRow({ state: "draft", title: privateCanary, published_at: null })],
    });
    const html = await ownerPage(makeEnv({ db, ownerEmail }));
    assert.match(html, /Continue your first draft/i);
    assert.match(html, new RegExp(privateCanary));
    assert.equal(db.mutations.length, 0);
  });

  await t.test("a different signed-in user receives no owner content", async () => {
    const db = new FakeD1({
      entries: [entryRow({ state: "draft", title: privateCanary, published_at: null })],
    });
    const response = await fetchApp("/owner", {
      env: makeEnv({ db, ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders("other@example.com") },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /not yours to administer/i);
    assert.doesNotMatch(html, new RegExp(privateCanary));
    assert.equal(db.queries.length, 0);
    assert.equal(db.mutations.length, 0);
  });

  await t.test("missing owner configuration disables administration without reading private content", async () => {
    const db = new FakeD1({
      entries: [entryRow({ state: "draft", title: privateCanary, published_at: null })],
    });
    const response = await fetchApp("/owner", {
      env: makeEnv({ db }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Administration is safely disabled/i);
    assert.doesNotMatch(html, new RegExp(privateCanary));
    assert.equal(db.queries.length, 0);
    assert.equal(db.mutations.length, 0);
  });
});

test("the single next-step panel uses bounded reads and compact responsive accessibility contracts", async () => {
  const [pageSource, repositorySource, css] = await Promise.all([
    readFile(new URL("../app/owner/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(pageSource, /className=\{`owner-next-step owner-next-step-\$\{readiness\.state\}`\}/);
  assert.match(pageSource, /aria-labelledby="owner-next-step-title"/);
  assert.match(pageSource, /<h2 id="owner-next-step-title">/);
  assert.match(pageSource, /<progress id="identity-progress" max="2" value=\{progress\}>/);
  assert.doesNotMatch(pageSource, /first-update-journey|IdentityReadinessPanel|FirstUpdateJourneyPanel/);
  const nextStepSource = pageSource.slice(
    pageSource.indexOf("function OwnerNextStep"),
    pageSource.indexOf("function nextStepContent"),
  );
  assert.doesNotMatch(nextStepSource, /<a\b/);
  assert.doesNotMatch(pageSource, /next\/link|localStorage|sessionStorage/i);
  assert.match(repositorySource, /\.prepare\(`\$\{ENTRY_SELECT\}[\s\S]*WHERE state = \?[\s\S]*ORDER BY created_at ASC, id ASC[\s\S]*LIMIT 1`\)[\s\S]*\.bind\(state\)[\s\S]*\.first<EntryRow>\(\)/);
  assert.match(css, /\.button\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.text-link\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.owner-content\s*\{[^}]*width:\s*calc\(100% - 28px\)/);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.owner-next-step\s*\{[^}]*grid-template-columns:\s*1fr/);
  assert.match(css, /\.owner-frame\s*\{[^}]*min-height:\s*calc\(100vh - 165px - env\(safe-area-inset-top\)\)/s);
  assert.doesNotMatch(css, /grid-template-columns:\s*220px|min-height:\s*72px/);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});

async function ownerPage(env) {
  const response = await fetchApp("/owner", {
    env,
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(response.status, 200);
  return response.text();
}

async function assertDraftIsPubliclyUnknown(env, id, privateCanary) {
  const [draftHtml, missingHtml, draftApi, missingApi, collection, home] = await Promise.all([
    fetchApp(`/entries/${id}`, { env, headers: { accept: "text/html" } }),
    fetchApp("/entries/unknown-first-update", { env, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${id}`, { env }),
    fetchApp("/api/v1/entries/unknown-first-update", { env }),
    fetchApp("/api/v1/entries", { env }),
    fetchApp("/", { env, headers: { accept: "text/html" } }),
  ]);

  assert.equal(draftHtml.status, 404);
  assert.equal(missingHtml.status, 404);
  for (const html of [await draftHtml.text(), await missingHtml.text()]) {
    assert.match(html, /This update is not public/i);
    assert.doesNotMatch(html, new RegExp(privateCanary));
  }
  assert.equal(draftApi.status, 404);
  assert.equal(missingApi.status, 404);
  assert.deepEqual(await responseJson(draftApi), await responseJson(missingApi));
  assert.deepEqual((await responseJson(collection)).data, []);
  assert.doesNotMatch(await home.text(), new RegExp(privateCanary));
}

function nextStepPanel(html) {
  const match = html.match(/<section[^>]+owner-next-step[^>]*>[\s\S]*?<\/section>/i);
  assert.ok(match, "expected the next-step panel");
  return match[0];
}

function ownerPageHeader(html) {
  const match = html.match(/<header class="owner-page-header">[\s\S]*?<\/header>/i);
  assert.ok(match, "expected the owner page header");
  return match[0];
}

function countMatches(value, pattern) {
  return (value.match(pattern) ?? []).length;
}

function isBoundedFirstStateQuery(query) {
  const normalized = query.sql.replace(/\s+/g, " ").trim().toLowerCase();
  return query.operation === "first" &&
    normalized.includes("where state = ?") &&
    normalized.includes("order by created_at asc, id asc") &&
    normalized.includes("limit 1");
}
