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
  responseJson,
  validEntryInput,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("the owner composer is body-first, compact, private-aware, and makes every kind clear", async () => {
  const longTitle = `${"OwnerComposerTitle".repeat(11)}OwnerComposer`;
  const longBody = `${"LongUnbrokenComposerBody".repeat(160)}\nA second line remains visible.`;
  const destinationUrl = "https://example.com/a-very-long-destination/path?source=owner-composer";
  const entry = entryRow({
    id: "composer-draft",
    kind: "link",
    title: longTitle,
    body: longBody,
    destination_url: destinationUrl,
    state: "draft",
    published_at: null,
  });
  const env = makeEnv({ db: new FakeD1({ entries: [entry] }), ownerEmail });
  const [newHtml, editHtml, source, css] = await Promise.all([
    ownerHtml("/owner/entries/new", env),
    ownerHtml(`/owner/entries/${entry.id}`, env),
    readSource("app/owner/entries/EntryForm.tsx"),
    readSource("app/globals.css"),
  ]);

  assert.match(newHtml, /<p class="eyebrow">Private workspace<\/p>/i);
  assert.match(newHtml, /Saving creates a private draft in this Aitta/i);
  assert.match(newHtml, /<strong id="entry-save-context-title">New private draft<\/strong>/i);
  assert.match(newHtml, /Nothing becomes public from this form/i);
  assert.match(newHtml, /A short update\. Text is required; a title and destination URL are optional\./i);
  assert.match(newHtml, /Destination URL \(optional\)/i);
  assert.equal(countMatches(newHtml, />Save private draft<\/button>/gi), 1);
  assert.match(newHtml, />Back to this Aitta<\/a>/i);

  assert.match(editHtml, /<p class="eyebrow">Private draft<\/p>/i);
  assert.match(editHtml, /<strong id="entry-save-context-title">Editing a private draft<\/strong>/i);
  assert.match(editHtml, new RegExp(escapeRegex(longTitle)));
  assert.match(editHtml, new RegExp(escapeRegex(longBody)));
  assert.match(editHtml, new RegExp(escapeRegex(destinationUrl)));
  assert.match(editHtml, /Share a destination\. Text is required to explain the link, and a destination URL is required\. A title is optional\./i);
  assert.match(editHtml, /Destination URL \(required for Link\)/i);
  assert.match(editHtml, /required=""/i);
  assert.equal(countMatches(editHtml, />Save private draft<\/button>/gi), 1);

  const publishedHtml = await ownerHtml("/owner/entries/composer-published", makeEnv({
    db: new FakeD1({ entries: [entryRow({
      id: "composer-published",
      kind: "announcement",
      title: "Already public",
      body: "The existing public state stays unchanged while content is saved.",
      state: "published",
    })] }),
    ownerEmail,
  }));
  assert.match(publishedHtml, /<p class="eyebrow">Public update<\/p>/i);
  assert.match(publishedHtml, /<strong id="entry-save-context-title">Editing a public update<\/strong>/i);
  assert.match(publishedHtml, /without changing its publication state/i);
  assert.equal(countMatches(publishedHtml, />Save update<\/button>/gi), 1);
  assert.match(publishedHtml, /A time-sensitive update\. Text is required; a title helps readers, and a destination URL is optional\./i);

  const articleHtml = await ownerHtml("/owner/entries/composer-article", makeEnv({
    db: new FakeD1({ entries: [entryRow({
      id: "composer-article",
      kind: "article",
      title: "Longer reading",
      body: "An article still starts with its required text.",
      state: "draft",
    })] }),
    ownerEmail,
  }));
  assert.match(articleHtml, /A fuller update\. Text is required; a title helps readers, and a destination URL is optional\./i);

  assert.ok(source.indexOf('name="body"') < source.indexOf('name="kind"'), "body must precede kind");
  assert.ok(source.indexOf('name="body"') < source.indexOf('name="title"'), "body must precede title");
  assert.ok(source.indexOf('name="body"') < source.indexOf('name="destinationUrl"'), "body must precede destination");
  assert.match(source, /body: form\.get\("body"\)/);
  assert.match(source, /kind: form\.get\("kind"\)/);
  assert.match(source, /title: form\.get\("title"\)/);
  assert.match(source, /destinationUrl: form\.get\("destinationUrl"\)/);
  assert.match(source, /const \[kind, setKind\] = useState<EntryKind>\(entry\?\.kind \?\? "note"\)/);
  assert.match(source, /import \{ ENTRY_KINDS, type EntryKind \} from "@\/lib\/constants"/);
  assert.match(source, /ENTRY_KINDS\.map\(\(entryKind\)/);
  assert.match(source, /value=\{kind\}[\s\S]*onChange=\{changeKind\}/);
  assert.match(source, /required=\{kind === "link"\}/);
  assert.match(source, /function changeKind\(event: ChangeEvent<HTMLSelectElement>\)[\s\S]*setKind\(nextKind\)/);
  assert.match(source, /function changeKind\(event: ChangeEvent<HTMLSelectElement>\)[\s\S]*nextKind !== "link" && fieldErrors\.destinationUrl[\s\S]*destinationUrl: undefined/s);
  assert.match(source, /function isEntryKind\(value: string\): value is EntryKind[\s\S]*ENTRY_KINDS\.includes\(value as EntryKind\)/);
  assert.doesNotMatch(source, /key=\{kind\}/, "kind guidance must not remount fields and lose their values");
  assert.match(source, /defaultValue=\{entry\?\.body \?\? ""\}/);
  assert.match(source, /defaultValue=\{entry\?\.title \?\? ""\}/);
  assert.match(source, /defaultValue=\{entry\?\.destinationUrl \?\? ""\}/);
  assert.match(css, /\.entry-kind-guidance, \.entry-destination-guidance\s*\{[^}]*min-height:\s*1\.5rem/s);
  assert.match(css, /\.entry-editor-form\s*\{[^}]*width:\s*min\(100%, 760px\)/s);
  assert.match(css, /\.entry-editor-form textarea\[name="body"\]\s*\{[^}]*min-height:\s*220px/s);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.entry-editor-form textarea\[name="body"\]\s*\{[^}]*min-height:\s*190px/s);
});

test("draft create and edit preserve all four kinds and exact accepted values", async () => {
  const db = new FakeD1({ entries: [] });
  const env = makeEnv({ db, ownerEmail });
  const fixtures = [
    validEntryInput({ kind: "note", title: null, body: "A body-first note.", destinationUrl: null }),
    validEntryInput({ kind: "article", title: "Article title", body: "Article body.", destinationUrl: null }),
    validEntryInput({ kind: "announcement", title: "Announcement title", body: "Announcement body.", destinationUrl: null }),
    validEntryInput({ kind: "link", title: "Link title", body: "Link context.", destinationUrl: "https://example.com/resource?ref=composer" }),
  ];
  const createdIds = [];

  for (const fixture of fixtures) {
    const response = await fetchApp("/api/private/entries", {
      env,
      method: "POST",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(fixture),
    });
    assert.equal(response.status, 201);
    const created = (await responseJson(response)).data;
    assert.equal(created.attributes.kind, fixture.kind);
    assert.equal(created.attributes.title, fixture.title);
    assert.equal(created.attributes.body, fixture.body);
    assert.equal(created.attributes.destinationUrl, fixture.destinationUrl);
    assert.equal(created.attributes.state, "draft");
    createdIds.push(created.id);
  }

  const edits = [
    validEntryInput({ kind: "note", title: null, body: "Edited note body.", destinationUrl: null }),
    validEntryInput({ kind: "article", title: "Edited article title", body: "Edited article body.", destinationUrl: null }),
    validEntryInput({ kind: "announcement", title: "Edited announcement title", body: "Edited announcement body.", destinationUrl: null }),
    validEntryInput({
      kind: "link",
      title: "T".repeat(200),
      body: `${"UnbrokenUpdateBody".repeat(200)}\nAll values survive editing.`,
      destinationUrl: "https://example.com/" + "long-segment".repeat(30),
    }),
  ];

  for (const [index, editInput] of edits.entries()) {
    const edit = await fetchApp(`/api/private/entries/${createdIds[index]}`, {
      env,
      method: "PUT",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(editInput),
    });
    assert.equal(edit.status, 200);
    const saved = (await responseJson(edit)).data;
    assert.equal(saved.id, createdIds[index]);
    assert.equal(saved.kind, editInput.kind);
    assert.equal(saved.title, editInput.title);
    assert.equal(saved.body, editInput.body);
    assert.equal(saved.destinationUrl, editInput.destinationUrl);
    assert.equal(saved.state, "draft");
  }
});

test("draft validation and authorization fail without mutation and private values stay public-unknown", async () => {
  const privateCanary = "TASK160_PRIVATE_DRAFT_CANARY";
  const db = new FakeD1({ entries: [] });
  const env = makeEnv({ db, ownerEmail });

  const invalidBody = await fetchApp("/api/private/entries", {
    env,
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({ body: "   " })),
  });
  assert.equal(invalidBody.status, 422);
  assert.deepEqual((await responseJson(invalidBody)).error.fields, [{
    name: "body",
    code: "invalid",
    message: "Body must be between 1 and 50000 characters.",
  }]);

  const invalidLink = await fetchApp("/api/private/entries", {
    env,
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({ kind: "link", destinationUrl: null })),
  });
  assert.equal(invalidLink.status, 422);
  assert.deepEqual((await responseJson(invalidLink)).error.fields, [{
    name: "destinationUrl",
    code: "invalid",
    message: "A link update needs a destination URL.",
  }]);
  assert.equal(db.mutations.length, 0);

  const deniedDb = new FakeD1({ entries: [] });
  const denied = await fetchApp("/api/private/entries", {
    env: makeEnv({ db: deniedDb, ownerEmail }),
    method: "POST",
    headers: mutationHeaders("other@example.com"),
    body: JSON.stringify(validEntryInput({ body: privateCanary })),
  });
  assert.equal(denied.status, 403);
  assert.equal(deniedDb.mutations.length, 0);

  const create = await fetchApp("/api/private/entries", {
    env,
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({ body: privateCanary })),
  });
  assert.equal(create.status, 201);
  const created = (await responseJson(create)).data;

  const [home, permalink, detail, collection] = await Promise.all([
    fetchApp("/", { env, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${created.id}`, { env, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${created.id}`, { env }),
    fetchApp("/api/v1/entries", { env }),
  ]);
  assert.equal(permalink.status, 404);
  assert.equal(detail.status, 404);
  const publicProjection = `${await home.text()}\n${await permalink.text()}\n${JSON.stringify(await responseJson(detail))}\n${JSON.stringify(await responseJson(collection))}`;
  assert.doesNotMatch(publicProjection, new RegExp(privateCanary));
});

test("composer validation focuses fields, definitive errors permit retry, and uncertain saves lock retry", async () => {
  const [source, css, presentation, deployment] = await Promise.all([
    readSource("app/owner/entries/EntryForm.tsx"),
    readSource("app/globals.css"),
    readSource("docs/presentation.md"),
    readSource("docs/deployment.md"),
  ]);

  assert.match(source, /if \(recoveryRequired\) return;/);
  assert.match(source, /if \(!formElement\.checkValidity\(\)\)[\s\S]*formElement\.reportValidity\(\)/);
  assert.match(source, /const failure = await definitiveFailure\(response\);[\s\S]*setFieldErrors\(failure\.fieldErrors\);[\s\S]*focusFirstInvalidField\(formElement, failure\.fieldErrors\)/);
  assert.match(source, /const MAX_SERVER_ERROR_LENGTH = 240;/);
  assert.match(source, /function safeServerError\(value: unknown\): string \| null/);
  assert.match(source, /normalized\.length > 0 && normalized\.length <= MAX_SERVER_ERROR_LENGTH/);
  assert.match(source, /if \(value === "entryKind"\) return "kind"/);
  assert.match(source, /window\.requestAnimationFrame\([\s\S]*form\.elements\.namedItem\(fieldName\)[\s\S]*control\.focus\(\)/);
  assert.match(source, /disabled=\{busy \|\| recoveryRequired\}/);
  assert.match(source, /The save result is unknown\. Do not submit again from this page; the first request may have succeeded/);
  assert.match(source, /Reload saved update before retrying[\s\S]*Check saved updates before retrying/);
  assert.doesNotMatch(source, /setTimeout|setInterval|localStorage|sessionStorage|navigator\.sendBeacon/);
  assert.match(css, /\.field-error\s*\{[^}]*color:\s*var\(--danger\)[^}]*font-weight:\s*650/s);
  assert.match(css, /\.entry-editor-footer \.form-status\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(presentation, /body-first owner update composer/i);
  assert.match(deployment, /Save private draft/i);
  assert.match(deployment, /unknown result disables another save/i);
});

async function ownerHtml(path, env) {
  const response = await fetchApp(path, {
    env,
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(response.status, 200);
  return response.text();
}

function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}
