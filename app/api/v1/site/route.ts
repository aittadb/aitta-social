import { getProfile } from "@/db/repository";
import { apiV1CanonicalUrl } from "@/lib/api-v1/canonical";
import { apiV1ProfileDocument } from "@/lib/api-v1/profile";
import {
  apiV1Error,
  apiV1Head,
  apiV1JsonResponse,
  apiV1MethodNotAllowed,
  apiV1NegotiationError,
} from "@/lib/api-v1/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const negotiationError = apiV1NegotiationError(request);
  if (negotiationError) return negotiationError;

  try {
    const profile = await getProfile();
    if (!profile) {
      return apiV1Error(
        "profile_not_configured",
        "The Aitta profile has not been configured.",
        404,
      );
    }
    const canonicalUrl = apiV1CanonicalUrl(profile.canonicalUrl);
    if (!canonicalUrl) {
      return apiV1Error(
        "canonical_url_unconfigured",
        "Canonical URL is not configured.",
        503,
      );
    }
    return apiV1JsonResponse(apiV1ProfileDocument(profile, canonicalUrl));
  } catch {
    return apiV1Error(
      "internal_error",
      "The API request could not be completed.",
      500,
    );
  }
}

export async function HEAD(request: Request) {
  return apiV1Head(await GET(request));
}

export const OPTIONS = apiV1MethodNotAllowed;
export const POST = apiV1MethodNotAllowed;
export const PUT = apiV1MethodNotAllowed;
export const PATCH = apiV1MethodNotAllowed;
export const DELETE = apiV1MethodNotAllowed;
