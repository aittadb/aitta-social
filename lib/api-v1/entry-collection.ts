import type { Entry } from "../types";
import { rfc6570PathSegment } from "../rfc6570-path-segment";
import {
  apiV1JsonLink,
  type ApiV1Action,
  type ApiV1Link,
  type ApiV1Resource,
} from "./representation";

export type ApiV1EntryAttributes = {
  kind: Entry["kind"];
  title?: string;
  body: string;
  destinationUrl?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiV1EntryCollectionDocument = {
  data: Array<ApiV1Resource<ApiV1EntryAttributes>>;
  pagination: {
    page: number;
    pageSize: number;
  };
  links: ApiV1Link[];
  actions: ApiV1Action[];
};

type EntryCollectionInput = {
  entries: Entry[];
  publishedCount: number;
  page: number;
  pageSize: number;
  canonicalUrl: string;
};

/** Builds the explicit published-only collection projection for v1 clients. */
export function apiV1EntryCollectionDocument({
  entries,
  publishedCount,
  page,
  pageSize,
  canonicalUrl,
}: EntryCollectionInput): ApiV1EntryCollectionDocument {
  const lastPage = Math.max(1, Math.ceil(publishedCount / pageSize));
  const pageUrl = (targetPage: number) => {
    const target = new URL(`${canonicalUrl}/api/v1/entries`);
    target.searchParams.set("page", String(targetPage));
    target.searchParams.set("pageSize", String(pageSize));
    return target.toString();
  };
  const data = entries.map(apiV1EntryResource);
  const links: ApiV1Link[] = [
    apiV1JsonLink("self", pageUrl(page)),
    apiV1JsonLink("first", pageUrl(1)),
    ...(page > 1 ? [apiV1JsonLink("previous", pageUrl(page - 1))] : []),
    ...(page < lastPage ? [apiV1JsonLink("next", pageUrl(page + 1))] : []),
    apiV1JsonLink("last", pageUrl(lastPage)),
    ...data.map((resource) =>
      apiV1JsonLink(
        "item",
        `${canonicalUrl}/api/v1/entries/${rfc6570PathSegment(resource.id)}`,
      )
    ),
    apiV1JsonLink("profile", `${canonicalUrl}/api/v1/schema`),
    apiV1JsonLink("social.aitta.profile", `${canonicalUrl}/api/v1/site`),
  ];

  return {
    data,
    pagination: { page, pageSize },
    links,
    actions: [],
  };
}

export function apiV1EntryResource(
  entry: Entry,
): ApiV1Resource<ApiV1EntryAttributes> {
  return {
    id: entry.id,
    type: "entry",
    attributes: {
      kind: entry.kind,
      ...(entry.title ? { title: entry.title } : {}),
      body: entry.body,
      ...(entry.destinationUrl ? { destinationUrl: entry.destinationUrl } : {}),
      ...(entry.publishedAt ? { publishedAt: entry.publishedAt } : {}),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    },
  };
}
