export const PAGE_PREVIEW_LIMITS = {
  requestBytes: 192 * 1024,
  normalizedJsonBytes: 128 * 1024,
  sections: 64,
  nodes: 1_024,
  depth: 5,
  textCharacters: 100_000,
  links: 128,
  titleCharacters: 200,
  descriptionCharacters: 500,
  textNodeCharacters: 10_000,
  linkLabelCharacters: 200,
  externalUrlCharacters: 2_048,
  fragmentCharacters: 64,
} as const;

export type PageDocumentV1 = {
  schemaVersion: 1;
  title: string;
  description: string | null;
  sections: PageSectionV1[];
};

export type PageSectionV1 = {
  fragment: string | null;
  layout: PageLayoutV1;
  blocks: PageBlockV1[];
};

export type PageLayoutV1 = "flow" | "split" | "cards";

export type PageBlockV1 =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; content: PageInlineV1[] }
  | { type: "list"; ordered: boolean; items: PageInlineV1[][] }
  | { type: "linkGroup"; links: PageLinkV1[] }
  | { type: "group"; layout: PageLayoutV1; blocks: PageBlockV1[] };

export type PageInlineV1 =
  | { type: "text"; text: string }
  | { type: "strong"; content: PageInlineV1[] }
  | { type: "emphasis"; content: PageInlineV1[] }
  | { type: "code"; text: string }
  | { type: "link"; label: string; destination: PageContentLinkTargetV1 };

export type PageLinkV1 = {
  label: string;
  destination: PageContentLinkTargetV1;
};

export type PageContentLinkTargetV1 =
  | { kind: "fragment"; fragment: string }
  | SiteLinkTargetV1;

export type SiteLinkTargetV1 =
  | { kind: "page"; pageId: string; fragment: string | null }
  | { kind: "updates" }
  | { kind: "external"; url: string };

export type PagePreviewInputV1 = {
  schemaVersion: 1;
  title: string;
  description: string | null;
  htmlFragment: string;
};

export class PageImportRejectedError extends Error {
  constructor() {
    super("The HTML fragment could not be safely imported.");
    this.name = "PageImportRejectedError";
  }
}

export function isPageDocumentV1(value: unknown): value is PageDocumentV1 {
  if (!isRecord(value) || !hasExactKeys(value, ["schemaVersion", "title", "description", "sections"])) {
    return false;
  }
  const structurallyValid = value.schemaVersion === 1 &&
    typeof value.title === "string" &&
    (value.description === null || typeof value.description === "string") &&
    Array.isArray(value.sections) &&
    value.sections.every(isPageSectionV1);
  return structurallyValid && isSemanticallyBoundedPreviewDocument(value as PageDocumentV1);
}

function isPageSectionV1(value: unknown): value is PageSectionV1 {
  return isRecord(value) &&
    hasExactKeys(value, ["fragment", "layout", "blocks"]) &&
    (value.fragment === null || typeof value.fragment === "string") &&
    isPageLayoutV1(value.layout) &&
    Array.isArray(value.blocks) &&
    value.blocks.every((block) => isPageBlockV1(block, 1));
}

function isPageBlockV1(value: unknown, depth: number): value is PageBlockV1 {
  if (depth > PAGE_PREVIEW_LIMITS.depth) return false;
  if (!isRecord(value) || typeof value.type !== "string") return false;
  switch (value.type) {
    case "heading":
      return hasExactKeys(value, ["type", "level", "text"]) &&
        (value.level === 2 || value.level === 3 || value.level === 4) &&
        typeof value.text === "string";
    case "paragraph":
      return hasExactKeys(value, ["type", "content"]) &&
        Array.isArray(value.content) && value.content.every((inline) => isPageInlineV1(inline, depth + 1));
    case "list":
      return hasExactKeys(value, ["type", "ordered", "items"]) &&
        typeof value.ordered === "boolean" &&
        Array.isArray(value.items) &&
        value.items.every((item) =>
          Array.isArray(item) && item.every((inline) => isPageInlineV1(inline, depth + 1))
        );
    case "linkGroup":
      return hasExactKeys(value, ["type", "links"]) &&
        Array.isArray(value.links) &&
        value.links.every((link) => isRecord(link) &&
          hasExactKeys(link, ["label", "destination"]) &&
          typeof link.label === "string" && isPageLinkTargetV1(link.destination));
    case "group":
      return hasExactKeys(value, ["type", "layout", "blocks"]) &&
        isPageLayoutV1(value.layout) &&
        Array.isArray(value.blocks) && value.blocks.every((block) => isPageBlockV1(block, depth + 1));
    default:
      return false;
  }
}

function isPageInlineV1(value: unknown, depth: number): value is PageInlineV1 {
  if (depth > PAGE_PREVIEW_LIMITS.depth) return false;
  if (!isRecord(value) || typeof value.type !== "string") return false;
  switch (value.type) {
    case "text":
    case "code":
      return hasExactKeys(value, ["type", "text"]) && typeof value.text === "string";
    case "strong":
    case "emphasis":
      return hasExactKeys(value, ["type", "content"]) &&
        Array.isArray(value.content) &&
        value.content.every((inline) => isPageInlineV1(inline, depth + 1));
    case "link":
      return hasExactKeys(value, ["type", "label", "destination"]) &&
        typeof value.label === "string" && isPageLinkTargetV1(value.destination);
    default:
      return false;
  }
}

function isSemanticallyBoundedPreviewDocument(document: PageDocumentV1): boolean {
  if (
    document.title.length === 0 ||
    document.title !== document.title.trim() ||
    characterLength(document.title) > PAGE_PREVIEW_LIMITS.titleCharacters ||
    hasForbiddenTextControl(document.title) ||
    document.sections.length === 0 ||
    document.sections.length > PAGE_PREVIEW_LIMITS.sections
  ) {
    return false;
  }
  if (
    document.description !== null &&
    (document.description.length === 0 ||
      document.description !== document.description.trim() ||
      characterLength(document.description) > PAGE_PREVIEW_LIMITS.descriptionCharacters ||
      hasForbiddenTextControl(document.description))
  ) {
    return false;
  }

  const fragments = new Set<string>();
  const fragmentTargets: string[] = [];
  const headings: number[] = [];
  let nodes = 0;
  let links = 0;
  let textCharacters = characterLength(document.title) + characterLength(document.description ?? "");

  const visitTarget = (target: PageContentLinkTargetV1): boolean => {
    if (target.kind === "page") return false;
    if (target.kind === "fragment") {
      if (!isCanonicalFragment(target.fragment)) return false;
      fragmentTargets.push(target.fragment);
      return true;
    }
    if (target.kind === "updates") return true;
    return isSafeExternalUrl(target.url);
  };

  const visitInlines = (inlines: PageInlineV1[], depth: number): boolean => {
    if (depth > PAGE_PREVIEW_LIMITS.depth || inlines.length === 0) return false;
    let visible = "";
    for (const inline of inlines) {
      nodes += 1;
      if (inline.type === "text" || inline.type === "code") {
        if (
          inline.text.length === 0 ||
          characterLength(inline.text) > PAGE_PREVIEW_LIMITS.textNodeCharacters
        ) {
          return false;
        }
        textCharacters += characterLength(inline.text);
        visible += inline.text;
      } else if (inline.type === "link") {
        if (!isBoundedLinkLabel(inline.label) || !visitTarget(inline.destination)) return false;
        links += 1;
        textCharacters += characterLength(inline.label);
        visible += inline.label;
      } else {
        if (!visitInlines(inline.content, depth + 1)) return false;
        visible += inlineVisibleText(inline.content);
      }
    }
    return visible.trim().length > 0;
  };

  const visitBlocks = (blocks: PageBlockV1[], depth: number): boolean => {
    if (depth > PAGE_PREVIEW_LIMITS.depth || blocks.length === 0) return false;
    for (const block of blocks) {
      nodes += 1;
      if (block.type === "heading") {
        if (
          block.text.length === 0 ||
          block.text !== block.text.trim() ||
          characterLength(block.text) > PAGE_PREVIEW_LIMITS.titleCharacters
        ) {
          return false;
        }
        headings.push(block.level);
        textCharacters += characterLength(block.text);
      } else if (block.type === "paragraph") {
        if (!visitInlines(block.content, depth + 1)) return false;
      } else if (block.type === "list") {
        if (block.items.length === 0 || block.items.some((item) => !visitInlines(item, depth + 1))) {
          return false;
        }
      } else if (block.type === "linkGroup") {
        if (block.links.length === 0) return false;
        for (const link of block.links) {
          if (!isBoundedLinkLabel(link.label) || !visitTarget(link.destination)) return false;
          links += 1;
          textCharacters += characterLength(link.label);
        }
      } else if (!visitBlocks(block.blocks, depth + 1)) {
        return false;
      }
    }
    return true;
  };

  for (const section of document.sections) {
    if (section.fragment !== null) {
      if (!isCanonicalFragment(section.fragment) || fragments.has(section.fragment)) return false;
      fragments.add(section.fragment);
      textCharacters += characterLength(section.fragment);
    }
    if (!visitBlocks(section.blocks, 1)) return false;
  }
  for (let index = 0; index < headings.length; index += 1) {
    const previous = index === 0 ? 1 : headings[index - 1];
    const current = headings[index];
    if (previous === undefined || current === undefined || current > previous + 1) return false;
  }
  if (fragmentTargets.some((fragment) => !fragments.has(fragment))) return false;
  if (
    nodes > PAGE_PREVIEW_LIMITS.nodes ||
    links > PAGE_PREVIEW_LIMITS.links ||
    textCharacters > PAGE_PREVIEW_LIMITS.textCharacters
  ) {
    return false;
  }
  try {
    return new TextEncoder().encode(JSON.stringify(document)).byteLength <=
      PAGE_PREVIEW_LIMITS.normalizedJsonBytes;
  } catch {
    return false;
  }
}

function isCanonicalFragment(value: string): boolean {
  return value.length > 0 &&
    characterLength(value) <= PAGE_PREVIEW_LIMITS.fragmentCharacters &&
    /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(value) &&
    value !== "aitta" &&
    !value.startsWith("aitta-");
}

function isBoundedLinkLabel(value: string): boolean {
  return value.length > 0 &&
    value === value.trim() &&
    characterLength(value) <= PAGE_PREVIEW_LIMITS.linkLabelCharacters &&
    !hasForbiddenTextControl(value);
}

function isSafeExternalUrl(value: string): boolean {
  if (
    value.length === 0 ||
    value !== value.trim() ||
    characterLength(value) > PAGE_PREVIEW_LIMITS.externalUrlCharacters ||
    hasUrlControl(value) ||
    /%0[0-9a-f]|%1[0-9a-f]|%7f/iu.test(value)
  ) {
    return false;
  }
  if (/^mailto:[A-Za-z0-9.!$&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/u.test(value)) {
    return true;
  }
  if (/^tel:\+?[0-9][0-9().-]{2,31}$/u.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.toString() === value;
  } catch {
    return false;
  }
}

function inlineVisibleText(content: PageInlineV1[]): string {
  return content.map((inline) => {
    if (inline.type === "text" || inline.type === "code") return inline.text;
    if (inline.type === "link") return inline.label;
    return inlineVisibleText(inline.content);
  }).join("");
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function hasForbiddenTextControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code === 127 || (code < 32 && code !== 9 && code !== 10 && code !== 13);
  });
}

function hasUrlControl(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 32 || code === 127;
  });
}

function isPageLinkTargetV1(value: unknown): value is PageContentLinkTargetV1 {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  switch (value.kind) {
    case "fragment":
      return hasExactKeys(value, ["kind", "fragment"]) && typeof value.fragment === "string";
    case "page":
      return hasExactKeys(value, ["kind", "pageId", "fragment"]) &&
        typeof value.pageId === "string" &&
        (value.fragment === null || typeof value.fragment === "string");
    case "updates":
      return hasExactKeys(value, ["kind"]);
    case "external":
      return hasExactKeys(value, ["kind", "url"]) && typeof value.url === "string";
    default:
      return false;
  }
}

function isPageLayoutV1(value: unknown): value is PageLayoutV1 {
  return value === "flow" || value === "split" || value === "cards";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => actual.includes(key));
}
