export function inlineStyleAttributeValues(html) {
  return [...html.matchAll(/\sstyle="([^"]*)"/gi)].map((match) => match[1]);
}
