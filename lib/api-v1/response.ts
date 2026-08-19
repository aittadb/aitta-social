import { acceptsApiV1Json } from "./accept";
import { apiV1CanonicalUrl } from "./canonical";
import {
  API_V1_MEDIA_TYPE,
  type ApiV1Document,
  type ApiV1ErrorDocument,
} from "./representation";

const JSON_HEADERS = {
  "Cache-Control": "public, max-age=60",
  Vary: "Accept",
} as const;

const ERROR_HEADERS = {
  "Cache-Control": "no-store",
  Vary: "Accept",
} as const;

export function apiV1ReadResponse<TAttributes extends Record<string, unknown>>(
  request: Request,
  createDocument: (canonicalUrl: string) => ApiV1Document<TAttributes>,
): Response {
  const negotiationError = apiV1NegotiationError(request);
  if (negotiationError) return negotiationError;

  try {
    const canonicalUrl = protectedCanonicalUrl();
    if (!canonicalUrl) {
      return apiV1Error(
        "canonical_url_unconfigured",
        "Canonical URL is not configured.",
        503,
      );
    }
    return apiV1JsonResponse(createDocument(canonicalUrl));
  } catch {
    return apiV1Error(
      "internal_error",
      "The API request could not be completed.",
      500,
    );
  }
}

export function apiV1MethodNotAllowed(request: Request): Response {
  const negotiationError = apiV1NegotiationError(request);
  if (negotiationError) return negotiationError;
  return apiV1Error(
    "method_not_allowed",
    "The request method is not supported for this API resource.",
    405,
    { Allow: "GET, HEAD" },
  );
}

export function apiV1NotFound(request: Request): Response {
  const negotiationError = apiV1NegotiationError(request);
  if (negotiationError) return negotiationError;
  return apiV1Error(
    "not_found",
    "The requested API resource was not found.",
    404,
  );
}

export function apiV1Head(response: Response): Response {
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export function apiV1NegotiationError(request: Request): Response | null {
  return acceptsApiV1Json(request.headers.get("accept")).accepted
    ? null
    : apiV1Error(
        "not_acceptable",
        `This API route returns ${API_V1_MEDIA_TYPE}.`,
        406,
      );
}

export function apiV1JsonResponse<
  TAttributes extends Record<string, unknown>,
>(document: ApiV1Document<TAttributes>): Response {
  return Response.json(document, { headers: JSON_HEADERS });
}

export function apiV1Error(
  code: string,
  message: string,
  status: number,
  extraHeaders: HeadersInit = {},
): Response {
  const document: ApiV1ErrorDocument = {
    data: null,
    error: { code, message },
    links: [],
  };
  return Response.json(document, {
    status,
    headers: { ...ERROR_HEADERS, ...Object.fromEntries(new Headers(extraHeaders)) },
  });
}

function protectedCanonicalUrl(): string | null {
  return apiV1CanonicalUrl();
}
