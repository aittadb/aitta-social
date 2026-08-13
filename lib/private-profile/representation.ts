import type { Profile } from "../types";

export const PRIVATE_PROFILE_MEDIA_TYPE = "application/json" as const;

export const PRIVATE_PROFILE_FIELD_NAMES = [
  "displayName",
  "shortDescription",
  "introduction",
  "location",
  "website",
  "externalLinks",
  "canonicalUrl",
  "accentColor",
  "density",
  "hidePoweredBy",
] as const;

export type PrivateProfileFieldName = (typeof PRIVATE_PROFILE_FIELD_NAMES)[number];

export type PrivateProfileAttributes = Pick<
  Profile,
  PrivateProfileFieldName
>;

export type PrivateProfileLink = {
  rel: "self" | "alternate" | "public-profile";
  href: string;
  mediaType: "application/json" | "text/html";
};

export type PrivateProfileAction = {
  rel: "edit";
  method: "PUT";
  href: string;
  requestMediaType: typeof PRIVATE_PROFILE_MEDIA_TYPE;
};

export type PrivateProfileDocument = {
  data: {
    id: "profile";
    type: "owner-profile";
    attributes: PrivateProfileAttributes;
  };
  links: PrivateProfileLink[];
  actions: PrivateProfileAction[];
};

export type PrivateProfileErrorField = {
  name: string;
  code: "invalid";
  message: string;
};

export type PrivateProfileErrorDocument = {
  data: null;
  error: {
    code: string;
    message: string;
    fields?: PrivateProfileErrorField[];
  };
  links: [];
};

/** Projects only owner-editable profile fields; protocol compatibility fields stay private. */
export function privateProfileDocument(
  profile: Profile,
  canonicalUrl: string,
): PrivateProfileDocument {
  const self = `${canonicalUrl}/api/private/profile`;
  return {
    data: {
      id: "profile",
      type: "owner-profile",
      attributes: {
        displayName: profile.displayName,
        shortDescription: profile.shortDescription,
        introduction: profile.introduction,
        location: profile.location,
        website: profile.website,
        externalLinks: profile.externalLinks.map(({ label, url }) => ({ label, url })),
        canonicalUrl: profile.canonicalUrl,
        accentColor: profile.accentColor,
        density: profile.density,
        hidePoweredBy: profile.hidePoweredBy,
      },
    },
    links: [
      { rel: "self", href: self, mediaType: PRIVATE_PROFILE_MEDIA_TYPE },
      { rel: "alternate", href: `${canonicalUrl}/owner/profile`, mediaType: "text/html" },
      { rel: "public-profile", href: canonicalUrl, mediaType: "text/html" },
    ],
    actions: [{
      rel: "edit",
      method: "PUT",
      href: self,
      requestMediaType: PRIVATE_PROFILE_MEDIA_TYPE,
    }],
  };
}
