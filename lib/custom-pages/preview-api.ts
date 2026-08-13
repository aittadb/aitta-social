import { acceptsApiV1Json } from "../api-v1/accept";
import {
  PAGE_PREVIEW_LIMITS,
  isPageDocumentV1,
  type PageDocumentV1,
} from "./page-document";

const MAX_CONTENT_TYPE_BYTES = 1_024;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Accept",
} as const;

export type PagePreviewDocument = {
  data: {
    id: "page-preview";
    type: "page-preview";
    attributes: { document: PageDocumentV1 };
  };
  links: [
    { rel: "self"; href: "/api/private/pages/preview"; mediaType: "application/json" },
    { rel: "alternate"; href: "/owner/pages/import"; mediaType: "text/html" },
  ];
  actions: [{
    rel: "preview";
    method: "POST";
    href: "/api/private/pages/preview";
    requestMediaType: "application/json";
  }];
};

export type PagePreviewErrorField = {
  name: "schemaVersion" | "title" | "description" | "htmlFragment";
  code: "invalid";
};

export class PagePreviewRequestError extends Error {
  readonly code: "unsupported_media_type" | "invalid_json" | "request_too_large";
  readonly status: 400 | 415;

  constructor(
    code: PagePreviewRequestError["code"],
    message: string,
    status: PagePreviewRequestError["status"],
  ) {
    super(message);
    this.name = "PagePreviewRequestError";
    this.code = code;
    this.status = status;
  }
}

export function pagePreviewNegotiationError(request: Request): Response | null {
  return acceptsApiV1Json(request.headers.get("accept")).accepted
    ? null
    : pagePreviewError(
        "not_acceptable",
        "This private API route returns application/json.",
        406,
      );
}

export async function readPagePreviewJson(request: Request): Promise<unknown> {
  if (!isPagePreviewJsonMediaType(request.headers.get("content-type"))) {
    throw new PagePreviewRequestError(
      "unsupported_media_type",
      "Content-Type must be application/json with an optional UTF-8 charset.",
      415,
    );
  }
  const bytes = await readBoundedBody(request);
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new PagePreviewRequestError(
      "invalid_json",
      "Request body must contain valid UTF-8 JSON.",
      400,
    );
  }
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new PagePreviewRequestError(
      "invalid_json",
      "Request body must contain valid JSON within 192 KiB.",
      400,
    );
  }
}

export function pagePreviewSuccess(document: PageDocumentV1): Response {
  const body: PagePreviewDocument = {
    data: {
      id: "page-preview",
      type: "page-preview",
      attributes: { document },
    },
    links: [
      { rel: "self", href: "/api/private/pages/preview", mediaType: "application/json" },
      { rel: "alternate", href: "/owner/pages/import", mediaType: "text/html" },
    ],
    actions: [{
      rel: "preview",
      method: "POST",
      href: "/api/private/pages/preview",
      requestMediaType: "application/json",
    }],
  };
  return Response.json(body, { headers: RESPONSE_HEADERS });
}

export function pagePreviewError(
  code: string,
  message: string,
  status: number,
  options: { fields?: PagePreviewErrorField[]; headers?: HeadersInit } = {},
): Response {
  return Response.json({
    data: null,
    error: {
      code,
      message,
      ...(options.fields?.length ? { fields: options.fields } : {}),
    },
    links: [],
  }, {
    status,
    headers: {
      ...RESPONSE_HEADERS,
      ...Object.fromEntries(new Headers(options.headers)),
    },
  });
}

export function pagePreviewAuthorizationError(status: number): Response {
  if (status === 401) {
    return pagePreviewError("authentication_required", "Authentication required.", 401);
  }
  if (status === 503) {
    return pagePreviewError(
      "owner_unavailable",
      "Owner administration is not configured.",
      503,
    );
  }
  return pagePreviewError("authorization_denied", "The request is not allowed.", 403);
}

export function parsePagePreviewDocument(value: unknown): PageDocumentV1 | null {
  if (!isRecord(value) || !hasExactKeys(value, ["data", "links", "actions"])) return null;
  if (
    !isRecord(value.data) ||
    !hasExactKeys(value.data, ["id", "type", "attributes"]) ||
    value.data.id !== "page-preview" ||
    value.data.type !== "page-preview" ||
    !isRecord(value.data.attributes) ||
    !hasExactKeys(value.data.attributes, ["document"]) ||
    !isPageDocumentV1(value.data.attributes.document)
  ) {
    return null;
  }
  if (!Array.isArray(value.links) || value.links.length !== 2) return null;
  const expectedLinks = [
    ["self", "/api/private/pages/preview", "application/json"],
    ["alternate", "/owner/pages/import", "text/html"],
  ];
  if (!value.links.every((link, index) =>
    isRecord(link) &&
    hasExactKeys(link, ["rel", "href", "mediaType"]) &&
    link.rel === expectedLinks[index]?.[0] &&
    link.href === expectedLinks[index]?.[1] &&
    link.mediaType === expectedLinks[index]?.[2]
  )) {
    return null;
  }
  if (!Array.isArray(value.actions) || value.actions.length !== 1) return null;
  const action = value.actions[0];
  if (
    !isRecord(action) ||
    !hasExactKeys(action, ["rel", "method", "href", "requestMediaType"]) ||
    action.rel !== "preview" ||
    action.method !== "POST" ||
    action.href !== "/api/private/pages/preview" ||
    action.requestMediaType !== "application/json"
  ) {
    return null;
  }
  return value.data.attributes.document;
}

function isPagePreviewJsonMediaType(value: string | null): boolean {
  if (value === null || new TextEncoder().encode(value).byteLength > MAX_CONTENT_TYPE_BYTES) {
    return false;
  }
  const parts = value.split(";");
  if (parts.length > 2 || parts[0]?.trim().toLowerCase() !== "application/json") return false;
  if (parts.length === 1) return true;
  const parameter = parts[1]?.trim().toLowerCase();
  return parameter === "charset=utf-8" || parameter === 'charset="utf-8"';
}

async function readBoundedBody(request: Request): Promise<Uint8Array> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const parsed = Number(declaredLength);
    if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > PAGE_PREVIEW_LIMITS.requestBytes) {
      throw requestTooLarge();
    }
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > PAGE_PREVIEW_LIMITS.requestBytes) {
        await reader.cancel();
        throw requestTooLarge();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function requestTooLarge(): PagePreviewRequestError {
  return new PagePreviewRequestError(
    "request_too_large",
    "Request body must be valid JSON within 192 KiB.",
    400,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => actual.includes(key));
}
