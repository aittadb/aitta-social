const MAX_CONTENT_TYPE_BYTES = 1024;

export function isJsonUtf8ContentType(value: string | null): boolean {
  if (value === null || new TextEncoder().encode(value).byteLength > MAX_CONTENT_TYPE_BYTES) {
    return false;
  }

  const parts = value.split(";");
  if (parts.length > 2 || parts[0]?.trim().toLowerCase() !== "application/json") {
    return false;
  }

  if (parts.length === 1) return true;

  const parameter = parts[1]?.trim() ?? "";
  const match = /^charset\s*=\s*(?:\"([^\"]+)\"|([^\s\"]+))$/iu.exec(parameter);
  const charset = (match?.[1] ?? match?.[2] ?? "").toLowerCase();
  return charset === "utf-8";
}

export async function readBoundedRequestBody(
  request: Request,
  limits: { maxBytes: number; onMissingBody: () => Error; onTooLarge: () => Error },
): Promise<Uint8Array> {
  if (request.body === null) {
    throw limits.onMissingBody();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;

      size += chunk.value.byteLength;
      if (size > limits.maxBytes) {
        throw limits.onTooLarge();
      }

      chunks.push(chunk.value);
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The stream may already be closed after a complete read.
    }
    reader.releaseLock();
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
