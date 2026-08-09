import { requireChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { decideOwnerAuthorization } from "@/lib/auth";
import { getRuntimeSettings } from "@/lib/runtime";

export type OwnerPageAccess =
  | { status: "owner"; user: ChatGPTUser }
  | { status: "not-owner" }
  | { status: "unconfigured" };

export async function requireOwnerPage(returnTo: string): Promise<OwnerPageAccess> {
  const user = await requireChatGPTUser(returnTo);
  const status = decideOwnerAuthorization(user.email, getRuntimeSettings().ownerEmail);
  return status === "owner" ? { status, user } : { status: status as "not-owner" | "unconfigured" };
}
