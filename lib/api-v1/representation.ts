export const API_V1_MEDIA_TYPE = "application/json" as const;
export const HTML_MEDIA_TYPE = "text/html" as const;

export type ApiV1Relation =
  | "self"
  | "profile"
  | "collection"
  | "item"
  | "alternate"
  | "first"
  | "previous"
  | "next"
  | "last"
  | "social.aitta.profile"
  | "social.aitta.manifest";

export type ApiV1Link = {
  rel: ApiV1Relation;
  href: string;
  mediaType: typeof API_V1_MEDIA_TYPE | typeof HTML_MEDIA_TYPE;
  templated?: true;
};

export type ApiV1Action = {
  rel: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  href: string;
  requestMediaType: typeof API_V1_MEDIA_TYPE;
};

export type ApiV1Resource<TAttributes extends Record<string, unknown>> = {
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
      apiV1JsonLink("self", `${canonicalUrl}/api/v1`),
      apiV1JsonLink("profile", `${canonicalUrl}/api/v1/schema`),
      apiV1JsonLink("social.aitta.profile", `${canonicalUrl}/api/v1/site`),
      apiV1JsonLink("collection", `${canonicalUrl}/api/v1/entries`),
      {
        ...apiV1JsonLink("item", `${canonicalUrl}/api/v1/entries/{id}`),
        templated: true,
      },
      apiV1JsonLink(
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
          "item",
          "alternate",
          "first",
          "previous",
          "next",
          "last",
          "social.aitta.profile",
          "social.aitta.manifest",
        ],
      },
    },
    links: [
      apiV1JsonLink("self", `${canonicalUrl}/api/v1/schema`),
      apiV1JsonLink("collection", `${canonicalUrl}/api/v1`),
    ],
    actions: [],
  };
}

export function apiV1JsonLink(rel: ApiV1Relation, href: string): ApiV1Link {
  return { rel, href, mediaType: API_V1_MEDIA_TYPE };
}
