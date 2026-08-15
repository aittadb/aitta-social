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
  const body = await readJsonDocument(response);
  const safeMessage = buildProfileSaveMessage(body, fieldErrors);
  return {
    outcome: "definitive-error",
    message: Object.keys(fieldErrors).length
      ? "Identity was not saved. Correct the highlighted fields and try again."
      : `Identity was not saved. ${safeMessage}`,
    fieldErrors,
  };
}

function buildProfileSaveMessage(
  body: unknown,
  fieldErrors: ProfileSaveFailure["fieldErrors"],
): string {
  let safeMessage = "The server rejected this request.";
  if (!isRecord(body) || !isRecord(body.error)) return safeMessage;

  if (typeof body.error.message === "string" && body.error.message.length <= 240) {
    safeMessage = body.error.message;
  }
  if (!Array.isArray(body.error.fields)) return safeMessage;

  for (const item of body.error.fields) {
    if (!isRecord(item) || typeof item.name !== "string" || typeof item.message !== "string") {
      continue;
    }
    const fieldName = profileFieldName(item.name);
    if (fieldName && item.message.length <= 240 && !fieldErrors[fieldName]) {
      fieldErrors[fieldName] = item.message;
    }
  }

  return safeMessage;
}

function isPrivateProfileDocument(value: unknown): value is PrivateProfileDocument {
  const parsed = parseProfileDocument(value);
  if (!parsed) return false;
  if (!isValidProfileAttributes(parsed.attributes)) return false;
  if (!isValidProfileLinks(parsed.links)) return false;
  return isValidProfileAction(parsed.actions[0]);
}

function parseProfileDocument(
  value: unknown,
): { attributes: Record<string, unknown>; links: unknown[]; actions: unknown[] } | null {
  if (!isRecord(value) || !hasExactKeys(value, ["data", "links", "actions"])) return null;
  if (!isRecord(value.data) || !hasExactKeys(value.data, ["id", "type", "attributes"])) return null;
  if (value.data.id !== "profile" || value.data.type !== "owner-profile") return null;
  if (!isRecord(value.data.attributes) || !hasExactKeys(value.data.attributes, [...profileFields])) return null;
  if (!Array.isArray(value.links) || !Array.isArray(value.actions)) return null;

  return {
    attributes: value.data.attributes,
    links: value.links,
    actions: value.actions,
  };
}

function isValidProfileAttributes(attributes: Record<string, unknown>): attributes is Record<string, unknown> {
  return (
    typeof attributes.displayName === "string" &&
    typeof attributes.shortDescription === "string" &&
    typeof attributes.introduction === "string" &&
    (attributes.location === null || typeof attributes.location === "string") &&
    (attributes.website === null || typeof attributes.website === "string") &&
    Array.isArray(attributes.externalLinks) &&
    attributes.externalLinks.every(
      (link) =>
        isRecord(link) &&
        hasExactKeys(link, ["label", "url"]) &&
        typeof link.label === "string" &&
        typeof link.url === "string",
    ) &&
    typeof attributes.canonicalUrl === "string" &&
    typeof attributes.accentColor === "string" &&
    (attributes.density === "comfortable" || attributes.density === "compact") &&
    typeof attributes.hidePoweredBy === "boolean"
  );
}

function isValidProfileLinks(links: unknown[]): boolean {
  if (links.length !== 3) return false;
  const expectedLinks: Array<[string, string]> = [
    ["self", "application/json"],
    ["alternate", "text/html"],
    ["public-profile", "text/html"],
  ];

  return links.every((link, index) => {
    if (!isRecord(link) || !hasExactKeys(link, ["rel", "href", "mediaType"])) return false;
    return link.rel === expectedLinks[index]?.[0] &&
      link.mediaType === expectedLinks[index]?.[1] &&
      typeof link.href === "string";
  });
}

function isValidProfileAction(value: unknown): value is {
  rel: string;
  method: string;
  href: string;
  requestMediaType: string;
} {
  return isRecord(value) &&
    hasExactKeys(value, ["rel", "method", "href", "requestMediaType"]) &&
    value.rel === "edit" &&
    value.method === "PUT" &&
    typeof value.href === "string" &&
    value.requestMediaType === "application/json";
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
