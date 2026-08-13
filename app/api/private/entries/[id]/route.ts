import { deleteEntry, updateEntry } from "@/db/repository";
import { requireOwnerApi } from "@/lib/auth";
import { jsonError } from "@/lib/http";
import {
  privateEntryAuthorizationError,
  privateEntryError,
  privateEntryNegotiationError,
  privateEntryRequestError,
  privateEntrySuccess,
  readPrivateEntryJson,
} from "@/lib/private-entry/request-response";
import { privateEntryDocument } from "@/lib/private-entry/representation";
import { parseEntryInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    return await putPrivateEntry(request, context);
  } catch {
    return privateEntryError(
      "save_failed",
      "The update save result could not be confirmed.",
      500,
    );
  }
}

async function putPrivateEntry(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return privateEntryAuthorizationError(auth.response.status);

  const negotiationError = privateEntryNegotiationError(request);
  if (negotiationError) return negotiationError;
  try {
    const { id } = await params;
    const input = parseEntryInput(await readPrivateEntryJson(request));
    const entry = await updateEntry(id, input);
    return entry
      ? privateEntrySuccess(privateEntryDocument(entry))
      : privateEntryError("entry_not_found", "Update not found.", 404);
  } catch (error) {
    const response = privateEntryRequestError(error);
    if (response) return response;
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  return (await deleteEntry(id))
    ? new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } })
    : jsonError("Update not found.", 404);
}

function privateEntryEditMethodNotAllowed(): Response {
  return privateEntryError(
    "method_not_allowed",
    "The request method is not supported for this private API resource.",
    405,
    { headers: { Allow: "PUT, DELETE" } },
  );
}

export const GET = privateEntryEditMethodNotAllowed;
export const HEAD = privateEntryEditMethodNotAllowed;
export const POST = privateEntryEditMethodNotAllowed;
export const PATCH = privateEntryEditMethodNotAllowed;
export const OPTIONS = privateEntryEditMethodNotAllowed;
