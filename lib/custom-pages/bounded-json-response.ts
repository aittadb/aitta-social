const MAX_PAGE_PREVIEW_RESPONSE_BYTES = 160 * 1024;

/** Reads an untrusted response without allocating beyond the feature limit. */
export async function readBoundedPagePreviewJson(response: Response): Promise<unknown> {
  if (!isJsonMediaType(response.headers.get("content-type"))) return null;
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    const parsed = Number(declaredLength);
    if (
      !Number.isSafeInteger(parsed) ||
      parsed < 0 ||
      parsed > MAX_PAGE_PREVIEW_RESPONSE_BYTES
    ) {
      return null;
    }
  }
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PAGE_PREVIEW_RESPONSE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(source) as unknown;
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function isJsonMediaType(value: string | null): boolean {
  if (value === null || new TextEncoder().encode(value).byteLength > 1_024) return false;
  const parts = value.split(";");
  if (parts.length > 2 || parts[0]?.trim().toLowerCase() !== "application/json") return false;
  if (parts.length === 1) return true;
  const parameter = parts[1]?.trim().toLowerCase();
  return parameter === "charset=utf-8" || parameter === 'charset="utf-8"';
}
