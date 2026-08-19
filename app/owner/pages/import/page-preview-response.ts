import {
  parsePagePreviewDocument,
} from "@/lib/custom-pages/preview-api";
import type { PageDocumentV1 } from "@/lib/custom-pages/page-document";
import { readBoundedPagePreviewJson } from "@/lib/custom-pages/bounded-json-response";
import { isRecord } from "@/lib/record-shape";

export type PagePreviewResult =
  | { outcome: "success"; document: PageDocumentV1 }
  | { outcome: "error"; message: string; fields: Partial<Record<PreviewFieldName, string>> };

export type PreviewFieldName = "schemaVersion" | "title" | "description" | "htmlFragment";

const fieldNames = new Set<PreviewFieldName>([
  "schemaVersion",
  "title",
  "description",
  "htmlFragment",
]);

export async function readPagePreviewResponse(response: Response): Promise<PagePreviewResult> {
  const body = await readBoundedPagePreviewJson(response);
  if (response.status === 200 && response.ok) {
    const document = parsePagePreviewDocument(body);
    return document
      ? { outcome: "success", document }
      : safeError("The normalized preview response could not be verified.");
  }
  if (response.ok) return safeError("The normalized preview response could not be verified.");

  const fields: Partial<Record<PreviewFieldName, string>> = {};
  let message = response.status >= 500
    ? "The page preview is temporarily unavailable."
    : "The page preview request was rejected.";
  if (isRecord(body) && isRecord(body.error)) {
    if (typeof body.error.message === "string" && body.error.message.length <= 240) {
      message = body.error.message;
    }
    if (Array.isArray(body.error.fields)) {
      for (const item of body.error.fields) {
        if (!isRecord(item) || typeof item.name !== "string") continue;
        const name = previewFieldName(item.name);
        if (name && !fields[name]) fields[name] = "Correct this value and try again.";
      }
    }
    if (body.error.code === "import_rejected" && !fields.htmlFragment) {
      fields.htmlFragment = "Review the fragment structure and supported markup, then try again.";
    }
  }
  return { outcome: "error", message, fields };
}

function safeError(message: string): PagePreviewResult {
  return { outcome: "error", message, fields: {} };
}

function previewFieldName(value: string): PreviewFieldName | null {
  return fieldNames.has(value as PreviewFieldName) ? value as PreviewFieldName : null;
}
