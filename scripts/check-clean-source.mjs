import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  access,
  copyFile,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const wrangler = join(root, "node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");
const activeHostingPath = join(root, ".openai", "hosting.json");
const exampleHostingPath = join(root, ".openai", "hosting.example.json");
const canaryFile = join(root, ".env.clean-source-rehearsal");
const temporaryRoot = await mkdtemp(join(tmpdir(), "aitta-social-clean-source-"));
const nonce = randomUUID().replaceAll("-", "");
const canaries = [
  `clean-source-owner-${nonce}@example.invalid`,
  `clean-source-canonical-${nonce}.example.invalid`,
  `clean-source-hub-${nonce}.example.invalid`,
  `clean-source-challenge-${nonce}`,
  `clean-source-credential-${nonce}`,
];

try {
  await assertAbsent(activeHostingPath, "The clean-source proof refuses a checkout with an active Sites binding");
  await assertAbsent(canaryFile, "The clean-source canary path must not already exist");
  await access(wrangler);

  const initialStatus = git(["status", "--porcelain", "--untracked-files=all"]);
  assert.equal(initialStatus, "", "Run the clean-source proof only from a clean tracked checkout");
  const localEnvironmentFiles = (await readdir(root))
    .filter((name) => name.startsWith(".env") && name !== ".env.example")
    .sort();
  assert.deepEqual(localEnvironmentFiles, [], "A fresh proof checkout must not contain local environment files");

  const sourceCommit = git(["rev-parse", "HEAD"]);
  assert.match(sourceCommit, /^[0-9a-f]{40}$/);
  const originUrl = git(["remote", "get-url", "origin"]);
  assert(!originUrl.includes("\n"));
  assert(!originUrl.includes("?") && !originUrl.includes("#") && !originUrl.includes("@"), "Proof origin must be a credential-free local bare repository");
  const originPath = isAbsolute(originUrl) ? originUrl : resolve(root, originUrl);
  const originIsBare = run("git", ["--git-dir", originPath, "rev-parse", "--is-bare-repository"], { capture: true });
  assert.equal(originIsBare, "true", "Proof origin must be a local bare repository");
  const originHead = run("git", ["--git-dir", originPath, "rev-parse", "HEAD"], { capture: true });
  assert.equal(originHead, sourceCommit, "The local bare origin and checked-out proof commit must match");
  const trackedFiles = nulList(git(["ls-files", "-z"]));
  assert(!trackedFiles.includes(".openai/hosting.json"));
  assert(!trackedFiles.includes("public/og.png"), "The removed generic social preview must not return");
  for (const path of trackedFiles) {
    assert.doesNotMatch(path, /(?:^|\/)(?:node_modules|dist|\.next|\.vinext|\.wrangler|outputs|work)(?:\/|$)/);
    assert.doesNotMatch(path, /(?:^|\/)\.env(?!\.example$)/);
  }

  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const packageLock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  assert.equal(packageLock.lockfileVersion, 3);
  assert.deepEqual(packageLock.packages[""].dependencies, packageJson.dependencies);
  assert.equal(packageLock.packages[""].version, packageJson.version);

  const directProductionDependencies = {};
  for (const [name, expectedVersion] of Object.entries(packageJson.dependencies)) {
    const locked = packageLock.packages[`node_modules/${name}`];
    assert(locked, `Production dependency ${name} must be present in package-lock.json`);
    assert.equal(locked.version, expectedVersion, `Production dependency ${name} must be exactly pinned`);
    assert.match(locked.integrity ?? "", /^sha512-/);
    const installed = JSON.parse(await readFile(join(root, "node_modules", name, "package.json"), "utf8"));
    assert.equal(installed.version, expectedVersion, `Installed production dependency ${name} must match the lock`);
    directProductionDependencies[name] = {
      version: locked.version,
      integrity: locked.integrity,
    };
  }

  const productionLock = Object.entries(packageLock.packages)
    .filter(([path, value]) => path.startsWith("node_modules/") && value.dev !== true)
    .map(([path, value]) => ({ path, version: value.version, integrity: value.integrity ?? null }))
    .sort((left, right) => left.path.localeCompare(right.path));
  assert(productionLock.length >= Object.keys(packageJson.dependencies).length);

  const constants = await readFile(join(root, "lib", "constants.ts"), "utf8");
  const softwareName = capture(constants, /SOFTWARE_NAME = "([^"]+)"/);
  const softwareVersion = capture(constants, /SOFTWARE_VERSION = "([^"]+)"/);
  const protocolName = capture(constants, /PROTOCOL_NAME = "([^"]+)"/);
  const protocolVersion = capture(constants, /PROTOCOL_VERSION = "([^"]+)"/);
  assert.equal(softwareName, "AittaSocial");
  assert.equal(softwareVersion, packageJson.version);
  assert.equal(protocolName, "aitta-social");
  assert.equal(protocolVersion, "1.0");

  const protocolDocument = await readFile(join(root, "docs", "protocol.md"), "utf8");
  assert.match(protocolDocument, /^# AittaSocial public protocol 1\.0/m);
  assert.match(protocolDocument, /Protocol name: `aitta-social`/);

  const beforeMigrationHashes = await schemaAndMigrationHashes();
  run(npm, ["run", "db:generate"]);
  const afterMigrationHashes = await schemaAndMigrationHashes();
  assert.deepEqual(afterMigrationHashes, beforeMigrationHashes, "Schema generation changed reviewed migrations");
  assert.equal(git(["diff", "--", "db/schema.ts", "drizzle"]), "", "Schema generation must leave no diff");

  const d1State = join(temporaryRoot, "fresh-d1");
  await mkdir(d1State, { recursive: true });
  const wranglerEnvironment = {
    ...process.env,
    CI: "1",
    NO_COLOR: "1",
    WRANGLER_LOG_PATH: join(temporaryRoot, "wrangler.log"),
  };
  run(wrangler, [
    "d1",
    "migrations",
    "apply",
    "site-creator-d1",
    "--local",
    "--persist-to",
    d1State,
    "--config",
    "wrangler.local.jsonc",
  ], { env: wranglerEnvironment });

  const schemaRows = d1Query(
    "SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    d1State,
    wranglerEnvironment,
  );
  assert.deepEqual(
    schemaRows.map(({ type, name }) => `${type}:${name}`),
    [
      "index:idx_entries_public_order",
      "index:idx_entries_updated_at",
      "table:_cf_METADATA",
      "table:d1_migrations",
      "table:entries",
      "table:profiles",
    ],
  );
  const entryTable = schemaRows.find(({ name }) => name === "entries")?.sql ?? "";
  const profileTable = schemaRows.find(({ name }) => name === "profiles")?.sql ?? "";
  assert.match(entryTable, /entries_kind_check/);
  assert.match(entryTable, /entries_state_check/);
  assert.match(profileTable, /profiles_singleton_check/);
  assert.match(profileTable, /profiles_density_check/);

  const appliedMigrations = d1Query(
    "SELECT name FROM d1_migrations ORDER BY id",
    d1State,
    wranglerEnvironment,
  );
  assert.deepEqual(
    appliedMigrations.map(({ name }) => name),
    Object.keys(beforeMigrationHashes).filter((path) => path.endsWith(".sql")).map((path) => path.split("/").at(-1)),
  );
  const emptyCounts = d1Query(
    "SELECT (SELECT COUNT(*) FROM profiles) AS profiles, (SELECT COUNT(*) FROM entries) AS entries",
    d1State,
    wranglerEnvironment,
  );
  assert.deepEqual(emptyCounts, [{ profiles: 0, entries: 0 }]);

  await writeFile(
    canaryFile,
    [
      `AITTA_SOCIAL_OWNER_EMAIL=${canaries[0]}`,
      `AITTA_SOCIAL_CANONICAL_URL=https://${canaries[1]}`,
      `AITTA_SOCIAL_HUB_URL=https://${canaries[2]}`,
      `AITTA_SOCIAL_HUB_CHALLENGE=${canaries[3]}`,
      `AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL=${canaries[4]}`,
      `AITTA_SOCIAL_DEV_AUTH_EMAIL=${canaries[0]}`,
      "",
    ].join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  assert.equal(git(["check-ignore", "--quiet", relative(root, canaryFile)], { statusOnly: true }), 0);

  run(npm, ["run", "build"], {
    env: {
      ...process.env,
      AITTA_SOCIAL_OWNER_EMAIL: canaries[0],
      AITTA_SOCIAL_CANONICAL_URL: `https://${canaries[1]}`,
      AITTA_SOCIAL_HUB_URL: `https://${canaries[2]}`,
      AITTA_SOCIAL_HUB_CHALLENGE: canaries[3],
      AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL: canaries[4],
      AITTA_SOCIAL_DEV_AUTH_EMAIL: canaries[0],
    },
  });

  const distRoot = join(root, "dist");
  const distFiles = await filesUnder(distRoot);
  assert(distFiles.includes("server/index.js"));
  assert(distFiles.includes("server/wrangler.json"));
  assert(!distFiles.includes(".openai/hosting.json"), "An inert build must not contain an active hosting binding");
  assert(!distFiles.some((path) => /(?:^|\/)og\.png$/i.test(path)));
  const generatedOutputFileCounts = {};
  for (const outputName of ["dist", ".next", ".vinext", ".wrangler"]) {
    const outputRoot = join(root, outputName);
    if (!(await exists(outputRoot))) continue;
    const outputFiles = await filesUnder(outputRoot);
    generatedOutputFileCounts[outputName] = outputFiles.length;
    await assertValuesAbsent(outputFiles.map((path) => join(outputRoot, path)), canaries);
  }
  assert(Object.hasOwn(generatedOutputFileCounts, "dist"));
  assert(Object.hasOwn(generatedOutputFileCounts, ".next"));
  assert(Object.hasOwn(generatedOutputFileCounts, ".vinext"));
  assert(Object.hasOwn(generatedOutputFileCounts, ".wrangler"));

  const generatedWrangler = JSON.parse(await readFile(join(distRoot, "server", "wrangler.json"), "utf8"));
  assert.deepEqual(generatedWrangler.r2_buckets, []);
  assert.deepEqual(generatedWrangler.d1_databases, [{
    binding: "DB",
    database_name: "site-creator-d1",
    database_id: "00000000-0000-4000-8000-000000000000",
  }]);

  for (const [sourcePath, expectedHash] of Object.entries(beforeMigrationHashes).filter(([path]) => path.startsWith("drizzle/"))) {
    const relativeMigration = sourcePath.replace(/^drizzle\//, "");
    const builtPath = join(distRoot, ".openai", "drizzle", relativeMigration);
    assert.equal(await fileHash(builtPath), expectedHash, `Built migration ${relativeMigration} must match source`);
  }

  const sourceArchive = join(temporaryRoot, "source.tar");
  run("git", ["archive", "--format=tar", "--output", sourceArchive, "HEAD"]);
  const sourceInventory = tarInventory(sourceArchive);
  assert(sourceInventory.includes(".openai/hosting.example.json"));
  assert(!sourceInventory.includes(".openai/hosting.json"));
  assert(!sourceInventory.some(forbiddenArtifact));
  await assertValuesAbsent([sourceArchive], canaries);

  const inertRoot = join(temporaryRoot, "inert-archive");
  await cp(distRoot, join(inertRoot, "dist"), { recursive: true });
  await mkdir(join(inertRoot, "dist", ".openai"), { recursive: true });
  await copyFile(exampleHostingPath, join(inertRoot, "dist", ".openai", "hosting.json"));
  const inertHosting = JSON.parse(await readFile(join(inertRoot, "dist", ".openai", "hosting.json"), "utf8"));
  assert.deepEqual(inertHosting, { project_id: null, d1: "DB", r2: null });

  const inertArchive = join(temporaryRoot, "inert-dist.tar");
  run("tar", ["-cf", inertArchive, "-C", inertRoot, "."]);
  const inertInventory = tarInventory(inertArchive);
  assert(inertInventory.includes("dist/.openai/hosting.json"));
  assert(inertInventory.includes("dist/server/index.js"));
  assert(inertInventory.includes("dist/.openai/drizzle/0000_closed_talos.sql"));
  assert(!inertInventory.some(forbiddenArtifact));
  await assertValuesAbsent([inertArchive], canaries);
  await assertPatternsAbsent(
    [...distFiles.map((path) => join(distRoot, path)), inertArchive],
    [/appgprj_[A-Za-z0-9]+/],
  );

  assert.equal(git(["status", "--porcelain", "--untracked-files=all"]), initialStatus);
  assert.equal(git(["rev-parse", "HEAD"]), sourceCommit);

  const evidence = {
    sourceCommit,
    sourceRepository: {
      kind: "local-bare-repository",
      origin: originPath,
      head: originHead,
    },
    node: process.version,
    npm: run(npm, ["--version"], { capture: true }),
    software: { name: softwareName, version: softwareVersion },
    protocol: { name: protocolName, version: protocolVersion },
    lockfile: {
      version: packageLock.lockfileVersion,
      sha256: await fileHash(join(root, "package-lock.json")),
      productionGraphCount: productionLock.length,
      productionGraphSha256: hashJson(productionLock),
      direct: directProductionDependencies,
    },
    schemaAndMigrations: {
      before: beforeMigrationHashes,
      after: afterMigrationHashes,
    },
    freshD1SchemaSha256: hashJson(schemaRows),
    sourceArchiveSha256: await fileHash(sourceArchive),
    inertArchiveInventorySha256: hashJson(inertInventory),
    generatedOutputFileCounts,
  };
  console.log("Clean bare-source, fresh-D1, inert archive, and private-canary proof passed.");
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  if (await exists(canaryFile)) await unlink(canaryFile);
  await rm(temporaryRoot, { recursive: true, force: true });
}

function run(command, args, { capture = false, env = process.env } = {}) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  })?.trim();
}

function git(args, { statusOnly = false } = {}) {
  try {
    const output = execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return statusOnly ? 0 : output.trim();
  } catch (error) {
    if (statusOnly && typeof error.status === "number") return error.status;
    throw error;
  }
}

function d1Query(command, persistPath, env) {
  const output = run(wrangler, [
    "d1",
    "execute",
    "site-creator-d1",
    "--local",
    "--persist-to",
    persistPath,
    "--config",
    "wrangler.local.jsonc",
    "--command",
    command,
    "--json",
  ], { capture: true, env });
  const parsed = JSON.parse(output);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].success, true);
  return parsed[0].results;
}

async function schemaAndMigrationHashes() {
  const hashes = { "db/schema.ts": await fileHash(join(root, "db", "schema.ts")) };
  for (const path of await filesUnder(join(root, "drizzle"))) {
    hashes[`drizzle/${path}`] = await fileHash(join(root, "drizzle", path));
  }
  return hashes;
}

async function filesUnder(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(join(directory, entry.name), path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function tarInventory(archive) {
  return run("tar", ["-tf", archive], { capture: true })
    .split("\n")
    .map((path) => path.replace(/^\.\//, "").replace(/\/$/, ""))
    .filter(Boolean)
    .sort();
}

function forbiddenArtifact(path) {
  return /(?:^|\/)(?:\.git|node_modules|\.next|\.vinext|\.wrangler|outputs|work)(?:\/|$)/.test(path)
    || /(?:^|\/)\.env(?!\.example$)/.test(path)
    || /(?:^|\/)public\/og\.png$/i.test(path);
}

async function assertValuesAbsent(paths, values) {
  for (const path of paths) {
    const source = await readFile(path);
    for (const value of values) {
      assert.equal(source.includes(Buffer.from(value)), false, `Private canary entered ${relative(root, path)}`);
    }
  }
}

async function assertPatternsAbsent(paths, patterns) {
  for (const path of paths) {
    const source = (await readFile(path)).toString("latin1");
    for (const pattern of patterns) {
      assert.doesNotMatch(source, pattern, `A hosting identifier entered ${relative(root, path)}`);
    }
  }
}

async function fileHash(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function capture(source, pattern) {
  const match = source.match(pattern);
  assert(match, `Expected source pattern ${pattern}`);
  return match[1];
}

function nulList(value) {
  return value.split("\0").filter(Boolean);
}

async function assertAbsent(path, message) {
  assert.equal(await exists(path), false, message);
}

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
