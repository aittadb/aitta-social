import { setEntryState } from "@/db/repository";
import { requireOwnerApi } from "@/lib/auth";
import {
  privateEntryAuthorizationError,
  privateEntryError,
  privateEntryNegotiationError,
  privateEntryRequestError,
  privateEntrySuccess,
  readPrivateEntryJson,
} from "@/lib/private-entry/request-response";
import { privateEntryDocument } from "@/lib/private-entry/representation";
import {
  parsePrivateEntryState,
  privateEntryStateMethodNotAllowed,
} from "@/lib/private-entry/state-request-response";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    return await putPrivateEntryState(request, params);
  } catch {
    return privateEntryError(
      "state_change_failed",
      "The publication-state result could not be confirmed.",
      500,
    );
  }
}

async function putPrivateEntryState(
  request: Request,
  params: Promise<{ id: string }>,
): Promise<Response> {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return privateEntryAuthorizationError(auth.response.status);

  const negotiationError = privateEntryNegotiationError(request);
  if (negotiationError) return negotiationError;
  try {
    const state = parsePrivateEntryState(await readPrivateEntryJson(request));
    const { id } = await params;
    const entry = await setEntryState(id, state);
    return entry
      ? privateEntrySuccess(privateEntryDocument(entry))
      : privateEntryError("entry_not_found", "Update not found.", 404);
  } catch (error) {
    const response = privateEntryRequestError(error);
    if (response) return response;
    throw error;
  }
}

export const GET = privateEntryStateMethodNotAllowed;
export const HEAD = privateEntryStateMethodNotAllowed;
export const POST = privateEntryStateMethodNotAllowed;
export const PATCH = privateEntryStateMethodNotAllowed;
export const DELETE = privateEntryStateMethodNotAllowed;
export const OPTIONS = privateEntryStateMethodNotAllowed;
