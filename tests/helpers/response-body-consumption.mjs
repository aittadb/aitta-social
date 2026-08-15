/** Consume and discard a response body before returning to the caller. */
export async function consumeResponse(response) {
  await response.text();
}
