import type { Entry } from "../types";
import { rfc6570PathSegment } from "../rfc6570-path-segment";
import {
  apiV1EntryResource,
  type ApiV1EntryAttributes,
} from "./entry-collection";
import {
  apiV1JsonLink,
  type ApiV1Document,
  type ApiV1Link,
  HTML_MEDIA_TYPE,
} from "./representation";

/** Builds the explicit published-entry detail projection for v1 clients. */
export function apiV1EntryDetailDocument(
  entry: Entry,
  canonicalUrl: string,
): ApiV1Document<ApiV1EntryAttributes> {
  const encodedId = rfc6570PathSegment(entry.id);
  const links: ApiV1Link[] = [
    apiV1JsonLink("self", `${canonicalUrl}/api/v1/entries/${encodedId}`),
    apiV1JsonLink("collection", `${canonicalUrl}/api/v1/entries`),
    apiV1JsonLink("profile", `${canonicalUrl}/api/v1/schema`),
    {
      rel: "alternate",
      href: `${canonicalUrl}/entries/${encodedId}`,
      mediaType: HTML_MEDIA_TYPE,
    },
  ];

  return {
    data: apiV1EntryResource(entry),
    links,
    actions: [],
  };
}
