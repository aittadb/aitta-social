import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

import { readRepositorySource } from "./helpers/repository-source.mjs";

test("owner request functions preserve every owner mutation request and inject transport", async () => {
  const { entries, profile, pagePreview } = await loadRequestModules();
  const calls = [];
  const response = new Response("ok", { status: 202 });
  const transport = async (input, init) => {
    calls.push({ input, init });
    return response;
  };

  assert.equal(await entries.createEntryRequest(entryBody, transport), response);
  assert.equal(await entries.editEntryRequest("entry / id", entryBody, transport), response);
  assert.equal(await entries.changeEntryStateRequest("entry / id", "published", transport), response);
  assert.equal(await entries.deleteEntryRequest("entry / id", transport), response);
  assert.equal(await profile.saveProfileRequest(profileBody, transport), response);
  assert.equal(await pagePreview.previewPageRequest(pagePreviewBody, transport), response);

  assert.deepEqual(calls.map(({ input, init }) => ({ input, init })), [
    jsonCall("/api/private/entries", "POST", entryBody),
    jsonCall("/api/private/entries/entry%20%2F%20id", "PUT", entryBody),
    jsonCall("/api/private/entries/entry%20%2F%20id/state", "PUT", { state: "published" }),
    {
      input: "/api/private/entries/entry%20%2F%20id",
      init: { method: "DELETE", headers: { Accept: "application/json" }, redirect: "error" },
    },
    jsonCall("/api/private/profile", "PUT", profileBody),
    jsonCall("/api/private/pages/preview", "POST", pagePreviewBody),
  ]);
});

test("owner request functions propagate transport rejection without retries", async () => {
  const { entries, profile, pagePreview } = await loadRequestModules();
  const failure = new Error("offline");
  let calls = 0;
  const rejectingTransport = async () => {
    calls += 1;
    throw failure;
  };

  await assert.rejects(entries.createEntryRequest(entryBody, rejectingTransport), failure);
  await assert.rejects(entries.editEntryRequest("id", entryBody, rejectingTransport), failure);
  await assert.rejects(entries.changeEntryStateRequest("id", "draft", rejectingTransport), failure);
  await assert.rejects(entries.deleteEntryRequest("id", rejectingTransport), failure);
  await assert.rejects(profile.saveProfileRequest(profileBody, rejectingTransport), failure);
  await assert.rejects(pagePreview.previewPageRequest(pagePreviewBody, rejectingTransport), failure);
  assert.equal(calls, 6);
});

test("owner React components use request boundaries and keep strict response readers", async () => {
  const components = await Promise.all([
    "app/owner/_components/EntryActions.tsx",
    "app/owner/entries/EntryForm.tsx",
    "app/owner/profile/ProfileForm.tsx",
    "app/owner/pages/import/PageImportForm.tsx",
  ].map(readRepositorySource));
  for (const source of components) assert.doesNotMatch(source, /\bfetch\s*\(/u);
  assert.match(components[0], /changeEntryStateRequest\(id, nextState\)/u);
  assert.match(components[0], /deleteEntryRequest\(id\)/u);
  assert.match(components[0], /readPublicationStateResponse\(response, \{ id, state: nextState \}\)/u);
  assert.match(components[0], /readDeletionResponse\(response, id\)/u);
  assert.match(components[1], /createEntryRequest\(requestBody\)/u);
  assert.match(components[1], /editEntryRequest\(entry\.id, requestBody\)/u);
  assert.match(components[1], /readDraftCreateResponse\(response\)/u);
  assert.match(components[2], /saveProfileRequest\(\{/u);
  assert.match(components[2], /readProfileSaveResponse\(response\)/u);
  assert.match(components[3], /previewPageRequest\(\{/u);
  assert.match(components[3], /readPagePreviewResponse\(response\)/u);
});

const entryBody = { kind: "note", title: "Title", body: "Body", destinationUrl: "https://example.test" };
const profileBody = {
  displayName: "Example", shortDescription: "Short", introduction: "Intro", location: "Helsinki",
  website: "https://example.test", externalLinks: [{ label: "Site", url: "https://example.test" }],
  canonicalUrl: "https://example.test", accentColor: "#31554d", density: "comfortable", hidePoweredBy: false,
};
const pagePreviewBody = { schemaVersion: 1, title: "Page", description: "Description", htmlFragment: "<p>Safe</p>" };

function jsonCall(input, method, body) {
  return {
    input,
    init: {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  };
}

async function loadRequestModules() {
  const boundaryUrl = await transpiledModuleUrl("app/owner/owner-browser-request.ts");
  const [entrySource, profileSource, pageSource] = await Promise.all([
    readRepositorySource("app/owner/entries/entry-mutation-requests.ts"),
    readRepositorySource("app/owner/profile/profile-save-request.ts"),
    readRepositorySource("app/owner/pages/import/page-preview-request.ts"),
  ]);
  const [entries, profile, pagePreview] = await Promise.all([
    import(transpiled(entrySource.replace("../owner-browser-request", boundaryUrl))),
    import(transpiled(profileSource.replace("../owner-browser-request", boundaryUrl))),
    import(transpiled(pageSource.replace("../../owner-browser-request", boundaryUrl))),
  ]);
  return { entries, profile, pagePreview };
}

async function transpiledModuleUrl(path) {
  return transpiled(await readRepositorySource(path));
}

function transpiled(source) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return `data:text/javascript,${encodeURIComponent(compiled)}`;
}
