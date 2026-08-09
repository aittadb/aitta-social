"use client";

import { useState } from "react";

export function EntryActions({ id, state }: { id: string; state: "draft" | "published" }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function changeState(nextState: "draft" | "published") {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/private/entries/${encodeURIComponent(id)}/state`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: nextState }),
    });
    if (response.ok) window.location.reload();
    else {
      setMessage(await safeError(response));
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this entry permanently? This cannot be undone.")) return;
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/private/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) window.location.href = "/owner";
    else {
      setMessage(await safeError(response));
      setBusy(false);
    }
  }

  return (
    <div className="entry-actions">
      <a className="button button-small button-quiet" href={`/owner/entries/${id}`}>Edit</a>
      {state === "draft" ? (
        <button className="button button-small" type="button" disabled={busy} onClick={() => changeState("published")}>Publish</button>
      ) : (
        <>
          <a className="button button-small button-quiet" href={`/entries/${id}`}>Permalink</a>
          <button className="button button-small button-quiet" type="button" disabled={busy} onClick={() => changeState("draft")}>Unpublish</button>
        </>
      )}
      <button className="button button-small button-danger" type="button" disabled={busy} onClick={remove}>Delete</button>
      <span className="form-status" role="status" aria-live="polite">{message}</span>
    </div>
  );
}

async function safeError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error ?? "The operation could not be completed.";
  } catch {
    return "The operation could not be completed.";
  }
}
