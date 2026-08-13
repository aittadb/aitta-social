import type { EntryState } from "../constants";
import { ValidationError } from "../validation";
import { privateEntryError } from "./request-response";

/** Parses the complete publication-state payload without accepting hidden fields. */
export function parsePrivateEntryState(value: unknown): EntryState {
  if (!isRecord(value) || !hasExactKeys(value, ["state"])) {
    throw new ValidationError({ state: "Submit exactly one state value." });
  }
  if (value.state !== "draft" && value.state !== "published") {
    throw new ValidationError({ state: "State must be draft or published." });
  }
  return value.state;
}

export function privateEntryStateMethodNotAllowed(): Response {
  return privateEntryError(
    "method_not_allowed",
    "The request method is not supported for this private API resource.",
    405,
    { headers: { Allow: "PUT" } },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => actual.includes(key));
}
