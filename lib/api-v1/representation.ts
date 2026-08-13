export const API_V1_MEDIA_TYPE = "application/json" as const;
export const HTML_MEDIA_TYPE = "text/html" as const;

export type ApiV1Relation =
  | "self"
  | "profile"
  | "collection"
  | "social.aitta.profile"
  | "social.aitta.manifest";

export type ApiV1Link = {
  rel: ApiV1Relation;
  href: string;
  mediaType: typeof API_V1_MEDIA_TYPE | typeof HTML_MEDIA_TYPE;
};

export type ApiV1Action = {
  rel: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  href: string;
  requestMediaType: typeof API_V1_MEDIA_TYPE;
};

type ApiV1Resource<TAttributes extends Record<string, unknown>> = {
  id: string;
  type: string;
  attributes: TAttributes;
};

export type ApiV1Document<TAttributes extends Record<string, unknown>> = {
  data: ApiV1Resource<TAttributes>;
  links: ApiV1Link[];
  actions: ApiV1Action[];
};

export type ApiV1ErrorDocument = {
  data: null;
  error: {
    code: string;
    message: string;
  };
  links: ApiV1Link[];
};

export function apiV1RootDocument(canonicalUrl: string): ApiV1Document<{
  name: "AittaSocial";
  version: 1;
}> {
  return {
    data: {
      id: "aitta-social-api",
      type: "api",
      attributes: { name: "AittaSocial", version: 1 },
    },
    links: [
      jsonLink("self", `${canonicalUrl}/api/v1`),
      jsonLink("profile", `${canonicalUrl}/api/v1/schema`),
      jsonLink("social.aitta.profile", `${canonicalUrl}/api/v1/site`),
      jsonLink(
        "social.aitta.manifest",
        `${canonicalUrl}/.well-known/aitta-social.json`,
      ),
    ],
    actions: [],
  };
}

export function apiV1SchemaDocument(canonicalUrl: string): ApiV1Document<{
  version: 1;
  representation: "aitta-social-json-api-v1";
  relations: ApiV1Relation[];
}> {
  return {
    data: {
      id: "aitta-social-api-profile",
      type: "api-profile",
      attributes: {
        version: 1,
        representation: "aitta-social-json-api-v1",
        relations: [
          "self",
          "profile",
          "collection",
          "social.aitta.profile",
          "social.aitta.manifest",
        ],
      },
    },
    links: [
      jsonLink("self", `${canonicalUrl}/api/v1/schema`),
      jsonLink("collection", `${canonicalUrl}/api/v1`),
    ],
    actions: [],
  };
}

function jsonLink(rel: ApiV1Relation, href: string): ApiV1Link {
  return { rel, href, mediaType: API_V1_MEDIA_TYPE };
}
