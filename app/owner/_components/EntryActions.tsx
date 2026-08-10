"use client";

import { useState } from "react";
import { classifyOwnerMutationResponse } from "./owner-mutation-outcome";

export function EntryActions({ id, state, label }: { id: string; state: "draft" | "published"; label: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const updateLabel = boundedUpdateLabel(label);
  const actionReference = id;

  function showUnconfirmedResult(message: string) {
    setMessage(message);
    setShowRecovery(true);
    setBusy(false);
  }

  async function changeState(nextState: "draft" | "published") {
    setBusy(true);
    setShowRecovery(false);
    setMessage(nextState === "published" ? "Publishing update…" : "Unpublishing update…");
    try {
      const response = await fetch(`/api/private/entries/${encodeURIComponent(id)}/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: nextState }),
      });
      const outcome = classifyOwnerMutationResponse(response);
      if (outcome === "success") {
        window.location.reload();
        return;
      }
      if (outcome === "unconfirmed") {
        showUnconfirmedResult("The update visibility result could not be confirmed. Reload Your presence before retrying.");
        return;
      }
      setMessage(await safeError(response));
      setBusy(false);
    } catch {
      showUnconfirmedResult("The update visibility result could not be confirmed. Reload Your presence before retrying.");
    }
  }

  function requestPublish() {
    const confirmed = window.confirm(
      `Publish “${updateLabel}” (update ${actionReference}) now? It will become visible on the public presence and its permalink.`,
    );
    if (!confirmed) {
      setShowRecovery(false);
      setMessage("Publication cancelled. The update is still private.");
      return;
    }
    void changeState("published");
  }

  async function remove() {
    if (!window.confirm(`Delete “${updateLabel}” (update ${actionReference}) permanently? This cannot be undone.`)) return;
    setBusy(true);
    setShowRecovery(false);
    setMessage("Deleting update…");
    try {
      const response = await fetch(`/api/private/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
      const outcome = classifyOwnerMutationResponse(response);
      if (outcome === "success") {
        window.location.assign("/owner");
        return;
      }
      if (outcome === "unconfirmed") {
        showUnconfirmedResult("The deletion result could not be confirmed. Reload Your presence before retrying.");
        return;
      }
      setMessage(await safeError(response));
      setBusy(false);
    } catch {
      showUnconfirmedResult("The deletion result could not be confirmed. Reload Your presence before retrying.");
    }
  }

  return (
    <div className="entry-actions" role="group" aria-label={`Actions for ${updateLabel}, update ${actionReference}`} aria-busy={busy}>
      <a className="button button-small button-quiet" href={`/owner/entries/${id}`} aria-label={`Edit ${updateLabel}, update ${actionReference}`}>Edit</a>
      {state === "draft" ? (
        <button className="button button-small" type="button" disabled={busy} onClick={requestPublish} aria-label={`Publish ${updateLabel}, update ${actionReference}`}>Publish</button>
      ) : (
        <>
          <a className="button button-small button-quiet" href={`/entries/${id}`} aria-label={`Open public permalink for ${updateLabel}, update ${actionReference}`}>Permalink</a>
          <button className="button button-small button-quiet" type="button" disabled={busy} onClick={() => void changeState("draft")} aria-label={`Unpublish ${updateLabel}, update ${actionReference}`}>Unpublish</button>
        </>
      )}
      <button className="button button-small button-danger" type="button" disabled={busy} onClick={remove} aria-label={`Delete ${updateLabel}, update ${actionReference}`}>Delete</button>
      <span className="form-status" role="status" aria-live="polite" aria-atomic="true">{message}</span>
      {showRecovery ? (
        <a className="button button-small button-quiet" href="/owner" aria-label={`Check current state of ${updateLabel}, update ${actionReference}`}>
          Check current state
        </a>
      ) : null}
    </div>
  );
}

function boundedUpdateLabel(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "untitled update";
  return normalized.length > 80 ? `${normalized.slice(0, 77).trimEnd()}…` : normalized;
}

async function safeError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: string };
    return body.error ?? "The operation could not be completed.";
  } catch {
    return "The operation could not be completed.";
  }
}
