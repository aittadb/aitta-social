import { createEntry } from "@/db/repository";
import { requireOwnerApi } from "@/lib/auth";
import {
  privateEntryCreateAuthorizationError,
  privateEntryCreateError,
  privateEntryCreateMethodNotAllowed,
  privateEntryCreateNegotiationError,
  privateEntryCreateRequestError,
  privateEntryCreateSuccess,
  readPrivateEntryCreateJson,
} from "@/lib/private-entry/create-request-response";
import { privateEntryDocument } from "@/lib/private-entry/representation";
import { parseEntryInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return await createPrivateEntry(request);
  } catch {
    return privateEntryCreateError(
      "create_failed",
      "The private draft creation result could not be confirmed.",
      500,
    );
  }
}

async function createPrivateEntry(request: Request): Promise<Response> {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return privateEntryCreateAuthorizationError(auth.response.status);

  const negotiationError = privateEntryCreateNegotiationError(request);
  if (negotiationError) return negotiationError;
  try {
    const input = parseEntryInput(await readPrivateEntryCreateJson(request));
    const entry = await createEntry(input);
    return privateEntryCreateSuccess(privateEntryDocument(entry));
  } catch (error) {
    const response = privateEntryCreateRequestError(error);
    if (response) return response;
    throw error;
  }
}

export const GET = privateEntryCreateMethodNotAllowed;
export const HEAD = privateEntryCreateMethodNotAllowed;
export const PUT = privateEntryCreateMethodNotAllowed;
export const PATCH = privateEntryCreateMethodNotAllowed;
export const DELETE = privateEntryCreateMethodNotAllowed;
export const OPTIONS = privateEntryCreateMethodNotAllowed;
