import type {
  PageBlockV1,
  PageContentLinkTargetV1,
  PageDocumentV1,
  PageInlineV1,
} from "@/lib/custom-pages/page-document";
import type { RefObject } from "react";
import styles from "./page-preview.module.css";

type Copy = {
  previewPrefix: string;
  linkOpensNewTab: string;
  linkRequiresResolver: string;
};

export function PageDocumentPreview({
  document,
  headingRef,
  copy,
}: {
  document: PageDocumentV1;
  headingRef: RefObject<HTMLHeadingElement | null>;
  copy: Copy;
}) {
  return (
    <article className={styles['page-import-preview']} aria-label={`${copy.previewPrefix}: ${document.title}`}>
      <header className={styles['page-import-preview-header']}>
        <p className={styles['preview-label']}>{copy.previewPrefix}</p>
        <h2 ref={headingRef} tabIndex={-1}>{document.title}</h2>
        {document.description ? <p>{document.description}</p> : null}
      </header>
      <div className={styles['page-import-sections']}>
        {document.sections.map((section, index) => (
          <section
            className={`${styles['page-import-section']} ${layoutClass(section.layout)}`}
            id={section.fragment ? previewFragmentId(section.fragment) : undefined}
            key={`${section.fragment ?? "section"}-${index}`}
          >
            {section.blocks.map((block, blockIndex) => (
              <PreviewBlock block={block} key={`${block.type}-${blockIndex}`} copy={copy} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}

function PreviewBlock({
  block,
  copy,
}: {
  block: PageBlockV1;
  copy: Copy;
}) {
  switch (block.type) {
    case "heading": {
      if (block.level === 2) return <h2>{block.text}</h2>;
      if (block.level === 3) return <h3>{block.text}</h3>;
      return <h4>{block.text}</h4>;
    }
    case "paragraph":
      return <p>{renderInlines(block.content, copy)}</p>;
    case "list": {
      const items = block.items.map((item, index) => <li key={index}>{renderInlines(item, copy)}</li>);
      return block.ordered ? <ol>{items}</ol> : <ul>{items}</ul>;
    }
    case "linkGroup":
      return (
        <div className={styles['link-group']}>
          {block.links.map((link, index) => (
            <PreviewLink destination={link.destination} key={`${link.label}-${index}`} copy={copy}>
              {link.label}
            </PreviewLink>
          ))}
        </div>
      );
    case "group":
      return (
        <div className={`${styles['page-import-group']} ${layoutClass(block.layout)}`}>
          {block.blocks.map((child, index) => (
            <div className={styles['page-import-group-item']} key={`${child.type}-${index}`}>
              <PreviewBlock block={child} copy={copy} />
            </div>
          ))}
        </div>
      );
  }
}

function renderInlines(content: PageInlineV1[], copy: Copy): React.ReactNode[] {
  return content.map((inline, index) => {
    switch (inline.type) {
      case "text":
        return inline.text;
      case "strong":
        return <strong key={index}>{renderInlines(inline.content, copy)}</strong>;
      case "emphasis":
        return <em key={index}>{renderInlines(inline.content, copy)}</em>;
      case "code":
        return <code key={index}>{inline.text}</code>;
      case "link":
        return (
          <PreviewLink destination={inline.destination} key={index} copy={copy}>
            {inline.label}
          </PreviewLink>
        );
    }
  });
}

function PreviewLink({
  destination,
  children,
  copy,
}: {
  destination: PageContentLinkTargetV1;
  children: React.ReactNode;
  copy: Copy;
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
          {children}<span className="visually-hidden">{copy.linkOpensNewTab}</span>
        </a>
      );
    }
    case "page":
      return <span title={copy.linkRequiresResolver}>{children}</span>;
  }
}

function layoutClass(layout: "flow" | "split" | "cards"): string {
  if (layout === "split") return styles['page-import-split'];
  if (layout === "cards") return styles['page-import-cards'];
  return styles['page-import-flow'];
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
