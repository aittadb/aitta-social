export type OwnerMutationOutcome = "success" | "definitive-error" | "unconfirmed";

export function classifyOwnerMutationResponse(
  response: Pick<Response, "ok" | "status">,
): OwnerMutationOutcome {
  if (response.ok) return "success";
  return response.status >= 500 ? "unconfirmed" : "definitive-error";
}
