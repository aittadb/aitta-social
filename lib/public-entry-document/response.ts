import type { PublicEntryDocument } from "./representation";

const SUCCESS_HEADERS = {
  "Cache-Control": "public, max-age=60",
  Vary: "Accept",
} as const;

const ERROR_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Accept",
} as const;

export function publicEntryDocumentJsonResponse(
  document: PublicEntryDocument,
): Response {
  return Response.json(document, { headers: SUCCESS_HEADERS });
}

export function publicEntryDocumentError(
  code: string,
  message: string,
  status: number,
): Response {
  return Response.json(
    { data: null, error: { code, message }, links: [] },
    { status, headers: ERROR_HEADERS },
  );
}

export function publicEntryDocumentHead(response: Response): Response {
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
