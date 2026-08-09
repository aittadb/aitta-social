import { deleteEntry, updateEntry } from "@/db/repository";
import { requireOwnerApi } from "@/lib/auth";
import { jsonError, readJson, validationResponse } from "@/lib/http";
import { parseEntryInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const input = parseEntryInput(await readJson(request));
    const entry = await updateEntry(id, input);
    return entry
      ? Response.json({ data: entry }, { headers: { "Cache-Control": "no-store" } })
      : jsonError("Update not found.", 404);
  } catch (error) {
    const response = validationResponse(error);
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
