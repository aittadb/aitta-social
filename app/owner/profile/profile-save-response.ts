import {
  type PrivateProfileDocument,
  type PrivateProfileFieldName,
} from "@/lib/private-profile/representation";
import { hasExactKeys, isRecord } from "@/lib/record-shape";

export type ProfileSaveFailure = {
  message: string;
  fieldErrors: Partial<Record<PrivateProfileFieldName, string>>;
};

export type ProfileSaveResponse =
  | { outcome: "success" }
  | { outcome: "unconfirmed" }
  | ({ outcome: "definitive-error" } & ProfileSaveFailure);

const MAX_RESPONSE_BYTES = 64 * 1024;
const profileFields = new Set<string>([
  "displayName",
  "shortDescription",
  "introduction",
  "location",
  "website",
  "externalLinks",
  "canonicalUrl",
  "accentColor",
  "density",
  "hidePoweredBy",
]);

/** Treats an invalid 2xx document as unconfirmed because the write may have landed. */
export async function readProfileSaveResponse(response: Response): Promise<ProfileSaveResponse> {
  if (response.status >= 500) return { outcome: "unconfirmed" };
  if (response.status === 200 && response.ok) {
    const body = await readJsonDocument(response);
    return isPrivateProfileDocument(body)
      ? { outcome: "success" }
      : { outcome: "unconfirmed" };
  }
  if (response.ok) return { outcome: "unconfirmed" };

  const fieldErrors: ProfileSaveFailure["fieldErrors"] = {};
  let safeMessage = "The server rejected this request.";
  const body = await readJsonDocument(response);
  if (isRecord(body) && isRecord(body.error)) {
    if (typeof body.error.message === "string" && body.error.message.length <= 240) {
      safeMessage = body.error.message;
    }
    if (Array.isArray(body.error.fields)) {
      for (const item of body.error.fields) {
        if (!isRecord(item) || typeof item.name !== "string" || typeof item.message !== "string") {
          continue;
        }
        const fieldName = profileFieldName(item.name);
        if (fieldName && item.message.length <= 240 && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = item.message;
        }
      }
    }
  }
  return {
    outcome: "definitive-error",
    message: Object.keys(fieldErrors).length
      ? "Identity was not saved. Correct the highlighted fields and try again."
      : `Identity was not saved. ${safeMessage}`,
    fieldErrors,
  };
}

function isPrivateProfileDocument(value: unknown): value is PrivateProfileDocument {
  if (!isRecord(value) || !hasExactKeys(value, ["data", "links", "actions"])) return false;
  if (!isRecord(value.data) || !hasExactKeys(value.data, ["id", "type", "attributes"])) {
    return false;
  }
  if (value.data.id !== "profile" || value.data.type !== "owner-profile") return false;
  if (
    !isRecord(value.data.attributes) ||
    !hasExactKeys(value.data.attributes, [...profileFields])
  ) {
    return false;
  }
  const attributes = value.data.attributes;
  if (
    typeof attributes.displayName !== "string" ||
    typeof attributes.shortDescription !== "string" ||
    typeof attributes.introduction !== "string" ||
    !(attributes.location === null || typeof attributes.location === "string") ||
    !(attributes.website === null || typeof attributes.website === "string") ||
    !Array.isArray(attributes.externalLinks) ||
    !attributes.externalLinks.every((link) =>
      isRecord(link) &&
      hasExactKeys(link, ["label", "url"]) &&
      typeof link.label === "string" &&
      typeof link.url === "string"
    ) ||
    typeof attributes.canonicalUrl !== "string" ||
    typeof attributes.accentColor !== "string" ||
    !(attributes.density === "comfortable" || attributes.density === "compact") ||
    typeof attributes.hidePoweredBy !== "boolean"
  ) {
    return false;
  }
  if (!Array.isArray(value.links) || value.links.length !== 3) return false;
  const expectedLinks = [
    ["self", "application/json"],
    ["alternate", "text/html"],
    ["public-profile", "text/html"],
  ];
  if (!value.links.every((link, index) =>
    isRecord(link) &&
    hasExactKeys(link, ["rel", "href", "mediaType"]) &&
    link.rel === expectedLinks[index]?.[0] &&
    link.mediaType === expectedLinks[index]?.[1] &&
    typeof link.href === "string"
  )) {
    return false;
  }
  if (!Array.isArray(value.actions)) return false;
  return value.actions.length === 1 && value.actions.every((action: unknown) =>
    isRecord(action) &&
    hasExactKeys(action, ["rel", "method", "href", "requestMediaType"]) &&
    action.rel === "edit" &&
    action.method === "PUT" &&
    typeof action.href === "string" &&
    action.requestMediaType === "application/json"
  );
}

async function readJsonDocument(response: Response): Promise<unknown> {
  if (!/^application\/json\b/iu.test(response.headers.get("content-type") ?? "")) return null;
  try {
    const source = await response.text();
    if (new TextEncoder().encode(source).byteLength > MAX_RESPONSE_BYTES) return null;
    return JSON.parse(source) as unknown;
  } catch {
    return null;
  }
}

function profileFieldName(value: string): PrivateProfileFieldName | null {
  const normalized = value.startsWith("externalLinks.") ? "externalLinks" : value;
  return profileFields.has(normalized) ? normalized as PrivateProfileFieldName : null;
}
