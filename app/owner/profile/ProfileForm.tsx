"use client";

import { useState, type FormEvent } from "react";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, canonicalDefault }: { profile: Profile | null; canonicalDefault: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

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
        accountType: form.get("accountType"),
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
      setStatus("Profile saved. The public account is ready to review.");
      setBusy(false);
      return;
    }
    setStatus(await errorMessage(response));
    setBusy(false);
  }

  return (
    <form className="owner-form" onSubmit={submit} noValidate>
      <fieldset>
        <legend>Identity</legend>
        <div className="field-grid field-grid-two">
          <Field label="Display name" name="displayName" required maxLength={100} defaultValue={profile?.displayName} />
          <label className="field"><span>Account type</span><select name="accountType" defaultValue={profile?.accountType ?? "person"}>
            <option value="person">Person</option><option value="company">Company</option><option value="project">Project</option>
            <option value="community">Community</option><option value="publication">Publication</option><option value="agent">AI agent</option><option value="other">Other entity</option>
          </select></label>
        </div>
        <label className="field"><span>Short description</span><textarea name="shortDescription" required maxLength={280} rows={3} defaultValue={profile?.shortDescription} /><small>One clear sentence for the top of the account.</small></label>
        <label className="field"><span>Longer introduction</span><textarea name="introduction" required maxLength={10000} rows={8} defaultValue={profile?.introduction} /></label>
      </fieldset>

      <fieldset>
        <legend>Public details</legend>
        <div className="field-grid field-grid-two">
          <Field label="Location (optional)" name="location" maxLength={120} defaultValue={profile?.location ?? ""} />
          <Field label="Website (optional)" name="website" type="url" defaultValue={profile?.website ?? ""} placeholder="https://example.com" />
        </div>
        <label className="field"><span>External links (optional)</span><textarea name="externalLinks" rows={4} defaultValue={profile?.externalLinks.map((link) => `${link.label} | ${link.url}`).join("\n")} placeholder={"Documentation | https://example.com/docs\nContact | https://example.com/contact"} /><small>One per line in “Label | URL” form. Maximum eight.</small></label>
        <Field label="Canonical deployment URL" name="canonicalUrl" type="url" required defaultValue={profile?.canonicalUrl ?? canonicalDefault} placeholder="https://account.example" />
      </fieldset>

      <fieldset>
        <legend>Presentation</legend>
        <div className="field-grid field-grid-two">
          <label className="field color-field"><span>Accent color</span><input name="accentColor" type="color" defaultValue={profile?.accentColor ?? "#31554d"} /></label>
          <label className="field"><span>Entry density</span><select name="density" defaultValue={profile?.density ?? "comfortable"}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
        </div>
        <label className="check-field"><input name="hidePoweredBy" type="checkbox" defaultChecked={profile?.hidePoweredBy} /><span>Hide the restrained “Powered by AittaSocial” and source links</span></label>
      </fieldset>

      <div className="form-footer">
        <button className="button" type="submit" disabled={busy}>Save profile</button>
        <a className="button button-quiet" href="/">Preview public account</a>
        <p className="form-status" role="status" aria-live="polite">{status}</p>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text", ...props }: { label: string; name: string; type?: string; [key: string]: unknown }) {
  return <label className="field"><span>{label}</span><input name={name} type={type} {...props} /></label>;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string; details?: Record<string, string> };
    return body.details ? Object.values(body.details)[0] : body.error ?? "The profile could not be saved.";
  } catch { return "The profile could not be saved."; }
}
