import { getProfile, listPublishedEntries } from "@/db/repository";
import { publicJsonError, validationResponse } from "@/lib/http";
import {
  publicEntryResource,
  resolveCanonicalUrl,
  withoutTrailingSlash,
} from "@/lib/public-resources";
import { parsePagination, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, pageSize } = parsePagination(url);
    const profile = await getProfile();
    if (!profile) return publicJsonError("profile_not_configured", "The account profile has not been configured.", 404);
    const canonicalUrl = resolveCanonicalUrl(profile);
    if (!canonicalUrl) return publicJsonError("canonical_url_unconfigured", "Canonical URL is not configured.", 503);
    const base = withoutTrailingSlash(canonicalUrl);
    const { entries, hasMore } = await listPublishedEntries(
      pageSize,
      (page - 1) * pageSize,
    );
    const collectionUrl = new URL(`${base}/api/v1/entries`);
    collectionUrl.searchParams.set("page", String(page));
    collectionUrl.searchParams.set("pageSize", String(pageSize));
    const pageUrl = (targetPage: number) => {
      const target = new URL(collectionUrl);
      target.searchParams.set("page", String(targetPage));
      return target.toString();
    };
    return Response.json(
      {
        data: entries.map((entry) => publicEntryResource(entry, canonicalUrl)),
        pagination: { page, pageSize, hasMore },
        links: {
          self: pageUrl(page),
          ...(page > 1 ? { previous: pageUrl(page - 1) } : {}),
          ...(hasMore ? { next: pageUrl(page + 1) } : {}),
          site: `${base}/api/v1/site`,
        },
      },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      return publicJsonError(
        "invalid_pagination",
        "page must be at least 1 and pageSize must be between 1 and 50.",
        400,
      );
    }
    const response = validationResponse(error);
    if (response) return response;
    throw error;
  }
}
