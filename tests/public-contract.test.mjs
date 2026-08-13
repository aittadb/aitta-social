import assert from "node:assert/strict";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  profileRow,
  responseJson,
} from "./helpers/worker-harness.mjs";

const ownerCanary = "owner-private-canary@example.test";

test("signed-out visitors receive the public presence HTML and only published content", async () => {
  const db = new FakeD1({
    profile: profileRow({ display_name: "Public Ada" }),
    entries: [
      entryRow({ id: "public-entry", title: "Visible entry", body: "PUBLIC_BODY_CANARY" }),
      entryRow({
        id: "draft-entry",
        title: "DRAFT_TITLE_PRIVATE_CANARY",
        body: "DRAFT_BODY_PRIVATE_CANARY",
        state: "draft",
        published_at: null,
      }),
    ],
  });
  const response = await fetchApp("/", {
    env: makeEnv({
      db,
      ownerEmail: ownerCanary,
    }),
    headers: { accept: "text/html" },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Public Ada/);
  assert.match(html, /Visible entry/);
  assert.match(html, /PUBLIC_BODY_CANARY/);
  assert.match(html, /aria-label="Manage Aitta as owner — sign in with ChatGPT for local sole-owner administration"[^>]*>Manage<\/a>/);
  assert.match(html, /\/signin-with-chatgpt\?return_to=%2Fowner/);
  assert.doesNotMatch(html, /Owner access|>Sign in<\/a>/);
  assert.doesNotMatch(html, /DRAFT_TITLE_PRIVATE_CANARY|DRAFT_BODY_PRIVATE_CANARY/);
  assert.doesNotMatch(html, new RegExp(ownerCanary, "i"));
});

test("a presence with no updates still has an intentional public empty state", async () => {
  const response = await fetchApp("/", {
    env: makeEnv({ db: new FakeD1({ entries: [] }) }),
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Ada Account/);
  assert.match(html, /No published updates yet/i);
  assert.match(html, /This Aitta already stands on its own/i);
});

test("public HTML is category-neutral while protocol 1.0 retains a legacy accountType", async () => {
  const env = makeEnv({
    db: new FakeD1({
      profile: profileRow({
        display_name: "Legacy organization",
        account_type: "company",
      }),
    }),
    canonicalUrl: "https://canonical.example/presence",
  });

  const htmlResponse = await fetchApp("/", {
    env,
    headers: { accept: "text/html" },
  });
  assert.equal(htmlResponse.status, 200);
  const html = await htmlResponse.text();
  assert.match(html, /class="presence-identity"/i);
  assert.doesNotMatch(html, />Public presence</i);
  assert.doesNotMatch(html, />Company presence</i);
  assert.doesNotMatch(html, />Presence type</i);

  const siteResponse = await fetchApp("/api/v1/site", { env });
  assert.equal(siteResponse.status, 200);
  const site = await responseJson(siteResponse);
  assert.equal(site.data.attributes.accountType, "company");

  const manifestResponse = await fetchApp("/.well-known/aitta-social.json", { env });
  assert.equal(manifestResponse.status, 200);
  const manifest = await responseJson(manifestResponse);
  assert.equal(manifest.accountType, "company");
  assert.equal(manifest.protocolVersion, "1.0");
});

test("all four entry kinds use the same public presence and update permalink model", async () => {
  const entries = [
    entryRow({ id: "kind-note", kind: "note", title: "A public note" }),
    entryRow({ id: "kind-article", kind: "article", title: "A public article" }),
    entryRow({
      id: "kind-link",
      kind: "link",
      title: "A public link",
      destination_url: "https://destination.example/resource",
    }),
    entryRow({ id: "kind-announcement", kind: "announcement", title: "A public announcement" }),
  ];
  const env = makeEnv({
    db: new FakeD1({ entries }),
    canonicalUrl: "https://canonical.example/account",
  });

  const accountResponse = await fetchApp("/", {
    env,
    headers: { accept: "text/html" },
  });
  assert.equal(accountResponse.status, 200);
  const accountHtml = await accountResponse.text();
  assert.match(accountHtml, /<ol class="update-stream">/i);

  for (const entry of entries) {
    assert.match(accountHtml, new RegExp(entry.title));

    const permalinkResponse = await fetchApp(`/entries/${entry.id}`, {
      env,
      headers: { accept: "text/html" },
    });
    assert.equal(permalinkResponse.status, 200);
    const permalinkHtml = await permalinkResponse.text();
    assert.match(permalinkHtml, new RegExp(entry.title));
    if (entry.kind === "note") {
      assert.match(permalinkHtml, /<h1 class="visually-hidden">Update from Ada Account<\/h1>/i);
      assert.doesNotMatch(permalinkHtml, /<span class="update-kind">Note<\/span>/i);
    } else {
      const kind = `${entry.kind.charAt(0).toUpperCase()}${entry.kind.slice(1)}`;
      assert.match(permalinkHtml, new RegExp(`>${kind}<`));
    }

    const apiResponse = await fetchApp(`/api/v1/entries/${entry.id}`, { env });
    assert.equal(apiResponse.status, 200);
    const api = await responseJson(apiResponse);
    assert.equal(api.data.attributes.kind, entry.kind);
    assert.equal(api.data.id, entry.id);
  }

  assert.match(accountHtml, /<span>Destination<\/span>/);
  assert.match(accountHtml, /https:\/\/destination\.example\/resource/);
  assert.match(accountHtml, /href="https:\/\/destination\.example\/resource" rel="noopener noreferrer"/);
  assert.doesNotMatch(accountHtml, /Read update|Open destination|entry-number|entry-card/i);
});

test("published permalinks render while drafts are indistinguishable from unknown entries", async () => {
  const db = new FakeD1({
    entries: [
      entryRow({ id: "public-entry", title: "Public permalink title" }),
      entryRow({ id: "private-entry", state: "draft", published_at: null }),
    ],
  });
  const env = makeEnv({ db });

  const publicResponse = await fetchApp("/entries/public-entry", {
    env,
    headers: { accept: "text/html" },
  });
  assert.equal(publicResponse.status, 200);
  const publicHtml = await publicResponse.text();
  assert.match(publicHtml, /Public permalink title/);
  assert.match(publicHtml, /View as JSON/);

  const draftApi = await fetchApp("/api/v1/entries/private-entry", { env });
  const missingApi = await fetchApp("/api/v1/entries/unknown-entry", { env });
  assert.equal(draftApi.status, 404);
  assert.equal(missingApi.status, 404);
  assert.deepEqual(await responseJson(draftApi), await responseJson(missingApi));

  const draftHtml = await fetchApp("/entries/private-entry", {
    env,
    headers: { accept: "text/html" },
  });
  const missingHtml = await fetchApp("/entries/unknown-entry", {
    env,
    headers: { accept: "text/html" },
  });
  assert.equal(draftHtml.status, 404);
  assert.equal(missingHtml.status, 404);
  const draftNotFoundHtml = await draftHtml.text();
  const missingNotFoundHtml = await missingHtml.text();
  for (const html of [draftNotFoundHtml, missingNotFoundHtml]) {
    assert.match(html, /This update is not public/);
    assert.doesNotMatch(html, /First public note|A useful public message/);
  }
});

test("site API uses an explicit public allowlist and canonical configured links", async () => {
  const profile = profileRow({
    private_canary: "PROFILE_ROW_SECRET",
    owner_email: ownerCanary,
    created_at: "PRIVATE_CREATED_CANARY",
    updated_at: "PRIVATE_UPDATED_CANARY",
  });
  const response = await fetchApp("/api/v1/site", {
    origin: "https://untrusted-request-host.example",
    env: makeEnv({
      db: new FakeD1({ profile }),
      ownerEmail: ownerCanary,
      canonicalUrl: "https://CANONICAL.example/account///",
    }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "public, max-age=60");
  const body = await responseJson(response);

  assert.deepEqual(Object.keys(body).sort(), ["actions", "data", "links"]);
  assert.deepEqual(Object.keys(body.data).sort(), ["attributes", "id", "type"]);
  assert.deepEqual(Object.keys(body.data.attributes).sort(), [
    "accountType",
    "canonicalUrl",
    "displayName",
    "externalLinks",
    "introduction",
    "location",
    "presentation",
    "shortDescription",
    "website",
  ]);
  assert.equal(body.data.id, "profile");
  assert.equal(body.data.type, "profile");
  assert.equal(body.data.attributes.canonicalUrl, "https://canonical.example/account");
  assert.deepEqual(body.links, [
    {
      rel: "self",
      href: "https://canonical.example/account/api/v1/site",
      mediaType: "application/json",
    },
    {
      rel: "profile",
      href: "https://canonical.example/account/api/v1/schema",
      mediaType: "application/json",
    },
    {
      rel: "social.aitta.profile",
      href: "https://canonical.example/account",
      mediaType: "text/html",
    },
  ]);
  assert.deepEqual(body.actions, []);

  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /PROFILE_ROW_SECRET|PRIVATE_CREATED_CANARY|PRIVATE_UPDATED_CANARY/);
  assert.doesNotMatch(serialized, new RegExp(ownerCanary, "i"));
  assert.doesNotMatch(serialized, /untrusted-request-host/i);
});

test("discovery manifest has a stable allowlist and exposes only an explicitly configured challenge", async (t) => {
  const baseOptions = {
    db: new FakeD1({ profile: profileRow({ private_canary: "MANIFEST_PROFILE_SECRET" }) }),
    ownerEmail: ownerCanary,
    canonicalUrl: "https://canonical.example/account",
  };

  await t.test("challenge absent", async () => {
    const response = await fetchApp("/.well-known/aitta-social.json", {
      env: makeEnv(baseOptions),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "public, max-age=60");
    const body = await responseJson(response);
    assert.deepEqual(Object.keys(body).sort(), [
      "accountType",
      "canonicalUrl",
      "endpoints",
      "protocol",
      "protocolVersion",
      "software",
    ]);
    assert.equal(body.protocol, "aitta-social");
    assert.equal(body.protocolVersion, "1.0");
    assert.deepEqual(body.software, { name: "AittaSocial", version: "0.1.0" });
    assert.deepEqual(body.endpoints, {
      api: "https://canonical.example/account/api/v1",
      profile: "https://canonical.example/account/api/v1/site",
      entries: "https://canonical.example/account/api/v1/entries",
      entryTemplate: "https://canonical.example/account/api/v1/entries/{id}",
    });
    assert.equal("hubVerificationChallenge" in body, false);
    const serialized = JSON.stringify(body);
    assert.doesNotMatch(serialized, /MANIFEST_PROFILE_SECRET/);
    assert.doesNotMatch(serialized, new RegExp(ownerCanary, "i"));
  });

  await t.test("challenge present without other protected settings", async () => {
    const response = await fetchApp("/.well-known/aitta-social.json", {
      env: makeEnv({ ...baseOptions, hubChallenge: "challenge-public-proof" }),
    });
    const body = await responseJson(response);
    assert.equal(body.hubVerificationChallenge, "challenge-public-proof");
  });
});

test("entry collection is published-only, deterministically ordered, and deterministically paginated", async () => {
  const sameTime = "2026-07-01T10:00:00.000Z";
  const entries = [
    entryRow({ id: "alpha", title: "Alpha", published_at: sameTime }),
    entryRow({ id: "charlie", title: "Charlie", published_at: sameTime }),
    entryRow({ id: "bravo", title: "Bravo", published_at: sameTime }),
    entryRow({ id: "newest", title: "Newest", published_at: "2026-08-01T10:00:00.000Z" }),
    entryRow({ id: "oldest", title: "Oldest", published_at: "2026-01-01T10:00:00.000Z" }),
    entryRow({
      id: "draft-private",
      title: "DRAFT_COLLECTION_CANARY",
      body: "DRAFT_COLLECTION_BODY_CANARY",
      state: "draft",
      published_at: null,
    }),
  ];
  const env = makeEnv({
    db: new FakeD1({ entries }),
    canonicalUrl: "https://canonical.example/account",
  });

  const firstResponse = await fetchApp("/api/v1/entries?page=1&pageSize=2", { env });
  assert.equal(firstResponse.status, 200);
  assert.equal(firstResponse.headers.get("cache-control"), "public, max-age=30");
  const first = await responseJson(firstResponse);
  assert.deepEqual(first.data.map(({ id }) => id), ["newest", "charlie"]);
  assert.deepEqual(first.pagination, { page: 1, pageSize: 2 });
  assert.equal(first.links.find(({ rel }) => rel === "self")?.href,
    "https://canonical.example/account/api/v1/entries?page=1&pageSize=2");
  assert.equal(first.links.find(({ rel }) => rel === "next")?.href,
    "https://canonical.example/account/api/v1/entries?page=2&pageSize=2");
  assert.equal(first.links.find(({ rel }) => rel === "last")?.href,
    "https://canonical.example/account/api/v1/entries?page=3&pageSize=2");
  assert.deepEqual(first.actions, []);

  const second = await responseJson(await fetchApp("/api/v1/entries?page=2&pageSize=2", { env }));
  assert.deepEqual(second.data.map(({ id }) => id), ["bravo", "alpha"]);
  assert.deepEqual(second.pagination, { page: 2, pageSize: 2 });
  assert.equal(second.links.find(({ rel }) => rel === "previous")?.href,
    "https://canonical.example/account/api/v1/entries?page=1&pageSize=2");
  assert.equal(second.links.find(({ rel }) => rel === "next")?.href,
    "https://canonical.example/account/api/v1/entries?page=3&pageSize=2");

  const third = await responseJson(await fetchApp("/api/v1/entries?page=3&pageSize=2", { env }));
  assert.deepEqual(third.data.map(({ id }) => id), ["oldest"]);
  assert.deepEqual(third.pagination, { page: 3, pageSize: 2 });
  assert.equal(third.links.some(({ rel }) => rel === "next"), false);

  for (const resource of [...first.data, ...second.data, ...third.data]) {
    assert.deepEqual(Object.keys(resource).sort(), [
      "attributes",
      "id",
      "type",
    ]);
    assert.equal(resource.type, "entry");
    assert.equal("state" in resource.attributes, false);
    assert.equal("private_canary" in resource, false);
    assert.equal("private_canary" in resource.attributes, false);
  }
  assert.doesNotMatch(JSON.stringify([first, second, third]), /DRAFT_COLLECTION_CANARY|ENTRY_PRIVATE_CANARY/);
});

test("public APIs reject invalid pagination and report unavailable public resources safely", async (t) => {
  const env = makeEnv({ db: new FakeD1() });
  for (const query of ["page=0", "page=-1", "page=1.5", "page=x", "pageSize=0", "pageSize=51"]) {
    await t.test(query, async () => {
      const response = await fetchApp(`/api/v1/entries?${query}`, { env });
      assert.equal(response.status, 400);
      assert.deepEqual(await responseJson(response), {
        data: null,
        error: {
          code: "invalid_pagination",
          message: "page must be at least 1 and pageSize must be between 1 and 50.",
        },
        links: [],
      });
    });
  }

  await t.test("profile not configured", async () => {
    const response = await fetchApp("/api/v1/site", {
      env: makeEnv({ db: new FakeD1({ profile: null }) }),
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await responseJson(response), {
      data: null,
      error: {
        code: "profile_not_configured",
        message: "The Aitta profile has not been configured.",
      },
      links: [],
    });
  });

  await t.test("canonical URL not configured", async () => {
    const response = await fetchApp("/api/v1/site", {
      env: makeEnv({ db: new FakeD1({ profile: profileRow({ canonical_url: "not a URL" }) }) }),
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await responseJson(response), {
      data: null,
      error: {
        code: "canonical_url_unconfigured",
        message: "Canonical URL is not configured.",
      },
      links: [],
    });
  });
});
