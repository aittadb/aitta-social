import { saveProfile } from "@/db/repository";
import { requireOwnerApi } from "@/lib/auth";
import { readJson, validationResponse } from "@/lib/http";
import { parseProfileInput } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return auth.response;
  try {
    const input = parseProfileInput(await readJson(request));
    const profile = await saveProfile(input);
    return Response.json({ data: profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const response = validationResponse(error);
    if (response) return response;
    throw error;
  }
}
