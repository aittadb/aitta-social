import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  ownerHeaders,
  profileRow,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";
const otherEmail = "other@example.com";
const ownerCanary = "TEMPLATE_OWNER_PRIVATE_CANARY@example.test";
const draftTitle = "TEMPLATE_DRAFT_TITLE_PRIVATE_CANARY";
const draftBody = "TEMPLATE_DRAFT_BODY_PRIVATE_CANARY";
const approvedAittaExplanation = [
  "An Aitta is your independently controlled AittaSocial application.",
  "It remains authoritative for its identity, content, configuration, and locally stored data,",
  "whether it is publicly reachable, private, or disconnected from the AittaSocial Hub.",
].join(" ");
const deploymentPrompt = JSON.parse(
  await readFile(new URL("../content/deployment-prompt.json", import.meta.url), "utf8"),
).prompt;

test("a truly unconfigured deployment leads with the exact prompt and published-only updates", async () => {
  const response = await fetchApp("/", {
    env: makeEnv({
      db: new FakeD1({
        profile: null,
        entries: [
          entryRow({ id: "public-update", title: "Visible public update" }),
          entryRow({
            id: "private-draft",
            title: draftTitle,
            body: draftBody,
            state: "draft",
            published_at: null,
          }),
        ],
      }),
      ownerEmail: ownerCanary,
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  const html = await response.text();
  const prompt = readPrompt(html);
  assert.equal(prompt, deploymentPrompt);
  assert.equal(html.match(/<textarea(?=[^>]+id="deployment-prompt")/gi)?.length, 1);
  assert.ok(html.indexOf("Set up your own Aitta") < html.indexOf("Visible public update"));
  assert.ok(html.indexOf(deploymentPrompt) < html.indexOf("Visible public update"));
  assert.match(normalizeVisibleText(html), new RegExp(escapeRegex(approvedAittaExplanation), "i"));
  assert.match(html, /A profile is an Aitta(?:&apos;|&#x27;|')s optional outward identity presentation/i);
  assert.match(html, /This Aitta has no profile yet and no current Hub connection/i);
  assert.match(html, /<label[^>]+for="deployment-prompt"[^>]*>Prompt for ChatGPT<\/label>/i);
  assert.match(html, /Select and copy this prompt into ChatGPT to set up your own Aitta/i);
  assert.match(html, /<textarea(?=[^>]+id="deployment-prompt")(?=[^>]+readonly)/i);
  assert.match(html, /href="\/owner"[^>]+aria-label="Manage this Aitta’s local sole-owner administration"[^>]*>Manage<\/a>/i);
  assert.match(html, /Visible public update/i);
  assert.doesNotMatch(
    html,
    new RegExp([draftTitle, draftBody, ownerCanary].join("|"), "i"),
  );
});

test("the prompt reveals no owner authorization result", async (t) => {
  const db = new FakeD1({ profile: null });

  await t.test("signed-in owner gets the normal owner destination", async () => {
    const response = await fetchApp("/", {
      env: makeEnv({ db, ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(readPrompt(html), deploymentPrompt);
    assert.match(html, /href="\/owner"[^>]+aria-label="Manage this Aitta’s local sole-owner administration"[^>]*>Manage<\/a>/i);
    assert.doesNotMatch(html, new RegExp(ownerEmail.replaceAll(".", "\\."), "i"));
  });

  await t.test("another signed-in visitor gets no administrative claim or private view", async () => {
    const publicResponse = await fetchApp("/", {
      env: makeEnv({ db, ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(otherEmail) },
    });
    const publicHtml = await publicResponse.text();
    assert.equal(readPrompt(publicHtml), deploymentPrompt);
    assert.match(publicHtml, /href="\/owner"[^>]+aria-label="Manage this Aitta’s local sole-owner administration"[^>]*>Manage<\/a>/i);
    assert.doesNotMatch(publicHtml, /you are the owner|owner verified/i);

    const ownerResponse = await fetchApp("/owner", {
      env: makeEnv({ db, ownerEmail }),
      headers: { accept: "text/html", ...ownerHeaders(otherEmail) },
    });
    const ownerHtml = await ownerResponse.text();
    assert.match(ownerHtml, /not yours to administer/i);
    assert.doesNotMatch(ownerHtml, /Create update|Identity setup/i);
  });

  await t.test("missing owner configuration keeps administration disabled", async () => {
    const publicResponse = await fetchApp("/", {
      env: makeEnv({ db }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(readPrompt(await publicResponse.text()), deploymentPrompt);

    const ownerResponse = await fetchApp("/owner", {
      env: makeEnv({ db }),
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    const ownerHtml = await ownerResponse.text();
    assert.match(ownerHtml, /Administration is safely disabled/i);
    assert.doesNotMatch(ownerHtml, /Create update|Identity setup/i);
  });
});

test("a configured deployment leads with its Identity and contains no setup prompt", async () => {
  const response = await fetchApp("/", {
    env: makeEnv({
      db: new FakeD1({
        profile: profileRow({
          display_name: "Configured Presence",
          short_description: "The represented Identity comes first.",
          private_canary: "CONFIGURED_PROFILE_PRIVATE_CANARY",
        }),
        entries: [entryRow({ title: "Configured public update" })],
      }),
      ownerEmail: ownerCanary,
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<h1[^>]*>Configured Presence<\/h1>/i);
  assert.ok(html.indexOf("Configured Presence") < html.indexOf("Configured public update"));
  assert.doesNotMatch(html, /@Sites|Set up your own Aitta|Prompt for ChatGPT|Set up this Aitta/i);
  assert.doesNotMatch(html, /CONFIGURED_PROFILE_PRIVATE_CANARY|TEMPLATE_OWNER_PRIVATE_CANARY/i);
});

test("a D1 failure is unavailable Aitta storage, never fresh setup or an owner claim", async (t) => {
  const failingDb = {
    prepare() {
      throw new Error("D1 unavailable private canary");
    },
  };
  const cases = [
    ["signed out", {}, /href="\/owner"[^>]*>Manage<\/a>/i],
    ["signed-in owner", ownerHeaders(ownerEmail), /href="\/owner"[^>]*>Manage<\/a>/i],
    ["signed-in non-owner", ownerHeaders(otherEmail), /href="\/owner"[^>]*>Manage<\/a>/i],
  ];

  for (const [name, headers, destination] of cases) {
    await t.test(name, async () => {
      const response = await fetchApp("/", {
        env: makeEnv({ db: failingDb, ownerEmail: ownerCanary }),
        headers: { accept: "text/html", ...headers },
      });

      assert.equal(response.status, 200);
      const html = await response.text();
      assert.match(html, /Aitta storage unavailable/i);
      assert.match(html, /This Aitta cannot be loaded right now/i);
      assert.match(html, /Its storage could not be read/i);
      assert.match(html, /Try again/i);
      assert.match(html, destination);
      assert.doesNotMatch(html, /@Sites|Set up your own Aitta|Prompt for ChatGPT|D1 unavailable private canary/i);
      assert.doesNotMatch(html, /TEMPLATE_OWNER_PRIVATE_CANARY|you are the owner|owner verified/i);
    });
  }
});

test("the prompt surface stays native, selectable, responsive, and accessible", async () => {
  const [component, page, css] = await Promise.all([
    readFile(new URL("../app/_components/DeploymentPrompt.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /<label htmlFor="deployment-prompt">/);
  assert.match(component, /<textarea[\s\S]*readOnly[\s\S]*value=\{deploymentPromptContent\.prompt\}/);
  assert.match(component, /aria-describedby="deployment-prompt-help"/);
  assert.doesNotMatch(component, /["']use client["']|navigator\.clipboard|onClick|<button/i);
  assert.doesNotMatch(page, /from\s+["']next\/link["']|<Link(?:\s|>)/);
  assert.match(css, /\.template-shell \.public-wide-content\s*\{[^}]*max-width:\s*732px/s);
  assert.match(css, /\.template-start\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*gap:\s*12px[^}]*padding:\s*16px[^}]*border-radius:\s*16px/s);
  assert.match(css, /\.template-introduction h1\s*\{[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*clamp\(1\.875rem, 4vw, 2\.375rem\)/s);
  assert.match(css, /\.identity-summary\s*\{[^}]*margin:\s*8px 0 0[^}]*font-family:\s*var\(--sans\)[^}]*font-size:\s*1rem/s);
  assert.match(css, /\.deployment-prompt textarea\s*\{[^}]*width:\s*100%[^}]*overflow-wrap:\s*anywhere/s);
  assert.doesNotMatch(css, /\.template-start\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.85fr\)/s);
  assert.doesNotMatch(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.template-start\s*\{[^}]*padding:\s*4rem/s);
  assert.match(css, /\.public-nav-inner\s*\{[^}]*min-height:\s*60px[^}]*flex-wrap:\s*nowrap/s);
  assert.match(css, /\.public-nav-action\s*\{[^}]*min-height:\s*44px[^}]*white-space:\s*nowrap/s);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*3px/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /(?:linear|radial|conic)-gradient\s*\(/i);
});

function readPrompt(html) {
  const match = html.match(/<textarea(?=[^>]+id="deployment-prompt")[^>]*>([\s\S]*?)<\/textarea>/i);
  assert.ok(match, "unconfigured page must render the deployment prompt textarea");
  return match[1];
}

function normalizeVisibleText(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
