import type { Profile } from "../types";
import {
  API_V1_MEDIA_TYPE,
  HTML_MEDIA_TYPE,
  type ApiV1Document,
} from "./representation";

export type ApiV1ProfileAttributes = {
  displayName: string;
  accountType: Profile["accountType"];
  shortDescription: string;
  introduction: string;
  location?: string;
  website?: string;
  externalLinks: Array<{ label: string; url: string }>;
  canonicalUrl: string;
  presentation: {
    accentColor: string;
    density: Profile["density"];
    showPoweredBy: boolean;
  };
};

/** Builds the explicit public profile projection for the prerelease v1 API. */
export function apiV1ProfileDocument(
  profile: Profile,
  canonicalUrl: string,
): ApiV1Document<ApiV1ProfileAttributes> {
  return {
    data: {
      id: "profile",
      type: "profile",
      attributes: {
        displayName: profile.displayName,
        accountType: profile.accountType,
        shortDescription: profile.shortDescription,
        introduction: profile.introduction,
        ...(profile.location ? { location: profile.location } : {}),
        ...(profile.website ? { website: profile.website } : {}),
        externalLinks: profile.externalLinks.map(({ label, url }) => ({ label, url })),
        canonicalUrl,
        presentation: {
          accentColor: profile.accentColor,
          density: profile.density,
          showPoweredBy: !profile.hidePoweredBy,
        },
      },
    },
    links: [
      profileLink("self", `${canonicalUrl}/api/v1/site`, API_V1_MEDIA_TYPE),
      profileLink("profile", `${canonicalUrl}/api/v1/schema`, API_V1_MEDIA_TYPE),
      profileLink("social.aitta.profile", canonicalUrl, HTML_MEDIA_TYPE),
    ],
    actions: [],
  };
}

function profileLink(
  rel: "self" | "profile" | "social.aitta.profile",
  href: string,
  mediaType: typeof API_V1_MEDIA_TYPE | typeof HTML_MEDIA_TYPE,
) {
  return { rel, href, mediaType } as const;
}
