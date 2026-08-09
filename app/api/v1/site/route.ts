import { getProfile } from "@/db/repository";
import { publicJsonError } from "@/lib/http";
import { publicSiteResource, resolveCanonicalUrl } from "@/lib/public-resources";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return publicJsonError("profile_not_configured", "The account profile has not been configured.", 404);
  const canonicalUrl = resolveCanonicalUrl(profile);
  if (!canonicalUrl) return publicJsonError("canonical_url_unconfigured", "Canonical URL is not configured.", 503);
  return Response.json(publicSiteResource(profile, canonicalUrl), {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
