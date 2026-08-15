"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { ENTRY_KINDS, type EntryKind } from "@/lib/constants";
import type { Entry } from "@/lib/types";
import { describedBy } from "../form-field-description";
import { readDraftCreateResponse } from "./draft-create-response";
import { createEntryRequest, editEntryRequest } from "./entry-mutation-requests";
import { readEntryEditResponse } from "./edit-save-response";
import sharedStyles from "../_components/owner-form-shared.module.css";
import styles from "./EntryForm.module.css";

type EntryFieldName = "kind" | "title" | "body" | "destinationUrl";
type FieldErrors = Partial<Record<EntryFieldName, string>>;

type EntryFormPayload = {
  kind: FormDataEntryValue | null;
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  destinationUrl: FormDataEntryValue | null;
};

type EntryContext = {
  heading: string;
  summary: string;
};

const entryFieldNames = new Set<EntryFieldName>([
  "kind",
  "title",
  "body",
  "destinationUrl",
]);

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
  const context = resolveEntryContext(entry, isPublished);

  const handleKindChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKind = event.currentTarget.value;
    if (!isEntryKind(nextKind)) return;
    setKind(nextKind);
    if (nextKind !== "link" && fieldErrors.destinationUrl) {
      setFieldErrors((current) => ({ ...current, destinationUrl: undefined }));
    }
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    await submitEntryForm({
      event,
      recoveryRequired,
      entry,
      kind,
      setFieldErrors,
      setStatus,
      setBusy,
      setRecoveryRequired,
      isPublished,
    });
  }

  const clearFieldError = (event: FormEvent<HTMLFormElement>) => {
    const control = event.target;
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      const fieldName = entryFormFieldName(control.name);
      if (fieldName && fieldErrors[fieldName]) {
        setFieldErrors((current) => ({ ...current, [fieldName]: undefined }));
      }
    }
  };

  return (
    <form
      className={`${sharedStyles['owner-form']} ${styles['entry-editor-form']}`}
      aria-label={entry ? "Edit update" : "Create private draft"}
      onSubmit={handleSubmit}
      onInput={clearFieldError}
      aria-busy={busy}
      noValidate
    >
      <EntryContextHeader context={context} isPublished={isPublished} />
      <EntryFields
        kind={kind}
        entry={entry}
        fieldErrors={fieldErrors}
        onKindChange={handleKindChange}
        recovery={recoveryRequired}
      />
      <EntryFooter
        entry={entry}
        busy={busy}
        status={status}
        recoveryRequired={recoveryRequired}
        isPublished={isPublished}
      />
    </form>
  );
}

function EntryContextHeader({ context, isPublished }: { context: EntryContext; isPublished: boolean }) {
  return (
    <section className={styles['entry-save-context']} aria-labelledby="entry-save-context-title">
      <strong id="entry-save-context-title">{context.heading}</strong>
      <span>{isPublished
        ? "Saving replaces this Aitta’s public update without changing its publication state."
        : context.summary}
      </span>
    </section>
  );
}

function EntryFields({
  kind,
  entry,
  fieldErrors,
  onKindChange,
  recovery,
}: {
  kind: EntryKind;
  entry: Entry | null;
  fieldErrors: FieldErrors;
  onKindChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  recovery: boolean;
}) {
  return (
    <fieldset className={styles['entry-editor-fields']} aria-disabled={recovery}>
      <legend>Update content</legend>
      <label className={`${sharedStyles['owner-form-field']} ${styles['entry-body-field']}`} htmlFor="entry-body">
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

      <div className={`${sharedStyles['owner-form-field-grid']} ${sharedStyles['owner-form-field-grid-two']}`}>
        <label className={sharedStyles['owner-form-field']} htmlFor="entry-kind">
          <span>Kind</span>
          <select
            id="entry-kind"
            name="kind"
            value={kind}
            onChange={onKindChange}
            aria-invalid={Boolean(fieldErrors.kind) || undefined}
            aria-describedby={describedBy("entry-kind-help", errorId("kind", fieldErrors.kind))}
          >
            {ENTRY_KINDS.map((entryKind) => (
              <option key={entryKind} value={entryKind}>
                {entryKind[0].toUpperCase()}{entryKind.slice(1)}
              </option>
            ))}
          </select>
          <small className={styles['entry-kind-guidance']} id="entry-kind-help">{entryKindGuidance[kind]}</small>
          <FieldError name="kind" error={fieldErrors.kind} />
        </label>
          <label className={sharedStyles['owner-form-field']} htmlFor="entry-title">
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

      <label className={sharedStyles['owner-form-field']} htmlFor="entry-destinationUrl">
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
        <small className={styles['entry-destination-guidance']} id="entry-destination-help">
          {kind === "link"
            ? "Use the complete https:// or http:// address this update should open."
            : "Leave this empty unless the update should point to a web address."}
        </small>
        <FieldError name="destinationUrl" error={fieldErrors.destinationUrl} />
      </label>
    </fieldset>
  );
}

function EntryFooter({
  entry,
  busy,
  status,
  recoveryRequired,
  isPublished,
}: {
  entry: Entry | null;
  busy: boolean;
  status: string;
  recoveryRequired: boolean;
  isPublished: boolean;
}) {
  return (
    <div className={`${sharedStyles['owner-form-footer']} ${styles['entry-editor-footer']}`}>
      <button className="button" type="submit" disabled={busy || recoveryRequired}>
        {entry && isPublished ? "Save update" : "Save private draft"}
      </button>
      <a className="button button-quiet" href="/owner">Back to this Aitta</a>
      <p className={sharedStyles['owner-form-status']} role="status" aria-live="polite" aria-atomic="true">{status}</p>
      {recoveryRequired ? (
          <a
            className="button button-quiet"
            href={entry ? `/owner/entries/${encodeURIComponent(entry.id)}` : "/owner"}
          >
          {entry ? "Reload saved update before retrying" : "Check saved updates before retrying"}
        </a>
      ) : null}
    </div>
  );
}

function resolveEntryContext(entry: Entry | null, isPublished: boolean): EntryContext {
  if (entry) {
    return {
      heading: isPublished ? "Editing a public update" : "Editing a private draft",
      summary: isPublished
        ? "Saving replaces this Aitta’s public update without changing its publication state."
        : "Only the owner can read this saved draft. Saving does not publish it.",
    };
  }

  return {
    heading: "New private draft",
    summary: "Saving creates a private draft in this Aitta. Nothing becomes public from this form.",
  };
}

async function submitEntryForm({
  event,
  recoveryRequired,
  entry,
  kind,
  setFieldErrors,
  setStatus,
  setBusy,
  setRecoveryRequired,
  isPublished,
}: {
  event: FormEvent<HTMLFormElement>;
  recoveryRequired: boolean;
  entry: Entry | null;
  kind: EntryKind;
  setFieldErrors: (value: FieldErrors | ((current: FieldErrors) => FieldErrors)) => void;
  setStatus: (value: string) => void;
  setBusy: (value: boolean) => void;
  setRecoveryRequired: (value: boolean) => void;
  isPublished: boolean;
}) {
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

  const formData = new FormData(formElement);
  const requestBody = requestBodyFromForm(formData);

  setBusy(true);
  setStatus(entry ? "Saving update…" : "Saving private draft…");

  try {
    const response = entry
      ? await editEntryRequest(entry.id, requestBody)
      : await createEntryRequest(requestBody);

    if (!entry) {
      const result = await readDraftCreateResponse(response);
      return finalizeDraftCreateResult({
        result,
        formElement,
        setFieldErrors,
        setStatus,
        setBusy,
        setRecoveryRequired,
      });
    }

    const result = await readEntryEditResponse(response, {
      id: entry.id,
      state: entry.state,
      kind,
      title: formText(formData.get("title")),
      body: formText(formData.get("body")),
      destinationUrl: normalizedDestinationUrl(formData.get("destinationUrl")),
    });

    await handleEntryEditResult({
      result,
      formElement,
      isPublished,
      setFieldErrors,
      setStatus,
      setBusy,
      setRecoveryRequired,
    });
  } catch {
    showUnconfirmedSave(setStatus, setRecoveryRequired, setBusy);
  }
}

async function finalizeDraftCreateResult({
  result,
  formElement,
  setFieldErrors,
  setStatus,
  setBusy,
  setRecoveryRequired,
}: {
  result: Awaited<ReturnType<typeof readDraftCreateResponse>>;
  formElement: HTMLFormElement;
  setFieldErrors: (value: FieldErrors | ((current: FieldErrors) => FieldErrors)) => void;
  setStatus: (value: string) => void;
  setBusy: (value: boolean) => void;
  setRecoveryRequired: (value: boolean) => void;
}) {
  if (result.outcome === "success") {
    window.location.assign(`/owner/entries/${encodeURIComponent(result.id)}`);
    return;
  }
  if (result.outcome === "unconfirmed") {
    showUnconfirmedSave(setStatus, setRecoveryRequired, setBusy);
    return;
  }
  setFieldErrors(result.fieldErrors);
  setStatus(result.message);
  focusFirstInvalidField(formElement, result.fieldErrors);
  setBusy(false);
}

async function handleEntryEditResult({
  result,
  formElement,
  isPublished,
  setFieldErrors,
  setStatus,
  setBusy,
  setRecoveryRequired,
}: {
  result: Awaited<ReturnType<typeof readEntryEditResponse>>;
  formElement: HTMLFormElement;
  isPublished: boolean;
  setFieldErrors: (value: FieldErrors | ((current: FieldErrors) => FieldErrors)) => void;
  setStatus: (value: string) => void;
  setBusy: (value: boolean) => void;
  setRecoveryRequired: (value: boolean) => void;
}) {
  if (result.outcome === "success") {
    setStatus(isPublished ? "Public update saved." : "Private draft saved.");
    setBusy(false);
    return;
  }
  if (result.outcome === "unconfirmed") {
    showUnconfirmedSave(setStatus, setRecoveryRequired, setBusy);
    return;
  }
  setFieldErrors(result.fieldErrors);
  setStatus(result.message);
  focusFirstInvalidField(formElement, result.fieldErrors);
  setBusy(false);
}

function showUnconfirmedSave(
  setStatus: (value: string) => void,
  setRecoveryRequired: (value: boolean) => void,
  setBusy: (value: boolean) => void,
) {
  setStatus("The save result is unknown. Do not submit again from this page; the first request may have succeeded. Check this Aitta’s saved state before retrying.");
  setRecoveryRequired(true);
  setBusy(false);
}

function requestBodyFromForm(formData: FormData): EntryFormPayload {
  return {
    kind: formData.get("kind"),
    title: formData.get("title"),
    body: formData.get("body"),
    destinationUrl: formData.get("destinationUrl"),
  };
}

function normalizedDestinationUrl(value: FormDataEntryValue | null): string | null {
  const source = formText(value);
  if (!source) return null;
  try {
    return new URL(source).toString();
  } catch {
    return source;
  }
}

function formText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function focusFirstInvalidField(form: HTMLFormElement, errors: FieldErrors) {
  const [fieldName] = Object.keys(errors) as EntryFieldName[];
  if (!fieldName) return;
  window.requestAnimationFrame(() => {
    const control = form.elements.namedItem(fieldName);
    if (control instanceof HTMLElement) control.focus();
  });
}

function FieldError({ name, error }: { name: EntryFieldName; error?: string }) {
  return error ? <span className="field-error" id={`entry-${name}-error`}>{error}</span> : null;
}

function errorId(name: EntryFieldName, error?: string): string | undefined {
  return error ? `entry-${name}-error` : undefined;
}

function entryFormFieldName(value: string): EntryFieldName | null {
  return entryFieldNames.has(value as EntryFieldName) ? value as EntryFieldName : null;
}

function isEntryKind(value: string): value is EntryKind {
  return ENTRY_KINDS.includes(value as EntryKind);
}
