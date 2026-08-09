import { requireOwnerApi } from "@/lib/auth";
import { probeHub } from "@/lib/hub";
import { getRuntimeSettings } from "@/lib/runtime";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireOwnerApi(request);
  if (!auth.ok) return auth.response;
  if (request.body !== null) {
    return jsonError("This operation accepts no request body.", 400);
  }
  const result = await probeHub(getRuntimeSettings());
  return Response.json(
    { data: result },
    { headers: { "Cache-Control": "no-store" } },
  );
}
