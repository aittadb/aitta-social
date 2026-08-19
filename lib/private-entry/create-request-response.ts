import type {
  PrivateEntryDocument,
} from "./representation";
import {
  PrivateEntryRequestError,
  privateEntryAuthorizationError,
  privateEntryError,
  privateEntryNegotiationError,
  privateEntryRequestError,
  privateEntrySuccess,
  readPrivateEntryJson,
} from "./request-response";

export { PrivateEntryRequestError as PrivateEntryCreateRequestError };

export const privateEntryCreateNegotiationError = privateEntryNegotiationError;
export const readPrivateEntryCreateJson = readPrivateEntryJson;

export function privateEntryCreateSuccess(document: PrivateEntryDocument): Response {
  return privateEntrySuccess(document, 201);
}

export function privateEntryCreateError(
  code: string,
  message: string,
  status: number,
  options: Parameters<typeof privateEntryError>[3] = {},
): Response {
  return privateEntryError(code, message, status, options);
}

export const privateEntryCreateAuthorizationError = privateEntryAuthorizationError;
export const privateEntryCreateRequestError = privateEntryRequestError;

export function privateEntryCreateMethodNotAllowed(): Response {
  return privateEntryCreateError(
    "method_not_allowed",
    "The request method is not supported for this private API resource.",
    405,
    { headers: { Allow: "POST" } },
  );
}
