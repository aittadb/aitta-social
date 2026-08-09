import { getEntry, getProfile } from "@/db/repository";
import { publicJsonError } from "@/lib/http";
import { publicEntryResource, resolveCanonicalUrl } from "@/lib/public-resources";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) return publicJsonError("profile_not_configured", "The account profile has not been configured.", 404);
  const canonicalUrl = resolveCanonicalUrl(profile);
  if (!canonicalUrl) return publicJsonError("canonical_url_unconfigured", "Canonical URL is not configured.", 503);
  const entry = await getEntry(id, true);
  if (!entry) return publicJsonError("entry_not_found", "Published entry not found.", 404);
  return Response.json(
    { data: publicEntryResource(entry, canonicalUrl) },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
