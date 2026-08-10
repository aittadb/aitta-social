"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import type { IdentityReadiness } from "@/lib/identity-readiness";
import type { ProfileInput } from "@/lib/types";

type DraftPreview = Pick<ProfileInput, "displayName" | "shortDescription" | "introduction" | "canonicalUrl" | "accentColor">;

export function ProfileForm({
  profile,
  canonicalDefault,
  readiness,
}: {
  profile: ProfileInput | null;
  canonicalDefault: string;
  readiness: IdentityReadiness;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState<DraftPreview>({
    displayName: profile?.displayName ?? "",
    shortDescription: profile?.shortDescription ?? "",
    introduction: profile?.introduction ?? "",
    canonicalUrl: profile?.canonicalUrl ?? canonicalDefault,
    accentColor: profile?.accentColor ?? "#31554d",
  });

  function updatePreview(event: FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget);
    setPreview({
      displayName: String(form.get("displayName") ?? ""),
      shortDescription: String(form.get("shortDescription") ?? ""),
      introduction: String(form.get("introduction") ?? ""),
      canonicalUrl: String(form.get("canonicalUrl") ?? ""),
      accentColor: String(form.get("accentColor") ?? "#31554d"),
    });
    setDirty(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Saving…");
    const form = new FormData(event.currentTarget);
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
    const response = await fetch("/api/private/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    });
    if (response.ok) {
      setStatus("Identity saved. Reloading its durable readiness…");
      window.location.assign("/owner/profile");
      return;
    }
    setStatus(await errorMessage(response));
    setBusy(false);
  }

  return (
    <form className="owner-form" onSubmit={submit} onInput={updatePreview} noValidate>
      <section className={`identity-form-readiness identity-readiness-${readiness.state}`} aria-labelledby="identity-form-readiness-title">
        <div>
          <p className="eyebrow">Saved readiness</p>
          <h2 id="identity-form-readiness-title">{readinessTitle(readiness.state)}</h2>
          <p>{canonicalExplanation(readiness)}</p>
          {readiness.canonicalUrl ? <p className="effective-canonical"><span>Effective public URL</span><code>{readiness.canonicalUrl}</code></p> : null}
        </div>
        <a className="text-link" href="/">Preview saved public presence</a>
      </section>

      <aside
        className="identity-draft-preview"
        aria-labelledby="identity-draft-preview-title"
        style={{ "--preview-accent": safePreviewAccent(preview.accentColor) } as CSSProperties}
      >
        <div>
          <p className="eyebrow">{dirty ? "Unsaved form preview" : profile ? "Saved Identity preview" : "New Identity preview"}</p>
          <h2 id="identity-draft-preview-title">{preview.displayName.trim() || "Your display name"}</h2>
          <p>{preview.shortDescription.trim() || "A short description will introduce this presence."}</p>
        </div>
        <div className="identity-draft-progress">
          <label htmlFor="identity-draft-progress">Required fields filled: {requiredCount(preview)} of 4</label>
          <progress id="identity-draft-progress" max="4" value={requiredCount(preview)}>{requiredCount(preview)} of 4</progress>
          <small>{dirty ? "This preview is temporary until Save identity succeeds." : profile ? "These values come from the saved Identity." : "Nothing has been saved yet."}</small>
        </div>
      </aside>

      <fieldset>
        <legend>Identity</legend>
        <Field label="Display name" name="displayName" required maxLength={100} defaultValue={profile?.displayName} />
        <label className="field"><span>Short description</span><textarea name="shortDescription" required maxLength={280} rows={3} defaultValue={profile?.shortDescription} /><small>One clear sentence for the top of the presence.</small></label>
        <label className="field"><span>Longer introduction</span><textarea name="introduction" required maxLength={10000} rows={8} defaultValue={profile?.introduction} /></label>
      </fieldset>

      <fieldset>
        <legend>Public details</legend>
        <div className="field-grid field-grid-two">
          <Field label="Location (optional)" name="location" maxLength={120} defaultValue={profile?.location ?? ""} />
          <Field label="Website (optional)" name="website" type="url" defaultValue={profile?.website ?? ""} placeholder="https://example.com" />
        </div>
        <label className="field"><span>External links (optional)</span><textarea name="externalLinks" rows={4} defaultValue={profile?.externalLinks.map((link) => `${link.label} | ${link.url}`).join("\n")} placeholder={"Documentation | https://example.com/docs\nContact | https://example.com/contact"} /><small>One per line in “Label | URL” form. Maximum eight.</small></label>
        <Field label="Canonical presence URL" name="canonicalUrl" type="url" required defaultValue={canonicalDefault} placeholder="https://presence.example" />
        <p className="field-note">A valid protected runtime URL takes precedence. This field remains the durable fallback and is validated when you save.</p>
      </fieldset>

      <fieldset>
        <legend>Presentation</legend>
        <div className="field-grid field-grid-two">
          <label className="field color-field"><span>Accent color</span><input name="accentColor" type="color" defaultValue={profile?.accentColor ?? "#31554d"} /></label>
          <label className="field"><span>Update density</span><select name="density" defaultValue={profile?.density ?? "comfortable"}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
        </div>
        <label className="check-field"><input name="hidePoweredBy" type="checkbox" defaultChecked={profile?.hidePoweredBy} /><span>Hide the restrained “Powered by AittaSocial” and source links</span></label>
      </fieldset>

      <div className="form-footer">
        <button className="button" type="submit" disabled={busy}>Save identity</button>
        <a className="button button-quiet" href="/">Preview public presence</a>
        <p className="form-status" role="status" aria-live="polite">{status}</p>
      </div>
    </form>
  );
}

function readinessTitle(state: IdentityReadiness["state"]): string {
  if (state === "complete") return "Identity is complete";
  if (state === "incomplete") return "Identity needs a canonical URL";
  return "Identity has not been saved";
}

function canonicalExplanation(readiness: IdentityReadiness): string {
  if (readiness.canonicalSource === "runtime") {
    return readiness.state === "fresh"
      ? "A normalized canonical URL from protected runtime settings is ready. Complete the Identity fields and save them."
      : "Public links use the normalized canonical URL from protected runtime settings. The saved Identity URL remains the fallback editable below.";
  }
  if (readiness.canonicalSource === "stored") {
    return "Public links use the normalized canonical URL saved with this Identity because no valid runtime override is active.";
  }
  return readiness.state === "incomplete"
    ? "Saved Identity content is preserved, but there is no valid effective canonical URL. Save a valid HTTPS URL below."
    : "Complete the required fields and save a valid HTTPS canonical URL. Unsaved changes do not survive reload.";
}

function requiredCount(preview: DraftPreview): number {
  return [preview.displayName, preview.shortDescription, preview.introduction, preview.canonicalUrl]
    .filter((value) => value.trim().length > 0)
    .length;
}

function safePreviewAccent(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#31554d";
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string; type?: string; [key: string]: unknown }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} {...props} /></label>;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string; details?: Record<string, string> };
    return body.details ? Object.values(body.details)[0] : body.error ?? "The identity could not be saved.";
  } catch { return "The identity could not be saved."; }
}
