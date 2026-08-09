import { ValidationError } from "./validation";

export function jsonError(error: string, status: number, details?: unknown): Response {
  return Response.json(
    { error, ...(details ? { details } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function publicJsonError(code: string, message: string, status: number): Response {
  return Response.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function hasNonEmptyBody(request: Request): Promise<boolean> {
  if (request.body === null) return false;
  const reader = request.body.getReader();
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) return false;
      if (chunk.value.byteLength > 0) return true;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      // The stream may already be closed after an empty body.
    }
    reader.releaseLock();
  }
}

export async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (type !== "application/json") {
    throw new ValidationError({ request: "Content-Type must be application/json." });
  }
  try {
    const source = await request.text();
    if (new TextEncoder().encode(source).byteLength > 64 * 1024) {
      throw new ValidationError({ request: "Request body must not exceed 64 KiB." });
    }
    return JSON.parse(source) as unknown;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError({ request: "Request body must contain valid JSON within 64 KiB." });
  }
}

export function validationResponse(error: unknown): Response | null {
  return error instanceof ValidationError
    ? jsonError(error.message, 400, error.issues)
    : null;
}
