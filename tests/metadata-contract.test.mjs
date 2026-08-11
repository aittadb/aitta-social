import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

import {
  FakeD1,
  entryRow,
  fetchApp,
  makeEnv,
  profileRow,
} from "./helpers/worker-harness.mjs";

const hostileOrigin = "https://hostile-request-host.example";
const hostileForwardedHost = "forwarded-host-private-canary.example";
const ownerCanary = "metadata-owner-private-canary@example.test";

test("populated presence metadata uses only public profile fields and configured canonical URL", async () => {
  const response = await fetchApp("/", {
    origin: hostileOrigin,
    headers: {
      accept: "text/html",
      "x-forwarded-host": hostileForwardedHost,
      "x-forwarded-proto": "http",
    },
    env: makeEnv({
      db: new FakeD1({
        profile: profileRow({
          display_name: "Ada <Partners> & Co",
          short_description: "Independent\n presence & public updates.",
          canonical_url: "https://profile-canonical.example/ignored",
          metadata_private_canary: "PROFILE_METADATA_PRIVATE_CANARY",
        }),
      }),
      ownerEmail: ownerCanary,
      canonicalUrl: "https://CANONICAL.example/presence///",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  const html = await response.text();

  assert.match(html, /<title>Ada &lt;Partners&gt; &amp; Co<\/title>/i);
  assert.match(
    html,
    /<meta name="description" content="Independent presence &amp; public updates\."\s*\/?>/i,
  );
  assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin"\s*\/?>/i);
  assert.match(html, /<meta property="og:title" content="Ada &lt;Partners&gt; &amp; Co"\s*\/?>/i);
  assert.match(html, /<meta property="og:description" content="Independent presence &amp; public updates\."\s*\/?>/i);
  assert.match(html, /<meta property="og:url" content="https:\/\/canonical\.example\/presence"\s*\/?>/i);
  assert.match(html, /<meta property="og:site_name" content="Ada &lt;Partners&gt; &amp; Co"\s*\/?>/i);
  assert.match(html, /<meta property="og:type" content="website"\s*\/?>/i);
  assert.match(html, /<meta name="twitter:card" content="summary"\s*\/?>/i);
  assert.match(html, /<link rel="canonical" href="https:\/\/canonical\.example\/presence"\s*\/?>/i);
  assert.match(html, /<meta name="robots" content="index, follow"\s*\/?>/i);
  assertNoImageMetadata(html);
  assertNoPrivateMetadata(html);
  assert.doesNotMatch(html, /<script[^>]*>Ada <Partners>/i);
});

test("unconfigured metadata is neutral, non-indexable, and independent of request or runtime hosts", async () => {
  const response = await fetchApp("/", {
    origin: hostileOrigin,
    headers: {
      accept: "text/html",
      "x-forwarded-host": hostileForwardedHost,
      "x-forwarded-proto": "http",
    },
    env: makeEnv({
      db: new FakeD1({ profile: null }),
      ownerEmail: ownerCanary,
      canonicalUrl: "https://runtime-canonical-without-profile.example",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  const html = await response.text();
  assert.match(html, /<title>Presence setup in progress<\/title>/i);
  assert.match(
    html,
    /<meta name="description" content="This independent presence is being prepared by its owner\."\s*\/?>/i,
  );
  assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/i);
  assert.doesNotMatch(html, /<link rel="canonical"/i);
  assert.doesNotMatch(html, /<meta property="og:url"/i);
  assertNoImageMetadata(html);
  assertNoPrivateMetadata(html);
  assert.doesNotMatch(html, /runtime-canonical-without-profile/i);
});

test("published update metadata has a stable presence canonical and excludes drafts and private fields", async () => {
  const response = await fetchApp("/entries/public-update", {
    origin: hostileOrigin,
    headers: {
      accept: "text/html",
      "x-forwarded-host": hostileForwardedHost,
    },
    env: makeEnv({
      db: new FakeD1({
        profile: profileRow({
          display_name: "North <Lab>",
          metadata_private_canary: "ENTRY_PROFILE_PRIVATE_CANARY",
        }),
        entries: [
          entryRow({
            id: "public-update",
            kind: "article",
            title: "A public & safe update",
            body: "A concise\nsharing description with <meaning> & context.",
            published_at: "2026-08-08T08:00:00.000Z",
            updated_at: "2026-08-09T09:00:00.000Z",
            metadata_private_canary: "PUBLIC_ROW_PRIVATE_CANARY",
          }),
          entryRow({
            id: "draft-update",
            title: "DRAFT_METADATA_TITLE_PRIVATE_CANARY",
            body: "DRAFT_METADATA_BODY_PRIVATE_CANARY",
            state: "draft",
            published_at: null,
          }),
        ],
      }),
      ownerEmail: ownerCanary,
      canonicalUrl: "https://canonical.example/presence",
    }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
  const html = await response.text();
  assert.match(html, /<title>A public &amp; safe update · North &lt;Lab&gt;<\/title>/i);
  assert.match(
    html,
    /<meta name="description" content="A concise sharing description with &lt;meaning&gt; &amp; context\."\s*\/?>/i,
  );
  assert.match(html, /<meta property="og:type" content="article"\s*\/?>/i);
  assert.match(html, /<meta property="article:published_time" content="2026-08-08T08:00:00\.000Z"\s*\/?>/i);
  assert.match(html, /<meta property="article:modified_time" content="2026-08-09T09:00:00\.000Z"\s*\/?>/i);
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/canonical\.example\/presence\/entries\/public-update"\s*\/?>/i,
  );
  assert.match(
    html,
    /<meta property="og:url" content="https:\/\/canonical\.example\/presence\/entries\/public-update"\s*\/?>/i,
  );
  assertNoImageMetadata(html);
  assertNoPrivateMetadata(html);
  assert.doesNotMatch(
    html,
    /ENTRY_PROFILE_PRIVATE_CANARY|PUBLIC_ROW_PRIVATE_CANARY|DRAFT_METADATA_(?:TITLE|BODY)_PRIVATE_CANARY/i,
  );
});

test("an update without a configured profile is not given indexable or canonical metadata", async () => {
  const response = await fetchApp("/entries/orphan-update", {
    origin: hostileOrigin,
    headers: { accept: "text/html", "x-forwarded-host": hostileForwardedHost },
    env: makeEnv({
      db: new FakeD1({
        profile: null,
        entries: [entryRow({ id: "orphan-update", title: "Orphan update" })],
      }),
      canonicalUrl: "https://runtime-canonical-without-profile.example",
    }),
  });

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<meta name="robots" content="noindex, nofollow"\s*\/?>/i);
  assert.doesNotMatch(html, /<link rel="canonical"/i);
  assert.doesNotMatch(html, /<meta property="og:url"/i);
  assert.doesNotMatch(html, /runtime-canonical-without-profile|hostile-request-host|forwarded-host/i);
});

test("non-article updates use website sharing semantics", async () => {
  const response = await fetchApp("/entries/note-update", {
    headers: { accept: "text/html" },
    env: makeEnv({
      db: new FakeD1({ entries: [entryRow({ id: "note-update", kind: "note" })] }),
      canonicalUrl: "https://canonical.example/presence",
    }),
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<meta property="og:type" content="website"\s*\/?>/i);
  assert.doesNotMatch(html, /property="article:(?:published|modified)_time"/i);
});

test("owner and unavailable HTML inherit only neutral non-indexable root metadata", async () => {
  const db = new FakeD1({
    profile: profileRow({ display_name: "Configured public presence" }),
    entries: [
      entryRow({
        id: "draft-update",
        title: "DRAFT_METADATA_TITLE_PRIVATE_CANARY",
        body: "DRAFT_METADATA_BODY_PRIVATE_CANARY",
        state: "draft",
        published_at: null,
      }),
    ],
  });
  const env = makeEnv({
    db,
    ownerEmail: "owner@example.com",
    canonicalUrl: "https://canonical.example/presence",
  });

  const ownerResponse = await fetchApp("/owner", {
    env,
    headers: {
      accept: "text/html",
      "oai-authenticated-user-id": "user:owner@example.com",
      "oai-authenticated-user-email": "owner@example.com",
    },
  });
  assert.equal(ownerResponse.status, 200);
  assert.equal(ownerResponse.headers.get("cache-control"), "no-store, must-revalidate");
  const ownerHtml = await ownerResponse.text();
  assert.match(ownerHtml, /<title>Independent presence<\/title>/i);
  assert.match(ownerHtml, /<meta name="robots" content="noindex, nofollow"\s*\/?>/i);
  assert.doesNotMatch(ownerHtml, /<link rel="canonical"|property="og:|name="twitter:/i);

  for (const id of ["draft-update", "missing-update"]) {
    const response = await fetchApp(`/entries/${id}`, {
      env,
      headers: { accept: "text/html" },
    });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("cache-control"), "no-store, must-revalidate");
    const html = await response.text();
    assert.match(html, /<meta name="robots" content="noindex/i);
    assert.doesNotMatch(html, /<link rel="canonical"|property="og:|name="twitter:/i);
    assert.doesNotMatch(html, /DRAFT_METADATA_(?:TITLE|BODY)_PRIVATE_CANARY/i);
  }
});

test("the text-only identity default leaves no stale asset or runtime image resolver in the build", async () => {
  const [layoutSource, metadataSource, workerSource, appFiles, publicFiles, packagedFiles] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/public-metadata.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    filesIfPresent(new URL("../app/", import.meta.url)),
    filesIfPresent(new URL("../public/", import.meta.url)),
    filesIfPresent(new URL("../dist/client/", import.meta.url)),
  ]);

  assert.doesNotMatch(layoutSource, /next\/headers|requestOrigin|x-forwarded-host|\/og\.png/i);
  assert.doesNotMatch(metadataSource, /\bimages\s*:|\/og\.(?:png|jpe?g|webp)/i);
  assert.doesNotMatch(workerSource, /next\/image|image-optimization|\/_vinext\/image|\bIMAGES\b/);
  assert.deepEqual(
    appFiles.filter((path) => /(?:^|\/)(?:opengraph-image|twitter-image|icon)\.[^.]+$/i.test(path)),
    [],
  );
  assert.deepEqual(publicFiles.filter(isIdentityImage), []);
  assert.deepEqual(packagedFiles.filter((path) => isIdentityImage(path) && !path.startsWith("_next/")), []);
});

function assertNoImageMetadata(html) {
  assert.doesNotMatch(html, /(?:property|name)="(?:og|twitter):image(?::alt)?"/i);
  assert.doesNotMatch(html, /\/og\.png/i);
}

function assertNoPrivateMetadata(html) {
  assert.doesNotMatch(html, /hostile-request-host|forwarded-host-private-canary/i);
  assert.doesNotMatch(html, new RegExp(ownerCanary, "i"));
  assert.doesNotMatch(html, /PROFILE_METADATA_PRIVATE_CANARY/i);
}

function isIdentityImage(path) {
  return /(?:^|\/)(?:og|opengraph-image|twitter-image|icon|favicon)(?:[.-]|$).*\.(?:png|jpe?g|webp|gif|svg|ico)$/i.test(path);
}

async function filesIfPresent(directory) {
  try {
    return await readdir(directory, { recursive: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}
