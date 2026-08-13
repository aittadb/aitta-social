import { requireOwnerApi } from "@/lib/auth";
import { compilePagePreview, PagePreviewValidationError } from "@/lib/custom-pages/html-fragment-compiler";
import { PageImportRejectedError } from "@/lib/custom-pages/page-document";
import {
  PagePreviewRequestError,
  pagePreviewAuthorizationError,
  pagePreviewError,
  pagePreviewNegotiationError,
  pagePreviewSuccess,
  readPagePreviewJson,
} from "@/lib/custom-pages/preview-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireOwnerApi(request);
    if (!auth.ok) return pagePreviewAuthorizationError(auth.response.status);

    const negotiationError = pagePreviewNegotiationError(request);
    if (negotiationError) return negotiationError;

    try {
      const document = compilePagePreview(await readPagePreviewJson(request));
      return pagePreviewSuccess(document);
    } catch (error) {
      if (error instanceof PagePreviewRequestError) {
        return pagePreviewError(error.code, error.message, error.status);
      }
      if (error instanceof PagePreviewValidationError) {
        return pagePreviewError(
          "validation_failed",
          "The submitted page preview values are invalid.",
          422,
          { fields: error.fields.map((name) => ({ name, code: "invalid" })) },
        );
      }
      if (error instanceof PageImportRejectedError) {
        return pagePreviewError(
          "import_rejected",
          "The HTML fragment could not be safely imported.",
          422,
        );
      }
      throw error;
    }
  } catch {
    return pagePreviewError(
      "preview_failed",
      "The page preview is temporarily unavailable.",
      500,
    );
  }
}

async function methodNotAllowed(request: Request): Promise<Response> {
  try {
    const auth = await requireOwnerApi(request);
    if (!auth.ok) return pagePreviewAuthorizationError(auth.response.status);
    return pagePreviewError(
      "method_not_allowed",
      "The request method is not supported for this private API resource.",
      405,
      { headers: { Allow: "POST" } },
    );
  } catch {
    return pagePreviewError(
      "preview_failed",
      "The page preview is temporarily unavailable.",
      500,
    );
  }
}

export const GET = methodNotAllowed;
export const HEAD = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
