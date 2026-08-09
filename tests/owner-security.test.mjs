import assert from "node:assert/strict";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  mutationHeaders,
  ownerHeaders,
  responseJson,
  validEntryInput,
  validProfileInput,
} from "./helpers/worker-harness.mjs";

const ownerEmail = "owner@example.com";

test("owner matching is normalized and remains a sole-owner server decision", async (t) => {
  await t.test("case and surrounding whitespace are normalized", async () => {
    const response = await fetchApp("/api/private/hub/test", {
      env: makeEnv({ ownerEmail: "  OWNER@Example.COM  " }),
      method: "POST",
      headers: {
        ...ownerHeaders("owner@example.com"),
        origin: "https://account.example",
      },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await responseJson(response), {
      data: {
        status: "unavailable",
        message: "Add the Hub URL and deployment credential in protected runtime settings.",
      },
    });
  });

  await t.test("a different signed-in identity receives no administration", async () => {
    const response = await fetchApp("/api/private/hub/test", {
      env: makeEnv({ ownerEmail }),
      method: "POST",
      headers: {
        ...ownerHeaders("someone-else@example.com"),
        origin: "https://account.example",
      },
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await responseJson(response), {
      error: "Administrative access denied.",
    });
  });

  await t.test("a signed-out visitor is challenged without leaking the owner", async () => {
    const response = await fetchApp("/api/private/hub/test", {
      env: makeEnv({ ownerEmail }),
      method: "POST",
      headers: { origin: "https://account.example" },
    });
    assert.equal(response.status, 401);
    const source = JSON.stringify(await responseJson(response));
    assert.match(source, /Authentication required/);
    assert.doesNotMatch(source, /owner@example\.com/i);
  });

  for (const [label, configured] of [
    ["missing", undefined],
    ["invalid", "not-an-email"],
  ]) {
    await t.test(`${label} owner configuration safely disables administration`, async () => {
      const response = await fetchApp("/api/private/hub/test", {
        env: makeEnv({ ownerEmail: configured }),
        method: "POST",
        headers: {
          ...ownerHeaders(ownerEmail),
          origin: "https://account.example",
        },
      });
      assert.equal(response.status, 503);
      const source = JSON.stringify(await responseJson(response));
      assert.match(source, /not configured/i);
      assert.doesNotMatch(source, /owner@example\.com|not-an-email/i);
    });
  }
});

test("the same-origin gate runs before identity and database mutation", async (t) => {
  const rejected = [
    {
      label: "cross-origin Origin header",
      headers: { ...ownerHeaders(ownerEmail), origin: "https://attacker.example" },
    },
    {
      label: "missing browser provenance",
      headers: ownerHeaders(ownerEmail),
    },
    {
      label: "malformed Origin header",
      headers: { ...ownerHeaders(ownerEmail), origin: "not a URL" },
    },
  ];

  for (const { label, headers } of rejected) {
    await t.test(label, async () => {
      const db = new FakeD1();
      const response = await fetchApp("/api/private/entries", {
        env: makeEnv({ db, ownerEmail }),
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify(validEntryInput()),
      });
      assert.equal(response.status, 403);
      assert.deepEqual(await responseJson(response), {
        error: "Same-origin request required.",
      });
      assert.equal(db.mutations.length, 0);
    });
  }

  await t.test("Sec-Fetch-Site explicitly permits a same-origin request without Origin", async () => {
    const response = await fetchApp("/api/private/hub/test", {
      env: makeEnv({ ownerEmail }),
      method: "POST",
      headers: { ...ownerHeaders(ownerEmail), "sec-fetch-site": "same-origin" },
    });
    assert.equal(response.status, 200);
  });
});

test("every private mutation route independently rejects a non-owner before touching D1", async (t) => {
  const routes = [
    ["save profile", "PUT", "/api/private/profile", validProfileInput()],
    ["create entry", "POST", "/api/private/entries", validEntryInput()],
    ["edit entry", "PUT", "/api/private/entries/entry-1", validEntryInput()],
    ["delete entry", "DELETE", "/api/private/entries/entry-1", undefined],
    ["change publication state", "PUT", "/api/private/entries/entry-1/state", { state: "published" }],
    ["test Hub", "POST", "/api/private/hub/test", undefined],
  ];

  for (const [label, method, path, payload] of routes) {
    await t.test(label, async () => {
      const db = new FakeD1({ entries: [entryRow({ state: "draft", published_at: null })] });
      const response = await fetchApp(path, {
        env: makeEnv({ db, ownerEmail }),
        method,
        headers: mutationHeaders("other@example.com"),
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      });
      assert.equal(response.status, 403);
      assert.deepEqual(await responseJson(response), {
        error: "Administrative access denied.",
      });
      assert.equal(db.mutations.length, 0);
    });
  }
});

test("authorized draft lifecycle stays private until publish and supports every POC action", async () => {
  const db = new FakeD1();
  const env = makeEnv({ db, ownerEmail });

  const createdResponse = await fetchApp("/api/private/entries", {
    env,
    method: "POST",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput()),
  });
  assert.equal(createdResponse.status, 201);
  const created = (await responseJson(createdResponse)).data;
  assert.equal(created.state, "draft");
  assert.match(created.id, /^[0-9a-f-]{36}$/i);

  const hiddenDetail = await fetchApp(`/api/v1/entries/${created.id}`, { env });
  assert.equal(hiddenDetail.status, 404);
  const hiddenCollection = await responseJson(await fetchApp("/api/v1/entries", { env }));
  assert.deepEqual(hiddenCollection.data, []);

  const editedResponse = await fetchApp(`/api/private/entries/${created.id}`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify(validEntryInput({
      kind: "announcement",
      title: "Ready to publish",
      body: "The reviewed public announcement.",
    })),
  });
  assert.equal(editedResponse.status, 200);
  assert.equal((await responseJson(editedResponse)).data.title, "Ready to publish");

  const publishedResponse = await fetchApp(`/api/private/entries/${created.id}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "published" }),
  });
  assert.equal(publishedResponse.status, 200);
  const published = (await responseJson(publishedResponse)).data;
  assert.equal(published.state, "published");
  assert.ok(published.publishedAt);

  const visibleDetail = await fetchApp(`/api/v1/entries/${created.id}`, { env });
  assert.equal(visibleDetail.status, 200);
  const visibleResource = (await responseJson(visibleDetail)).data;
  assert.equal(visibleResource.title, "Ready to publish");
  assert.equal("state" in visibleResource, false);

  const unpublishResponse = await fetchApp(`/api/private/entries/${created.id}/state`, {
    env,
    method: "PUT",
    headers: mutationHeaders(ownerEmail),
    body: JSON.stringify({ state: "draft" }),
  });
  assert.equal(unpublishResponse.status, 200);
  assert.equal((await responseJson(unpublishResponse)).data.state, "draft");
  assert.equal((await fetchApp(`/api/v1/entries/${created.id}`, { env })).status, 404);

  const deleteResponse = await fetchApp(`/api/private/entries/${created.id}`, {
    env,
    method: "DELETE",
    headers: mutationHeaders(ownerEmail),
  });
  assert.equal(deleteResponse.status, 204);
  assert.equal(await deleteResponse.text(), "");
  assert.equal(db.entries.length, 0);

  for (const [method, path, body] of [
    ["PUT", `/api/private/entries/${created.id}`, JSON.stringify(validEntryInput())],
    ["PUT", `/api/private/entries/${created.id}/state`, JSON.stringify({ state: "published" })],
    ["DELETE", `/api/private/entries/${created.id}`, undefined],
  ]) {
    const missingResponse = await fetchApp(path, {
      env,
      method,
      headers: mutationHeaders(ownerEmail),
      ...(body === undefined ? {} : { body }),
    });
    assert.equal(missingResponse.status, 404);
    assert.deepEqual(await responseJson(missingResponse), { error: "Update not found." });
  }
});

test("write boundaries require JSON, bound request size, and valid entry state", async (t) => {
  const db = new FakeD1({ entries: [entryRow({ state: "draft", published_at: null })] });
  const env = makeEnv({ db, ownerEmail });

  await t.test("wrong media type", async () => {
    const response = await fetchApp("/api/private/entries", {
      env,
      method: "POST",
      headers: { ...ownerHeaders(ownerEmail), origin: "https://account.example", "content-type": "text/plain" },
      body: JSON.stringify(validEntryInput()),
    });
    assert.equal(response.status, 400);
    assert.match(JSON.stringify(await responseJson(response)), /Content-Type must be application\/json/);
  });

  await t.test("oversized request", async () => {
    const response = await fetchApp("/api/private/entries", {
      env,
      method: "POST",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify(validEntryInput({ body: "x".repeat(70 * 1024) })),
    });
    assert.equal(response.status, 400);
    assert.match(JSON.stringify(await responseJson(response)), /64 KiB/);
  });

  await t.test("unknown publication state", async () => {
    const response = await fetchApp("/api/private/entries/entry-1/state", {
      env,
      method: "PUT",
      headers: mutationHeaders(ownerEmail),
      body: JSON.stringify({ state: "scheduled" }),
    });
    assert.equal(response.status, 400);
    assert.match(JSON.stringify(await responseJson(response)), /draft or published/);
  });
});
