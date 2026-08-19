/** Cloudflare Worker entry point for AittaSocial. */
import handler from "vinext/server/app-router-entry";
import {
  addAcceptVary,
  dispatchPublicEntryDocument,
} from "../lib/public-entry-document/dispatch";

const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "base-uri 'none'",
  "connect-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "block-all-mixed-content",
].join("; ");

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const dispatch = dispatchPublicEntryDocument(request);
    let response = dispatch.response ?? await handler.fetch(dispatch.request, env, ctx);
    if (dispatch.negotiated) response = addAcceptVary(response);
    if (!/^text\/html\b/i.test(response.headers.get("content-type") ?? "")) {
      if (dispatch.negotiated && request.method === "HEAD") {
        response = withoutBody(response);
      }
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, must-revalidate");
    headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    if (dispatch.negotiated && request.method === "HEAD") {
      return withoutBody(response);
    }
    return response;
  },
};

function withoutBody(response: Response): Response {
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export default worker;
