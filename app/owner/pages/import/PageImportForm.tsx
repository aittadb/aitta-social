"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PageDocumentV1 } from "@/lib/custom-pages/page-document";
import { PageDocumentPreview } from "./PageDocumentPreview";
import { PageImportTextField, PageImportTextareaField } from "./PageImportFields";
import {
  readPagePreviewResponse,
  type PreviewFieldName,
} from "./page-preview-response";
import { previewPageRequest } from "./page-preview-request";
import styles from "./page-preview.module.css";

type FieldErrors = Partial<Record<PreviewFieldName, string>>;
type Copy = {
  sourceFragment: string;
  sourceText: string;
  pageTitle: string;
  description: string;
  htmlFragment: string;
  optional: string;
  statusPreviewErrorPrefix: string;
  statusNormalize: string;
  statusReady: string;
  statusRequestFailed: string;
  htmlErrorMessage: string;
  exactTitle: string;
  normalizedNotice: string;
  normalizedLabel: string;
  previewPrefix: string;
  linkOpensNewTab: string;
  linkRequiresResolver: string;
  openSource: string;
};

export function PageImportForm({ copy }: { copy: Copy }) {
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
      setStatus(copy.statusPreviewErrorPrefix);
      form.reportValidity();
      return;
    }
    const values = new FormData(form);
    setBusy(true);
    setStatus(copy.statusNormalize);
    try {
      const response = await previewPageRequest({
        schemaVersion: 1,
        title: values.get("title"),
        description: values.get("description"),
        htmlFragment: values.get("htmlFragment"),
      });
      const result = await readPagePreviewResponse(response);
      if (result.outcome === "success") {
        setDocument(result.document);
        setStatus(copy.statusReady);
      } else {
        setFieldErrors(result.fields);
        setStatus(result.message);
        requestAnimationFrame(() => focusFirstInvalidField(form, result.fields));
      }
    } catch {
      setStatus(copy.statusRequestFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles['page-import-workspace']}>
      <form aria-busy={busy} className={styles['page-import-form']} onSubmit={submit} noValidate>
        <div className={styles['page-import-form-intro']}>
          <h2>{copy.sourceFragment}</h2>
          <p>{copy.sourceText}</p>
        </div>
        <PageImportTextField
          disabled={busy}
          error={fieldErrors.title}
          label={copy.pageTitle}
          maxLength={200}
          name="title"
          onInput={clearFieldError}
          required
          optionalSuffix={copy.optional}
        />
        <PageImportTextareaField
          disabled={busy}
          error={fieldErrors.description}
          label={copy.description}
          maxLength={500}
          name="description"
          onInput={clearFieldError}
          optional
          required={false}
          rows={3}
          optionalSuffix={copy.optional}
        />
        <PageImportTextareaField
          disabled={busy}
          error={fieldErrors.htmlFragment}
          errorId="page-preview-fragment-error"
          help={copy.htmlErrorMessage}
          helpId="page-preview-fragment-help"
          label={copy.htmlFragment}
          name="htmlFragment"
          onInput={clearFieldError}
          required
          rows={16}
          spellCheck={false}
          variant="source"
          optionalSuffix={copy.optional}
        />
        <div className={styles['page-import-form-footer']}>
          <button className="button" type="submit" disabled={busy}>
            {busy ? copy.openSource : copy.statusNormalize}
          </button>
          <p aria-live="polite" className={styles['page-import-status']} role="status">{status}</p>
        </div>
      </form>

      {document ? (
        <div className={styles['page-import-result']}>
          <PageDocumentPreview document={document} headingRef={previewHeadingRef} copy={
            {
              previewPrefix: copy.previewPrefix,
              linkOpensNewTab: copy.linkOpensNewTab,
              linkRequiresResolver: copy.linkRequiresResolver,
            }
          } />
          <section className={styles['page-import-normalized']} aria-labelledby="normalized-document-title">
            <div className={styles['page-import-normalized-header']}>
              <h2 id="normalized-document-title">{copy.exactTitle}</h2>
              <p>{copy.normalizedNotice}</p>
            </div>
            <textarea
              aria-label={copy.normalizedLabel}
              className={styles['page-import-normalized-json']}
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
