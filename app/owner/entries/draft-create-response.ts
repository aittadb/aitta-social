import type {
  PrivateEntryDocument,
  PrivateEntryFieldName,
} from "@/lib/private-entry/representation";
import { hasExactKeys, isRecord } from "@/lib/record-shape";

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
const entryFields = new Set<string>(["kind", "title", "body", "destinationUrl"]);

/** Treats an invalid 201 document as unconfirmed because the draft may exist. */
export async function readDraftCreateResponse(response: Response): Promise<DraftCreateResponse> {
  if (response.status >= 500) return { outcome: "unconfirmed" };
  if (response.status === 201 && response.ok) {
    const body = await readPrivateEntryResponseJson(response);
    return isPrivateEntryDocument(body, { state: "draft", requireNewId: true }) &&
        body.data.attributes.publishedAt === null
      ? { outcome: "success", id: body.data.id }
      : { outcome: "unconfirmed" };
  }
  if (response.ok || response.status < 400 || response.status > 499) {
    return { outcome: "unconfirmed" };
  }

  const fieldErrors: DraftCreateFailure["fieldErrors"] = {};
  const body = await readPrivateEntryResponseJson(response);
  if (!isPrivateEntryErrorDocument(body)) return { outcome: "unconfirmed" };
  if (body.error.fields) {
    for (const item of body.error.fields) {
      const fieldName = entryFieldName(item.name);
      if (fieldName && !fieldErrors[fieldName]) {
        fieldErrors[fieldName] = item.message;
      }
    }
  }
  return {
    outcome: "definitive-error",
    message: Object.keys(fieldErrors).length
      ? "Update was not saved. Correct the highlighted fields and try again."
      : `Update was not saved. ${body.error.message}`,
    fieldErrors,
  };
}

export function isPrivateEntryDocument(
  value: unknown,
  expected: {
    id?: string;
    state?: "draft" | "published";
    requireNewId?: boolean;
  } = {},
): value is PrivateEntryDocument {
  if (!isRecord(value) || !hasExactKeys(value, ["data", "links", "actions"])) return false;
  if (!isRecord(value.data) || !hasExactKeys(value.data, ["id", "type", "attributes"])) {
    return false;
  }
  if (
    typeof value.data.id !== "string" ||
    (expected.id !== undefined && value.data.id !== expected.id) ||
    (expected.requireNewId === true &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value.data.id)) ||
    (expected.id === undefined && expected.requireNewId !== true) ||
    value.data.type !== "owner-entry"
  ) return false;
  if (!isRecord(value.data.attributes) || !hasExactKeys(value.data.attributes, [
    "kind",
    "title",
    "body",
    "destinationUrl",
    "state",
    "publishedAt",
    "createdAt",
    "updatedAt",
  ])) return false;
  const attributes = value.data.attributes;
  if (
    !["note", "article", "announcement", "link"].includes(String(attributes.kind)) ||
    !(attributes.title === null || isNormalizedBoundedText(attributes.title, 1, 200)) ||
    !isNormalizedBoundedText(attributes.body, 1, 50000) ||
    !isPublicDestination(attributes.destinationUrl) ||
    (attributes.kind === "link" && attributes.destinationUrl === null) ||
    !(attributes.state === "draft" || attributes.state === "published") ||
    (expected.state !== undefined && attributes.state !== expected.state) ||
    !(attributes.publishedAt === null || isTimestamp(attributes.publishedAt)) ||
    (attributes.state === "published" && attributes.publishedAt === null) ||
    !isTimestamp(attributes.createdAt) ||
    !isTimestamp(attributes.updatedAt)
  ) return false;

  const encodedId = encodeURIComponent(value.data.id).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
  const suffix = `/api/private/entries/${encodedId}`;
  if (!Array.isArray(value.links) || value.links.length !== 2) return false;
  const [selfLink, alternateLink] = value.links;
  if (
    !isLink(selfLink, "self", "application/json") ||
    selfLink.href !== suffix ||
    !isLink(alternateLink, "alternate", "text/html")
  ) return false;
  if (alternateLink.href !== `/owner/entries/${encodedId}`) return false;

  if (!Array.isArray(value.actions) || value.actions.length !== 3) return false;
  const [editAction, publishAction, deleteAction] = value.actions;
  return isAction(editAction, "edit", "PUT", selfLink.href, true) &&
    isAction(
      publishAction,
      attributes.state === "published" ? "unpublish" : "publish",
      "PUT",
      `${selfLink.href}/state`,
      true,
    ) &&
    isAction(deleteAction, "delete", "DELETE", selfLink.href, false);
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
  ) return false;
  if (value.error.fields === undefined) return true;
  return Array.isArray(value.error.fields) &&
    value.error.fields.length <= MAX_ERROR_FIELDS &&
    value.error.fields.every((field) =>
      isRecord(field) &&
      hasExactKeys(field, ["name", "code", "message"]) &&
      typeof field.name === "string" && field.name.length > 0 && field.name.length <= 64 &&
      typeof field.code === "string" && /^[a-z][a-z0-9_]{0,63}$/u.test(field.code) &&
      isBoundedMessage(field.message)
    );
}

function isNormalizedBoundedText(value: unknown, minimum: number, maximum: number): value is string {
  return typeof value === "string" &&
    value === value.trim() &&
    value.length >= minimum &&
    value.length <= maximum;
}

function isPublicDestination(value: unknown): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username && !url.password && url.toString() === value;
  } catch {
    return false;
  }
}

function isBoundedMessage(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 240;
}

function entryFieldName(value: string): PrivateEntryFieldName | null {
  const normalized = value === "entryKind" ? "kind" : value;
  return entryFields.has(normalized) ? normalized as PrivateEntryFieldName : null;
}

function isLink(
  value: unknown,
  rel: string,
  mediaType: string,
): value is { rel: string; href: string; mediaType: string } {
  return isRecord(value) &&
    hasExactKeys(value, ["rel", "href", "mediaType"]) &&
    value.rel === rel &&
    typeof value.href === "string" &&
    value.mediaType === mediaType;
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

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) {
    return false;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}
