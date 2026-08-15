/** Encodes an opaque value as one RFC 6570 level-1 path segment. */
export function rfc6570PathSegment(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}
