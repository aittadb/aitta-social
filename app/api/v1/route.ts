import { apiV1RootDocument } from "@/lib/api-v1/representation";
import {
  apiV1Head,
  apiV1MethodNotAllowed,
  apiV1ReadResponse,
} from "@/lib/api-v1/response";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return apiV1ReadResponse(request, apiV1RootDocument);
}

export function HEAD(request: Request) {
  return apiV1Head(GET(request));
}

export const OPTIONS = apiV1MethodNotAllowed;
export const POST = apiV1MethodNotAllowed;
export const PUT = apiV1MethodNotAllowed;
export const PATCH = apiV1MethodNotAllowed;
export const DELETE = apiV1MethodNotAllowed;
