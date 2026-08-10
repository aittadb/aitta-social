"use client";

import { useState, type FormEvent } from "react";
import type { Entry } from "@/lib/types";
import { classifyOwnerMutationResponse } from "../_components/owner-mutation-outcome";

export function EntryForm({ entry }: { entry: Entry | null }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const isPublished = entry?.state === "published";

  function showUnconfirmedSave() {
    setStatus("The save result could not be confirmed. Reload Your presence before retrying.");
    setShowRecovery(true);
    setBusy(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setShowRecovery(false);
    setStatus(entry ? (isPublished ? "Saving public update…" : "Saving private draft…") : "Creating private draft…");
    const form = new FormData(event.currentTarget);
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
          window.location.assign(`/owner/entries/${payload.data.id}`);
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
      setStatus(await errorMessage(response));
    } catch {
      showUnconfirmedSave();
      return;
    }
    setBusy(false);
  }

  return (
    <form className="owner-form entry-editor-form" aria-label={entry ? "Edit update" : "Create private draft"} onSubmit={submit} aria-busy={busy} noValidate>
      <fieldset>
        <legend>Update</legend>
        <div className="field-grid field-grid-two">
          <label className="field"><span>Kind</span><select name="kind" defaultValue={entry?.kind ?? "note"}><option value="note">Note</option><option value="article">Article</option><option value="link">Link</option><option value="announcement">Announcement</option></select></label>
          <label className="field"><span>Title (optional)</span><input name="title" maxLength={200} defaultValue={entry?.title ?? ""} /></label>
        </div>
        <label className="field"><span>Text</span><textarea name="body" required maxLength={50000} rows={16} defaultValue={entry?.body} /><small>Plain text only in this POC. Keep each update focused.</small></label>
        <label className="field"><span>Destination URL (optional; required for Link)</span><input name="destinationUrl" type="url" defaultValue={entry?.destinationUrl ?? ""} placeholder="https://example.com/resource" /></label>
      </fieldset>
      <div className="form-footer">
        <button className="button" type="submit" disabled={busy}>
          {entry ? (isPublished ? "Save public update" : "Save private draft") : "Create private draft"}
        </button>
        <a className="button button-quiet" href="/owner">Return to Your presence</a>
        <p className="form-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
        {showRecovery ? (
          <a className="button button-quiet" href={entry ? `/owner/entries/${entry.id}` : "/owner"}>
            {entry ? "Reload saved update" : "Check saved updates"}
          </a>
        ) : null}
      </div>
    </form>
  );
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string; details?: Record<string, string> };
    return body.details ? Object.values(body.details)[0] : body.error ?? "The update could not be saved.";
  } catch { return "The update could not be saved."; }
}
