import { ownerBrowserRequest, type OwnerBrowserTransport } from "../../owner-browser-request";

export type PagePreviewRequestBody = {
  schemaVersion: 1;
  title: FormDataEntryValue | null;
  description: FormDataEntryValue | null;
  htmlFragment: FormDataEntryValue | null;
};

export function previewPageRequest(body: PagePreviewRequestBody, transport?: OwnerBrowserTransport): Promise<Response> {
  return ownerBrowserRequest("/api/private/pages/preview", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, transport);
}
