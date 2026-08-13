import type { Entry } from "../types";

const PRIVATE_ENTRY_MEDIA_TYPE = "application/json" as const;

export type PrivateEntryFieldName = "kind" | "title" | "body" | "destinationUrl";

type PrivateEntryAttributes = Pick<
  Entry,
  | PrivateEntryFieldName
  | "state"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
>;

type PrivateEntryLink = {
  rel: "self" | "alternate";
  href: string;
  mediaType: "application/json" | "text/html";
};

type PrivateEntryAction =
  | {
      rel: "edit" | "publish" | "unpublish";
      method: "PUT";
      href: string;
      requestMediaType: typeof PRIVATE_ENTRY_MEDIA_TYPE;
    }
  | {
      rel: "delete";
      method: "DELETE";
      href: string;
    };

export type PrivateEntryDocument = {
  data: {
    id: string;
    type: "owner-entry";
    attributes: PrivateEntryAttributes;
  };
  links: PrivateEntryLink[];
  actions: PrivateEntryAction[];
};

export type PrivateEntryErrorField = {
  name: string;
  code: "invalid";
  message: string;
};

export type PrivateEntryErrorDocument = {
  data: null;
  error: {
    code: string;
    message: string;
    fields?: PrivateEntryErrorField[];
  };
  links: [];
};

export type PrivateEntryDeletionDocument = {
  data: {
    id: string;
    type: "owner-entry-deletion";
    attributes: { deleted: true };
  };
  links: [
    { rel: "collection"; href: "/owner"; mediaType: "text/html" },
    { rel: "recovery"; href: "/owner"; mediaType: "text/html" },
  ];
  actions: [];
};

/** Projects only the private update facts required by the verified owner client. */
export function privateEntryDocument(
  entry: Entry,
): PrivateEntryDocument {
  const encodedId = privateEntryIdPathSegment(entry.id);
  const self = `/api/private/entries/${encodedId}`;
  const state = `${self}/state`;
  return {
    data: {
      id: entry.id,
      type: "owner-entry",
      attributes: {
        kind: entry.kind,
        title: entry.title,
        body: entry.body,
        destinationUrl: entry.destinationUrl,
        state: entry.state,
        publishedAt: entry.publishedAt,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    },
    links: [
      { rel: "self", href: self, mediaType: PRIVATE_ENTRY_MEDIA_TYPE },
      {
        rel: "alternate",
        href: `/owner/entries/${encodedId}`,
        mediaType: "text/html",
      },
    ],
    actions: [
      {
        rel: "edit",
        method: "PUT",
        href: self,
        requestMediaType: PRIVATE_ENTRY_MEDIA_TYPE,
      },
      {
        rel: entry.state === "published" ? "unpublish" : "publish",
        method: "PUT",
        href: state,
        requestMediaType: PRIVATE_ENTRY_MEDIA_TYPE,
      },
      { rel: "delete", method: "DELETE", href: self },
    ],
  };
}

/** A deleted update has no private self resource; only safe owner destinations remain. */
export function privateEntryDeletionDocument(id: string): PrivateEntryDeletionDocument {
  return {
    data: {
      id,
      type: "owner-entry-deletion",
      attributes: { deleted: true },
    },
    links: [
      { rel: "collection", href: "/owner", mediaType: "text/html" },
      { rel: "recovery", href: "/owner", mediaType: "text/html" },
    ],
    actions: [],
  };
}

function privateEntryIdPathSegment(id: string): string {
  return encodeURIComponent(id).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}
