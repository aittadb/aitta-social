import type { EntryKind, EntryState } from "@/lib/constants";
import type { PrivateEntryFieldName } from "@/lib/private-entry/representation";
import {
  isPrivateEntryDocument,
  isPrivateEntryErrorDocument,
  readPrivateEntryResponseJson,
} from "./draft-create-response";

export type EntryEditFailure = {
  message: string;
  fieldErrors: Partial<Record<PrivateEntryFieldName, string>>;
};

export type EntryEditResponse =
  | { outcome: "success" }
  | { outcome: "unconfirmed" }
  | ({ outcome: "definitive-error" } & EntryEditFailure);

const entryFields = new Set<string>(["kind", "title", "body", "destinationUrl"]);

/** Confirms only an exact 200 document for the entry and publication state being edited. */
export async function readEntryEditResponse(
  response: Response,
  expected: {
    id: string;
    state: EntryState;
    kind: EntryKind;
    title: string | null;
    body: string;
    destinationUrl: string | null;
  },
): Promise<EntryEditResponse> {
  if (response.status >= 500) return { outcome: "unconfirmed" };
  if (response.status === 200 && response.ok) {
    const body = await readPrivateEntryResponseJson(response);
    return isPrivateEntryDocument(body, expected) &&
        body.data.attributes.kind === expected.kind &&
        body.data.attributes.title === expected.title &&
        body.data.attributes.body === expected.body &&
        body.data.attributes.destinationUrl === expected.destinationUrl
      ? { outcome: "success" }
      : { outcome: "unconfirmed" };
  }
  if (response.ok || response.status < 400 || response.status > 499) {
    return { outcome: "unconfirmed" };
  }

  const body = await readPrivateEntryResponseJson(response);
  if (!isPrivateEntryErrorDocument(body)) return { outcome: "unconfirmed" };
  const fieldErrors: EntryEditFailure["fieldErrors"] = {};
  if (body.error.fields) {
    for (const item of body.error.fields) {
      const fieldName = entryFieldName(item.name);
      if (fieldName && !fieldErrors[fieldName]) {
        fieldErrors[fieldName] = item.message;
      }
    }
  }
  return {
    outcome: "definitive-error",
    message: Object.keys(fieldErrors).length
      ? "Update was not saved. Correct the highlighted fields and try again."
      : `Update was not saved. ${body.error.message}`,
    fieldErrors,
  };
}

function entryFieldName(value: string): PrivateEntryFieldName | null {
  const normalized = value === "entryKind" ? "kind" : value;
  return entryFields.has(normalized) ? normalized as PrivateEntryFieldName : null;
}
