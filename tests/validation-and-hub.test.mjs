import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  fetchApp,
  makeEnv,
  mutationHeaders,
  responseJson,
  validProfileInput,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";
const retiredOriginCanary = "https://retired-hub-origin-canary.example";
const retiredCredentialCanary = "RETIRED_HUB_CREDENTIAL_MUST_NEVER_ESCAPE";

test("profile writes normalize canonical/public URLs and persist only validated fields", async () => {
  const db = new FakeD1({ profile: null });
  const response = await fetchApp("/api/private/profile", {
    env: makeEnv({ db, ownerEmail }),
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validProfileInput({
      displayName: "  Normalized account  ",
      location: "  Helsinki  ",
      website: "HTTP://Example.COM/about?q=public#section",
      externalLinks: [
        { label: "  Documentation  ", url: "https://EXAMPLE.com/docs" },
      ],
      canonicalUrl: "https://CANONICAL.Example/account///",
      accentColor: "#AABBCC",
      density: "compact",
      hidePoweredBy: true,
    })),
  });

  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(db.profile.display_name, "Normalized account");
  assert.equal(db.profile.location, "Helsinki");
  assert.equal(db.profile.website, "http://example.com/about?q=public#section");
  assert.deepEqual(JSON.parse(db.profile.external_links_json), [
    { label: "Documentation", url: "https://example.com/docs" },
  ]);
  assert.equal(db.profile.accent_color, "#aabbcc");
  assert.equal(db.profile.density, "compact");
  assert.equal(db.profile.hide_powered_by, 1);
  assert.equal(db.profile.canonical_url, "https://canonical.example/account");

  const publicProfile = (await responseJson(await fetchApp("/api/v1/site", {
    env: makeEnv({ db, ownerEmail }),
  }))).data;
  assert.equal(publicProfile.canonicalUrl, "https://canonical.example/account");
  assert.equal(publicProfile.presentation.showPoweredBy, false);
});

test("category-neutral profile writes keep the smallest protocol 1.0 compatibility value", async (t) => {
  await t.test("new profiles store other even when a legacy caller supplies person", async () => {
    const db = new FakeD1({ profile: null });
    const response = await fetchApp("/api/private/profile", {
      env: makeEnv({ db, ownerEmail }),
      method: "PUT",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validProfileInput({
        accountType: "person",
        displayName: "Category-neutral presence",
      })),
    });

    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.equal(db.profile.display_name, "Category-neutral presence");
    assert.equal(db.profile.account_type, "other");
  });

  await t.test("legacy profile updates preserve their stored value", async () => {
    const db = new FakeD1({ profile: {
      display_name: "Legacy project",
      account_type: "project",
      short_description: "Existing public identity.",
      introduction: "A legacy profile that remains compatible.",
      location: null,
      website: null,
      external_links_json: "[]",
      canonical_url: "https://account.example",
      accent_color: "#31554d",
      density: "comfortable",
      hide_powered_by: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    } });
    const response = await fetchApp("/api/private/profile", {
      env: makeEnv({ db, ownerEmail }),
      method: "PUT",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validProfileInput({
        accountType: "person",
        displayName: "Updated legacy project",
      })),
    });

    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.equal(db.profile.display_name, "Updated legacy project");
    assert.equal(db.profile.account_type, "project");
  });
});

test("profile validation rejects malformed identity, canonical URL, links, and presentation", async (t) => {
  const cases = [
    ["required public identity", {
      displayName: "",
      accountType: "unsupported",
      shortDescription: "",
      introduction: "",
    }, ["displayName", "shortDescription", "introduction"]],
    ["canonical URL must be credential-free HTTPS without query or fragment", {
      canonicalUrl: "https://user:pass@example.com/account?secret=yes#fragment",
    }, ["canonicalUrl"]],
    ["canonical URL rejects HTTP", {
      canonicalUrl: "http://example.com",
    }, ["canonicalUrl"]],
    ["website rejects non-public schemes", {
      website: "javascript:alert(1)",
    }, ["website"]],
    ["external link rejects credentials", {
      externalLinks: [{ label: "Private", url: "https://user:pass@example.com/" }],
    }, ["externalLinks.0.url"]],
    ["external link requires a bounded label", {
      externalLinks: [{ label: "", url: "https://example.com/" }],
    }, ["externalLinks.0.label"]],
    ["external links are deliberately capped", {
      externalLinks: Array.from({ length: 9 }, (_, index) => ({
        label: `Link ${index}`,
        url: `https://example.com/${index}`,
      })),
    }, ["externalLinks"]],
    ["presentation values are constrained", {
      accentColor: "red",
      density: "spacious",
    }, ["accentColor", "density"]],
  ];

  for (const [label, overrides, expectedIssues] of cases) {
    await t.test(label, async () => {
      const db = new FakeD1();
      const response = await fetchApp("/api/private/profile", {
        env: makeEnv({ db, ownerEmail }),
        method: "PUT",
        headers: mutationHeaders(ownerEmail),
        body: JSON.stringify(validProfileInput(overrides)),
      });
      assert.equal(response.status, 400);
      const body = await responseJson(response);
      assert.equal(body.error, "The submitted values are invalid.");
      for (const issue of expectedIssues) assert.equal(typeof body.details[issue], "string");
      assert.equal("accountType" in body.details, false);
      assert.equal(db.mutations.length, 0);
    });
  }
});

test("entry validation keeps the single flexible model bounded", async (t) => {
  const cases = [
    ["unsupported kind", { kind: "video", body: "Body" }, "entryKind", "Choose a valid update kind."],
    ["missing body", { kind: "note", body: "" }, "body", undefined],
    ["link destination required", { kind: "link", body: "Body", destinationUrl: "" }, "destinationUrl", "A link update needs a destination URL."],
    ["destination scheme restricted", { kind: "link", body: "Body", destinationUrl: "file:///etc/passwd" }, "destinationUrl", undefined],
    ["title bounded", { kind: "article", body: "Body", title: "x".repeat(201) }, "title", undefined],
  ];

  for (const [label, input, issue, expectedMessage] of cases) {
    await t.test(label, async () => {
      const db = new FakeD1();
      const response = await fetchApp("/api/private/entries", {
        env: makeEnv({ db, ownerEmail }),
        method: "POST",
        headers: mutationHeaders(ownerEmail),
        body: JSON.stringify(input),
      });
      assert.equal(response.status, 400);
      const body = await responseJson(response);
      assert.equal(typeof body.details[issue], "string");
      if (expectedMessage) assert.equal(body.details[issue], expectedMessage);
      assert.equal(db.mutations.length, 0);
    });
  }
});

test("retired Hub surfaces are identical 404s and never make an outbound request", async (t) => {
  const contexts = [
    ["signed out", makeEnv({ ownerEmail }), {}],
    ["owner", makeEnv({ ownerEmail }), mutationHeaders(ownerEmail)],
    ["non-owner", makeEnv({ ownerEmail }), mutationHeaders("other@example.com")],
    ["missing owner", makeEnv(), mutationHeaders(ownerEmail)],
  ];
  const variants = [
    ["owner GET", "/owner/hub?destination=https%3A%2F%2Fattacker.example", "GET", undefined],
    ["owner POST", "/owner/hub?destination=https%3A%2F%2Fattacker.example", "POST", { destination: "https://attacker.example" }],
    ["private GET", "/api/private/hub/test?destination=https%3A%2F%2Fattacker.example", "GET", undefined],
    ["private POST", "/api/private/hub/test?destination=https%3A%2F%2Fattacker.example", "POST", { destination: "https://attacker.example" }],
  ];
  const originalFetch = globalThis.fetch;
  const originalConsole = Object.fromEntries(
    ["log", "info", "warn", "error"].map((level) => [level, console[level]]),
  );
  const calls = [];
  const logs = [];
  globalThis.fetch = async (...args) => {
    calls.push(args);
    throw new Error("A retired Hub route must never make an outbound request.");
  };
  for (const level of Object.keys(originalConsole)) {
    console[level] = (...args) => logs.push([level, ...args.map(String)]);
  }

  try {
    let baseline;
    for (const [label, baseEnv, identityHeaders] of contexts) {
      await t.test(label, async () => {
        const env = {
          ...baseEnv,
          AITTA_SOCIAL_HUB_URL: retiredOriginCanary,
          AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL: retiredCredentialCanary,
        };
        const projections = [];
        for (const [variant, path, method, body] of variants) {
          const response = await fetchApp(path, {
            env,
            method,
            headers: {
              accept: "text/html",
              ...identityHeaders,
              ...(body === undefined ? {} : { "content-type": "application/json" }),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          });
          const projection = {
            variant,
            status: response.status,
            contentType: response.headers.get("content-type"),
            location: response.headers.get("location"),
            cacheControl: response.headers.get("cache-control"),
            body: await response.text(),
          };
          assert.equal(projection.status, 404);
          assert.equal(projection.location, null);
          const serialized = JSON.stringify(projection);
          assert.doesNotMatch(serialized, /retired-hub-origin-canary/i);
          assert.doesNotMatch(serialized, /RETIRED_HUB_CREDENTIAL/i);
          assert.doesNotMatch(serialized, /Provisional Hub setup|Hub probe|deployment credential/i);
          projections.push(projection);
        }
        if (baseline === undefined) baseline = projections;
        else assert.deepEqual(projections, baseline);
      });
    }
    assert.equal(calls.length, 0);
    const serializedLogs = JSON.stringify(logs);
    assert.doesNotMatch(serializedLogs, /retired-hub-origin-canary/i);
    assert.doesNotMatch(serializedLogs, /RETIRED_HUB_CREDENTIAL/i);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [level, method] of Object.entries(originalConsole)) console[level] = method;
  }
});

test("public reads and the protocol 1.0 challenge remain Hub-independent", async () => {
  const challenge = "PUBLIC_CHALLENGE_REMAINS_PROTOCOL_1_0";
  const env = {
    ...makeEnv({ hubChallenge: challenge }),
    AITTA_SOCIAL_HUB_URL: retiredOriginCanary,
    AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL: retiredCredentialCanary,
  };
  const originalFetch = globalThis.fetch;
  const originalConsole = Object.fromEntries(
    ["log", "info", "warn", "error"].map((level) => [level, console[level]]),
  );
  const logs = [];
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("Public reads must not contact Hub.");
  };
  for (const level of Object.keys(originalConsole)) {
    console[level] = (...args) => logs.push([level, ...args.map(String)]);
  }

  try {
    const responses = await Promise.all([
      fetchApp("/", { env, headers: { accept: "text/html" } }),
      fetchApp("/api/v1/site", { env }),
      fetchApp("/.well-known/aitta-social.json", { env }),
    ]);
    assert.deepEqual(responses.map(({ status }) => status), [200, 200, 200]);
    const bodies = await Promise.all(responses.map((response) => response.text()));
    const [html, site, manifest] = bodies;
    for (const [index, body] of bodies.entries()) {
      const serialized = `${JSON.stringify([...responses[index].headers])}\n${body}`;
      assert.doesNotMatch(serialized, /retired-hub-origin-canary/i);
      assert.doesNotMatch(serialized, /RETIRED_HUB_CREDENTIAL/i);
    }
    assert.doesNotMatch(html, new RegExp(challenge));
    assert.doesNotMatch(site, new RegExp(challenge));
    assert.equal(JSON.parse(manifest).hubVerificationChallenge, challenge);
    assert.equal(calls, 0);
    const serializedLogs = JSON.stringify(logs);
    assert.doesNotMatch(serializedLogs, /retired-hub-origin-canary/i);
    assert.doesNotMatch(serializedLogs, /RETIRED_HUB_CREDENTIAL/i);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [level, method] of Object.entries(originalConsole)) console[level] = method;
  }
});

test("retired Hub implementation and identifiers are absent from current build output", async () => {
  for (const path of [
    "../lib/hub.ts",
    "../app/api/private/hub/test/route.ts",
    "../app/owner/hub/page.tsx",
    "../app/owner/hub/HubTest.tsx",
  ]) {
    await assert.rejects(readFile(new URL(path, import.meta.url), "utf8"), { code: "ENOENT" });
  }

  const sources = await Promise.all([
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../AGENTS.md", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../lib/runtime.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/_components/OwnerShell.tsx", import.meta.url), "utf8"),
    readTree(new URL("../app/", import.meta.url)),
    readTree(new URL("../lib/", import.meta.url)),
    ...[
      "deployment.md",
      "local-development.md",
      "presentation.md",
      "privacy.md",
      "protocol.md",
      "security.md",
    ].map((path) => readFile(new URL(`../docs/${path}`, import.meta.url), "utf8")),
    readTree(new URL("../dist/client/", import.meta.url)),
    readTree(new URL("../dist/server/", import.meta.url)),
  ]);
  const currentOutput = sources.join("\n");
  assert.doesNotMatch(
    currentOutput,
    /AITTA_SOCIAL_HUB_URL|AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL|deploymentCredential|\/api\/private\/hub\/test|\/owner\/hub|HubTest|Provisional Hub setup/,
  );
  assert.doesNotMatch(currentOutput, /retired-hub-origin-canary|RETIRED_HUB_CREDENTIAL/i);
});

async function readTree(root) {
  const contents = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const url = new URL(entry.name, root);
    if (entry.isDirectory()) {
      contents.push(await readTree(new URL(`${entry.name}/`, root)));
    } else {
      try {
        contents.push(await readFile(url, "utf8"));
      } catch {
        // Binary fonts and other non-text assets have no executable route surface.
      }
    }
  }
  return contents.join("\n");
}
