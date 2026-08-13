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
const protectedCanaries = [
  "OWNER_CHROME_PROFILE_PRIVATE_CANARY",
  "OWNER_CHROME_DRAFT_PRIVATE_CANARY",
  "OWNER_CHROME_AUTH_RESULT_PRIVATE_CANARY",
];

const ownerRoutes = [
  { path: "/owner", current: "Home" },
  { path: "/owner/profile", current: "Identity" },
  { path: "/owner/entries/new", current: "New update" },
  { path: "/owner/entries/owner-chrome-entry", current: "New update" },
  { path: "/owner/pages/import", current: "Pages" },
];

test("every authorized owner document uses one truthful shared private frame", async () => {
  const env = makeEnv({
    ownerEmail,
    db: new FakeD1({
      profile: profileRow({ display_name: "Configured owner Aitta" }),
      entries: [entryRow({
        id: "owner-chrome-entry",
        title: "Private owner draft",
        body: protectedCanaries[1],
        state: "draft",
        published_at: null,
      })],
    }),
  });

  for (const { path, current } of ownerRoutes) {
    const response = await fetchApp(path, {
      env,
      headers: { accept: "text/html", ...ownerHeaders(ownerEmail) },
    });
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assertOwnerFrame(html, { authorized: true, current });
    assert.doesNotMatch(html, new RegExp(`${ownerEmail}|${protectedCanaries[2]}`, "iu"), path);
  }
});

test("non-owner and missing-owner states use safe chrome before every D1 read", async (t) => {
  for (const statusCase of [
    {
      label: "non-owner",
      ownerEmail,
      identity: "other@example.com",
      heading: /not yours to administer/iu,
    },
    {
      label: "missing owner",
      ownerEmail: undefined,
      identity: ownerEmail,
      heading: /Administration is safely disabled/iu,
    },
  ]) {
    await t.test(statusCase.label, async () => {
      const db = databaseReadCanary();
      for (const { path } of ownerRoutes) {
        const response = await fetchApp(path, {
          env: makeEnv({ db, ownerEmail: statusCase.ownerEmail }),
          headers: {
            accept: "text/html",
            ...ownerHeaders(statusCase.identity),
            "oai-authenticated-user-full-name": encodeURIComponent(protectedCanaries[2]),
            "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
          },
        });
        assert.equal(response.status, 200, path);
        const html = await response.text();
        assert.match(html, statusCase.heading, path);
        assertOwnerFrame(html, { authorized: false });
        assert.doesNotMatch(
          html,
          new RegExp(`${protectedCanaries.join("|")}|${ownerEmail}`, "iu"),
          path,
        );
      }
      assert.equal(db.reads, 0);
    });
  }
});

test("signed-out owner routes remain exact Sites redirects before D1", async () => {
  const db = databaseReadCanary();
  for (const { path } of ownerRoutes) {
    const response = await fetchApp(path, {
      env: makeEnv({ db, ownerEmail }),
      headers: { accept: "text/html" },
    });
    assert.ok([303, 307, 308].includes(response.status), path);
    assert.equal(
      response.headers.get("location"),
      `/signin-with-chatgpt?return_to=${encodeURIComponent(path)}`,
      path,
    );
    assert.equal(await response.text(), "", path);
  }
  assert.equal(db.reads, 0);
});

test("owner and public frames share only a pure fixed resource-link primitive", async () => {
  const [resources, publicFrame, ownerShell, css] = await Promise.all([
    readFile(new URL("../app/_components/AittaFooterResources.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/_components/PublicPresenceFrame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/owner/_components/OwnerShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(resources, /href="\/privacy"[\s\S]*href="\/technical"[\s\S]*href="https:\/\/github\.com\/aittadb\/aitta-social"/u);
  assert.match(resources, /aria-label="Technical resources"/u);
  assert.doesNotMatch(resources, /from\s+["'][^"']*db\/|@\/db|getProfile|getChatGPTUser|authorization|next\/headers|runtime|process\.env|children|href:\s*string/iu);
  assert.match(publicFrame, /function PublicFooter\(/u);
  assert.doesNotMatch(publicFrame, /export function PublicFooter|export function PublicPresenceHeader/u);
  assert.match(publicFrame, /<AittaFooterResources \/>/u);
  assert.match(publicFrame, /identityHref="\/"[\s\S]*href: "\/owner"/u);
  assert.match(ownerShell, /<OwnerHeader authorized \/>[\s\S]*aria-label="Owner navigation"[\s\S]*<OwnerFooter \/>/u);
  assert.match(ownerShell, /<OwnerHeader authorized=\{false\} \/>[\s\S]*<OwnerFooter \/>/u);
  assert.doesNotMatch(ownerShell, /displayName|owner-user|owner-session|next\/link/iu);

  assert.match(css, /\.owner-wordmark, \.owner-topbar \.owner-public-link, \.owner-footer a\s*\{[^}]*min-height:\s*var\(--control-min-height\)/su);
  assert.match(css, /\.owner-topbar \.owner-public-link\s*\{[^}]*border:[^}]*border-radius:[^}]*white-space:\s*nowrap/su);
  assert.match(css, /\.owner-footer-inner\s*\{[^}]*min-height:\s*110px[^}]*display:\s*flex/su);
  assert.match(css, /\.public-attribution a, \.technical-links a\s*\{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/su);
  assert.match(css, /\.owner-nav\s*>\s*a\s*\{[^}]*min-height:\s*var\(--control-min-height\)/su);
  assert.match(css, /@media\s*\(max-width:\s*640px\)[\s\S]*\.owner-footer-inner\s*\{[^}]*flex-direction:\s*column/su);
  assert.doesNotMatch(css, /\.owner-(?:topbar|nav|footer)[^{]*\{[^}]*position:\s*(?:fixed|sticky)/iu);
});

function assertOwnerFrame(html, { authorized, current }) {
  assert.equal((html.match(/<main\b/giu) ?? []).length, 1);
  assert.equal((html.match(/id="main-content"/giu) ?? []).length, 1);
  assert.equal((html.match(/<header\b[^>]*aria-label="Private owner workspace"/giu) ?? []).length, 1);
  assert.equal((html.match(/<footer\b[^>]*class="owner-footer"/giu) ?? []).length, 1);
  assert.match(html, /class="owner-context-label">Private owner workspace<\/span>/iu);
  assert.match(html, /class="owner-public-link" href="\/">View Aitta<\/a>/iu);
  assert.match(html, /<nav class="technical-links" aria-label="Technical resources">/iu);
  assert.match(html, /href="\/privacy"[^>]*>Privacy<\/a>/iu);
  assert.match(html, /href="\/technical"[^>]*>Technical<\/a>/iu);
  assert.match(html, /href="https:\/\/github\.com\/aittadb\/aitta-social"[^>]*>GitHub<\/a>/iu);
  assert.match(html, /href="\/\.well-known\/aitta-social\.json"[^>]*>Manifest<\/a>/iu);
  assert.match(html, /href="\/api\/v1\/site"[^>]*>Profile<\/a>/iu);
  assert.match(html, /href="\/api\/v1\/entries"[^>]*>Updates<\/a>/iu);
  assert.match(html, /class="owner-signout" href="\/signout-with-chatgpt\?return_to=%2F">Sign out<\/a>/iu);

  const ownerNav = html.match(/<nav class="owner-nav"[\s\S]*?<\/nav>/iu)?.[0] ?? "";
  if (authorized) {
    assert.match(html, /class="owner-wordmark" href="\/owner"[^>]*>Manage<\/a>/iu);
    assert.match(ownerNav, /href="\/owner"[^>]*>Home<\/a>[\s\S]*href="\/owner\/profile"[^>]*>Identity<\/a>[\s\S]*href="\/owner\/entries\/new"[^>]*>New update<\/a>[\s\S]*href="\/owner\/pages\/import"[^>]*>Pages<\/a>/iu);
    assert.equal((ownerNav.match(/<a\b/giu) ?? []).length, 4);
    assert.equal((ownerNav.match(/aria-current="page"/giu) ?? []).length, 1);
    assert.match(ownerNav, new RegExp(`aria-current="page"[^>]*>${current}<\\/a>`, "iu"));
  } else {
    assert.match(html, /<span class="owner-wordmark">Manage<\/span>/iu);
    assert.equal(ownerNav, "");
    assert.doesNotMatch(html, /href="\/owner\/profile"|href="\/owner\/entries\/new"|href="\/owner\/pages\/import"|class="owner-form"|class="owner-entry/iu);
  }
}

function databaseReadCanary() {
  return {
    reads: 0,
    prepare() {
      this.reads += 1;
      throw new Error(protectedCanaries[0]);
    },
  };
}
