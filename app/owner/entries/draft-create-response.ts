import type {
  PrivateEntryDocument,
  PrivateEntryFieldName,
} from "@/lib/private-entry/representation";
import { hasExactKeys, isRecord } from "@/lib/record-shape";
import { privateEntryErrorFieldName } from "./private-entry-error-field-name";

export type DraftCreateFailure = {
  message: string;
  fieldErrors: Partial<Record<PrivateEntryFieldName, string>>;
};

export type DraftCreateResponse =
  | { outcome: "success"; id: string }
  | { outcome: "unconfirmed" }
  | ({ outcome: "definitive-error" } & DraftCreateFailure);

const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_ERROR_FIELDS = 16;

/** Treats an invalid 201 document as unconfirmed because the draft may exist. */
export async function readDraftCreateResponse(response: Response): Promise<DraftCreateResponse> {
  if (response.status >= 500) return { outcome: "unconfirmed" };
  if (response.status === 201 && response.ok) {
    const body = await readPrivateEntryResponseJson(response);
    if (!isPrivateEntryDocument(body, { state: "draft", requireNewId: true })) {
      return { outcome: "unconfirmed" };
    }
    return body.data.attributes.publishedAt === null
      ? { outcome: "success", id: body.data.id }
      : { outcome: "unconfirmed" };
  }
  if (response.ok || response.status < 400 || response.status > 499) {
    return { outcome: "unconfirmed" };
  }

  const body = await readPrivateEntryResponseJson(response);
  if (!isPrivateEntryErrorDocument(body)) return { outcome: "unconfirmed" };
  const fieldErrors: DraftCreateFailure["fieldErrors"] = collectErrorFields(body);
  return {
    outcome: "definitive-error",
    message: Object.keys(fieldErrors).length
      ? "Update was not saved. Correct the highlighted fields and try again."
      : `Update was not saved. ${body.error.message}`,
    fieldErrors,
  };
}

function collectErrorFields(body: { error: { fields?: Array<{ name: string; message: string }> } }) {
  const fieldErrors: DraftCreateFailure["fieldErrors"] = {};
  if (!body.error.fields) return fieldErrors;

  for (const item of body.error.fields) {
    const fieldName = privateEntryErrorFieldName(item.name);
    if (fieldName && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = item.message;
    }
  }

  return fieldErrors;
}

export function isPrivateEntryDocument(
  value: unknown,
  expected: {
    id?: string;
    state?: "draft" | "published";
    requireNewId?: boolean;
  } = {},
): value is PrivateEntryDocument {
  const parsed = parseEntryDocument(value, expected);
  if (!parsed) return false;

  return (
    isValidEntryAttributes(parsed.attributes, parsed.state) &&
    isValidEntryLinks(parsed.links, parsed.encodedId, parsed.selfLinkHref) &&
    isValidEntryActions(parsed.actions, parsed.selfLinkHref, parsed.state)
  );
}

function parseEntryDocument(
  value: unknown,
  expected: {
    id?: string;
    state?: "draft" | "published";
    requireNewId?: boolean;
  },
): {
  attributes: {
    kind: string;
    title: string | null;
    body: string;
    destinationUrl: string | null;
    state: "draft" | "published";
  };
  links: unknown[];
  actions: unknown[];
  encodedId: string;
  state: "draft" | "published";
  selfLinkHref: string;
} | null {
  if (!isRecord(value) || !hasExactKeys(value, ["data", "links", "actions"])) return null;
  if (!isRecord(value.data) || !hasExactKeys(value.data, ["id", "type", "attributes"])) return null;

  const entryId = parseEntryId(value.data.id, expected);
  if (entryId === null || value.data.type !== "owner-entry") return null;
  const attributes = parseEntryAttributes(value.data.attributes);
  if (attributes === null) return null;
  if (expected.state !== undefined && attributes.state !== expected.state) return null;

  const encodedId = encodeURIComponent(entryId).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  const selfLinkHref = `/api/private/entries/${encodedId}`;

  return {
    attributes: {
      kind: attributes.kind,
      title: attributes.title,
      body: attributes.body,
      destinationUrl: attributes.destinationUrl,
      state: attributes.state,
    },
    links: value.links as unknown[],
    actions: value.actions as unknown[],
    encodedId,
    state: attributes.state,
    selfLinkHref,
  };
}

function parseEntryId(
  value: unknown,
  expected: { id?: string; requireNewId?: boolean },
): string | null {
  if (typeof value !== "string") return null;
  if (expected.id !== undefined && value !== expected.id) return null;
  if (expected.requireNewId === true && !isDraftId(value)) return null;
  return value;
}

function parseEntryAttributes(attributes: unknown): {
  kind: string;
  title: string | null;
  body: string;
  destinationUrl: string | null;
  state: "draft" | "published";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
} | null {
  if (!isRecord(attributes) || !hasExactKeys(attributes, [
    "kind",
    "title",
    "body",
    "destinationUrl",
    "state",
    "publishedAt",
    "createdAt",
    "updatedAt",
  ])) {
    return null;
  }

  if (
    !isNormalizedBoundedText(attributes.kind, 1, 32) ||
    (typeof attributes.title !== "string" && attributes.title !== null) ||
    (typeof attributes.title === "string" && !isNormalizedBoundedText(attributes.title, 1, 200)) ||
    !isNormalizedBoundedText(attributes.body, 1, 50000) ||
    !isValidDestination(attributes.destinationUrl) ||
    !isEntryState(attributes.state) ||
    !isIsoDatetime(attributes.createdAt) ||
    !isIsoDatetime(attributes.updatedAt) ||
    !isOptionalIsoDatetime(attributes.publishedAt)
  ) {
    return null;
  }

  return {
    kind: attributes.kind,
    title: attributes.title,
    body: attributes.body,
    destinationUrl: attributes.destinationUrl,
    state: attributes.state,
    publishedAt: attributes.publishedAt,
    createdAt: attributes.createdAt,
    updatedAt: attributes.updatedAt,
  };
}

function isValidEntryAttributes(
  attributes: {
    kind: string;
    title: string | null;
    body: string;
    destinationUrl: string | null;
    state: "draft" | "published";
  },
  state: "draft" | "published",
): boolean {
  if (!ALLOWED_ENTRY_KIND.has(attributes.kind)) return false;
  if (!isNormalizedBoundedText(attributes.body, 1, 50000)) return false;
  if (!isPublicDestination(attributes.destinationUrl)) return false;
  if (attributes.kind === "link" && attributes.destinationUrl === null) return false;
  if (attributes.state !== state) return false;
  return true;
}

function isValidEntryLinks(links: unknown[], encodedId: string, selfLinkHref: string): boolean {
  if (!Array.isArray(links) || links.length !== 2) return false;
  const [selfLink, alternateLink] = links;
  return isLink(selfLink, "self", "application/json", selfLinkHref) &&
    isLink(alternateLink, "alternate", "text/html", `/owner/entries/${encodedId}`);
}

function isValidEntryActions(
  actions: unknown[],
  selfLinkHref: string,
  state: "draft" | "published",
): boolean {
  if (!Array.isArray(actions) || actions.length !== 3) return false;
  const [editAction, publishAction, deleteAction] = actions;
  return isAction(editAction, "edit", "PUT", selfLinkHref, true) &&
    isAction(
      publishAction,
      state === "published" ? "unpublish" : "publish",
      "PUT",
      `${selfLinkHref}/state`,
      true,
    ) &&
    isAction(deleteAction, "delete", "DELETE", selfLinkHref, false);
}

export async function readPrivateEntryResponseJson(response: Response): Promise<unknown> {
  if (!/^application\/json\b/iu.test(response.headers.get("content-type") ?? "")) return null;
  if (response.body === null) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) return null;
      chunks.push(chunk.value);
    }
  } catch {
    return null;
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The response stream may already be closed after a complete read.
    }
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    return null;
  }
}

export function isPrivateEntryErrorDocument(value: unknown): value is {
  data: null;
  error: {
    code: string;
    message: string;
    fields?: Array<{ name: string; code: string; message: string }>;
  };
  links: [];
} {
  if (!isRecord(value) || !hasExactKeys(value, ["data", "error", "links"])) return false;
  if (value.data !== null || !Array.isArray(value.links) || value.links.length !== 0) return false;
  if (!isRecord(value.error)) return false;
  const errorKeys = value.error.fields === undefined
    ? ["code", "message"]
    : ["code", "message", "fields"];
  if (
    !hasExactKeys(value.error, errorKeys) ||
    typeof value.error.code !== "string" ||
    !/^[a-z][a-z0-9_]{0,63}$/u.test(value.error.code) ||
    !isBoundedMessage(value.error.message)
  ) {
    return false;
  }
  if (value.error.fields === undefined) return true;

  return isBoundedErrorFields(value.error.fields as unknown[]);
}

const ALLOWED_ENTRY_KIND = new Set<string>(["note", "article", "announcement", "link"]);

function isBoundedErrorFields(fields: unknown[]): boolean {
  if (fields.length > MAX_ERROR_FIELDS) return false;
  return fields.every((field) =>
    isRecord(field) &&
    hasExactKeys(field, ["name", "code", "message"]) &&
    typeof field.name === "string" && field.name.length > 0 && field.name.length <= 64 &&
    typeof field.code === "string" && /^[a-z][a-z0-9_]{0,63}$/u.test(field.code) &&
    isBoundedMessage(field.message),
  );
}

function isBoundedMessage(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 240;
}

function isNormalizedBoundedText(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" && value === value.trim() && value.length >= minimum && value.length <= maximum;
}

function isEntryState(value: unknown): value is "draft" | "published" {
  return value === "draft" || value === "published";
}

function isValidDestination(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isPublicDestination(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password &&
      url.toString() === value;
  } catch {
    return false;
  }
}

function isIsoDatetime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  return new Date(parsed).toISOString() === value;
}

function isOptionalIsoDatetime(value: unknown): value is string | null {
  return value === null || isIsoDatetime(value);
}

function isLink(
  value: unknown,
  rel: string,
  mediaType: string,
  expectedHref: string,
): value is { rel: string; href: string; mediaType: string } {
  return isRecord(value) &&
    hasExactKeys(value, ["rel", "href", "mediaType"]) &&
    value.rel === rel &&
    value.mediaType === mediaType &&
    value.href === expectedHref;
}

function isAction(
  value: unknown,
  rel: string,
  method: string,
  href: string,
  hasRequestMediaType: boolean,
): boolean {
  if (!isRecord(value) || value.rel !== rel || value.method !== method || value.href !== href) {
    return false;
  }

  if (hasRequestMediaType) {
    return hasExactKeys(value, ["rel", "method", "href", "requestMediaType"]) &&
      value.requestMediaType === "application/json";
  }

  return hasExactKeys(value, ["rel", "method", "href"]);
}

function isDraftId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
}
