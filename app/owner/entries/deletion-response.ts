import {
  isPrivateEntryErrorDocument,
  readPrivateEntryResponseJson,
} from "./draft-create-response";
import { isOwnerEntryJsonResponseMediaType } from "./json-response-media-type";
import { hasExactKeys, isRecord } from "@/lib/record-shape";

export type DeletionResponse =
  | { outcome: "success" }
  | { outcome: "unconfirmed" }
  | { outcome: "definitive-error"; message: string };

/** Confirms only the fixed deletion acknowledgement for this update. */
export async function readDeletionResponse(
  response: Response,
  expectedId: string,
): Promise<DeletionResponse> {
  if (response.redirected || response.status >= 500 || !isOwnerEntryJsonResponseMediaType(response.headers.get("content-type"))) {
    return { outcome: "unconfirmed" };
  }
  if (response.status === 200 && response.ok) {
    const body = await readPrivateEntryResponseJson(response);
    return isDeletionAcknowledgement(body, expectedId)
      ? { outcome: "success" }
      : { outcome: "unconfirmed" };
  }
  if (response.ok || response.status < 400 || response.status > 499) {
    return { outcome: "unconfirmed" };
  }
  const body = await readPrivateEntryResponseJson(response);
  return isPrivateEntryErrorDocument(body)
    ? { outcome: "definitive-error", message: body.error.message }
    : { outcome: "unconfirmed" };
}

function isDeletionAcknowledgement(value: unknown, expectedId: string): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ["data", "links", "actions"])) return false;
  if (!isRecord(value.data) || !hasExactKeys(value.data, ["id", "type", "attributes"])) return false;
  if (value.data.id !== expectedId || value.data.type !== "owner-entry-deletion") return false;
  if (!isRecord(value.data.attributes) || !hasExactKeys(value.data.attributes, ["deleted"]) || value.data.attributes.deleted !== true) {
    return false;
  }
  if (!Array.isArray(value.links) || value.links.length !== 2) return false;
  const [collection, recovery] = value.links;
  return isLink(collection, "collection") && isLink(recovery, "recovery") &&
    Array.isArray(value.actions) && value.actions.length === 0;
}

function isLink(value: unknown, rel: "collection" | "recovery"): boolean {
  return isRecord(value) && hasExactKeys(value, ["rel", "href", "mediaType"]) &&
    value.rel === rel && value.href === "/owner" && value.mediaType === "text/html";
}
