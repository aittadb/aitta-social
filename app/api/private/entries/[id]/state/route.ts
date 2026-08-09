import { setEntryState } from "@/db/repository";
import { requireOwnerApi } from "@/lib/auth";
import { jsonError, readJson, validationResponse } from "@/lib/http";
import { ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return auth.response;
  try {
    const payload = await readJson(request) as { state?: unknown };
    if (payload.state !== "draft" && payload.state !== "published") {
      throw new ValidationError({ state: "State must be draft or published." });
    }
    const { id } = await params;
    const entry = await setEntryState(id, payload.state);
    return entry
      ? Response.json({ data: entry }, { headers: { "Cache-Control": "no-store" } })
      : jsonError("Update not found.", 404);
  } catch (error) {
    const response = validationResponse(error);
    if (response) return response;
    throw error;
  }
}
