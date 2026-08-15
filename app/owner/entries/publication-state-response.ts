import type { EntryState } from "@/lib/constants";
import { isOwnerEntryJsonResponseMediaType } from "./json-response-media-type";
import {
  isPrivateEntryDocument,
  isPrivateEntryErrorDocument,
  readPrivateEntryResponseJson,
} from "./draft-create-response";

export type PublicationStateResponse =
  | { outcome: "success" }
  | { outcome: "unconfirmed" }
  | { outcome: "definitive-error"; message: string };

/** Confirms only the exact entry and publication state requested by this page. */
export async function readPublicationStateResponse(
  response: Response,
  expected: { id: string; state: EntryState },
): Promise<PublicationStateResponse> {
  if (response.status >= 500) return { outcome: "unconfirmed" };
  if (!isOwnerEntryJsonResponseMediaType(response.headers.get("content-type"))) {
    return { outcome: "unconfirmed" };
  }
  if (response.status === 200 && response.ok) {
    const body = await readPrivateEntryResponseJson(response);
    return isPrivateEntryDocument(body, expected)
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
