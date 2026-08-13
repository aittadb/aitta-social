import { acceptsApiV1Json } from "../api-v1/accept";
import { ValidationError } from "../validation";
import type {
  PrivateEntryDocument,
  PrivateEntryDeletionDocument,
  PrivateEntryErrorDocument,
  PrivateEntryErrorField,
} from "./representation";

const MAX_CONTENT_TYPE_BYTES = 1024;
const MAX_ENTRY_BODY_BYTES = 64 * 1024;
const PRIVATE_ENTRY_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Accept",
} as const;

export class PrivateEntryRequestError extends Error {
  readonly code: "unsupported_media_type" | "invalid_json" | "request_too_large";
  readonly status: 400 | 415;

  constructor(
    code: PrivateEntryRequestError["code"],
    message: string,
    status: PrivateEntryRequestError["status"],
  ) {
    super(message);
    this.name = "PrivateEntryRequestError";
    this.code = code;
    this.status = status;
  }
}

export function privateEntryNegotiationError(request: Request): Response | null {
  return acceptsApiV1Json(request.headers.get("accept")).accepted
    ? null
    : privateEntryError(
        "not_acceptable",
        "This private API route returns application/json.",
        406,
      );
}

export async function readPrivateEntryJson(request: Request): Promise<unknown> {
  if (!isPrivateEntryJsonMediaType(request.headers.get("content-type"))) {
    throw new PrivateEntryRequestError(
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
    throw new PrivateEntryRequestError(
      "invalid_json",
      "Request body must contain valid UTF-8 JSON.",
      400,
    );
  }
  try {
    return JSON.parse(source) as unknown;
  } catch {
    throw new PrivateEntryRequestError(
      "invalid_json",
      "Request body must contain valid JSON within 64 KiB.",
      400,
    );
  }
}

export function privateEntrySuccess(
  document: PrivateEntryDocument | PrivateEntryDeletionDocument,
  status = 200,
): Response {
  return Response.json(document, { status, headers: PRIVATE_ENTRY_HEADERS });
}

export function privateEntryError(
  code: string,
  message: string,
  status: number,
  options: { fields?: PrivateEntryErrorField[]; headers?: HeadersInit } = {},
): Response {
  const document: PrivateEntryErrorDocument = {
    data: null,
    error: {
      code,
      message,
      ...(options.fields?.length ? { fields: options.fields } : {}),
    },
    links: [],
  };
  return Response.json(document, {
    status,
    headers: {
      ...PRIVATE_ENTRY_HEADERS,
      ...Object.fromEntries(new Headers(options.headers)),
    },
  });
}

export function privateEntryAuthorizationError(status: number): Response {
  if (status === 401) {
    return privateEntryError("authentication_required", "Authentication required.", 401);
  }
  if (status === 503) {
    return privateEntryError(
      "owner_unavailable",
      "Owner administration is not configured.",
      503,
    );
  }
  return privateEntryError("authorization_denied", "The request is not allowed.", 403);
}

export function privateEntryRequestError(error: unknown): Response | null {
  if (error instanceof PrivateEntryRequestError) {
    return privateEntryError(error.code, error.message, error.status);
  }
  if (error instanceof ValidationError) {
    const fields = Object.entries(error.issues).map(([name, message]) => ({
      name: name === "entryKind" ? "kind" : name,
      code: "invalid" as const,
      message,
    }));
    return privateEntryError(
      "validation_failed",
      "The submitted update values are invalid.",
      422,
      { fields },
    );
  }
  return null;
}

function isPrivateEntryJsonMediaType(value: string | null): boolean {
  if (value === null || new TextEncoder().encode(value).byteLength > MAX_CONTENT_TYPE_BYTES) {
    return false;
  }
  const parts = value.split(";");
  if (parts.length > 2 || parts[0]?.trim().toLowerCase() !== "application/json") {
    return false;
  }
  if (parts.length === 1) return true;
  const parameter = parts[1]?.trim() ?? "";
  const match = /^charset\s*=\s*(?:"([^"]+)"|([^\s"]+))$/iu.exec(parameter);
  const charset = (match?.[1] ?? match?.[2] ?? "").toLowerCase();
  return charset === "utf-8";
}

async function readBoundedBody(request: Request): Promise<Uint8Array> {
  if (request.body === null) {
    throw new PrivateEntryRequestError(
      "invalid_json",
      "Request body must contain valid JSON within 64 KiB.",
      400,
    );
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_ENTRY_BODY_BYTES) {
        throw new PrivateEntryRequestError(
          "request_too_large",
          "Request body must not exceed 64 KiB.",
          400,
        );
      }
      chunks.push(chunk.value);
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The stream may already be closed after a complete read.
    }
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
