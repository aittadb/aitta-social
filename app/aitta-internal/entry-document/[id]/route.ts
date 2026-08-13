import { getEntry, getProfile } from "@/db/repository";
import { publicEntryCanonicalUrl } from "@/lib/public-entry-document/canonical";
import {
  ENTRY_DOCUMENT_DISPATCH_HEADER,
  ENTRY_DOCUMENT_DISPATCH_VALUE,
} from "@/lib/public-entry-document/dispatch";
import { publicEntryDocument } from "@/lib/public-entry-document/representation";
import {
  publicEntryDocumentError,
  publicEntryDocumentHead,
  publicEntryDocumentJsonResponse,
} from "@/lib/public-entry-document/response";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isWorkerDispatch(request)) return unavailableInternalRoute();

  try {
    const { id } = await params;
    if (id.includes("/")) return entryNotFound();
    const profile = await getProfile();
    if (!profile) {
      return publicEntryDocumentError(
        "profile_not_configured",
        "The Aitta profile has not been configured.",
        404,
      );
    }
    const canonicalUrl = publicEntryCanonicalUrl(profile.canonicalUrl);
    if (!canonicalUrl) {
      return publicEntryDocumentError(
        "canonical_url_unconfigured",
        "Canonical URL is not configured.",
        503,
      );
    }
    const entry = await getEntry(id, true);
    if (!entry) return entryNotFound();
    return publicEntryDocumentJsonResponse(publicEntryDocument(entry, canonicalUrl));
  } catch {
    return publicEntryDocumentError(
      "internal_error",
      "The API request could not be completed.",
      500,
    );
  }
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return publicEntryDocumentHead(await GET(request, context));
}

function isWorkerDispatch(request: Request): boolean {
  return request.headers.get(ENTRY_DOCUMENT_DISPATCH_HEADER) ===
    ENTRY_DOCUMENT_DISPATCH_VALUE;
}

function unavailableInternalRoute(): Response {
  return new Response(null, {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

function entryNotFound(): Response {
  return publicEntryDocumentError(
    "entry_not_found",
    "Published entry not found.",
    404,
  );
}
