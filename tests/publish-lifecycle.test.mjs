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
const entryId = "44444444-4444-4444-8444-444444444444";

test("publish lifecycle keeps the existing owner state transition and public projection boundary", async () => {
  const privateCanary = "TASK164_PRIVATE_DRAFT_CANARY";
  const db = new FakeD1({
    entries: [entryRow({ id: entryId, state: "draft", published_at: null, body: privateCanary })],
  });
  const env = makeEnv({ db, ownerEmail });

  const publish = await fetchApp(`/api/private/entries/${entryId}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "published" }),
  });
  assert.equal(publish.status, 200);
  assert.equal((await responseJson(publish)).data.attributes.state, "published");
  assert.equal(db.entries[0].state, "published");

  const publicEntry = await fetchApp(`/api/v1/entries/${entryId}`, { env });
  assert.equal(publicEntry.status, 200);
  assert.equal((await responseJson(publicEntry)).data.attributes.body, privateCanary);

  const unpublish = await fetchApp(`/api/private/entries/${entryId}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "draft" }),
  });
  assert.equal(unpublish.status, 200);
  assert.equal((await responseJson(unpublish)).data.attributes.state, "draft");
  assert.equal(db.entries[0].state, "draft");

  const hiddenAgain = await fetchApp(`/api/v1/entries/${entryId}`, { env });
  assert.equal(hiddenAgain.status, 404);
  assert.doesNotMatch(JSON.stringify(await responseJson(hiddenAgain)), new RegExp(privateCanary));

  const concurrentMissing = await fetchApp("/api/private/entries/55555555-5555-4555-8555-555555555555/state", {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "published" }),
  });
  assert.equal(concurrentMissing.status, 404, "a concurrently missing update has no state to infer");
});

test("publish controls make Draft and Published meaning, confirmation, definitive failure, and unknown-result recovery explicit", async () => {
  const [actions, presentation, deployment, privacy] = await Promise.all([
    readFile(new URL("../app/owner/_components/EntryActions.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/presentation.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/deployment.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/privacy.md", import.meta.url), "utf8"),
  ]);

  assert.match(actions, /<strong>\{state === "draft" \? "Draft" : "Published"\}<\/strong>/);
  assert.match(actions, /only the owner can read this update\. Publishing makes it publicly readable on this Aitta\./);
  assert.match(actions, /this update is publicly readable on this Aitta\. Unpublishing returns it to a private draft\./);
  assert.match(actions, /function requestPublish\(\)[\s\S]*window\.confirm\([\s\S]*publicly readable on this Aitta at its permalink[\s\S]*if \(!confirmed\)[\s\S]*return;[\s\S]*void changeState\("published"\)/);
  assert.match(actions, /if \(lifecycleRecoveryRequired\) return;/);
  assert.match(actions, /showUnconfirmedLifecycleResult\(nextState\)/);
  assert.match(actions, /The publication result could not be confirmed\. Check this Aitta’s saved state before changing this update’s publication state again\./);
  assert.match(actions, /The unpublish result could not be confirmed\. Check this Aitta’s saved state before changing this update’s publication state again\./);
  assert.match(actions, /disabled=\{busy \|\| lifecycleRecoveryRequired\}/g);
  assert.match(actions, /The server rejected this publication request\. \$\{failure\}/);
  assert.match(actions, /The server rejected this unpublish request\. \$\{failure\}/);
  assert.doesNotMatch(actions, /This update was not published|This update remains published/);
  assert.match(actions, /Check this Aitta’s current saved state/);
  assert.equal((actions.match(/changeEntryStateRequest\(/g) ?? []).length, 1, "state makes one request with no retry loop");
  assert.equal((actions.match(/deleteEntryRequest\(/g) ?? []).length, 1, "delete makes one request with no retry loop");

  for (const document of [presentation, deployment, privacy]) {
    assert.match(document, /Draft|Published|publish/i);
    assert.match(document, /Aitta/i);
  }
});
