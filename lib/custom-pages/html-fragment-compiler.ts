import {
  parse,
  parseFragment,
  type DefaultTreeAdapterTypes,
  type ParserError,
} from "parse5";
import {
  PAGE_PREVIEW_LIMITS,
  PageImportRejectedError,
  type PageBlockV1,
  type PageContentLinkTargetV1,
  type PageDocumentV1,
  type PageInlineV1,
  type PageLayoutV1,
  type PageLinkV1,
  type PagePreviewInputV1,
  type PageSectionV1,
} from "./page-document";

type HtmlNode = DefaultTreeAdapterTypes.ChildNode;
type HtmlElement = DefaultTreeAdapterTypes.Element;

const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const HTML_WHITESPACE = /[\t\n\f\r ]+/gu;
const FRAGMENT_TOKEN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const MAILTO_TARGET = /^mailto:[A-Za-z0-9.!$&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/u;
const TEL_TARGET = /^tel:\+?[0-9][0-9().-]{2,31}$/u;

export class PagePreviewValidationError extends Error {
  readonly fields: ("schemaVersion" | "title" | "description" | "htmlFragment")[];

  constructor(fields: PagePreviewValidationError["fields"]) {
    super("The submitted page preview values are invalid.");
    this.name = "PagePreviewValidationError";
    this.fields = fields;
  }
}

export function compilePagePreview(value: unknown): PageDocumentV1 {
  const input = parsePagePreviewInput(value);
  const document = compileHtmlFragment(input);
  validateDocumentBounds(document);
  if (byteLength(JSON.stringify(document)) > PAGE_PREVIEW_LIMITS.normalizedJsonBytes) rejectImport();
  return document;
}

function parsePagePreviewInput(value: unknown): PagePreviewInputV1 {
  const fields: PagePreviewValidationError["fields"] = [];
  if (!isRecord(value) || !hasExactKeys(value, ["schemaVersion", "title", "description", "htmlFragment"])) {
    throw new PagePreviewValidationError(["schemaVersion", "title", "description", "htmlFragment"]);
  }

  if (value.schemaVersion !== 1) fields.push("schemaVersion");
  const title = typeof value.title === "string" ? value.title.trim() : "";
  if (
    typeof value.title !== "string" ||
    title.length === 0 ||
    characterLength(title) > PAGE_PREVIEW_LIMITS.titleCharacters ||
    hasForbiddenTextControl(title)
  ) {
    fields.push("title");
  }

  let description: string | null = null;
  if (value.description !== null && typeof value.description !== "string") {
    fields.push("description");
  } else if (typeof value.description === "string") {
    const normalized = value.description.trim();
    description = normalized.length === 0 ? null : normalized;
    if (
      description !== null &&
      (characterLength(description) > PAGE_PREVIEW_LIMITS.descriptionCharacters ||
        hasForbiddenTextControl(description))
    ) {
      fields.push("description");
    }
  }

  const htmlFragment = typeof value.htmlFragment === "string" ? value.htmlFragment : "";
  if (
    typeof value.htmlFragment !== "string" ||
    htmlFragment.trim().length === 0 ||
    byteLength(htmlFragment) > PAGE_PREVIEW_LIMITS.requestBytes
  ) {
    fields.push("htmlFragment");
  }
  if (fields.length > 0) throw new PagePreviewValidationError([...new Set(fields)]);
  return { schemaVersion: 1, title, description, htmlFragment };
}

function compileHtmlFragment(input: PagePreviewInputV1): PageDocumentV1 {
  rejectDocumentSource(input.htmlFragment);
  const parserErrors: ParserError[] = [];
  const fragment = parseFragment(input.htmlFragment, {
    sourceCodeLocationInfo: true,
    onParseError: (error) => parserErrors.push(error),
  });
  if (parserErrors.length > 0) rejectImport();

  const sections: PageSectionV1[] = [];
  let implicitBlocks: PageBlockV1[] = [];
  const flushImplicit = () => {
    if (implicitBlocks.length === 0) return;
    sections.push({ fragment: null, layout: "flow", blocks: implicitBlocks });
    implicitBlocks = [];
  };

  for (const node of fragment.childNodes) {
    if (isComment(node)) continue;
    if (isWhitespaceText(node)) continue;
    if (isElement(node) && node.tagName === "section") {
      flushImplicit();
      sections.push(compileSection(node));
      continue;
    }
    implicitBlocks.push(compileBlock(node, 1));
  }
  flushImplicit();
  if (sections.length === 0) rejectImport();

  const document: PageDocumentV1 = {
    schemaVersion: 1,
    title: input.title,
    description: input.description,
    sections,
  };
  validateFragmentsAndHeadings(document);
  return document;
}

/** parseFragment intentionally drops document wrapper tags, so inspect a full parse too. */
function rejectDocumentSource(source: string): void {
  const document = parse(source, { sourceCodeLocationInfo: true });
  const stack: DefaultTreeAdapterTypes.Node[] = [...document.childNodes];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (node.nodeName === "#documentType" && node.sourceCodeLocation) rejectImport();
    if (
      isElement(node) &&
      (node.tagName === "html" || node.tagName === "head" || node.tagName === "body") &&
      node.sourceCodeLocation
    ) {
      rejectImport();
    }
    if ("childNodes" in node) stack.push(...node.childNodes);
  }
}

function compileSection(element: HtmlElement): PageSectionV1 {
  requireClosedHtmlElement(element);
  requireOnlyAttributes(element, ["data-aitta-fragment", "data-aitta-layout"]);
  const fragmentValue = attributeValue(element, "data-aitta-fragment");
  const layoutValue = attributeValue(element, "data-aitta-layout");
  const fragment = fragmentValue === null ? null : parseFragmentToken(fragmentValue);
  const layout = layoutValue === null ? "flow" : parseLayout(layoutValue);
  const blocks = compileBlockChildren(element, 1);
  if (blocks.length === 0) rejectImport();
  return { fragment, layout, blocks };
}

function compileBlock(node: HtmlNode, depth: number): PageBlockV1 {
  requireDepth(depth);
  if (!isElement(node)) rejectImport();
  requireClosedHtmlElement(node);
  switch (node.tagName) {
    case "h2":
    case "h3":
    case "h4": {
      requireOnlyAttributes(node, []);
      const text = compilePlainText(node, PAGE_PREVIEW_LIMITS.titleCharacters);
      return { type: "heading", level: Number(node.tagName.slice(1)) as 2 | 3 | 4, text };
    }
    case "p": {
      const linkGroup = attributeValue(node, "data-aitta-link-group");
      if (linkGroup !== null) {
        requireOnlyAttributes(node, ["data-aitta-link-group"]);
        if (linkGroup !== "") rejectImport();
        const links = compileLinkGroup(node);
        return { type: "linkGroup", links };
      }
      requireOnlyAttributes(node, []);
      const content = compileInlineChildren(node, depth + 1, true);
      if (content.length === 0) rejectImport();
      return { type: "paragraph", content };
    }
    case "ol":
    case "ul": {
      requireOnlyAttributes(node, []);
      const items = node.childNodes.flatMap((child) => {
        if (isComment(child) || isWhitespaceText(child)) return [];
        if (!isElement(child) || child.tagName !== "li") rejectImport();
        requireClosedHtmlElement(child);
        requireOnlyAttributes(child, []);
        const content = compileInlineChildren(child, depth + 1, true);
        if (content.length === 0) rejectImport();
        return [content];
      });
      if (items.length === 0) rejectImport();
      return { type: "list", ordered: node.tagName === "ol", items };
    }
    case "div": {
      requireOnlyAttributes(node, ["data-aitta-layout"]);
      const layoutValue = attributeValue(node, "data-aitta-layout");
      if (layoutValue === null) rejectImport();
      const blocks = compileBlockChildren(node, depth + 1);
      if (blocks.length === 0) rejectImport();
      return { type: "group", layout: parseLayout(layoutValue), blocks };
    }
    default:
      rejectImport();
  }
}

function compileBlockChildren(element: HtmlElement, depth: number): PageBlockV1[] {
  return element.childNodes.flatMap((child) =>
    isComment(child) || isWhitespaceText(child) ? [] : [compileBlock(child, depth)]
  );
}

function compileInlineChildren(
  element: HtmlElement,
  depth: number,
  trimEdges: boolean,
): PageInlineV1[] {
  requireDepth(depth);
  const rawContent: PageInlineV1[] = [];
  for (const node of element.childNodes) {
    if (isComment(node)) continue;
    if (isTextNode(node)) {
      const text = normalizeHtmlText(node.value);
      if (characterLength(text) > PAGE_PREVIEW_LIMITS.textNodeCharacters) rejectImport();
      if (text.length > 0) rawContent.push({ type: "text", text });
      continue;
    }
    if (!isElement(node)) rejectImport();
    requireClosedHtmlElement(node);
    switch (node.tagName) {
      case "strong":
      case "em": {
        requireOnlyAttributes(node, []);
        const nested = compileInlineChildren(node, depth + 1, false);
        if (visibleInlineText(nested).trim().length === 0) rejectImport();
        rawContent.push({
          type: node.tagName === "strong" ? "strong" as const : "emphasis" as const,
          content: nested,
        });
        break;
      }
      case "code": {
        requireOnlyAttributes(node, []);
        const text = compilePlainText(node, PAGE_PREVIEW_LIMITS.textNodeCharacters);
        rawContent.push({ type: "code", text });
        break;
      }
      case "a":
        rawContent.push({ type: "link", ...compileLink(node) });
        break;
      default:
        rejectImport();
    }
  }
  const content = mergeAdjacentText(rawContent);
  for (const inline of content) {
    if (
      (inline.type === "text" || inline.type === "code") &&
      characterLength(inline.text) > PAGE_PREVIEW_LIMITS.textNodeCharacters
    ) {
      rejectImport();
    }
  }
  const normalized = trimEdges ? trimInlineEdges(content) : content;
  if (visibleInlineText(normalized).trim().length === 0) return [];
  return normalized;
}

function compileLinkGroup(element: HtmlElement): PageLinkV1[] {
  const links: PageLinkV1[] = [];
  for (const child of element.childNodes) {
    if (isComment(child) || isWhitespaceText(child)) continue;
    if (!isElement(child) || child.tagName !== "a") rejectImport();
    links.push(compileLink(child));
  }
  if (links.length === 0) rejectImport();
  return links;
}

function compileLink(element: HtmlElement): PageLinkV1 {
  requireClosedHtmlElement(element);
  requireOnlyAttributes(element, ["href"]);
  const href = attributeValue(element, "href");
  if (href === null) rejectImport();
  const label = compilePlainText(element, PAGE_PREVIEW_LIMITS.linkLabelCharacters);
  return { label, destination: compileLinkTarget(href) };
}

function compileLinkTarget(href: string): PageContentLinkTargetV1 {
  if (
    href.length === 0 ||
    href !== href.trim() ||
    characterLength(href) > PAGE_PREVIEW_LIMITS.externalUrlCharacters ||
    hasUrlControl(href)
  ) {
    rejectImport();
  }
  if (href.startsWith("#")) {
    return { kind: "fragment", fragment: parseFragmentToken(href.slice(1)) };
  }
  if (href === "/updates") return { kind: "updates" };
  if (MAILTO_TARGET.test(href)) return { kind: "external", url: href };
  if (TEL_TARGET.test(href)) return { kind: "external", url: href };
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    rejectImport();
  }
  if (url.protocol !== "https:" || url.username || url.password) rejectImport();
  const normalized = url.toString();
  if (
    characterLength(normalized) > PAGE_PREVIEW_LIMITS.externalUrlCharacters ||
    /%0[0-9a-f]|%1[0-9a-f]|%7f/iu.test(normalized)
  ) {
    rejectImport();
  }
  return { kind: "external", url: normalized };
}

function compilePlainText(
  element: HtmlElement,
  maximumCharacters: number,
): string {
  let source = "";
  for (const child of element.childNodes) {
    if (isComment(child)) continue;
    if (!isTextNode(child)) rejectImport();
    source += child.value;
  }
  const text = normalizeHtmlText(source);
  const normalized = text.trim();
  if (normalized.length === 0 || characterLength(normalized) > maximumCharacters) rejectImport();
  return normalized;
}

function validateFragmentsAndHeadings(document: PageDocumentV1): void {
  const fragments = new Set<string>();
  const linkTargets: string[] = [];
  const headingLevels: number[] = [];
  for (const section of document.sections) {
    if (section.fragment !== null) {
      if (fragments.has(section.fragment)) rejectImport();
      fragments.add(section.fragment);
    }
    visitBlocks(section.blocks, (block) => {
      if (block.type === "heading") headingLevels.push(block.level);
      if (block.type === "linkGroup") {
        for (const link of block.links) {
          if (link.destination.kind === "fragment") linkTargets.push(link.destination.fragment);
        }
      }
      if (block.type === "paragraph" || block.type === "list") {
        const groups = block.type === "paragraph" ? [block.content] : block.items;
        for (const group of groups) visitInlines(group, (inline) => {
          if (inline.type === "link" && inline.destination.kind === "fragment") {
            linkTargets.push(inline.destination.fragment);
          }
        });
      }
    });
  }
  if (linkTargets.some((target) => !fragments.has(target))) rejectImport();
  for (let index = 0; index < headingLevels.length; index += 1) {
    const current = headingLevels[index];
    const previous = index === 0 ? 1 : headingLevels[index - 1];
    if (current === undefined || previous === undefined || current > previous + 1) rejectImport();
  }
}

function validateDocumentBounds(document: PageDocumentV1): void {
  if (document.sections.length > PAGE_PREVIEW_LIMITS.sections) rejectImport();
  let nodes = 0;
  let textCharacters = characterLength(document.title) + characterLength(document.description ?? "");
  let links = 0;

  for (const section of document.sections) {
    if (section.fragment !== null) textCharacters += characterLength(section.fragment);
    visitBlocks(section.blocks, (block, depth) => {
      nodes += 1;
      requireDepth(depth);
      if (block.type === "heading") textCharacters += characterLength(block.text);
      if (block.type === "linkGroup") {
        links += block.links.length;
        for (const link of block.links) textCharacters += characterLength(link.label);
      }
      if (block.type === "paragraph" || block.type === "list") {
        const groups = block.type === "paragraph" ? [block.content] : block.items;
        for (const group of groups) visitInlines(group, (inline, inlineDepth) => {
          nodes += 1;
          requireDepth(depth + inlineDepth);
          if (inline.type === "text" || inline.type === "code") {
            textCharacters += characterLength(inline.text);
          } else if (inline.type === "link") {
            links += 1;
            textCharacters += characterLength(inline.label);
          }
        });
      }
    });
  }
  if (
    nodes > PAGE_PREVIEW_LIMITS.nodes ||
    textCharacters > PAGE_PREVIEW_LIMITS.textCharacters ||
    links > PAGE_PREVIEW_LIMITS.links
  ) {
    rejectImport();
  }
}

function visitBlocks(
  blocks: PageBlockV1[],
  visitor: (block: PageBlockV1, depth: number) => void,
  depth = 1,
): void {
  for (const block of blocks) {
    visitor(block, depth);
    if (block.type === "group") visitBlocks(block.blocks, visitor, depth + 1);
  }
}

function visitInlines(
  inlines: PageInlineV1[],
  visitor: (inline: PageInlineV1, depth: number) => void,
  depth = 1,
): void {
  for (const inline of inlines) {
    visitor(inline, depth);
    if (inline.type === "strong" || inline.type === "emphasis") {
      visitInlines(inline.content, visitor, depth + 1);
    }
  }
}

function requireClosedHtmlElement(element: HtmlElement): void {
  if (
    element.namespaceURI !== HTML_NAMESPACE ||
    !element.sourceCodeLocation?.startTag ||
    !element.sourceCodeLocation.endTag
  ) {
    rejectImport();
  }
}

function requireOnlyAttributes(element: HtmlElement, allowed: string[]): void {
  if (element.attrs.length > allowed.length) rejectImport();
  for (const attribute of element.attrs) {
    if (attribute.namespace || attribute.prefix || !allowed.includes(attribute.name)) rejectImport();
  }
}

function attributeValue(element: HtmlElement, name: string): string | null {
  return element.attrs.find((attribute) => attribute.name === name)?.value ?? null;
}

function parseLayout(value: string): PageLayoutV1 {
  if (value === "flow" || value === "split" || value === "cards") return value;
  rejectImport();
}

function parseFragmentToken(value: string): string {
  if (
    characterLength(value) > PAGE_PREVIEW_LIMITS.fragmentCharacters ||
    !FRAGMENT_TOKEN.test(value) ||
    value === "aitta" ||
    value.startsWith("aitta-")
  ) {
    rejectImport();
  }
  return value;
}

function trimInlineEdges(content: PageInlineV1[]): PageInlineV1[] {
  const trimmed = structuredClone(content);
  trimInlineBoundary(trimmed, "start");
  trimInlineBoundary(trimmed, "end");
  return trimmed;
}

function trimInlineBoundary(content: PageInlineV1[], side: "start" | "end"): void {
  while (content.length > 0) {
    const index = side === "start" ? 0 : content.length - 1;
    const inline = content[index];
    if (!inline) return;
    if (inline.type === "text" || inline.type === "code") {
      inline.text = side === "start" ? inline.text.trimStart() : inline.text.trimEnd();
      if (inline.text.length === 0) content.splice(index, 1);
      return;
    }
    if (inline.type === "strong" || inline.type === "emphasis") {
      trimInlineBoundary(inline.content, side);
      if (inline.content.length === 0) {
        content.splice(index, 1);
        continue;
      }
    }
    return;
  }
}

function mergeAdjacentText(content: PageInlineV1[]): PageInlineV1[] {
  const merged: PageInlineV1[] = [];
  for (const inline of content) {
    const previous = merged.at(-1);
    if (inline.type === "text" && previous?.type === "text") previous.text += inline.text;
    else merged.push(inline);
  }
  return merged;
}

function visibleInlineText(content: PageInlineV1[]): string {
  return content.map((inline) => {
    if (inline.type === "text" || inline.type === "code") return inline.text;
    if (inline.type === "link") return inline.label;
    return visibleInlineText(inline.content);
  }).join("");
}

function normalizeHtmlText(value: string): string {
  return value.replace(HTML_WHITESPACE, " ");
}

function requireDepth(depth: number): void {
  if (depth > PAGE_PREVIEW_LIMITS.depth) rejectImport();
}

function isElement(node: DefaultTreeAdapterTypes.Node): node is HtmlElement {
  return "tagName" in node;
}

function isComment(node: DefaultTreeAdapterTypes.Node): boolean {
  return node.nodeName === "#comment";
}

function isWhitespaceText(node: DefaultTreeAdapterTypes.Node): boolean {
  return isTextNode(node) && node.value.trim().length === 0;
}

function isTextNode(node: DefaultTreeAdapterTypes.Node): node is DefaultTreeAdapterTypes.TextNode {
  return node.nodeName === "#text";
}

function characterLength(value: string): number {
  return Array.from(value).length;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => actual.includes(key));
}

function rejectImport(): never {
  throw new PageImportRejectedError();
}
