import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const deploymentPromptContent = JSON.parse(
  await readFile(new URL("../content/deployment-prompt.json", import.meta.url), "utf8"),
);
const promptMatch = readme.match(
  /^# AittaSocial\r?\n\r?\n```text\r?\n([\s\S]*?)\r?\n```/,
);

assert.ok(promptMatch, "README must open immediately after its H1 with the deployment prompt");

const prompt = promptMatch[1].replaceAll("\r", "");
const normalizedPrompt = prompt.replace(/\s+/g, " ").trim();

test("README opens with one short plain-language deployment prompt", () => {
  assert.equal(readme.match(/@Sites\b/g)?.length, 1);
  assert.doesNotMatch(readme, /^## Reusable deployment prompt$/m);
  assert.ok(
    normalizedPrompt.split(" ").length <= 110,
    `deployment prompt must stay at or below 110 words; found ${normalizedPrompt.split(" ").length}`,
  );
  assert.ok(readme.indexOf(promptMatch[0]) < readme.indexOf("## Proof-of-concept scope"));
  assert.match(readme, /\[ChatGPT Sites deployment\]\(docs\/deployment\.md\)/);
});

test("README and runtime use one exact normalized deployment prompt", () => {
  assert.equal(typeof deploymentPromptContent.prompt, "string");
  assert.equal(deploymentPromptContent.prompt, normalizedPrompt);
  assert.equal(deploymentPromptContent.prompt.trim(), deploymentPromptContent.prompt);
  assert.doesNotMatch(deploymentPromptContent.prompt, /\s{2,}|\r|\n/);
});

test("deployment prompt preserves every setup and approval boundary", () => {
  assert.match(normalizedPrompt, /https:\/\/github\.com\/aittadb\/aitta-social/);
  assert.match(normalizedPrompt, /reuse.*existing Site.*exactly one matches/i);
  assert.match(normalizedPrompt, /never create a.*duplicate/i);
  assert.match(normalizedPrompt, /stop to ask me if more than one Site could match/i);
  assert.match(normalizedPrompt, /keep it.*private first/i);
  assert.match(normalizedPrompt, /its own storage/i);
  assert.match(normalizedPrompt, /set up one owner through protected Site settings/i);
  assert.match(normalizedPrompt, /No current Hub connection exists.*public use works without one/i);
  assert.match(normalizedPrompt, /after sign-in.*owner controls.*without a GitHub fork/i);
  assert.match(normalizedPrompt, /optional outward Identity profile/i);
  for (const control of ["Identity", "links", "updates", "accent", "density", "attribution"]) {
    assert.match(normalizedPrompt, new RegExp(`\\b${control}\\b`, "i"));
  }
  assert.match(normalizedPrompt, /ask before any later source change or.*deployment/i);
  assert.match(normalizedPrompt, /ask separately before public access and before a custom domain/i);
});

test("README gives the full approved first-use explanation and profile boundary", () => {
  assert.match(
    readme,
    /An \*\*Aitta\*\* is one independently\s+controlled top-level place:\s+it remains authoritative for its identity, content, configuration, and locally\s+stored data whether it is public, private, or disconnected from the\s+AittaSocial Hub\. Today, the proof of concept implements that idea as an\s+independently controlled Aitta deployment on ChatGPT Sites\. One Aitta\s+deployment currently runs one Aitta/i,
  );
  assert.match(readme, /profile\*\* is an Aitta's optional outward identity presentation/i);
  assert.match(readme, /current POC has no Hub connection/i);
});

test("deployment prompt contains no owner identity, secret name, or implementation jargon", () => {
  assert.doesNotMatch(prompt, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  assert.match(normalizedPrompt, /without putting their email in this prompt or source/i);
  assert.doesNotMatch(prompt, /AITTA_SOCIAL_|OWNER_EMAIL|DEPLOYMENT_CREDENTIAL/i);
  assert.doesNotMatch(
    prompt,
    /\b(?:API|D1|JSON|HTTP|OAuth|OIDC|CSRF|SQL|schema|migration|binding|worker|endpoint|route|header|credential|environment variable|npm|wrangler)\b/i,
  );
});

test("README does not promise an automatic repository fork or synchronization", () => {
  assert.match(readme, /supported runtime changes require no GitHub fork/i);
  assert.match(
    readme,
    /template neither creates nor assumes an automatically synchronized fork/i,
  );
});
