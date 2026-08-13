import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  responseJson,
  validEntryInput,
  validProfileInput,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "clean-owner@example.test";
const deploymentPrompt = JSON.parse(
  await readFile(new URL("../content/deployment-prompt.json", import.meta.url), "utf8"),
).prompt;

test("a fresh D1 moves from safe setup to configured empty and published-only without changing source", async () => {
  const sourceBefore = await trackedSourceFingerprint();
  const draftCanary = "CLEAN_SOURCE_DRAFT_VALUE_CANARY";
  const publicBody = "A public update saved through the deployment-owned database.";
  const db = new FakeD1({ profile: null, entries: [] });

  const missingOwnerEnv = makeEnv({ db });
  const initialPublic = await fetchApp("/", {
    env: missingOwnerEnv,
    headers: { accept: "text/html" },
  });
  assert.equal(initialPublic.status, 200);
  const initialPublicHtml = await initialPublic.text();
  assert.match(initialPublicHtml, new RegExp(escapeRegex(deploymentPrompt)));
  assert.match(initialPublicHtml, /Set up your own Aitta/i);
  assert.match(initialPublicHtml, /An Aitta is your independently controlled AittaSocial application/i);
  assert.match(initialPublicHtml, /optional outward identity presentation/i);
  assert.match(initialPublicHtml, /no current Hub connection/i);

  const disabledOwner = await fetchApp("/owner", {
    env: missingOwnerEnv,
    headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
  });
  assert.equal(disabledOwner.status, 200);
  assert.match(await disabledOwner.text(), /Administration is safely disabled/i);
  const disabledWrite = await fetchApp("/api/private/profile", {
    env: missingOwnerEnv,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validProfileInput()),
  });
  assert.equal(disabledWrite.status, 503);
  assert.equal(db.mutations.length, 0);

  const unavailable = await fetchApp("/", {
    env: makeEnv({
      db: { prepare() { throw new Error("CLEAN_SOURCE_D1_FAILURE_VALUE_CANARY"); } },
      ownerEmail,
    }),
    headers: { accept: "text/html" },
  });
  assert.equal(unavailable.status, 200);
  const unavailableHtml = await unavailable.text();
  assert.match(unavailableHtml, /Aitta storage unavailable/i);
  assert.match(unavailableHtml, /This Aitta cannot be loaded right now/i);
  assert.doesNotMatch(unavailableHtml, /@Sites|Set up your own Aitta|CLEAN_SOURCE_D1_FAILURE_VALUE_CANARY/i);

  const configuredEnv = makeEnv({ db, ownerEmail });
  const identitySave = await fetchApp("/api/private/profile", {
    env: configuredEnv,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validProfileInput({
      displayName: "Clean Source Presence",
      shortDescription: "Configured at runtime without a repository fork.",
      canonicalUrl: "https://clean-source.example/presence///",
      accentColor: "#6a4b35",
      density: "compact",
      hidePoweredBy: true,
    })),
  });
  assert.equal(identitySave.status, 200);
  assert.equal(db.profile.display_name, "Clean Source Presence");
  assert.equal(db.profile.canonical_url, "https://clean-source.example/presence");

  const configuredEmpty = await fetchApp("/", {
    env: configuredEnv,
    headers: { accept: "text/html" },
  });
  const configuredEmptyHtml = await configuredEmpty.text();
  assert.match(configuredEmptyHtml, /Clean Source Presence/i);
  assert.match(configuredEmptyHtml, /No published updates yet/i);
  assert.match(configuredEmptyHtml, /density-compact/i);
  assert.doesNotMatch(configuredEmptyHtml, /@Sites|Prompt for ChatGPT|Powered by AittaSocial/i);

  const draftResponse = await fetchApp("/api/private/entries", {
    env: configuredEnv,
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({ title: "Private rehearsal", body: draftCanary })),
  });
  assert.equal(draftResponse.status, 201);
  const draft = (await responseJson(draftResponse)).data;

  const [draftHome, draftPermalink, draftApi, draftCollection] = await Promise.all([
    fetchApp("/", { env: configuredEnv, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${draft.id}`, { env: configuredEnv, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${draft.id}`, { env: configuredEnv }),
    fetchApp("/api/v1/entries", { env: configuredEnv }),
  ]);
  assert.equal(draftPermalink.status, 404);
  assert.equal(draftApi.status, 404);
  const privateProjection = [
    await draftHome.text(),
    await draftPermalink.text(),
    JSON.stringify(await responseJson(draftApi)),
    JSON.stringify(await responseJson(draftCollection)),
  ].join("\n");
  assert.doesNotMatch(privateProjection, new RegExp(draftCanary));

  const edit = await fetchApp(`/api/private/entries/${draft.id}`, {
    env: configuredEnv,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({ title: "Reviewed public update", body: publicBody })),
  });
  assert.equal(edit.status, 200);
  const publish = await fetchApp(`/api/private/entries/${draft.id}/state`, {
    env: configuredEnv,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "published" }),
  });
  assert.equal(publish.status, 200);

  const [publishedHome, publishedPermalink, publishedApi, collection] = await Promise.all([
    fetchApp("/", { env: configuredEnv, headers: { accept: "text/html" } }),
    fetchApp(`/entries/${draft.id}`, { env: configuredEnv, headers: { accept: "text/html" } }),
    fetchApp(`/api/v1/entries/${draft.id}`, { env: configuredEnv }),
    fetchApp("/api/v1/entries", { env: configuredEnv }),
  ]);
  assert.equal(publishedPermalink.status, 200);
  assert.equal(publishedApi.status, 200);
  const publicProjection = [
    await publishedHome.text(),
    await publishedPermalink.text(),
    JSON.stringify(await responseJson(publishedApi)),
    JSON.stringify(await responseJson(collection)),
  ].join("\n");
  assert.match(publicProjection, /Reviewed public update/);
  assert.match(publicProjection, new RegExp(escapeRegex(publicBody)));
  assert.doesNotMatch(publicProjection, new RegExp(draftCanary));
  assert.equal(await trackedSourceFingerprint(), sourceBefore);
});

test("the clean-source proof is inert, value-based, versioned, and separately hosted", async () => {
  const [script, runbook, packageJson, constants] = await Promise.all([
    readFile(new URL("../scripts/check-clean-source.mjs", import.meta.url), "utf8"),
    readFile(new URL("../docs/reproducibility.md", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../lib/constants.ts", import.meta.url), "utf8"),
  ]);

  assert.match(packageJson, /"reproducibility:check": "npm audit --omit=dev && node scripts\/check-clean-source\.mjs"/);
  assert.match(script, /run\("git", \["archive", "--format=tar"/);
  assert.match(script, /assertAbsent\(activeHostingPath/);
  assert.match(script, /project_id: null, d1: "DB", r2: null/);
  assert.match(script, /Retired keys are hostile build-time inputs, not supported configuration/);
  assert.match(script, /AITTA_SOCIAL_HUB_URL: `https:\/\/\$\{canaries\[2\]\}`/);
  assert.match(script, /AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL: canaries\[4\]/);
  assert.match(script, /\["dist", "\.next", "\.vinext", "\.wrangler"\]/);
  assert.match(script, /assertValuesAbsent\(outputFiles/);
  assert.match(script, /A fresh proof checkout must not contain local environment files/);
  assert.match(script, /Proof origin must be a local bare repository/);
  assert.match(script, /kind: "local-bare-repository"/);
  assert.match(script, /for \(const path of trackedFiles\)[\s\S]{0,220}\\\.next\|\\\.vinext/);
  assert.match(script, /function forbiddenArtifact[\s\S]{0,180}\\\.next\|\\\.vinext/);
  assert.match(script, /d1[\s\S]*migrations[\s\S]*apply/);
  assert.match(script, /Schema generation changed reviewed migrations/);
  assert.doesNotMatch(script, /sites:package|https?:\/\/api\.|fetch\(/i);

  assert.match(runbook, /fresh local\s+clone/i);
  assert.match(runbook, /local bare repository/i);
  assert.match(runbook, /npm audit --omit=dev/);
  assert.match(runbook, /synthetic \*values\*/i);
  assert.match(runbook, /TASK-059/);
  assert.match(runbook, /TASK-061/);
  assert.match(constants, /SOFTWARE_VERSION = "0\.1\.0"/);
  assert.match(constants, /PROTOCOL_VERSION = "1\.0"/);
});

async function trackedSourceFingerprint() {
  const paths = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .sort();
  const hash = createHash("sha256");
  for (const path of paths) {
    hash.update(path);
    hash.update("\0");
    hash.update(await readFile(new URL(`../${path}`, import.meta.url)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
