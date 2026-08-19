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

type EntryFormCopy = {
  formAriaCreate: string;
  formAriaEdit: string;
  editHeading: string;
  createHeading: string;
  text: string;
  privateWorkspace: string;
  kind: string;
  titleOptional: string;
  linkOptional: string;
  linkRequired: string;
  destinationHelpRequired: string;
  destinationHelpOptional: string;
  fieldsLegend: string;
  bodyHelp: string;
  kindGuidanceNote: string;
  kindGuidanceArticle: string;
  kindGuidanceAnnouncement: string;
  kindGuidanceLink: string;
  validationFailed: string;
  editActionPublish: string;
  editActionCreate: string;
  updateContextPublic: string;
  updateContextPrivate: string;
  updateSaveNote: string;
  updateSaveDraftOnly: string;
  createIntro: string;
  updateNewDraft: string;
  updateNewDraftSummary: string;
  saveUpdateText: string;
  saveDraftText: string;
  saveSuccessPublished: string;
  saveSuccessPrivate: string;
  submitErrorText: string;
  reloadAfterError: string;
  checkSavedState: string;
  checkDraftsBeforeRetry: string;
  sourceUpdateLabel: string;
  checkSavedUpdatesBeforeRetry: string;
  kindOptionsNote: {
    note: string;
    article: string;
    announcement: string;
    link: string;
  };
};

type EntryContext = {
  heading: string;
  summary: string;
};

const entryFieldNames = new Set<EntryFieldKind>([
  "kind",
  "title",
  "body",
  "destinationUrl",
]);

type EntryFieldKind = "kind" | "title" | "body" | "destinationUrl";

export function EntryForm({
  entry,
  copy,
}: {
  entry: Entry | null;
  copy: EntryFormCopy;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? "note");
  const isPublished = entry?.state === "published";
  const context = resolveEntryContext(entry, isPublished, copy);

  const handleKindChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKind = event.currentTarget.value;
    if (!isEntryKind(nextKind)) return;
    setKind(nextKind);
    if (nextKind !== "link" && fieldErrors.destinationUrl) {
      setFieldErrors((current) => ({ ...current, destinationUrl: undefined }));
    }
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    await submitEntryForm({
      event,
      recoveryRequired,
      entry,
      setFieldErrors,
      setStatus,
      setBusy,
      setRecoveryRequired,
      isPublished,
      copy,
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
      onSubmit={submit}
      onInput={clearFieldError}
      aria-busy={busy}
      noValidate
    >
      <EntryContextHeader context={context} isPublished={isPublished} copy={copy} />
      <EntryFields
        kind={kind}
        entry={entry}
        fieldErrors={fieldErrors}
        onKindChange={handleKindChange}
        recovery={recoveryRequired}
        copy={copy}
      />
      <EntryFooter
        entry={entry}
        busy={busy}
        status={status}
        recoveryRequired={recoveryRequired}
        isPublished={isPublished}
        copy={copy}
      />
    </form>
  );
}

function EntryContextHeader({ context, isPublished, copy }: { context: EntryContext; isPublished: boolean; copy: EntryFormCopy }) {
  return (
    <section className={styles['entry-save-context']} aria-labelledby="entry-save-context-title">
      <strong id="entry-save-context-title">{context.heading}</strong>
      <span>{isPublished
        ? copy.updateSaveNote
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
  copy,
}: {
  kind: EntryKind;
  entry: Entry | null;
  fieldErrors: FieldErrors;
  onKindChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  recovery: boolean;
  copy: EntryFormCopy;
}) {
  return (
    <fieldset className="entry-editor-fields" aria-disabled={recovery}>
      <legend>{copy.fieldsLegend}</legend>
      <label className={`${sharedStyles['owner-form-field']} ${styles['entry-body-field']}`} htmlFor="entry-body">
        <span>{copy.text}</span>
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
        <small id="entry-body-help">{copy.bodyHelp}</small>
        <FieldError name="body" error={fieldErrors.body} />
      </label>

      <div className={`${sharedStyles['owner-form-field-grid']} ${sharedStyles['owner-form-field-grid-two']}`}>
        <label className={sharedStyles['owner-form-field']} htmlFor="entry-kind">
          <span>{copy.kind}</span>
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
          <small className={styles['entry-kind-guidance']} id="entry-kind-help">{entryKindGuidance(kind, copy)}</small>
          <FieldError name="kind" error={fieldErrors.kind} />
        </label>
          <label className={sharedStyles['owner-form-field']} htmlFor="entry-title">
          <span>{copy.titleOptional}</span>
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
        <span>{kind === "link" ? copy.linkRequired : copy.linkOptional}</span>
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
            ? copy.destinationHelpRequired
            : copy.destinationHelpOptional}
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
  copy,
}: {
  entry: Entry | null;
  busy: boolean;
  status: string;
  recoveryRequired: boolean;
  isPublished: boolean;
  copy: EntryFormCopy;
}) {
  return (
    <div className={`${sharedStyles['owner-form-footer']} ${styles['entry-editor-footer']} `}>
      <button className="button" type="submit" disabled={busy || recoveryRequired}>
        {entry && isPublished ? "Save update" : "Save private draft"}
      </button>
      <a className="button button-quiet" href="/owner">{copy.privateWorkspace}</a>
      <p className={sharedStyles['owner-form-status']} role="status" aria-live="polite" aria-atomic="true">{status}</p>
      {recoveryRequired ? (
          <a
            className="button button-quiet"
            href={entry ? `/owner/entries/${encodeURIComponent(entry.id)}` : "/owner"}
          >
          {entry ? copy.reloadAfterError : copy.checkSavedState}
        </a>
      ) : null}
    </div>
  );
}

function resolveEntryContext(entry: Entry | null, isPublished: boolean, copy: EntryFormCopy): EntryContext {
  if (entry) {
    return {
      heading: isPublished ? copy.updateContextPublic : copy.updateContextPrivate,
      summary: isPublished
        ? copy.updateSaveNote
        : copy.updateSaveDraftOnly,
    };
  }

  return {
    heading: copy.updateNewDraft,
    summary: copy.updateNewDraftSummary,
  };
}

async function submitEntryForm({
  event,
  recoveryRequired,
  entry,
  setFieldErrors,
  setStatus,
  setBusy,
  setRecoveryRequired,
  isPublished,
  copy,
}: {
  event: FormEvent<HTMLFormElement>;
  recoveryRequired: boolean;
  entry: Entry | null;
  setFieldErrors: (value: FieldErrors | ((current: FieldErrors) => FieldErrors)) => void;
  setStatus: (value: string) => void;
  setBusy: (value: boolean) => void;
  setRecoveryRequired: (value: boolean) => void;
  isPublished: boolean;
  copy: EntryFormCopy;
}) {
  event.preventDefault();
  if (recoveryRequired) return;

  setFieldErrors({});
  setStatus("");
  const formElement = event.currentTarget;
  if (!formElement.checkValidity()) {
    setStatus(copy.validationFailed);
    formElement.reportValidity();
    return;
  }

  const formData = new FormData(formElement);
  const requestBody = requestBodyFromForm(formData);
  function showUnconfirmedSave() {
    setStatus("The save result is unknown. Do not submit again from this page; the first request may have succeeded.");
    setRecoveryRequired(true);
    setBusy(false);
  }

  setBusy(true);
  setStatus(entry ? copy.saveUpdateText : copy.saveDraftText);

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
        setBusy,
        setStatus,
        showUnconfirmedSave,
      });
    }

    const result = await readEntryEditResponse(response, {
      id: entry.id,
      state: entry.state,
      kind: formText(formData.get("kind")) as EntryKind,
      title: formText(formData.get("title")) || null,
      body: formText(formData.get("body")),
      destinationUrl: normalizedDestinationUrl(formData.get("destinationUrl")),
    });

    if (result.outcome === "unconfirmed") {
      showUnconfirmedSave();
      return;
    }
    if (result.outcome === "success") {
      setStatus(isPublished ? "Public update saved." : "Private draft saved.");
      setBusy(false);
      return;
    }
    setFieldErrors(result.fieldErrors);
    setStatus(result.message);
    focusFirstInvalidField(formElement, result.fieldErrors);
    setBusy(false);
  } catch {
    showUnconfirmedSave();
    return;
  }
  setBusy(false);
}

async function finalizeDraftCreateResult({
  result,
  formElement,
  setFieldErrors,
  setBusy,
  showUnconfirmedSave,
  setStatus,
}: {
  result: Awaited<ReturnType<typeof readDraftCreateResponse>>;
  formElement: HTMLFormElement;
  setFieldErrors: (value: FieldErrors | ((current: FieldErrors) => FieldErrors)) => void;
  setBusy: (value: boolean) => void;
  showUnconfirmedSave: () => void;
  setStatus: (value: string) => void;
}) {
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
}

function entryKindGuidance(kind: EntryKind, copy: EntryFormCopy): string {
  return kind === "note"
    ? copy.kindGuidanceNote
    : kind === "article"
      ? copy.kindGuidanceArticle
      : kind === "announcement"
        ? copy.kindGuidanceAnnouncement
        : copy.kindGuidanceLink;
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
  return entryFieldNames.has(value as EntryFieldKind) ? value as EntryFieldKind : null;
}

function isEntryKind(value: string): value is EntryKind {
  return ENTRY_KINDS.includes(value as EntryKind);
}
