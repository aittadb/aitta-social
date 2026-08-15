/** Create a fresh owner-entry deletion acknowledgement envelope. */
export function deletionAcknowledgement(id) {
  return {
    data: { id, type: "owner-entry-deletion", attributes: { deleted: true } },
    links: [
      { rel: "collection", href: "/owner", mediaType: "text/html" },
      { rel: "recovery", href: "/owner", mediaType: "text/html" },
    ],
    actions: [],
  };
}
