import type { Entry } from "../types";
import {
  apiV1EntryIdPathSegment,
  apiV1EntryResource,
} from "../api-v1/entry-collection";

const JSON_MEDIA_TYPE = "application/json" as const;
const HTML_MEDIA_TYPE = "text/html" as const;

type PublicEntryDocumentLink = {
  rel: "self" | "collection" | "profile" | "alternate";
  href: string;
  mediaType: typeof JSON_MEDIA_TYPE | typeof HTML_MEDIA_TYPE;
};

export type PublicEntryDocument = {
  data: ReturnType<typeof apiV1EntryResource>;
  links: PublicEntryDocumentLink[];
  actions: [];
};

/** Builds today's allowlisted hypermedia representation for one public update. */
export function publicEntryDocument(
  entry: Entry,
  canonicalUrl: string,
): PublicEntryDocument {
  const encodedId = apiV1EntryIdPathSegment(entry.id);
  const documentHref = `${canonicalUrl}/entries/${encodedId}`;
  const links: PublicEntryDocumentLink[] = [
    jsonLink("self", documentHref),
    jsonLink("collection", `${canonicalUrl}/api/v1/entries`),
    jsonLink("profile", `${canonicalUrl}/api/v1/schema`),
    { rel: "alternate", href: documentHref, mediaType: HTML_MEDIA_TYPE },
  ];

  return {
    data: apiV1EntryResource(entry),
    links,
    actions: [],
  };
}

function jsonLink(
  rel: Exclude<PublicEntryDocumentLink["rel"], "alternate">,
  href: string,
): PublicEntryDocumentLink {
  return { rel, href, mediaType: JSON_MEDIA_TYPE };
}
