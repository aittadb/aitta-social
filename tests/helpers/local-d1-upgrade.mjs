import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Miniflare } from "miniflare";

export const REPOSITORY_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const DIST_SERVER_ROOT = path.join(REPOSITORY_ROOT, "dist/server");
export const APP_ORIGIN = "https://legacy-person.example";
export const OWNER_EMAIL = "owner@example.test";
export const D1_DATABASE_NAME = "site-creator-d1";
export const D1_DATABASE_ID = "00000000-0000-4000-8000-000000000000";

export async function sha256(relativePath) {
  const source = await readFile(path.join(REPOSITORY_ROOT, relativePath));
  return createHash("sha256").update(source).digest("hex");
}

export async function readRepositoryFile(relativePath) {
  return readFile(path.join(REPOSITORY_ROOT, relativePath), "utf8");
}

/**
 * Return an explicit, absolute module inventory for the compiled Worker.
 * index.js is deliberately first because Miniflare treats the first ES module
 * as the entrypoint; no source module or automatic dependency discovery is
 * used by this upgrade proof.
 */
export async function compiledWorkerModules() {
  const entrypoint = path.join(DIST_SERVER_ROOT, "index.js");
  assert((await stat(entrypoint)).isFile(), "npm run build must create dist/server/index.js");

  const modules = [];
  await collectJavaScript(DIST_SERVER_ROOT, modules);
  modules.sort((left, right) => left.localeCompare(right));

  return [entrypoint, ...modules.filter((modulePath) => modulePath !== entrypoint)].map(
    (modulePath) => ({ type: "ESModule", path: modulePath }),
  );
}

export async function createCompiledWorker({
  persistPath,
  ownerEmail = OWNER_EMAIL,
  canonicalUrl = APP_ORIGIN,
} = {}) {
  assert.equal(path.isAbsolute(persistPath), true, "D1 persistence path must be absolute");
  await mkdir(persistPath, { recursive: true });

  const packagedConfig = JSON.parse(
    await readFile(path.join(DIST_SERVER_ROOT, "wrangler.json"), "utf8"),
  );
  assert.equal(packagedConfig.main, "index.js");
  assert.match(packagedConfig.compatibility_date, /^\d{4}-\d{2}-\d{2}$/u);
  assert(Array.isArray(packagedConfig.compatibility_flags));
  assert.deepEqual(packagedConfig.d1_databases, [
    {
      binding: "DB",
      database_name: D1_DATABASE_NAME,
      database_id: D1_DATABASE_ID,
    },
  ]);

  const bindings = {};
  if (ownerEmail !== null) bindings.AITTA_SOCIAL_OWNER_EMAIL = ownerEmail;
  if (canonicalUrl !== null) bindings.AITTA_SOCIAL_CANONICAL_URL = canonicalUrl;

  const miniflare = new Miniflare({
    modules: await compiledWorkerModules(),
    modulesRoot: DIST_SERVER_ROOT,
    // Let Miniflare choose a compatible loopback listener in restricted
    // environments so test execution remains stable across hosts.
    compatibilityDate: packagedConfig.compatibility_date,
    compatibilityFlags: packagedConfig.compatibility_flags,
    bindings,
    d1Databases: { DB: D1_DATABASE_ID },
    d1Persist: persistPath,
    serviceBindings: {
      ASSETS: async () => new Response("Not found", { status: 404 }),
    },
  });

  const db = await miniflare.getD1Database("DB");
  return {
    db,
    fetch: (pathname, init = {}) =>
      miniflare.dispatchFetch(new URL(pathname, APP_ORIGIN), init),
    dispose: () => miniflare.dispose(),
  };
}

export async function applyMigrationSql(db, sql) {
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
  return applyPreparedBatch(db, statements);
}

export async function applyFixtureSql(db, sql) {
  return applyMigrationSql(db, sql);
}

export async function rows(db, sql, ...bindings) {
  const result = await db.prepare(sql).bind(...bindings).all();
  assert.equal(result.success, true);
  return result.results;
}

export async function copyPersistedD1(sourcePath, backupPath) {
  assert.equal(path.isAbsolute(sourcePath), true);
  assert.equal(path.isAbsolute(backupPath), true);
  await cp(sourcePath, backupPath, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
}

async function collectJavaScript(directory, output) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectJavaScript(absolutePath, output);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      output.push(absolutePath);
    }
  }
}

async function applyPreparedBatch(db, statements) {
  assert(statements.length > 0, "At least one SQL statement is required");
  const results = await db.batch(statements.map((statement) => db.prepare(statement)));
  assert.equal(results.length, statements.length);
  for (const result of results) assert.equal(result.success, true);
  return results;
}
