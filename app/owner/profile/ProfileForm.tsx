"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";
import type { IdentityReadiness } from "@/lib/identity-readiness";
import type { PrivateProfileFieldName } from "@/lib/private-profile/representation";
import { resolvePresentationAccent } from "@/lib/presentation-accent";
import type { ProfileInput } from "@/lib/types";
import { describedBy } from "../form-field-description";
import { readProfileSaveResponse } from "./profile-save-response";
import { saveProfileRequest } from "./profile-save-request";
import type { Messages } from "@/lib/i18n/messages/en";
import sharedStyles from "../_components/owner-form-shared.module.css";
import styles from "./ProfileForm.module.css";

type DraftPreview = Pick<
  ProfileInput,
  | "displayName"
  | "shortDescription"
  | "introduction"
  | "canonicalUrl"
  | "accentColor"
  | "density"
  | "hidePoweredBy"
>;
type ProfileFieldName = PrivateProfileFieldName;
type FieldErrors = Partial<Record<ProfileFieldName, string>>;
type CanonicalDefaultSource = "stored" | "runtime-substitution" | "invalid-stored-omitted" | "empty";
type FormValues = {
  displayName: string;
  shortDescription: string;
  introduction: string;
  location: string;
  website: string;
  externalLinks: string;
  canonicalUrl: string;
  accentColor: string;
  density: ProfileInput["density"];
  hidePoweredBy: boolean;
};

const defaultAccentPreference = "#31554d";
const validAccentPreference = /^#[0-9a-f]{6}$/i;

const profileFieldNames = new Set<ProfileFieldName>([
  "displayName",
  "shortDescription",
  "introduction",
  "location",
  "website",
  "externalLinks",
  "canonicalUrl",
  "accentColor",
  "density",
  "hidePoweredBy",
]);
const optionalPublicDetailFieldNames = new Set<ProfileFieldName>([
  "location",
  "website",
  "externalLinks",
]);

export function ProfileForm({
  profile,
  canonicalDefault,
  canonicalDefaultSource,
  readiness,
  copy,
}: {
  profile: ProfileInput | null;
  canonicalDefault: string;
  canonicalDefaultSource: CanonicalDefaultSource;
  readiness: IdentityReadiness;
  copy: Messages["ui"]["owner"]["profile"];
}) {
  const loadedValues = initialFormValues(profile, canonicalDefault);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [recoveryRequired, setRecoveryRequired] = useState(false);
  const historicalAccentReplacementNeeded = Boolean(profile && !isValidAccentPreference(profile.accentColor));
  const [historicalAccentReplacementChosen, setHistoricalAccentReplacementChosen] = useState(false);
  const accentReplacementRequired = historicalAccentReplacementNeeded && !historicalAccentReplacementChosen;
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const optionalDetailsRef = useRef<HTMLDetailsElement>(null);
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(() => hasOptionalPublicDetails(loadedValues));
  const [optionalDetailsCount, setOptionalDetailsCount] = useState(() => optionalPublicDetailsCount(loadedValues));
  const [preview, setPreview] = useState<DraftPreview>({
    displayName: profile?.displayName ?? "",
    shortDescription: profile?.shortDescription ?? "",
    introduction: profile?.introduction ?? "",
    canonicalUrl: canonicalDefault,
    accentColor: editableAccentPreference(profile?.accentColor),
    density: profile?.density ?? "comfortable",
    hidePoweredBy: profile?.hidePoweredBy ?? false,
  });

  function showUnconfirmedSave() {
    setStatus("The Identity save result could not be confirmed. Reload the saved Identity before retrying.");
    setRecoveryRequired(true);
    setBusy(false);
  }

  function openOptionalDetails() {
    const details = optionalDetailsRef.current;
    if (details && !details.open) details.open = true;
    setOptionalDetailsOpen(true);
  }

  function revealInvalidOptionalDetails(event: FormEvent<HTMLFormElement>) {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;
    const fieldName = profileFieldName(control.name);
    if (fieldName && optionalPublicDetailFieldNames.has(fieldName)) openOptionalDetails();
  }

  function updatePreview(event: FormEvent<HTMLFormElement>) {
    updateProfilePreview({
      event,
      fieldErrors,
      loadedValues,
      setDirty,
      setOptionalDetailsCount,
      setPreview,
      setFieldErrors,
      historicalAccentReplacementNeeded,
      historicalAccentReplacementChosen,
      setHistoricalAccentReplacementChosen,
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recoveryRequired) return;

    const formElement = event.currentTarget;
    setFieldErrors({});
    setStatus("");
    if (!formElement.checkValidity()) {
      if (hasInvalidOptionalPublicDetails(formElement)) openOptionalDetails();
      setStatus(copy.requiredFieldError);
      formElement.reportValidity();
      return;
    }
    if (accentReplacementRequired) {
      const accentErrors = {
        accentColor: copy.editPrompt,
      };
      setFieldErrors(accentErrors);
      setStatus(copy.unsaved);
      focusFirstInvalidField(formElement, accentErrors);
      return;
    }

      setBusy(true);
    setStatus(copy.saveButton);
    const form = new FormData(formElement);
    const externalLinks = String(form.get("externalLinks") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separator = line.indexOf("|");
        return separator === -1
          ? { label: "Link", url: line }
          : { label: line.slice(0, separator).trim(), url: line.slice(separator + 1).trim() };
      });
    try {
      const response = await saveProfileRequest({
        displayName: form.get("displayName"),
        shortDescription: form.get("shortDescription"),
        introduction: form.get("introduction"),
        location: form.get("location"),
        website: form.get("website"),
        externalLinks,
        canonicalUrl: form.get("canonicalUrl"),
        accentColor: form.get("accentColor"),
        density: form.get("density"),
        hidePoweredBy: form.get("hidePoweredBy") === "on",
      });
      const result = await readProfileSaveResponse(response);
      if (result.outcome === "success") {
        setStatus(copy.newIdentity);
        window.location.assign("/owner/profile");
        return;
      }
      if (result.outcome === "unconfirmed") {
        showUnconfirmedSave();
        return;
      }
      setFieldErrors(result.fieldErrors);
      if (hasOptionalPublicDetailErrors(result.fieldErrors)) openOptionalDetails();
      setStatus(result.message);
      focusFirstInvalidField(formElement, result.fieldErrors);
    } catch {
      showUnconfirmedSave();
      return;
    }
    setBusy(false);
  }

  return (
    <form
      className="owner-form"
      aria-label={copy.settingsAria}
      onSubmit={submit}
      onInput={updatePreview}
      onInvalidCapture={revealInvalidOptionalDetails}
      aria-busy={busy}
      noValidate
    >
      <section
        className={`${styles['identity-form-readiness']} ${readiness.state === "complete" ? styles['identity-readiness-complete'] : styles['identity-readiness-incomplete']}`}
        aria-labelledby="identity-form-readiness-title"
      >
        <div>
          <p className="eyebrow">{copy.readinessHeadline}</p>
          <h2 id="identity-form-readiness-title">{readinessTitle(readiness.state)}</h2>
          <p>{canonicalExplanation(readiness, canonicalDefaultSource)}</p>
          {readiness.canonicalUrl ? (
            <p className={styles.effectiveCanonical}>
              <span>{`${canonicalSourceHeading(readiness.canonicalSource)} · ${canonicalSourceLabel(readiness.canonicalSource)}`}</span>
              <code>{readiness.canonicalUrl}</code>
            </p>
          ) : null}
        </div>
        <a className="text-link" href="/">{copy.previewPublicProfile}</a>
      </section>

        <p
          className={`identity-save-state ${saveStateClass(dirty, profile, canonicalDefaultSource)}`}
          aria-live="polite"
        >
        <strong>{dirty
            ? copy.unsaved
            : canonicalDefaultSource === "invalid-stored-omitted" && profile
            ? copy.savedFallback
          : canonicalDefaultSource === "runtime-substitution" && profile
            ? copy.savedFallbackSubstitution
            : profile
              ? copy.savedValuesLoaded
              : copy.newIdentity}</strong>
        <span>{dirty
          ? copy.editPrompt
          : canonicalDefaultSource === "invalid-stored-omitted" && profile
            ? copy.savedFallback
          : canonicalDefaultSource === "runtime-substitution" && profile
            ? copy.savedFallbackSubstitution
            : profile
              ? copy.savedProfileUnchanged
            : canonicalDefaultSource === "runtime-substitution"
              ? copy.previewLocal
              : copy.identitySetupDescription}</span>
      </p>

      <fieldset className="identity-primary-fields">
        <legend>{copy.requiredIdentity}</legend>
        <p className={styles['fieldset-introduction']}>{copy.fieldHelp}</p>
        <Field label={copy.displayName} name="displayName" required maxLength={100} defaultValue={profile?.displayName} error={fieldErrors.displayName} />
        <label className={sharedStyles['owner-form-field']} htmlFor="profile-shortDescription">
          <span>{copy.shortDescription}</span>
          <textarea
            id="profile-shortDescription"
            name="shortDescription"
            required
            maxLength={280}
            rows={3}
            defaultValue={profile?.shortDescription}
            aria-invalid={Boolean(fieldErrors.shortDescription) || undefined}
            aria-describedby={describedBy("short-description-help", errorId("shortDescription", fieldErrors.shortDescription))}
          />
          <small id="short-description-help">{copy.shortDescriptionHelp}</small>
          <FieldError name="shortDescription" error={fieldErrors.shortDescription} />
        </label>
        <Field
          label={copy.canonicalUrlLabel}
          name="canonicalUrl"
          type="url"
          required
          defaultValue={canonicalDefault}
          placeholder={copy.canonicalUrlPlaceholder}
          help={canonicalFieldHelp(readiness.canonicalSource, canonicalDefaultSource)}
          error={fieldErrors.canonicalUrl}
        />
        <label className={sharedStyles['owner-form-field']} htmlFor="profile-introduction">
          <span>{copy.longerIntroduction}</span>
          <textarea
            id="profile-introduction"
            name="introduction"
            required
            maxLength={10000}
            rows={8}
            defaultValue={profile?.introduction}
            aria-invalid={Boolean(fieldErrors.introduction) || undefined}
            aria-describedby={errorId("introduction", fieldErrors.introduction)}
          />
          <FieldError name="introduction" error={fieldErrors.introduction} />
        </label>
      </fieldset>

        <details
        ref={optionalDetailsRef}
        className={styles['optional-details']}
        open={optionalDetailsOpen}
        onToggle={(event) => setOptionalDetailsOpen(event.currentTarget.open)}
      >
        <summary>
          <span>{copy.optionalPublicDetails}</span>
          <span className={styles['optional-details-count']}>{optionalDetailsCount} {copy.optionalCountSuffix}</span>
        </summary>
          <div className={styles['optional-details-content']}>
          <p>{copy.locationWebsiteIntro}</p>
          <div className={`${sharedStyles['owner-form-field-grid']} ${sharedStyles['owner-form-field-grid-two']}`}>
            <Field label={copy.locationOptional} name="location" maxLength={120} defaultValue={profile?.location ?? ""} error={fieldErrors.location} />
            <Field label={copy.websiteOptional} name="website" type="url" defaultValue={profile?.website ?? ""} placeholder={copy.canonicalUrlPlaceholder} error={fieldErrors.website} />
          </div>
            <label className={sharedStyles['owner-form-field']} htmlFor="profile-externalLinks">
            <span>{copy.externalLinks}</span>
            <textarea
              id="profile-externalLinks"
              name="externalLinks"
              rows={4}
              defaultValue={profile?.externalLinks.map((link) => `${link.label} | ${link.url}`).join("\n")}
              placeholder={copy.externalLinksPlaceholder}
              aria-invalid={Boolean(fieldErrors.externalLinks) || undefined}
              aria-describedby={describedBy("external-links-help", errorId("externalLinks", fieldErrors.externalLinks))}
            />
            <small id="external-links-help">{copy.externalLinksHelp}</small>
            <FieldError name="externalLinks" error={fieldErrors.externalLinks} />
          </label>
        </div>
      </details>

      <fieldset className={styles['secondary-fields']}>
        <legend>{copy.appearance}</legend>
        <p className={styles['fieldset-introduction']}>{copy.appearanceGuide}</p>
        <div className={styles['identity-appearance-layout']}>
            <div className={styles['identity-appearance-controls']}>
            <label className={`${sharedStyles['owner-form-field']} ${sharedStyles['owner-form-color-field']}`} htmlFor="profile-accentColor">
              <span>{copy.accent}</span>
              <input
                id="profile-accentColor"
                name="accentColor"
                type="color"
                defaultValue={editableAccentPreference(profile?.accentColor)}
                aria-invalid={Boolean(fieldErrors.accentColor) || accentReplacementRequired || undefined}
                aria-describedby={describedBy("accent-color-help", errorId("accentColor", fieldErrors.accentColor))}
              />
              <small id="accent-color-help">{accentReplacementRequired
                ? copy.editPrompt
                : copy.previewLocal}</small>
              <FieldError name="accentColor" error={fieldErrors.accentColor} />
            </label>
            <label className={sharedStyles['owner-form-field']} htmlFor="profile-density">
              <span>{copy.spacing}</span>
              <select
                id="profile-density"
                name="density"
                defaultValue={profile?.density ?? "comfortable"}
                aria-invalid={Boolean(fieldErrors.density) || undefined}
                aria-describedby={describedBy("density-help", errorId("density", fieldErrors.density))}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
              <small id="density-help">
                {previewDensity(preview.density) === "compact"
                  ? `${copy.previewSpacingCompact} / ${copy.previewSpacingComfortable}`
                  : `${copy.previewSpacingComfortable} / ${copy.previewSpacingCompact}`}
              </small>
              <FieldError name="density" error={fieldErrors.density} />
            </label>
            <label className="check-field"><input name="hidePoweredBy" type="checkbox" defaultChecked={profile?.hidePoweredBy} /><span>{copy.hideAttribution}</span></label>
          </div>

            <aside
              className={`${styles['identity-draft-preview']} ${styles['identity-appearance-preview']} ${styles[previewDensity(preview.density) === "compact" ? "identityAppearanceCompact" : "identityAppearanceRegular"]}`}
            aria-labelledby="identity-draft-preview-title"
            style={{ "--accent": resolvePresentationAccent(preview.accentColor) } as CSSProperties}
          >
            <div className={styles['identity-appearance-preview-heading']}>
              <p className="eyebrow">{copy.previewTitle}</p>
              <p className={`${styles['identity-appearance-preview-state']} ${dirty ? styles['identity-appearance-preview-unsaved'] : profile ? styles['identity-appearance-preview-saved'] : styles['identity-appearance-preview-new']}`}>
                <strong>{dirty ? copy.previewStateUnsaved : profile ? copy.previewStateSaved : copy.previewStateNotSaved}</strong>
                <span>{dirty
                  ? copy.unsaved
                  : profile
                    ? copy.previewStateSaved
                    : copy.previewLocal}</span>
              </p>
              <h2 id="identity-draft-preview-title">{preview.displayName.trim() || copy.displayName}</h2>
              <p>{preview.shortDescription.trim() || copy.shortDescription}</p>
            </div>

            <div className={styles['identity-draft-progress']}>
              <label htmlFor="identity-draft-progress">{copy.previewNotSaved.replace("{count}", String(requiredCount(preview)))}</label>
              <progress id="identity-draft-progress" max="4" value={requiredCount(preview)}>{requiredCount(preview)} of 4</progress>
              <small>{dirty ? copy.unsaved : copy.previewLocal}</small>
            </div>

            <div className={styles['identity-appearance-sample']} aria-label={copy.examplePublicUpdate}>
              <div className={styles['identity-appearance-sample-summary']} aria-label={copy.previewNotSaved}>
                <span>{copy.previewSpacingLabel} · {previewDensity(preview.density) === "compact" ? copy.previewSpacingCompact : copy.previewSpacingComfortable}</span>
                <span>{copy.previewAttributionLabel} · {preview.hidePoweredBy ? copy.hidden : copy.visible}</span>
              </div>
              <article className={styles['identity-appearance-sample-update']}>
                <strong>{copy.examplePublicUpdate}</strong>
                <span>{copy.exampleSpacingText}</span>
              </article>
              <article className={styles['identity-appearance-sample-update']}>
                <strong>{copy.examplePublicUpdate}</strong>
                <span>{copy.previewLocal}</span>
              </article>
              {preview.hidePoweredBy ? null : <p className={styles['identity-appearance-sample-attribution']}>{copy.previewAttributionBrand}</p>}
            </div>
          </aside>
        </div>
      </fieldset>

        <div className={sharedStyles['owner-form-footer']}>
        <button className="button" type="submit" disabled={busy || recoveryRequired}>{copy.saveButton}</button>
        <a className="button button-quiet" href="/">{copy.previewPublicProfile}</a>
        <p className={sharedStyles['owner-form-status']} role="status" aria-live="polite" aria-atomic="true">{status}</p>
        {recoveryRequired ? <a className="button button-quiet" href="/owner/profile">{copy.reloadSavedIdentity}</a> : null}
      </div>
    </form>
  );
}

function readinessTitle(state: IdentityReadiness["state"]): string {
  if (state === "complete") return "Identity is ready";
  if (state === "incomplete") return "Identity needs a valid public URL";
  return "Identity has not been saved";
}

function canonicalExplanation(readiness: IdentityReadiness, defaultSource: CanonicalDefaultSource): string {
  if (defaultSource === "invalid-stored-omitted") {
    return readiness.canonicalSource === "runtime"
      ? "Canonical fallback is invalid and was omitted from this form. The effective protected runtime URL is available below; saving updates the runtime fallback."
      : "Canonical fallback is invalid and was omitted from this form. The stored value is excluded from this form because it is invalid.";
  }
  if (readiness.canonicalSource === "runtime") {
    if (defaultSource === "runtime-substitution") {
      return "Canonical fallback is invalid. The effective protected runtime URL is available below and prefilled from the protected runtime URL. Saving updates the runtime fallback.";
    }
    return readiness.state === "fresh"
      ? "A protected runtime URL is active for this Aitta. Save the required profile fields below; the canonical field saves a fallback only."
      : "A protected runtime URL is currently public for this Aitta. The editable canonical field below is the saved fallback and cannot change that protected setting.";
  }
  if (readiness.canonicalSource === "stored") {
    return "No valid protected runtime URL is active, so this Aitta uses the saved canonical fallback shown below.";
  }
  return readiness.state === "incomplete"
    ? "The saved profile remains in this Aitta, but it has no valid public URL. Save a valid HTTPS canonical fallback below."
    : "Complete the required profile fields and save a valid HTTPS canonical fallback. Unsaved changes do not survive reload.";
}

function canonicalSourceLabel(source: IdentityReadiness["canonicalSource"]): string {
  if (source === "runtime") return "protected runtime URL";
  if (source === "stored") return "saved canonical fallback";
  return "not configured";
}

function canonicalSourceHeading(source: IdentityReadiness["canonicalSource"]): string {
  if (source === "runtime") return "Effective public URL";
  if (source === "stored") return "Canonical URL fallback";
  return "Public URL source";
}

function canonicalFieldHelp(source: IdentityReadiness["canonicalSource"], defaultSource: CanonicalDefaultSource): string {
  if (defaultSource === "invalid-stored-omitted") {
    return source === "runtime"
      ? "No URL is prefilled because the saved fallback is invalid and was omitted from this form. Prefilled from the protected runtime URL because no valid fallback is available. Saving writes this value to D1 as the replacement fallback; it cannot change the protected runtime URL."
      : "No URL is prefilled because the saved fallback is invalid. Saving a valid HTTPS URL replaces it in this Aitta’s D1.";
  }
  if (source === "runtime") {
    if (defaultSource === "runtime-substitution") {
      return "Prefilled from the effective protected runtime URL because no valid saved fallback is available. Saving writes this value to D1 as the replacement fallback; it cannot change the protected runtime URL.";
    }
    return "Saved in this Aitta’s D1 as a fallback. The protected runtime URL remains effective and cannot be changed here.";
  }
  if (source === "stored") {
    return "Saved in this Aitta’s D1 and currently public because no valid protected runtime URL is active.";
  }
  return "Save a complete HTTPS URL as this Aitta’s durable fallback. A later valid protected runtime URL will take precedence.";
}

function requiredCount(preview: DraftPreview): number {
  return [preview.displayName, preview.shortDescription, preview.introduction, preview.canonicalUrl]
    .filter((value) => value.trim().length > 0)
    .length;
}

function previewDensity(value: string): ProfileInput["density"] {
  return value === "compact" ? "compact" : "comfortable";
}

function isValidAccentPreference(value: unknown): value is string {
  return typeof value === "string" && validAccentPreference.test(value);
}

function editableAccentPreference(value: unknown): string {
  return isValidAccentPreference(value) ? value.toLowerCase() : defaultAccentPreference;
}

function optionalPublicDetailsCount(values: Pick<FormValues, "location" | "website" | "externalLinks">): number {
  return [values.location, values.website, values.externalLinks]
    .filter((value) => value.trim().length > 0)
    .length;
}

function hasOptionalPublicDetails(values: Pick<FormValues, "location" | "website" | "externalLinks">): boolean {
  return optionalPublicDetailsCount(values) > 0;
}

function initialFormValues(profile: ProfileInput | null, canonicalDefault: string): FormValues {
  return {
    displayName: profile?.displayName ?? "",
    shortDescription: profile?.shortDescription ?? "",
    introduction: profile?.introduction ?? "",
    location: profile?.location ?? "",
    website: profile?.website ?? "",
    externalLinks: profile?.externalLinks.map((link) => `${link.label} | ${link.url}`).join("\n") ?? "",
    canonicalUrl: canonicalDefault,
    accentColor: editableAccentPreference(profile?.accentColor),
    density: profile?.density ?? "comfortable",
    hidePoweredBy: profile?.hidePoweredBy ?? false,
  };
}

function sameFormValues(left: FormValues, right: FormValues): boolean {
  return Object.keys(left).every((key) => left[key as keyof FormValues] === right[key as keyof FormValues]);
}

function saveStateClass(dirty: boolean, profile: ProfileInput | null, defaultSource: CanonicalDefaultSource): string {
  if (dirty) return "identity-save-state-unsaved";
  return profile && (defaultSource === "stored" || defaultSource === "empty")
    ? "identity-save-state-saved"
    : "identity-save-state-loaded";
}

type FieldProps = {
  label: string;
  name: ProfileFieldName;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  help?: string;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type">;

function Field({ label, name, type = "text", help, error, ...props }: FieldProps) {
  const inputId = `profile-${name}`;
  const helpId = help ? `${inputId}-help` : undefined;
  return (
    <label className={sharedStyles['owner-form-field']} htmlFor={inputId}>
      <span>{label}</span>
      <input
        id={inputId}
        name={name}
        type={type}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(helpId, errorId(name, error))}
        {...props}
      />
      {help ? <small id={helpId}>{help}</small> : null}
      <FieldError name={name} error={error} />
    </label>
  );
}

function FieldError({ name, error }: { name: ProfileFieldName; error?: string }) {
  return error ? <span className="field-error" id={`profile-${name}-error`}>{error}</span> : null;
}

function errorId(name: ProfileFieldName, error?: string): string | undefined {
  return error ? `profile-${name}-error` : undefined;
}

function profileFieldName(value: string): ProfileFieldName | null {
  if (value.startsWith("externalLinks.")) return "externalLinks";
  return profileFieldNames.has(value as ProfileFieldName) ? value as ProfileFieldName : null;
}

function hasOptionalPublicDetailErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).some((fieldName) => optionalPublicDetailFieldNames.has(fieldName as ProfileFieldName));
}

function hasInvalidOptionalPublicDetails(form: HTMLFormElement): boolean {
  return [...optionalPublicDetailFieldNames].some((fieldName) => {
    const control = form.elements.namedItem(fieldName);
    return (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) && !control.validity.valid;
  });
}


type UpdatePreviewInput = {
  event: FormEvent<HTMLFormElement>;
  fieldErrors: FieldErrors;
  loadedValues: FormValues;
  setDirty: (value: boolean) => void;
  setOptionalDetailsCount: (value: number | ((current: number) => number)) => void;
  setPreview: (value: DraftPreview) => void;
  setFieldErrors: (value: FieldErrors | ((current: FieldErrors) => FieldErrors)) => void;
  historicalAccentReplacementNeeded: boolean;
  historicalAccentReplacementChosen: boolean;
  setHistoricalAccentReplacementChosen: (value: boolean) => void;
};

function updateProfilePreview({
  event,
  fieldErrors,
  loadedValues,
  setDirty,
  setOptionalDetailsCount,
  setPreview,
  setFieldErrors,
  historicalAccentReplacementNeeded,
  historicalAccentReplacementChosen,
  setHistoricalAccentReplacementChosen,
}: UpdatePreviewInput) {
  const form = new FormData(event.currentTarget);
  const control = event.target;
  const fieldName = eventFieldName(control);
  const replacementSelected = historicalAccentReplacementNeeded &&
    (historicalAccentReplacementChosen || fieldName === "accentColor");

  const nextValues = extractFormValues(form);
  setOptionalDetailsCount(optionalPublicDetailsCount(nextValues));
  setPreview(toDraftPreview(nextValues));
  setDirty(!sameFormValues(nextValues, loadedValues) || replacementSelected);

  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLTextAreaElement ||
    control instanceof HTMLSelectElement
  ) {
    if (fieldName === "accentColor") {
      setHistoricalAccentReplacementChosen(true);
    }
    if (fieldName && fieldErrors[fieldName]) {
      setFieldErrors((current) => ({ ...current, [fieldName]: undefined }));
    }
  }
}

function eventFieldName(
  control: EventTarget | null,
): ProfileFieldName | null {
  if (
    !(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement ||
    control instanceof HTMLSelectElement)
  ) {
    return null;
  }
  return profileFieldName(control.name);
}

function extractFormValues(form: FormData): FormValues {
  return {
    displayName: String(form.get("displayName") ?? ""),
    shortDescription: String(form.get("shortDescription") ?? ""),
    introduction: String(form.get("introduction") ?? ""),
    location: String(form.get("location") ?? ""),
    website: String(form.get("website") ?? ""),
    externalLinks: String(form.get("externalLinks") ?? ""),
    canonicalUrl: String(form.get("canonicalUrl") ?? ""),
    accentColor: String(form.get("accentColor") ?? defaultAccentPreference),
    density: parseDensity(form.get("density")),
    hidePoweredBy: form.get("hidePoweredBy") === "on",
  };
}

function toDraftPreview(values: FormValues): DraftPreview {
  return {
    displayName: values.displayName,
    shortDescription: values.shortDescription,
    introduction: values.introduction,
    canonicalUrl: values.canonicalUrl,
    accentColor: values.accentColor,
    density: values.density,
    hidePoweredBy: values.hidePoweredBy,
  };
}

function parseDensity(value: FormDataEntryValue | null): ProfileInput["density"] {
  return value === "compact" ? "compact" : "comfortable";
}



function focusFirstInvalidField(form: HTMLFormElement, errors: FieldErrors) {
  const [fieldName] = Object.keys(errors) as ProfileFieldName[];
  if (!fieldName) return;
  window.requestAnimationFrame(() => {
    const control = form.elements.namedItem(fieldName);
    if (control instanceof HTMLElement) control.focus();
  });
}
