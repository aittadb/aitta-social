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
  density: string;
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
}: {
  profile: ProfileInput | null;
  canonicalDefault: string;
  canonicalDefaultSource: CanonicalDefaultSource;
  readiness: IdentityReadiness;
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
    const form = new FormData(event.currentTarget);
    const control = event.target;
    const fieldName = control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
      ? profileFieldName(control.name)
      : null;
    const replacementSelected = historicalAccentReplacementNeeded &&
      (historicalAccentReplacementChosen || fieldName === "accentColor");
    setOptionalDetailsCount(optionalPublicDetailsCount(formValues(form)));
    setPreview({
      displayName: String(form.get("displayName") ?? ""),
      shortDescription: String(form.get("shortDescription") ?? ""),
      introduction: String(form.get("introduction") ?? ""),
      canonicalUrl: String(form.get("canonicalUrl") ?? ""),
      accentColor: String(form.get("accentColor") ?? defaultAccentPreference),
      density: previewDensity(String(form.get("density") ?? "comfortable")),
      hidePoweredBy: form.get("hidePoweredBy") === "on",
    });
    setDirty(!sameFormValues(formValues(form), loadedValues) || replacementSelected);

    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      if (fieldName === "accentColor") setHistoricalAccentReplacementChosen(true);
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
      if (hasInvalidOptionalPublicDetails(formElement)) openOptionalDetails();
      setStatus("Identity was not saved. Complete the required fields and correct invalid URLs.");
      formElement.reportValidity();
      return;
    }
    if (accentReplacementRequired) {
      const accentErrors = {
        accentColor: "Choose an accent color before saving this historical profile.",
      };
      setFieldErrors(accentErrors);
      setStatus("Identity was not saved. Choose a replacement for the historical accent and try again.");
      focusFirstInvalidField(formElement, accentErrors);
      return;
    }

    setBusy(true);
    setStatus("Saving Identity…");
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
        setStatus("Identity saved. Reloading server-saved readiness…");
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
    <form className="owner-form" aria-label="Identity and profile settings" onSubmit={submit} onInput={updatePreview} onInvalidCapture={revealInvalidOptionalDetails} aria-busy={busy} noValidate>
      <section className={`identity-form-readiness identity-readiness-${readiness.state}`} aria-labelledby="identity-form-readiness-title">
        <div>
          <p className="eyebrow">Server-saved readiness</p>
          <h2 id="identity-form-readiness-title">{readinessTitle(readiness.state)}</h2>
          <p>{canonicalExplanation(readiness, canonicalDefaultSource)}</p>
          {readiness.canonicalUrl ? (
            <p className="effective-canonical">
              <span>Effective public URL · {canonicalSourceLabel(readiness.canonicalSource)}</span>
              <code>{readiness.canonicalUrl}</code>
            </p>
          ) : null}
        </div>
        <a className="text-link" href="/">Preview saved public profile</a>
      </section>

      <p className={`identity-save-state ${saveStateClass(dirty, profile, canonicalDefaultSource)}`} aria-live="polite">
        <strong>{dirty
          ? "Unsaved changes"
          : canonicalDefaultSource === "invalid-stored-omitted" && profile
            ? "Saved profile loaded without its invalid URL"
          : canonicalDefaultSource === "runtime-substitution" && profile
            ? "Saved profile loaded with a safe URL substitution"
            : profile
              ? "Saved values loaded"
              : "New Identity, not saved"}</strong>
        <span>{dirty
          ? "These edits exist only in this open form. Server-saved readiness above has not changed."
          : canonicalDefaultSource === "invalid-stored-omitted" && profile
            ? "The saved canonical fallback is invalid and was omitted from this form. Other profile values were loaded from this Aitta. Saving a valid HTTPS fallback will replace the invalid D1 value."
          : canonicalDefaultSource === "runtime-substitution" && profile
            ? "The saved canonical fallback is invalid, so the effective protected runtime URL is prefilled below. Saving will replace the invalid D1 fallback."
          : profile
            ? "The form matches the profile values loaded from this Aitta."
            : canonicalDefaultSource === "runtime-substitution"
              ? "The protected runtime URL is prefilled as a fallback starting value. Complete the profile fields and save to create this Aitta’s outward profile."
              : "Complete the required fields and save to create this Aitta’s outward profile."}</span>
      </p>

      <fieldset className="identity-primary-fields">
        <legend>Required Identity</legend>
        <p className="fieldset-introduction">These four fields create the outward profile this Aitta controls.</p>
        <Field label="Display name" name="displayName" required maxLength={100} defaultValue={profile?.displayName} error={fieldErrors.displayName} />
        <label className="field" htmlFor="profile-shortDescription">
          <span>Short description</span>
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
          <small id="short-description-help">One clear sentence for the top of the public profile.</small>
          <FieldError name="shortDescription" error={fieldErrors.shortDescription} />
        </label>
        <Field
          label="Canonical URL fallback"
          name="canonicalUrl"
          type="url"
          required
          defaultValue={canonicalDefault}
          placeholder="https://aitta.example"
          help={canonicalFieldHelp(readiness.canonicalSource, canonicalDefaultSource)}
          error={fieldErrors.canonicalUrl}
        />
        <label className="field" htmlFor="profile-introduction">
          <span>Longer introduction</span>
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
        className="identity-optional-details"
        open={optionalDetailsOpen}
        onToggle={(event) => setOptionalDetailsOpen(event.currentTarget.open)}
      >
        <summary>
          <span>Optional public details</span>
          <span className="identity-optional-details-count">{optionalDetailsCount} of 3 added</span>
        </summary>
        <div className="identity-optional-details-content">
          <p>Location, website, and external links appear publicly only when you add them.</p>
          <div className="field-grid field-grid-two">
            <Field label="Location (optional)" name="location" maxLength={120} defaultValue={profile?.location ?? ""} error={fieldErrors.location} />
            <Field label="Website (optional)" name="website" type="url" defaultValue={profile?.website ?? ""} placeholder="https://example.com" error={fieldErrors.website} />
          </div>
          <label className="field" htmlFor="profile-externalLinks">
            <span>External links (optional)</span>
            <textarea
              id="profile-externalLinks"
              name="externalLinks"
              rows={4}
              defaultValue={profile?.externalLinks.map((link) => `${link.label} | ${link.url}`).join("\n")}
              placeholder={"Documentation | https://example.com/docs\nContact | https://example.com/contact"}
              aria-invalid={Boolean(fieldErrors.externalLinks) || undefined}
              aria-describedby={describedBy("external-links-help", errorId("externalLinks", fieldErrors.externalLinks))}
            />
            <small id="external-links-help">One per line in “Label | URL” form. Maximum eight.</small>
            <FieldError name="externalLinks" error={fieldErrors.externalLinks} />
          </label>
        </div>
      </details>

      <fieldset className="identity-secondary-fields">
        <legend>Appearance</legend>
        <p className="fieldset-introduction">Optional restrained choices for this Aitta’s public profile and update list.</p>
        <div className="identity-appearance-layout">
          <div className="identity-appearance-controls">
            <label className="field color-field" htmlFor="profile-accentColor">
              <span>Accent color</span>
              <input
                id="profile-accentColor"
                name="accentColor"
                type="color"
                defaultValue={editableAccentPreference(profile?.accentColor)}
                aria-invalid={Boolean(fieldErrors.accentColor) || accentReplacementRequired || undefined}
                aria-describedby={describedBy("accent-color-help", errorId("accentColor", fieldErrors.accentColor))}
              />
              <small id="accent-color-help">{accentReplacementRequired
                ? "The historical saved accent cannot be shown safely. Choose a replacement before saving; reload leaves the stored value unchanged."
                : "The saved choice stays exact. This preview derives a contrast-safe display color."}</small>
              <FieldError name="accentColor" error={fieldErrors.accentColor} />
            </label>
            <label className="field" htmlFor="profile-density">
              <span>Update spacing</span>
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
              <small id="density-help">Choose comfortable or compact spacing for public updates.</small>
              <FieldError name="density" error={fieldErrors.density} />
            </label>
            <label className="check-field"><input name="hidePoweredBy" type="checkbox" defaultChecked={profile?.hidePoweredBy} /><span>Hide the restrained “Powered by AittaSocial” attribution</span></label>
          </div>

          <aside
            className={`identity-draft-preview identity-appearance-preview density-${previewDensity(preview.density)}`}
            aria-labelledby="identity-draft-preview-title"
            style={{ "--accent": resolvePresentationAccent(preview.accentColor) } as CSSProperties}
          >
            <div className="identity-appearance-preview-heading">
              <p className="eyebrow">Appearance preview</p>
              <p className={`identity-appearance-preview-state ${dirty ? "identity-appearance-preview-unsaved" : profile ? "identity-appearance-preview-saved" : "identity-appearance-preview-new"}`}>
                <strong>{dirty ? "Unsaved preview" : profile ? "Saved appearance" : "Appearance not saved"}</strong>
                <span>{dirty
                  ? "These choices are temporary until Save Identity succeeds."
                  : profile
                    ? "This matches the appearance loaded from this Aitta."
                    : "Choose an appearance, then save Identity to make it public."}</span>
              </p>
              <h2 id="identity-draft-preview-title">{preview.displayName.trim() || "Your display name"}</h2>
              <p>{preview.shortDescription.trim() || "A short description will introduce this profile."}</p>
            </div>

            <div className="identity-draft-progress">
              <label htmlFor="identity-draft-progress">Fields filled in this form: {requiredCount(preview)} of 4</label>
              <progress id="identity-draft-progress" max="4" value={requiredCount(preview)}>{requiredCount(preview)} of 4</progress>
              <small>This local count is not server readiness. {dirty ? "It remains temporary until Save Identity succeeds." : canonicalDefaultSource === "invalid-stored-omitted" ? "The preview excludes the invalid saved canonical fallback described above." : canonicalDefaultSource === "runtime-substitution" ? "The preview includes the safe runtime URL substitution described above." : profile ? "The preview uses the loaded saved values." : "Nothing has been saved yet."}</small>
            </div>

            <div className="identity-appearance-sample" aria-label="Public update appearance sample">
              <div className="identity-appearance-sample-summary" aria-label="Current appearance choices">
                <span>Spacing · {previewDensity(preview.density) === "compact" ? "Compact" : "Comfortable"}</span>
                <span>Attribution · {preview.hidePoweredBy ? "Hidden" : "Visible"}</span>
              </div>
              <article className="identity-appearance-sample-update">
                <strong>Example public update</strong>
                <span>Spacing changes here without changing update content.</span>
              </article>
              <article className="identity-appearance-sample-update">
                <strong>Another public update</strong>
                <span>The preview remains local until the complete form is saved.</span>
              </article>
              {preview.hidePoweredBy ? null : <p className="identity-appearance-sample-attribution">Powered by AittaSocial</p>}
            </div>
          </aside>
        </div>
      </fieldset>

      <div className="form-footer">
        <button className="button" type="submit" disabled={busy || recoveryRequired}>Save Identity</button>
        <a className="button button-quiet" href="/">Preview saved public profile</a>
        <p className="form-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
        {recoveryRequired ? <a className="button button-quiet" href="/owner/profile">Reload saved Identity before retrying</a> : null}
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
    return "The saved profile remains in this Aitta, but its invalid canonical fallback was omitted from this form. Save a valid HTTPS fallback below.";
  }
  if (readiness.canonicalSource === "runtime") {
    if (defaultSource === "runtime-substitution") {
      return readiness.state === "fresh"
        ? "A protected runtime URL is active for this Aitta and prefilled below as a fallback starting value. Saving creates the D1 fallback."
        : "A protected runtime URL is currently public for this Aitta. Because the stored fallback is invalid, that effective URL is prefilled below; saving replaces the invalid D1 fallback.";
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

function canonicalFieldHelp(source: IdentityReadiness["canonicalSource"], defaultSource: CanonicalDefaultSource): string {
  if (defaultSource === "invalid-stored-omitted") {
    return "No URL is prefilled because the saved fallback is invalid. Saving a valid HTTPS URL replaces it in this Aitta’s D1.";
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

function formValues(form: FormData): FormValues {
  return {
    displayName: String(form.get("displayName") ?? ""),
    shortDescription: String(form.get("shortDescription") ?? ""),
    introduction: String(form.get("introduction") ?? ""),
    location: String(form.get("location") ?? ""),
    website: String(form.get("website") ?? ""),
    externalLinks: String(form.get("externalLinks") ?? ""),
    canonicalUrl: String(form.get("canonicalUrl") ?? ""),
    accentColor: String(form.get("accentColor") ?? defaultAccentPreference),
    density: String(form.get("density") ?? "comfortable"),
    hidePoweredBy: form.get("hidePoweredBy") === "on",
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
    <label className="field" htmlFor={inputId}>
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

function focusFirstInvalidField(form: HTMLFormElement, errors: FieldErrors) {
  const [fieldName] = Object.keys(errors) as ProfileFieldName[];
  if (!fieldName) return;
  window.requestAnimationFrame(() => {
    const control = form.elements.namedItem(fieldName);
    if (control instanceof HTMLElement) control.focus();
  });
}
