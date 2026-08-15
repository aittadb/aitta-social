/** Returns normalized Vary header tokens in their original order. */
export function varyHeaderTokens(response) {
  return (response.headers.get("vary") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase());
}
