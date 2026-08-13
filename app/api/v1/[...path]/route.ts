import { apiV1Head, apiV1NotFound } from "@/lib/api-v1/response";

export const dynamic = "force-dynamic";

export const GET = apiV1NotFound;

export function HEAD(request: Request) {
  return apiV1Head(apiV1NotFound(request));
}

export const OPTIONS = apiV1NotFound;
export const POST = apiV1NotFound;
export const PUT = apiV1NotFound;
export const PATCH = apiV1NotFound;
export const DELETE = apiV1NotFound;
