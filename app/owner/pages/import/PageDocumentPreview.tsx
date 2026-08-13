import type {
  PageBlockV1,
  PageContentLinkTargetV1,
  PageDocumentV1,
  PageInlineV1,
} from "@/lib/custom-pages/page-document";
import type { RefObject } from "react";
import styles from "./page-preview.module.css";

export function PageDocumentPreview({
  document,
  headingRef,
}: {
  document: PageDocumentV1;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <article className={styles.preview} aria-label={`Normalized page preview: ${document.title}`}>
      <header className={styles.previewHeader}>
        <p className={styles.previewLabel}>Normalized page preview</p>
        <h2 ref={headingRef} tabIndex={-1}>{document.title}</h2>
        {document.description ? <p>{document.description}</p> : null}
      </header>
      <div className={styles.sections}>
        {document.sections.map((section, index) => (
          <section
            className={`${styles.section} ${layoutClass(section.layout)}`}
            id={section.fragment ? previewFragmentId(section.fragment) : undefined}
            key={`${section.fragment ?? "section"}-${index}`}
          >
            {section.blocks.map((block, blockIndex) => (
              <PreviewBlock block={block} key={`${block.type}-${blockIndex}`} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

function PreviewBlock({ block }: { block: PageBlockV1 }) {
  switch (block.type) {
    case "heading": {
      if (block.level === 2) return <h2>{block.text}</h2>;
      if (block.level === 3) return <h3>{block.text}</h3>;
      return <h4>{block.text}</h4>;
    }
    case "paragraph":
      return <p>{renderInlines(block.content)}</p>;
    case "list": {
      const items = block.items.map((item, index) => <li key={index}>{renderInlines(item)}</li>);
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "linkGroup":
      return (
        <div className={styles.linkGroup}>
          {block.links.map((link, index) => (
            <PreviewLink destination={link.destination} key={`${link.label}-${index}`}>
              {link.label}
            </PreviewLink>
          ))}
        </div>
      );
    case "group":
      return (
        <div className={`${styles.group} ${layoutClass(block.layout)}`}>
          {block.blocks.map((child, index) => (
            <div className={styles.groupItem} key={`${child.type}-${index}`}>
              <PreviewBlock block={child} />
            </div>
          ))}
        </div>
      );
  }
}

function renderInlines(content: PageInlineV1[]): React.ReactNode[] {
  return content.map((inline, index) => {
    switch (inline.type) {
      case "text":
        return inline.text;
      case "strong":
        return <strong key={index}>{renderInlines(inline.content)}</strong>;
      case "emphasis":
        return <em key={index}>{renderInlines(inline.content)}</em>;
      case "code":
        return <code key={index}>{inline.text}</code>;
      case "link":
        return (
          <PreviewLink destination={inline.destination} key={index}>
            {inline.label}
          </PreviewLink>
        );
    }
  });
}

function PreviewLink({
  destination,
  children,
}: {
  destination: PageContentLinkTargetV1;
  children: React.ReactNode;
}) {
  switch (destination.kind) {
    case "fragment":
      return <a href={`#${previewFragmentId(destination.fragment)}`}>{children}</a>;
    case "updates":
      return <a href="/updates">{children}</a>;
    case "external": {
      const href = safeExternalHref(destination.url);
      if (!href) return <span>{children}</span>;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) {
        return <a href={href}>{children}</a>;
      }
      return (
        <a href={href} rel="noopener noreferrer" target="_blank">
          {children}<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      );
    }
    case "page":
      return <span title="Page links require a saved-page resolver.">{children}</span>;
  }
}

function layoutClass(layout: "flow" | "split" | "cards"): string {
  if (layout === "split") return styles.split;
  if (layout === "cards") return styles.cards;
  return styles.flow;
}

function previewFragmentId(fragment: string): string {
  return `page-preview-${fragment}`;
}

function safeExternalHref(value: string): string | null {
  if (/^mailto:[A-Za-z0-9.!$&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/u.test(value)) {
    return value;
  }
  if (/^tel:\+?[0-9][0-9().-]{2,31}$/u.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}
