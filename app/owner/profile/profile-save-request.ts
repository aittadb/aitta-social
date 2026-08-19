import { ownerBrowserRequest, type OwnerBrowserTransport } from "../owner-browser-request";

export type ProfileSaveRequestBody = {
  displayName: FormDataEntryValue | null;
  shortDescription: FormDataEntryValue | null;
  introduction: FormDataEntryValue | null;
  location: FormDataEntryValue | null;
  website: FormDataEntryValue | null;
  externalLinks: Array<{ label: string; url: string }>;
  canonicalUrl: FormDataEntryValue | null;
  accentColor: FormDataEntryValue | null;
  density: FormDataEntryValue | null;
  hidePoweredBy: boolean;
};

export function saveProfileRequest(body: ProfileSaveRequestBody, transport?: OwnerBrowserTransport): Promise<Response> {
  return ownerBrowserRequest("/api/private/profile", {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, transport);
}
