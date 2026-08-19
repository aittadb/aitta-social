import { selectPublicEntryDocumentVariant } from "./accept";
import {
  publicEntryDocumentError,
  publicEntryDocumentHead,
} from "./response";

export const ENTRY_DOCUMENT_DISPATCH_HEADER =
  "x-aitta-entry-document-dispatch" as const;
export const ENTRY_DOCUMENT_DISPATCH_VALUE =
  "worker-negotiated-json" as const;

const ENTRY_DOCUMENT_PATH = /^\/entries\/([^/]+)$/u;

export type PublicEntryDocumentDispatch = {
  request: Request;
  negotiated: boolean;
  response?: Response;
};

/**
 * Strips an untrusted marker, then dispatches only the one public entry path.
 * Every other route and method remains owned by Vinext.
 */
export function dispatchPublicEntryDocument(
  externalRequest: Request,
): PublicEntryDocumentDispatch {
  const request = withoutDispatchMarker(externalRequest);
  const url = new URL(request.url);
  if (
    url.pathname === "/aitta-internal" ||
    url.pathname.startsWith("/aitta-internal/")
  ) {
    return { request, negotiated: false, response: unavailableInternalPath() };
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return { request, negotiated: false };
  }

  const match = ENTRY_DOCUMENT_PATH.exec(url.pathname);
  if (!match) return { request, negotiated: false };

  const variant = selectPublicEntryDocumentVariant(request.headers.get("accept"));
  if (variant === "not-acceptable") {
    return {
      request,
      negotiated: true,
      response: notAcceptableResponse(request.method),
    };
  }
  if (variant === "html") return { request, negotiated: true };

  const rawId = match[1];
  if (!rawId) return { request, negotiated: false };
  // Vinext ignores app directories whose names begin with `_`. The Worker
  // therefore reserves this marker-gated namespace and rejects direct access.
  url.pathname = `/aitta-internal/entry-document/${rawId}`;
  url.search = "";
  const headers = new Headers(request.headers);
  headers.set(ENTRY_DOCUMENT_DISPATCH_HEADER, ENTRY_DOCUMENT_DISPATCH_VALUE);
  return {
    request: new Request(url, new Request(request, { headers })),
    negotiated: true,
  };
}

function unavailableInternalPath(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

export function addAcceptVary(response: Response): Response {
  const headers = new Headers(response.headers);
  const tokens = (headers.get("vary") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!tokens.some((value) => value.toLowerCase() === "accept")) {
    tokens.push("Accept");
  }
  headers.set("Vary", tokens.join(", "));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withoutDispatchMarker(request: Request): Request {
  if (!request.headers.has(ENTRY_DOCUMENT_DISPATCH_HEADER)) return request;
  const headers = new Headers(request.headers);
  headers.delete(ENTRY_DOCUMENT_DISPATCH_HEADER);
  return new Request(request, { headers });
}

function notAcceptableResponse(method: string): Response {
  const response = publicEntryDocumentError(
    "not_acceptable",
    "This document is available as text/html or application/json.",
    406,
  );
  return method === "HEAD"
    ? publicEntryDocumentHead(response)
    : response;
}
