import { saveProfile } from "@/db/repository";
import { apiV1CanonicalUrl } from "@/lib/api-v1/canonical";
import { requireOwnerApi } from "@/lib/auth";
import { privateProfileDocument } from "@/lib/private-profile/representation";
import {
  privateProfileAuthorizationError,
  privateProfileError,
  privateProfileMethodNotAllowed,
  privateProfileNegotiationError,
  privateProfileRequestError,
  privateProfileSuccess,
  readPrivateProfileJson,
} from "@/lib/private-profile/request-response";
import { parseProfileInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    return await putPrivateProfile(request);
  } catch {
    return privateProfileError(
      "save_failed",
      "The Identity save result could not be confirmed.",
      500,
    );
  }
}

async function putPrivateProfile(request: Request): Promise<Response> {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return privateProfileAuthorizationError(auth.response.status);

  const negotiationError = privateProfileNegotiationError(request);
  if (negotiationError) return negotiationError;
  try {
    const input = parseProfileInput(await readPrivateProfileJson(request));
    const profile = await saveProfile(input);
    const canonicalUrl = apiV1CanonicalUrl(profile.canonicalUrl);
    if (!canonicalUrl) {
      return privateProfileError(
        "canonical_url_unavailable",
        "The saved profile could not be represented safely.",
        500,
      );
    }
    return privateProfileSuccess(privateProfileDocument(profile, canonicalUrl));
  } catch (error) {
    const response = privateProfileRequestError(error);
    if (response) return response;
    throw error;
  }
}

export const GET = privateProfileMethodNotAllowed;
export const HEAD = privateProfileMethodNotAllowed;
export const POST = privateProfileMethodNotAllowed;
export const PATCH = privateProfileMethodNotAllowed;
export const DELETE = privateProfileMethodNotAllowed;
export const OPTIONS = privateProfileMethodNotAllowed;
