"use client";

import { useState, type FormEvent } from "react";
import type { Entry } from "@/lib/types";
import { classifyOwnerMutationResponse } from "../_components/owner-mutation-outcome";

type EntryFieldName = "kind" | "title" | "body" | "destinationUrl";
type FieldErrors = Partial<Record<EntryFieldName, string>>;

const entryFieldNames = new Set<EntryFieldName>([
  "kind",
  "title",
  "body",
  "destinationUrl",
]);
const MAX_SERVER_ERROR_LENGTH = 240;

export function EntryForm({ entry }: { entry: Entry | null }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const isPublished = entry?.state === "published";

  function showUnconfirmedSave() {
    setStatus("The save result is unknown. Do not submit again from this page; the first request may have succeeded. Check this Aitta’s saved state before retrying.");
    setRecoveryRequired(true);
    setBusy(false);
  }

  function clearFieldError(event: FormEvent<HTMLFormElement>) {
    const control = event.target;
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      const fieldName = entryFieldName(control.name);
      if (fieldName && fieldErrors[fieldName]) {
        setFieldErrors((current) => ({ ...current, [fieldName]: undefined }));
      }
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recoveryRequired) return;

    const formElement = event.currentTarget;
    setFieldErrors({});
    setStatus("");
    if (!formElement.checkValidity()) {
      setStatus("Update was not saved. Complete the required text and correct invalid URLs.");
      formElement.reportValidity();
      return;
    }

    setBusy(true);
    setStatus(entry ? "Saving update…" : "Saving private draft…");
    const form = new FormData(formElement);
    try {
      const response = await fetch(entry ? `/api/private/entries/${encodeURIComponent(entry.id)}` : "/api/private/entries", {
        method: entry ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.get("kind"),
          title: form.get("title"),
          body: form.get("body"),
          destinationUrl: form.get("destinationUrl"),
        }),
      });
      const outcome = classifyOwnerMutationResponse(response);
      if (outcome === "success") {
        const payload = await response.json() as { data: Entry };
        if (!entry) {
          window.location.assign(`/owner/entries/${encodeURIComponent(payload.data.id)}`);
          return;
        }
        setStatus(isPublished ? "Public update saved." : "Private draft saved.");
        setBusy(false);
        return;
      }
      if (outcome === "unconfirmed") {
        showUnconfirmedSave();
        return;
      }
      const failure = await definitiveFailure(response);
      setFieldErrors(failure.fieldErrors);
      setStatus(failure.message);
      focusFirstInvalidField(formElement, failure.fieldErrors);
    } catch {
      showUnconfirmedSave();
      return;
    }
    setBusy(false);
  }

  return (
    <form
      className="owner-form entry-editor-form"
      aria-label={entry ? "Edit update" : "Create private draft"}
      onSubmit={submit}
      onInput={clearFieldError}
      aria-busy={busy}
      noValidate
    >
      <section className="entry-save-context" aria-labelledby="entry-save-context-title">
        <strong id="entry-save-context-title">
          {entry ? (isPublished ? "Editing a public update" : "Editing a private draft") : "New private draft"}
        </strong>
        <span>{entry
          ? isPublished
            ? "Saving replaces this Aitta’s public update without changing its publication state."
            : "Only the owner can read this saved draft. Saving does not publish it."
          : "Saving creates a private draft in this Aitta. Nothing becomes public from this form."}</span>
      </section>

      <fieldset className="entry-editor-fields">
        <legend>Update content</legend>
        <label className="field entry-body-field" htmlFor="entry-body">
          <span>Text</span>
          <textarea
            id="entry-body"
            name="body"
            required
            maxLength={50000}
            rows={10}
            defaultValue={entry?.body ?? ""}
            aria-invalid={Boolean(fieldErrors.body) || undefined}
            aria-describedby={describedBy("entry-body-help", errorId("body", fieldErrors.body))}
          />
          <small id="entry-body-help">Write the update first. Plain text only in this POC.</small>
          <FieldError name="body" error={fieldErrors.body} />
        </label>

        <div className="field-grid field-grid-two">
          <label className="field" htmlFor="entry-kind">
            <span>Kind</span>
            <select
              id="entry-kind"
              name="kind"
              defaultValue={entry?.kind ?? "note"}
              aria-invalid={Boolean(fieldErrors.kind) || undefined}
              aria-describedby={errorId("kind", fieldErrors.kind)}
            >
              <option value="note">Note</option>
              <option value="article">Article</option>
              <option value="link">Link</option>
              <option value="announcement">Announcement</option>
            </select>
            <FieldError name="kind" error={fieldErrors.kind} />
          </label>
          <label className="field" htmlFor="entry-title">
            <span>Title (optional)</span>
            <input
              id="entry-title"
              name="title"
              maxLength={200}
              defaultValue={entry?.title ?? ""}
              aria-invalid={Boolean(fieldErrors.title) || undefined}
              aria-describedby={errorId("title", fieldErrors.title)}
            />
            <FieldError name="title" error={fieldErrors.title} />
          </label>
        </div>

        <label className="field" htmlFor="entry-destinationUrl">
          <span>Destination URL (optional; required for Link)</span>
          <input
            id="entry-destinationUrl"
            name="destinationUrl"
            type="url"
            defaultValue={entry?.destinationUrl ?? ""}
            placeholder="https://example.com/resource"
            aria-invalid={Boolean(fieldErrors.destinationUrl) || undefined}
            aria-describedby={errorId("destinationUrl", fieldErrors.destinationUrl)}
          />
          <FieldError name="destinationUrl" error={fieldErrors.destinationUrl} />
        </label>
      </fieldset>

      <div className="form-footer entry-editor-footer">
        <button className="button" type="submit" disabled={busy || recoveryRequired}>
          {entry && isPublished ? "Save update" : "Save private draft"}
        </button>
        <a className="button button-quiet" href="/owner">Back to this Aitta</a>
        <p className="form-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
        {recoveryRequired ? (
          <a className="button button-quiet" href={entry ? `/owner/entries/${encodeURIComponent(entry.id)}` : "/owner"}>
            {entry ? "Reload saved update before retrying" : "Check saved updates before retrying"}
          </a>
        ) : null}
      </div>
    </form>
  );
}

function FieldError({ name, error }: { name: EntryFieldName; error?: string }) {
  return error ? <span className="field-error" id={`entry-${name}-error`}>{error}</span> : null;
}

function errorId(name: EntryFieldName, error?: string): string | undefined {
  return error ? `entry-${name}-error` : undefined;
}

function describedBy(...ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function entryFieldName(value: string): EntryFieldName | null {
  if (value === "entryKind") return "kind";
  return entryFieldNames.has(value as EntryFieldName) ? value as EntryFieldName : null;
}

async function definitiveFailure(response: Response): Promise<{ message: string; fieldErrors: FieldErrors }> {
  const fieldErrors: FieldErrors = {};
  let safeMessage = "The server rejected this request.";
  try {
    const body = await response.json() as unknown;
    if (body && typeof body === "object" && !Array.isArray(body)) {
    const record = body as Record<string, unknown>;
      const error = safeServerError(record.error);
      if (error) safeMessage = error;
      if (record.details && typeof record.details === "object" && !Array.isArray(record.details)) {
        for (const [key, value] of Object.entries(record.details as Record<string, unknown>)) {
          const fieldName = entryFieldName(key);
          const error = safeServerError(value);
          if (fieldName && error && !fieldErrors[fieldName]) {
            fieldErrors[fieldName] = error;
          }
        }
      }
    }
  } catch {
    // Keep the fixed safe fallback for malformed error responses.
  }
  return {
    message: Object.keys(fieldErrors).length
      ? "Update was not saved. Correct the highlighted fields and try again."
      : `Update was not saved. ${safeMessage}`,
    fieldErrors,
  };
}

function safeServerError(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= MAX_SERVER_ERROR_LENGTH
    ? normalized
    : null;
}

function focusFirstInvalidField(form: HTMLFormElement, errors: FieldErrors) {
  const [fieldName] = Object.keys(errors) as EntryFieldName[];
  if (!fieldName) return;
  window.requestAnimationFrame(() => {
    const control = form.elements.namedItem(fieldName);
    if (control instanceof HTMLElement) control.focus();
  });
}
