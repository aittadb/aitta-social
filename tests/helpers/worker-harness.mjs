import assert from "node:assert/strict";
import { register } from "node:module";

const APP_ORIGIN = "https://account.example";
const TEST_ENV_KEY = Symbol.for("aitta-social.test.cloudflare-env");
const cloudflareWorkersStub = `data:text/javascript,${encodeURIComponent(`
  const key = Symbol.for("aitta-social.test.cloudflare-env");
  export const env = new Proxy({}, {
    get(_target, property) { return globalThis[key]?.[property]; },
    has(_target, property) { return property in (globalThis[key] ?? {}); },
    ownKeys() { return Reflect.ownKeys(globalThis[key] ?? {}); },
    getOwnPropertyDescriptor() { return { configurable: true, enumerable: true }; }
  });
`)}`;

const loaderSource = `
  const cloudflareWorkersStub = ${JSON.stringify(cloudflareWorkersStub)};
  export async function resolve(specifier, context, nextResolve) {
    return specifier === "cloudflare:workers"
      ? { url: cloudflareWorkersStub, shortCircuit: true }
      : nextResolve(specifier, context);
  }
`;
register(`data:text/javascript,${encodeURIComponent(loaderSource)}`, import.meta.url);

let workerPromise;

export function profileRow(overrides = {}) {
  return {
    display_name: "Ada Account",
    account_type: "person",
    short_description: "Independent notes and announcements.",
    introduction: "This is a deliberately small, independently controlled presence.",
    location: "Helsinki",
    website: "https://ada.example/about",
    external_links_json: JSON.stringify([
      { label: "Work", url: "https://ada.example/work" },
    ]),
    canonical_url: APP_ORIGIN,
    accent_color: "#31554d",
    density: "comfortable",
    hide_powered_by: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    private_canary: "PROFILE_PRIVATE_CANARY",
    owner_email: "do-not-project@example.test",
    ...overrides,
  };
}

export function entryRow(overrides = {}) {
  return {
    id: "entry-1",
    kind: "note",
    title: "First public note",
    body: "A useful public message.",
    destination_url: null,
    state: "published",
    published_at: "2026-06-01T12:00:00.000Z",
    created_at: "2026-05-31T12:00:00.000Z",
    updated_at: "2026-06-01T12:00:00.000Z",
    private_canary: "ENTRY_PRIVATE_CANARY",
    ...overrides,
  };
}

/**
 * A deliberately product-specific D1 fake. It recognizes only the queries the
 * AittaSocial repository issues, records mutations, and fails closed on a new
 * query so route tests cannot silently stop exercising persistence behavior.
 */
export class FakeD1 {
  constructor({ profile = profileRow(), entries = [] } = {}) {
    this.profile = profile ? structuredClone(profile) : null;
    this.entries = entries.map((entry) => structuredClone(entry));
    this.mutations = [];
    this.queries = [];
  }

  prepare(sql) {
    assert.equal(typeof sql, "string");
    return new FakeStatement(this, sql);
  }
}

class FakeStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = sql;
    this.normalized = sql.replace(/\s+/g, " ").trim().toLowerCase();
    this.values = [];
  }

  bind(...values) {
    this.values = values;
    return this;
  }

  async first() {
    this.database.queries.push({ operation: "first", sql: this.sql, values: this.values });
    if (this.normalized.includes(" from profiles") && this.normalized.includes(" where id = ?")) {
      return this.values[0] === 1 ? clone(this.database.profile) : null;
    }
    if (this.normalized.includes(" from entries") && this.normalized.includes(" where id = ?")) {
      const [id, state] = this.values;
      const entry = this.database.entries.find((candidate) =>
        candidate.id === id && (state === undefined || candidate.state === state),
      );
      return clone(entry ?? null);
    }
    throw new Error(`Unhandled D1 first() query in test fake: ${this.normalized}`);
  }

  async all() {
    this.database.queries.push({ operation: "all", sql: this.sql, values: this.values });
    if (!this.normalized.includes(" from entries")) {
      throw new Error(`Unhandled D1 all() query in test fake: ${this.normalized}`);
    }

    if (this.normalized.includes(" where state = ?")) {
      const [state, limit, offset] = this.values;
      const results = this.database.entries
        .filter((entry) => entry.state === state)
        .sort(comparePublicEntries)
        .slice(offset, offset + limit)
        .map(clone);
      return { success: true, results };
    }

    if (this.normalized.includes(" order by updated_at desc, id desc limit ?")) {
      const [limit] = this.values;
      const results = this.database.entries
        .toSorted((left, right) =>
          descending(left.updated_at, right.updated_at) || descending(left.id, right.id),
        )
        .slice(0, limit)
        .map(clone);
      return { success: true, results };
    }

    throw new Error(`Unhandled D1 all() query in test fake: ${this.normalized}`);
  }

  async run() {
    const record = { operation: "run", sql: this.sql, values: structuredClone(this.values) };
    this.database.queries.push(record);
    this.database.mutations.push(record);

    if (this.normalized.startsWith("insert into profiles")) {
      assert.match(this.normalized, /values \(\?, \?, 'other', \?/);
      assert.doesNotMatch(this.normalized, /account_type = excluded\.account_type/);
      const [
        id,
        displayName,
        shortDescription,
        introduction,
        location,
        website,
        externalLinksJson,
        canonicalUrl,
        accentColor,
        density,
        hidePoweredBy,
        createdAt,
        updatedAt,
      ] = this.values;
      assert.equal(id, 1);
      this.database.profile = {
        display_name: displayName,
        account_type: this.database.profile?.account_type ?? "other",
        short_description: shortDescription,
        introduction,
        location,
        website,
        external_links_json: externalLinksJson,
        canonical_url: canonicalUrl,
        accent_color: accentColor,
        density,
        hide_powered_by: hidePoweredBy,
        created_at: this.database.profile?.created_at ?? createdAt,
        updated_at: updatedAt,
      };
      return changed(1);
    }

    if (this.normalized.startsWith("insert into entries")) {
      const [id, kind, title, body, destinationUrl, state, publishedAt, createdAt, updatedAt] = this.values;
      this.database.entries.push({
        id,
        kind,
        title,
        body,
        destination_url: destinationUrl,
        state,
        published_at: publishedAt,
        created_at: createdAt,
        updated_at: updatedAt,
      });
      return changed(1);
    }

    if (this.normalized.startsWith("update entries set kind = ?")) {
      const [kind, title, body, destinationUrl, updatedAt, id] = this.values;
      const entry = this.database.entries.find((candidate) => candidate.id === id);
      if (!entry) return changed(0);
      Object.assign(entry, {
        kind,
        title,
        body,
        destination_url: destinationUrl,
        updated_at: updatedAt,
      });
      return changed(1);
    }

    if (this.normalized.startsWith("update entries set state = ?")) {
      const publishes = this.normalized.includes("published_at = coalesce");
      const [state, firstTime, secondTime, maybeId] = this.values;
      const id = publishes ? maybeId : secondTime;
      const entry = this.database.entries.find((candidate) => candidate.id === id);
      if (!entry) return changed(0);
      entry.state = state;
      if (publishes) {
        entry.published_at ??= firstTime;
        entry.updated_at = secondTime;
      } else {
        entry.updated_at = firstTime;
      }
      return changed(1);
    }

    if (this.normalized.startsWith("delete from entries where id = ?")) {
      const [id] = this.values;
      const before = this.database.entries.length;
      this.database.entries = this.database.entries.filter((entry) => entry.id !== id);
      return changed(before - this.database.entries.length);
    }

    throw new Error(`Unhandled D1 run() query in test fake: ${this.normalized}`);
  }
}

export function makeEnv({
  db = new FakeD1(),
  ownerEmail,
  canonicalUrl,
  hubUrl,
  hubChallenge,
  deploymentCredential,
} = {}) {
  return {
    DB: db,
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    ...(ownerEmail === undefined ? {} : { AITTA_SOCIAL_OWNER_EMAIL: ownerEmail }),
    ...(canonicalUrl === undefined ? {} : { AITTA_SOCIAL_CANONICAL_URL: canonicalUrl }),
    ...(hubUrl === undefined ? {} : { AITTA_SOCIAL_HUB_URL: hubUrl }),
    ...(hubChallenge === undefined ? {} : { AITTA_SOCIAL_HUB_CHALLENGE: hubChallenge }),
    ...(deploymentCredential === undefined
      ? {}
      : { AITTA_SOCIAL_DEPLOYMENT_CREDENTIAL: deploymentCredential }),
  };
}

export function ownerHeaders(email = "owner@example.com") {
  return {
    "oai-authenticated-user-id": `user:${email}`,
    "oai-authenticated-user-email": email,
    "oai-authenticated-user-full-name": encodeURIComponent("Test Owner"),
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  };
}

export function mutationHeaders(email = "owner@example.com") {
  return {
    ...ownerHeaders(email),
    origin: APP_ORIGIN,
    "content-type": "application/json",
  };
}

export async function fetchApp(path, {
  env = makeEnv(),
  method = "GET",
  headers = {},
  body,
  origin = APP_ORIGIN,
} = {}) {
  globalThis[TEST_ENV_KEY] = env;
  const worker = await getWorker();
  const request = new Request(new URL(path, origin), { method, headers, body });
  return worker.fetch(request, env, {
    waitUntil() {},
    passThroughOnException() {},
  });
}

export async function responseJson(response) {
  const source = await response.text();
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/i);
  return JSON.parse(source);
}

export function validProfileInput(overrides = {}) {
  return {
    displayName: "Ada Account",
    accountType: "person",
    shortDescription: "Independent notes and announcements.",
    introduction: "A longer introduction for the account.",
    location: "Helsinki",
    website: "https://ada.example/about",
    externalLinks: [{ label: "Work", url: "https://ada.example/work" }],
    canonicalUrl: APP_ORIGIN,
    accentColor: "#31554d",
    density: "comfortable",
    hidePoweredBy: false,
    ...overrides,
  };
}

export function validEntryInput(overrides = {}) {
  return {
    kind: "note",
    title: "A draft",
    body: "Private until deliberately published.",
    destinationUrl: null,
    ...overrides,
  };
}

async function getWorker() {
  workerPromise ??= import(new URL("../../dist/server/index.js", import.meta.url).href)
    .then((module) => module.default);
  return workerPromise;
}

function comparePublicEntries(left, right) {
  return (
    descending(left.published_at ?? "", right.published_at ?? "") ||
    descending(left.id, right.id)
  );
}

function descending(left, right) {
  return left < right ? 1 : left > right ? -1 : 0;
}

function changed(changes) {
  return { success: true, meta: { changes } };
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}
