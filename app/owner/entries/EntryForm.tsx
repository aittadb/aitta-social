"use client";

import { useState, type FormEvent } from "react";
import type { Entry } from "@/lib/types";

export function EntryForm({ entry }: { entry: Entry | null }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Saving draft…");
    const form = new FormData(event.currentTarget);
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
    if (response.ok) {
      const payload = await response.json() as { data: Entry };
      if (!entry) window.location.href = `/owner/entries/${payload.data.id}`;
      else { setStatus("Draft changes saved."); setBusy(false); }
      return;
    }
    setStatus(await errorMessage(response));
    setBusy(false);
  }

  return (
    <form className="owner-form entry-editor-form" onSubmit={submit} noValidate>
      <fieldset>
        <legend>Entry</legend>
        <div className="field-grid field-grid-two">
          <label className="field"><span>Kind</span><select name="kind" defaultValue={entry?.kind ?? "note"}><option value="note">Note</option><option value="article">Article</option><option value="link">Link</option><option value="announcement">Announcement</option></select></label>
          <label className="field"><span>Title (optional)</span><input name="title" maxLength={200} defaultValue={entry?.title ?? ""} /></label>
        </div>
        <label className="field"><span>Text</span><textarea name="body" required maxLength={50000} rows={16} defaultValue={entry?.body} /><small>Plain text only in this POC. Keep each entry focused.</small></label>
        <label className="field"><span>Destination URL (optional; required for Link)</span><input name="destinationUrl" type="url" defaultValue={entry?.destinationUrl ?? ""} placeholder="https://example.com/resource" /></label>
      </fieldset>
      <div className="form-footer">
        <button className="button" type="submit" disabled={busy}>{entry ? "Save draft changes" : "Create draft"}</button>
        <a className="button button-quiet" href="/owner">Return to overview</a>
        <p className="form-status" role="status" aria-live="polite">{status}</p>
      </div>
    </form>
  );
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string; details?: Record<string, string> };
    return body.details ? Object.values(body.details)[0] : body.error ?? "The entry could not be saved.";
  } catch { return "The entry could not be saved."; }
}
