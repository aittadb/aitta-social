import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
const credential = "HUB_CREDENTIAL_MUST_STAY_SERVER_SIDE";

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

  assert.equal(response.status, 200);
  const profile = (await responseJson(response)).data;
  assert.equal(profile.displayName, "Normalized account");
  assert.equal(profile.location, "Helsinki");
  assert.equal(profile.website, "http://example.com/about?q=public#section");
  assert.deepEqual(profile.externalLinks, [
    { label: "Documentation", url: "https://example.com/docs" },
  ]);
  assert.equal(profile.canonicalUrl, "https://canonical.example/account");
  assert.equal(profile.accentColor, "#aabbcc");
  assert.equal(profile.density, "compact");
  assert.equal(profile.hidePoweredBy, true);
  assert.equal(db.profile.canonical_url, "https://canonical.example/account");

  const publicProfile = (await responseJson(await fetchApp("/api/v1/site", {
    env: makeEnv({ db, ownerEmail }),
  }))).data;
  assert.equal(publicProfile.canonicalUrl, "https://canonical.example/account");
  assert.equal(publicProfile.presentation.showPoweredBy, false);
});

test("profile validation rejects malformed identity, canonical URL, links, and presentation", async (t) => {
  const cases = [
    ["required public identity", {
      displayName: "",
      accountType: "unsupported",
      shortDescription: "",
      introduction: "",
    }, ["displayName", "accountType", "shortDescription", "introduction"]],
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
      assert.equal(db.mutations.length, 0);
    });
  }
});

test("entry validation keeps the single flexible model bounded", async (t) => {
  const cases = [
    ["unsupported kind", { kind: "video", body: "Body" }, "entryKind"],
    ["missing body", { kind: "note", body: "" }, "body"],
    ["link destination required", { kind: "link", body: "Body", destinationUrl: "" }, "destinationUrl"],
    ["destination scheme restricted", { kind: "link", body: "Body", destinationUrl: "file:///etc/passwd" }, "destinationUrl"],
    ["title bounded", { kind: "article", body: "Body", title: "x".repeat(201) }, "title"],
  ];

  for (const [label, input, issue] of cases) {
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
      assert.equal(db.mutations.length, 0);
    });
  }
});

test("Hub probe confines the credential to the configured HTTPS origin", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (target, init) => {
    calls.push({ target, init });
    return {
      ok: true,
      status: 200,
      text() {
        throw new Error("Hub response bodies must not be consumed");
      },
      json() {
        throw new Error("Hub response bodies must not be consumed");
      },
    };
  };

  try {
    const response = await fetchApp("/api/private/hub/test", {
      env: makeEnv({
        ownerEmail,
        hubUrl: "https://hub.example.test",
        deploymentCredential: credential,
      }),
      method: "POST",
      headers: { ...mutationHeaders(ownerEmail), "content-type": undefined },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await responseJson(response);
    assert.deepEqual(body, {
      data: {
        status: "connected",
        message: "The configured Hub accepted the probe.",
      },
    });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].target, "https://hub.example.test/");
    assert.equal(calls[0].init.method, "GET");
    assert.equal(calls[0].init.redirect, "manual");
    assert.equal(calls[0].init.headers.Accept, "application/json");
    assert.equal(calls[0].init.headers.Authorization, `Bearer ${credential}`);
    assert.ok(calls[0].init.signal instanceof AbortSignal);
    assert.doesNotMatch(JSON.stringify(body), new RegExp(credential));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Hub probe accepts an empty transport stream but no request content", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 200 });
  try {
    const response = await fetchApp("/api/private/hub/test", {
      env: makeEnv({
        ownerEmail,
        hubUrl: "https://hub.example.test",
        deploymentCredential: credential,
      }),
      method: "POST",
      headers: { ...mutationHeaders(ownerEmail), "content-type": undefined },
      body: new Uint8Array(),
    });
    assert.equal(response.status, 200);
    assert.equal((await responseJson(response)).data.status, "connected");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Hub destination cannot come from the browser and invalid configured destinations receive no credential", async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(null, { status: 200 });
  };

  try {
    await t.test("browser-supplied destination/body is rejected", async () => {
      const response = await fetchApp("/api/private/hub/test", {
        env: makeEnv({
          ownerEmail,
          hubUrl: "https://hub.example.test",
          deploymentCredential: credential,
        }),
        method: "POST",
        headers: mutationHeaders(ownerEmail),
        body: JSON.stringify({ destination: "https://attacker.example/collect" }),
      });
      assert.equal(response.status, 400);
      assert.deepEqual(await responseJson(response), {
        error: "This operation accepts no request body.",
      });
      assert.equal(calls, 0);
    });

    for (const invalidHubUrl of [
      "http://hub.example.test",
      "https://hub.example.test/probe",
      "https://hub.example.test/?next=https://attacker.example",
      "https://user:pass@hub.example.test",
      "https://hub.example.test/#fragment",
    ]) {
      await t.test(`rejects ${invalidHubUrl}`, async () => {
        const response = await fetchApp("/api/private/hub/test", {
          env: makeEnv({
            ownerEmail,
            hubUrl: invalidHubUrl,
            deploymentCredential: credential,
          }),
          method: "POST",
          headers: { ...mutationHeaders(ownerEmail), "content-type": undefined },
        });
        assert.equal(response.status, 200);
        const body = await responseJson(response);
        assert.equal(body.data.status, "unavailable");
        assert.equal(body.data.message, "The Hub URL must be a plain HTTPS origin.");
        assert.doesNotMatch(JSON.stringify(body), new RegExp(credential));
        assert.equal(calls, 0);
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Hub unavailability is coarse, secret-free, and cannot take public reads offline", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error(`network failure involving ${credential}`);
  };

  const env = makeEnv({
    ownerEmail,
    hubUrl: "https://hub.example.test",
    deploymentCredential: credential,
  });

  try {
    const probe = await fetchApp("/api/private/hub/test", {
      env,
      method: "POST",
      headers: { ...mutationHeaders(ownerEmail), "content-type": undefined },
    });
    assert.equal(probe.status, 200);
    const body = await responseJson(probe);
    assert.deepEqual(body, {
      data: {
        status: "unavailable",
        message: "The Hub could not be reached. Public account pages remain available.",
      },
    });
    assert.doesNotMatch(JSON.stringify(body), new RegExp(credential));

    const site = await fetchApp("/api/v1/site", { env });
    assert.equal(site.status, 200);
    assert.doesNotMatch(JSON.stringify(await responseJson(site)), new RegExp(credential));

    const account = await fetchApp("/", { env, headers: { accept: "text/html" } });
    assert.equal(account.status, 200);
    assert.doesNotMatch(await account.text(), new RegExp(credential));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Hub credential handling has no client or logging path", async () => {
  const [hubSource, routeSource, clientSource] = await Promise.all([
    readFile(new URL("../lib/hub.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/private/hub/test/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/hub/HubTest.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(hubSource, /Authorization:\s*`Bearer \$\{settings\.deploymentCredential\}`/);
  assert.match(hubSource, /redirect:\s*"manual"/);
  assert.match(hubSource, /AbortSignal\.timeout\(5000\)/);
  assert.doesNotMatch(`${hubSource}\n${routeSource}`, /console\s*\./);
  assert.doesNotMatch(
    clientSource,
    /AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL|deploymentCredential|Authorization|Bearer/i,
  );
  assert.doesNotMatch(routeSource, /request\.(?:json|text|formData)\s*\(/);
});
