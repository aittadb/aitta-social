import { getProfile } from "@/db/repository";
import {
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  SOFTWARE_NAME,
  SOFTWARE_VERSION,
} from "@/lib/constants";
import { resolveCanonicalUrl, withoutTrailingSlash } from "@/lib/public-resources";
import { getRuntimeSettings } from "@/lib/runtime";
import { publicJsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getProfile();
  if (!profile) return publicJsonError("profile_not_configured", "The account profile has not been configured.", 404);
  const resolvedCanonicalUrl = resolveCanonicalUrl(profile);
  if (!resolvedCanonicalUrl) return publicJsonError("canonical_url_unconfigured", "Canonical URL is not configured.", 503);
  const canonicalUrl = withoutTrailingSlash(resolvedCanonicalUrl);
  const challenge = getRuntimeSettings().hubChallenge;
  return Response.json(
    {
      protocol: PROTOCOL_NAME,
      protocolVersion: PROTOCOL_VERSION,
      software: { name: SOFTWARE_NAME, version: SOFTWARE_VERSION },
      canonicalUrl,
      endpoints: {
        api: `${canonicalUrl}/api/v1`,
        profile: `${canonicalUrl}/api/v1/site`,
        entries: `${canonicalUrl}/api/v1/entries`,
        entryTemplate: `${canonicalUrl}/api/v1/entries/{id}`,
      },
      accountType: profile.accountType,
      ...(challenge ? { hubVerificationChallenge: challenge } : {}),
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
