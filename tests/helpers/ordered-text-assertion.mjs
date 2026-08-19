import assert from "node:assert/strict";

export function assertOrdered(source, ...needles) {
  let position = -1;
  for (const needle of needles) {
    const nextPosition = source.indexOf(needle, position + 1);
    assert.ok(nextPosition > position, `${needle} must follow the preceding semantic element`);
    position = nextPosition;
  }
}
