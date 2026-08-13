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

const ownerEmail = "owner@example.com";
const draftId = "16500000-0000-4000-8000-000000000001";
const publishedId = "16500000-0000-4000-8000-000000000002";

test("deleting either a draft or published update uses the unchanged owner route and makes it publicly unknown", async () => {
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
  assert.equal(draftDelete.status, 204);
  assert.equal(db.entries.some((entry) => entry.id === draftId), false);

  const publishedBeforeDelete = await fetchApp(`/api/v1/entries/${publishedId}`, { env });
  assert.equal(publishedBeforeDelete.status, 200);

  const publishedDelete = await fetchApp(`/api/private/entries/${publishedId}`, {
    env,
    method: "DELETE",
    headers: mutationHeaders(ownerEmail),
  });
  assert.equal(publishedDelete.status, 204);
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
  assert.match(actions, /fetch\(`\/api\/private\/entries\/\$\{encodeURIComponent\(id\)\}`, \{ method: "DELETE" \}\)/);
  assert.match(actions, /if \(outcome === "success"\) \{\s*window\.location\.assign\("\/owner"\);/);
  assert.match(actions, /The server rejected this deletion request\. \$\{await safeError\(response\)\}/);
  assert.match(actions, /The deletion result could not be confirmed\. Check this Aitta’s saved state before deleting this update again\./);
  assert.match(actions, /setDeletionRecoveryRequired\(true\);[\s\S]*setBusy\(false\);/);
  assert.match(actions, /disabled=\{busy \|\| deletionRecoveryRequired\}[\s\S]*Delete/);
  assert.match(actions, /disabled=\{busy \|\| lifecycleRecoveryRequired\}[\s\S]*Publish/);
  assert.match(actions, /href="\/owner"[\s\S]*Check this Aitta’s saved state/);
  assert.doesNotMatch(actions, /Reload Your presence|This update was deleted|This update remains/i);
  assert.equal((actions.match(/fetch\(/g) ?? []).length, 2, "delete makes one request and has no retry path");

  for (const document of [presentation, deployment]) {
    assert.match(document, /delet/i);
    assert.match(document, /Aitta/i);
  }
});
