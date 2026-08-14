import { ownerBrowserRequest, type OwnerBrowserTransport } from "../owner-browser-request";

export type EntrySaveRequestBody = {
  kind: FormDataEntryValue | null;
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  destinationUrl: FormDataEntryValue | null;
};

export function createEntryRequest(body: EntrySaveRequestBody, transport?: OwnerBrowserTransport): Promise<Response> {
  return ownerBrowserRequest("/api/private/entries", jsonRequest("POST", body), transport);
}

export function editEntryRequest(id: string, body: EntrySaveRequestBody, transport?: OwnerBrowserTransport): Promise<Response> {
  return ownerBrowserRequest(`/api/private/entries/${encodeURIComponent(id)}`, jsonRequest("PUT", body), transport);
}

export function changeEntryStateRequest(
  id: string,
  state: "draft" | "published",
  transport?: OwnerBrowserTransport,
): Promise<Response> {
  return ownerBrowserRequest(
    `/api/private/entries/${encodeURIComponent(id)}/state`,
    jsonRequest("PUT", { state }),
    transport,
  );
}

export function deleteEntryRequest(id: string, transport?: OwnerBrowserTransport): Promise<Response> {
  return ownerBrowserRequest(`/api/private/entries/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    redirect: "error",
  }, transport);
}

function jsonRequest(method: "POST" | "PUT", body: object): RequestInit {
  return {
    method,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
