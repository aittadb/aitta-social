/** Counts Unicode code points so page limits do not split astral characters. */
export function characterLength(value: string): number {
  return Array.from(value).length;
}

/** Rejects C0 controls except the whitespace controls preserved in page text. */
export function hasForbiddenTextControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code === 127 || (code < 32 && code !== 9 && code !== 10 && code !== 13);
  });
}

/** Rejects controls and whitespace that cannot appear in a normalized URL. */
export function hasUrlControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 32 || code === 127;
  });
}
