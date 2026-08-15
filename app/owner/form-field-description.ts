/** Compose the accessible descriptions referenced by one owner-form control. */
export function describedBy(...ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}
