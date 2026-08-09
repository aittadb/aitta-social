import { createEntry } from "@/db/repository";
import { requireOwnerApi } from "@/lib/auth";
import { readJson, validationResponse } from "@/lib/http";
import { parseEntryInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return auth.response;
  try {
    const input = parseEntryInput(await readJson(request));
    const entry = await createEntry(input);
    return Response.json(
      { data: entry },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const response = validationResponse(error);
    if (response) return response;
    throw error;
  }
}
