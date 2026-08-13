"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { ENTRY_KINDS, type EntryKind } from "@/lib/constants";
import type { Entry } from "@/lib/types";
import { classifyOwnerMutationResponse } from "../_components/owner-mutation-outcome";
import { readDraftCreateResponse } from "./draft-create-response";

type EntryFieldName = "kind" | "title" | "body" | "destinationUrl";
type FieldErrors = Partial<Record<EntryFieldName, string>>;

const entryFieldNames = new Set<EntryFieldName>([
  "kind",
  "title",
  "body",
  "destinationUrl",
]);
const MAX_SERVER_ERROR_LENGTH = 240;

const entryKindGuidance: Record<EntryKind, string> = {
  note: "A short update. Text is required; a title and destination URL are optional.",
  article: "A fuller update. Text is required; a title helps readers, and a destination URL is optional.",
  announcement: "A time-sensitive update. Text is required; a title helps readers, and a destination URL is optional.",
  link: "Share a destination. Text is required to explain the link, and a destination URL is required. A title is optional.",
};

export function EntryForm({ entry }: { entry: Entry | null }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? "note");
  const isPublished = entry?.state === "published";

  function changeKind(event: ChangeEvent<HTMLSelectElement>) {
    const nextKind = event.currentTarget.value;
    if (!isEntryKind(nextKind)) return;
    setKind(nextKind);
    if (nextKind !== "link" && fieldErrors.destinationUrl) {
      setFieldErrors((current) => ({ ...current, destinationUrl: undefined }));
    }
  }

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
        headers: entry
          ? { "Content-Type": "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.get("kind"),
          title: form.get("title"),
          body: form.get("body"),
          destinationUrl: form.get("destinationUrl"),
        }),
      });
      if (!entry) {
        const result = await readDraftCreateResponse(response);
        if (result.outcome === "success") {
          window.location.assign(`/owner/entries/${encodeURIComponent(result.id)}`);
          return;
        }
        if (result.outcome === "unconfirmed") {
          showUnconfirmedSave();
          return;
        }
        setFieldErrors(result.fieldErrors);
        setStatus(result.message);
        focusFirstInvalidField(formElement, result.fieldErrors);
        setBusy(false);
        return;
      }
      const outcome = classifyOwnerMutationResponse(response);
      if (outcome === "success") {
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
              value={kind}
              onChange={changeKind}
              aria-invalid={Boolean(fieldErrors.kind) || undefined}
              aria-describedby={describedBy("entry-kind-help", errorId("kind", fieldErrors.kind))}
            >
              {ENTRY_KINDS.map((entryKind) => (
                <option key={entryKind} value={entryKind}>{entryKind[0].toUpperCase()}{entryKind.slice(1)}</option>
              ))}
            </select>
            <small className="entry-kind-guidance" id="entry-kind-help">{entryKindGuidance[kind]}</small>
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
          <span>{kind === "link" ? "Destination URL (required for Link)" : "Destination URL (optional)"}</span>
          <input
            id="entry-destinationUrl"
            name="destinationUrl"
            type="url"
            required={kind === "link"}
            defaultValue={entry?.destinationUrl ?? ""}
            placeholder="https://example.com/resource"
            aria-invalid={Boolean(fieldErrors.destinationUrl) || undefined}
            aria-describedby={describedBy("entry-destination-help", errorId("destinationUrl", fieldErrors.destinationUrl))}
          />
          <small className="entry-destination-guidance" id="entry-destination-help">{kind === "link" ? "Use the complete https:// or http:// address this update should open." : "Leave this empty unless the update should point to a web address."}</small>
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

function isEntryKind(value: string): value is EntryKind {
  return ENTRY_KINDS.includes(value as EntryKind);
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
