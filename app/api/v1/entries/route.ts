import {
  countPublishedEntries,
  getProfile,
  listPublishedEntries,
} from "@/db/repository";
import { apiV1CanonicalUrl } from "@/lib/api-v1/canonical";
import { apiV1EntryCollectionDocument } from "@/lib/api-v1/entry-collection";
import {
  apiV1Error,
  apiV1Head,
  apiV1NegotiationError,
} from "@/lib/api-v1/response";
import { parsePagination, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const COLLECTION_VARY = "Accept, Authorization";

export async function GET(request: Request) {
  const negotiationError = apiV1NegotiationError(request);
  if (negotiationError) return withCollectionVary(negotiationError);

  try {
    const { page, pageSize } = parsePagination(new URL(request.url));
    const profile = await getProfile();
    if (!profile) {
      return collectionError(
        "profile_not_configured",
        "The Aitta profile has not been configured.",
        404,
      );
    }
    const canonicalUrl = apiV1CanonicalUrl(profile.canonicalUrl);
    if (!canonicalUrl) {
      return collectionError(
        "canonical_url_unconfigured",
        "Canonical URL is not configured.",
        503,
      );
    }
    const publishedCount = await countPublishedEntries();
    const { entries } = await listPublishedEntries(
      pageSize,
      (page - 1) * pageSize,
    );
    return Response.json(
      apiV1EntryCollectionDocument({
        entries,
        publishedCount,
        page,
        pageSize,
        canonicalUrl,
      }),
      {
        headers: {
          "Cache-Control": "public, max-age=30",
          Vary: COLLECTION_VARY,
        },
      },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return collectionError(
        "invalid_pagination",
        "page must be at least 1 and pageSize must be between 1 and 50.",
        400,
      );
    }
    return collectionError(
      "internal_error",
      "The API request could not be completed.",
      500,
    );
  }
}

export async function HEAD(request: Request) {
  return apiV1Head(await GET(request));
}

function methodNotAllowed(request: Request) {
  const negotiationError = apiV1NegotiationError(request);
  if (negotiationError) return withCollectionVary(negotiationError);
  return collectionError(
    "method_not_allowed",
    "The request method is not supported for this API resource.",
    405,
    { Allow: "GET, HEAD" },
  );
}

export const OPTIONS = methodNotAllowed;
export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;

function collectionError(
  code: string,
  message: string,
  status: number,
  headers: HeadersInit = {},
) {
  return apiV1Error(code, message, status, {
    ...Object.fromEntries(new Headers(headers)),
    Vary: COLLECTION_VARY,
  });
}

function withCollectionVary(response: Response): Response {
  response.headers.set("Vary", COLLECTION_VARY);
  return response;
}
