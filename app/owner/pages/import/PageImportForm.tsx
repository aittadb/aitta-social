"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PageDocumentV1 } from "@/lib/custom-pages/page-document";
import { PageDocumentPreview } from "./PageDocumentPreview";
import {
  readPagePreviewResponse,
  type PreviewFieldName,
} from "./page-preview-response";
import styles from "./page-preview.module.css";

type FieldErrors = Partial<Record<PreviewFieldName, string>>;

export function PageImportForm() {
  const [document, setDocument] = useState<PageDocumentV1 | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!document) return;
    const frame = requestAnimationFrame(() => previewHeadingRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [document]);

  function clearFieldError(event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const name = event.currentTarget.name as PreviewFieldName;
    if (!fieldErrors[name]) return;
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setDocument(null);
    setFieldErrors({});
    setStatus("");
    if (!form.checkValidity()) {
      setStatus("Complete the required fields before creating a preview.");
      form.reportValidity();
      return;
    }
    const values = new FormData(form);
    setBusy(true);
    setStatus("Normalizing the page fragment…");
    try {
      const response = await fetch("/api/private/pages/preview", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 1,
          title: values.get("title"),
          description: values.get("description"),
          htmlFragment: values.get("htmlFragment"),
        }),
      });
      const result = await readPagePreviewResponse(response);
      if (result.outcome === "success") {
        setDocument(result.document);
        setStatus("Preview ready. Nothing was saved or published.");
      } else {
        setFieldErrors(result.fields);
        setStatus(result.message);
        requestAnimationFrame(() => focusFirstInvalidField(form, result.fields));
      }
    } catch {
      setStatus("The page preview could not be reached. Nothing was saved; you can try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.workspace}>
      <form aria-busy={busy} className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.formIntro}>
          <h2>Source fragment</h2>
          <p>Paste page-body HTML only. Scripts, styles, forms, embeds, site chrome, images, and unknown markup are rejected.</p>
        </div>
        <label className={styles.field}>
          <span>Page title</span>
          <input
            aria-describedby={fieldErrors.title ? "page-preview-title-error" : undefined}
            aria-invalid={fieldErrors.title ? true : undefined}
            disabled={busy}
            maxLength={200}
            name="title"
            onInput={clearFieldError}
            required
          />
          {fieldErrors.title ? <span className={styles.error} id="page-preview-title-error">{fieldErrors.title}</span> : null}
        </label>
        <label className={styles.field}>
          <span>Description <span className={styles.optional}>(optional)</span></span>
          <textarea
            aria-describedby={fieldErrors.description ? "page-preview-description-error" : undefined}
            aria-invalid={fieldErrors.description ? true : undefined}
            disabled={busy}
            maxLength={500}
            name="description"
            onInput={clearFieldError}
            rows={3}
          />
          {fieldErrors.description ? <span className={styles.error} id="page-preview-description-error">{fieldErrors.description}</span> : null}
        </label>
        <label className={styles.field}>
          <span>HTML fragment</span>
          <textarea
            aria-describedby={fieldErrors.htmlFragment
              ? "page-preview-fragment-help page-preview-fragment-error"
              : "page-preview-fragment-help"}
            aria-invalid={fieldErrors.htmlFragment ? true : undefined}
            className={styles.source}
            disabled={busy}
            name="htmlFragment"
            onInput={clearFieldError}
            required
            rows={16}
            spellCheck={false}
          />
          <span className={styles.help} id="page-preview-fragment-help">
            Accepted content: sections, h2–h4 headings, paragraphs, lists, emphasis, code, safe links, and annotated flow, split, or cards groups.
          </span>
          {fieldErrors.htmlFragment
            ? <span className={styles.error} id="page-preview-fragment-error">{fieldErrors.htmlFragment}</span>
            : null}
        </label>
        <div className={styles.formFooter}>
          <button className="button" type="submit" disabled={busy}>
            {busy ? "Normalizing…" : "Create safe preview"}
          </button>
          <p aria-live="polite" className={styles.status} role="status">{status}</p>
        </div>
      </form>

      {document ? (
        <div className={styles.result}>
          <PageDocumentPreview document={document} headingRef={previewHeadingRef} />
          <section className={styles.normalized} aria-labelledby="normalized-document-title">
            <div className={styles.normalizedHeader}>
              <h2 id="normalized-document-title">Exact normalized PageDocumentV1</h2>
              <p>This closed document excludes the raw HTML still visible in the source textarea above.</p>
            </div>
            <textarea
              aria-label="Exact normalized PageDocumentV1 JSON"
              className={styles.normalizedJson}
              readOnly
              rows={18}
              value={JSON.stringify(document, null, 2)}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}

function focusFirstInvalidField(form: HTMLFormElement, errors: FieldErrors): void {
  for (const name of ["title", "description", "htmlFragment"] as const) {
    if (!errors[name]) continue;
    const control = form.elements.namedItem(name);
    if (control instanceof HTMLElement) control.focus();
    return;
  }
}
