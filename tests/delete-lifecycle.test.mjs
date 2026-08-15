import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  mutationHeaders,
  responseJson,
} from "./helpers/worker-harness.mjs";
import {
  compileRecordShapeAwareTypeScriptModule,
  importRecordShapeAwareTypeScriptModule,
} from "./helpers/record-shape-esm-compiler.mjs";
import { assertPrivateJson } from "./helpers/private-json-response.mjs";
import { deletionAcknowledgement } from "./helpers/deletion-acknowledgement-contract.mjs";

const ownerEmail = "owner@example.com";
const draftId = "16500000-0000-4000-8000-000000000001";
const publishedId = "16500000-0000-4000-8000-000000000002";

test("deleting either a draft or published update acknowledges only the deleted identifier and makes it publicly unknown", async () => {
  const privateCanary = "TASK165_DELETE_PRIVATE_CANARY";
  const db = new FakeD1({
    entries: [
      entryRow({ id: draftId, state: "draft", published_at: null, body: privateCanary }),
      entryRow({ id: publishedId, state: "published", body: privateCanary }),
    ],
  });
  const env = makeEnv({ db, ownerEmail });

  const draftDelete = await fetchApp(`/api/private/entries/${draftId}`, {
    env,
    method: "DELETE",
    headers: mutationHeaders(ownerEmail),
  });
  assertPrivateJson(draftDelete, 200);
  assertDeletionAcknowledgement(await responseJson(draftDelete), draftId);
  assert.equal(db.entries.some((entry) => entry.id === draftId), false);

  const publishedBeforeDelete = await fetchApp(`/api/v1/entries/${publishedId}`, { env });
  assert.equal(publishedBeforeDelete.status, 200);

  const publishedDelete = await fetchApp(`/api/private/entries/${publishedId}`, {
    env,
    method: "DELETE",
    headers: mutationHeaders(ownerEmail),
  });
  assertPrivateJson(publishedDelete, 200);
  assertDeletionAcknowledgement(await responseJson(publishedDelete), publishedId);
  assert.equal(db.entries.some((entry) => entry.id === publishedId), false);

  const [deletedDraft, deletedPublished, unknown] = await Promise.all([
    fetchApp(`/api/v1/entries/${draftId}`, { env }),
    fetchApp(`/api/v1/entries/${publishedId}`, { env }),
    fetchApp("/api/v1/entries/16500000-0000-4000-8000-000000000099", { env }),
  ]);
  for (const response of [deletedDraft, deletedPublished, unknown]) {
    assert.equal(response.status, 404);
    assert.doesNotMatch(JSON.stringify(await responseJson(response)), new RegExp(privateCanary));
  }
});

test("delete denial is authoritative and does not mutate either private or public state", async () => {
  const privateCanary = "TASK165_DENIAL_PRIVATE_CANARY";
  const db = new FakeD1({ entries: [entryRow({ id: publishedId, body: privateCanary })] });
  const env = makeEnv({ db, ownerEmail });

  const nonOwner = await fetchApp(`/api/private/entries/${publishedId}`, {
    env,
    method: "DELETE",
    headers: mutationHeaders("other@example.com"),
  });
  assert.equal(nonOwner.status, 403);

  const csrf = await fetchApp(`/api/private/entries/${publishedId}`, {
    env,
    method: "DELETE",
    headers: { ...mutationHeaders(ownerEmail), origin: "https://attacker.example" },
  });
  assert.equal(csrf.status, 403);
  assert.equal(db.entries.some((entry) => entry.id === publishedId), true);

  const stillPublic = await fetchApp(`/api/v1/entries/${publishedId}`, { env });
  assert.equal(stillPublic.status, 200);
  assert.equal((await responseJson(stillPublic)).data.attributes.body, privateCanary);
});

test("delete controls have an irreversible update-specific confirmation and isolated recovery", async () => {
  const [actions, presentation, deployment] = await Promise.all([
    readFile(new URL("../app/owner/_components/EntryActions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/presentation.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/deployment.md", import.meta.url), "utf8"),
  ]);

  assert.match(actions, /window\.confirm\(`Delete “\$\{updateLabel\}” \(update \$\{actionReference\}\) permanently\? This cannot be undone\.`\)/);
  assert.match(actions, /if \(!confirmed\) \{\s*setMessage\("Deletion cancelled\. This update was not deleted\."\);\s*return;/);
  assert.match(actions, /import \{ readDeletionResponse \} from "\.\.\/entries\/deletion-response"/u);
  assert.match(actions, /import \{ changeEntryStateRequest, deleteEntryRequest \} from "\.\.\/entries\/entry-mutation-requests"/u);
  assert.match(actions, /const response = await deleteEntryRequest\(id\);/u);
  assert.doesNotMatch(actions, /\bfetch\s*\(/u);
  assert.match(actions, /readDeletionResponse\(response, id\)/u);
  assert.match(actions, /if \(outcome\.outcome === "success"\) \{\s*window\.location\.assign\("\/owner"\);/u);
  assert.match(actions, /The server rejected this deletion request\. \$\{outcome\.message\}/u);
  assert.match(actions, /The deletion result could not be confirmed\. Check this Aitta’s saved state before deleting this update again\./);
  assert.match(actions, /setDeletionRecoveryRequired\(true\);[\s\S]*setBusy\(false\);/);
  assert.match(actions, /disabled=\{busy \|\| deletionRecoveryRequired\}[\s\S]*Delete/);
  assert.match(actions, /disabled=\{busy \|\| lifecycleRecoveryRequired\}[\s\S]*Publish/);
  assert.match(actions, /href="\/owner"[\s\S]*Check this Aitta’s saved state/);
  assert.doesNotMatch(actions, /Reload Your presence|This update was deleted|This update remains/i);
  assert.equal((actions.match(/deleteEntryRequest\(/g) ?? []).length, 1, "delete makes one request and has no retry path");

  for (const document of [presentation, deployment]) {
    assert.match(document, /delet/i);
    assert.match(document, /Aitta/i);
  }
});

test("deletion client accepts only the exact acknowledgement and exact structured 4xx errors", async () => {
  const readDeletionResponse = await compiledDeletionResponseReader();
  const expectedAcknowledgement = deletionAcknowledgement(draftId);
  assert.deepEqual(
    await readDeletionResponse(Response.json(expectedAcknowledgement), draftId),
    { outcome: "success" },
  );

  for (const response of [
    new Response(null, { status: 204 }),
    new Response("not JSON", { status: 200 }),
    new Response(JSON.stringify(expectedAcknowledgement), { status: 200, headers: { "content-type": "application/json-seq" } }),
    Response.json({ ...expectedAcknowledgement, data: { ...expectedAcknowledgement.data, id: publishedId } }),
    Response.json({ ...expectedAcknowledgement, data: { ...expectedAcknowledgement.data, type: "owner-entry" } }),
    Response.json({ ...expectedAcknowledgement, data: { ...expectedAcknowledgement.data, attributes: { deleted: false } } }),
    Response.json({ ...expectedAcknowledgement, links: [] }),
    Response.json({ ...expectedAcknowledgement, links: [expectedAcknowledgement.links[0], { ...expectedAcknowledgement.links[1], href: "/attacker" }] }),
    Response.json({ ...expectedAcknowledgement, actions: [{ rel: "create" }] }),
    Response.json({ error: "DELETE_RESPONSE_PRIVATE_CANARY" }, { status: 500 }),
    Response.json({ data: null, error: { code: "bad", message: "No." }, links: [] }, { status: 302 }),
    new Response("not JSON", { status: 404, headers: { "content-type": "text/plain" } }),
    Response.json({ error: "legacy" }, { status: 422 }),
  ]) {
    assert.deepEqual(await readDeletionResponse(response, draftId), { outcome: "unconfirmed" });
  }

  assert.deepEqual(await readDeletionResponse(Response.json({
    data: null,
    error: { code: "entry_not_found", message: "Update not found." },
    links: [],
  }, { status: 404 }), draftId), {
    outcome: "definitive-error",
    message: "Update not found.",
  });

  let pulls = 0;
  const oversized = new Response(new ReadableStream({
    pull(controller) {
      pulls += 1;
      if (pulls > 100) return controller.close();
      controller.enqueue(new Uint8Array(16 * 1024));
    },
  }, { highWaterMark: 0 }), { status: 200, headers: { "content-type": "application/json" } });
  assert.deepEqual(await readDeletionResponse(oversized, draftId), { outcome: "unconfirmed" });
  assert.ok(pulls <= 6);
});

function assertDeletionAcknowledgement(value, id) {
  assert.deepEqual(value, deletionAcknowledgement(id));
}

async function compiledDeletionResponseReader() {
  const [privateEntryErrorFieldNameUrl, mediaTypeUrl] = await Promise.all([
    compileRecordShapeAwareTypeScriptModule(
      new URL("../app/owner/entries/private-entry-error-field-name.ts", import.meta.url),
    ),
    compileRecordShapeAwareTypeScriptModule(
      new URL("../app/owner/entries/json-response-media-type.ts", import.meta.url),
    ),
  ]);
  const draftUrl = await compileRecordShapeAwareTypeScriptModule(
    new URL("../app/owner/entries/draft-create-response.ts", import.meta.url),
    { "./private-entry-error-field-name": privateEntryErrorFieldNameUrl },
  );
  const deletionModule = await importRecordShapeAwareTypeScriptModule(
    new URL("../app/owner/entries/deletion-response.ts", import.meta.url),
    {
      "./draft-create-response": draftUrl,
      "./json-response-media-type": mediaTypeUrl,
    },
  );
  return deletionModule.readDeletionResponse;
}
