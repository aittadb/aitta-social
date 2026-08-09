import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getRuntimeSettings } from "./runtime";

export type OwnerAuthorization =
  | { status: "owner"; user: ChatGPTUser }
  | { status: "signed-out" }
  | { status: "not-owner" }
  | { status: "unconfigured" };

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeConfiguredOwnerEmail(value: string | null): string | null {
  if (!value) return null;
  const normalized = normalizeEmail(value);
  return normalized.length <= 320 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)
    ? normalized
    : null;
}

export function decideOwnerAuthorization(
  authenticatedEmail: string | null,
  configuredOwnerEmail: string | null,
): OwnerAuthorization["status"] {
  if (!authenticatedEmail) return "signed-out";
  const ownerEmail = normalizeConfiguredOwnerEmail(configuredOwnerEmail);
  if (!ownerEmail) return "unconfigured";
  return normalizeEmail(authenticatedEmail) === ownerEmail
    ? "owner"
    : "not-owner";
}

export async function getOwnerAuthorization(): Promise<OwnerAuthorization> {
  const user = await getChatGPTUser();
  const status = decideOwnerAuthorization(
    user?.email ?? null,
    getRuntimeSettings().ownerEmail,
  );
  if (status === "owner" && user) return { status, user };
  if (status === "signed-out") return { status };
  if (status === "not-owner") return { status };
  return { status: "unconfigured" };
}

export async function requireOwnerApi(request: Request): Promise<
  | { ok: true; user: ChatGPTUser }
  | { ok: false; response: Response }
> {
  if (!isSameOriginMutation(request)) {
    return { ok: false, response: apiError("Same-origin request required.", 403) };
  }
  const auth = await getOwnerAuthorization();
  if (auth.status === "owner") return { ok: true, user: auth.user };
  if (auth.status === "signed-out") {
    return { ok: false, response: apiError("Authentication required.", 401) };
  }
  if (auth.status === "unconfigured") {
    return {
      ok: false,
      response: apiError("Owner administration is not configured.", 503),
    };
  }
  return { ok: false, response: apiError("Administrative access denied.", 403) };
}

export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin) return fetchSite === "same-origin";
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function apiError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}
