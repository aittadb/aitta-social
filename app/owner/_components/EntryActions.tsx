"use client";

import { useState } from "react";
import { readDeletionResponse } from "../entries/deletion-response";
import { changeEntryStateRequest, deleteEntryRequest } from "../entries/entry-mutation-requests";
import { readPublicationStateResponse } from "../entries/publication-state-response";

export function EntryActions({ id, state, label }: { id: string; state: "draft" | "published"; label: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lifecycleRecoveryRequired, setLifecycleRecoveryRequired] = useState(false);
  const [deletionRecoveryRequired, setDeletionRecoveryRequired] = useState(false);
  const updateLabel = boundedUpdateLabel(label);
  const actionReference = id;
  const lifecycleDescriptionId = `entry-lifecycle-${id}`;

  function showUnconfirmedResult(message: string) {
    setMessage(message);
    setDeletionRecoveryRequired(true);
    setBusy(false);
  }

  function showUnconfirmedLifecycleResult(nextState: "draft" | "published") {
    setMessage(nextState === "published"
      ? "The publication result could not be confirmed. Check this Aitta’s saved state before changing this update’s publication state again."
      : "The unpublish result could not be confirmed. Check this Aitta’s saved state before changing this update’s publication state again.");
    setLifecycleRecoveryRequired(true);
    setBusy(false);
  }

  async function changeState(nextState: "draft" | "published") {
    if (lifecycleRecoveryRequired) return;
    setBusy(true);
    setMessage(nextState === "published" ? "Publishing this update…" : "Returning this update to Draft…");
    try {
      const response = await changeEntryStateRequest(id, nextState);
      const result = await readPublicationStateResponse(response, { id, state: nextState });
      if (result.outcome === "success") {
        window.location.reload();
        return;
      }
      if (result.outcome === "unconfirmed") {
        showUnconfirmedLifecycleResult(nextState);
        return;
      }
      setMessage(lifecycleFailureMessage(nextState, result.message));
      setBusy(false);
    } catch {
      showUnconfirmedLifecycleResult(nextState);
    }
  }

  function requestPublish() {
    const confirmed = window.confirm(
      `Publish “${updateLabel}” (update ${actionReference}) now? It will become publicly readable on this Aitta at its permalink.`,
    );
    if (!confirmed) {
      setMessage("Publication cancelled. The update is still private.");
      return;
    }
    void changeState("published");
  }

  async function remove() {
    const confirmed = window.confirm(`Delete “${updateLabel}” (update ${actionReference}) permanently? This cannot be undone.`);
    if (!confirmed) {
      setMessage("Deletion cancelled. This update was not deleted.");
      return;
    }
    setBusy(true);
    setMessage("Deleting update…");
    try {
      const response = await deleteEntryRequest(id);
      const outcome = await readDeletionResponse(response, id);
      if (outcome.outcome === "success") {
        window.location.assign("/owner");
        return;
      }
      if (outcome.outcome === "unconfirmed") {
        showUnconfirmedResult("The deletion result could not be confirmed. Check this Aitta’s saved state before deleting this update again.");
        return;
      }
      setMessage(`The server rejected this deletion request. ${outcome.message}`);
      setBusy(false);
    } catch {
      showUnconfirmedResult("The deletion result could not be confirmed. Check this Aitta’s saved state before deleting this update again.");
    }
  }

  return (
    <div
      className="entry-actions"
      role="group"
      aria-label={`Actions for ${updateLabel}, update ${actionReference}`}
      aria-describedby={lifecycleDescriptionId}
      aria-busy={busy}
    >
      <p className="form-status" id={lifecycleDescriptionId}>
        <strong>{state === "draft" ? "Draft" : "Published"}</strong>
        {state === "draft"
          ? " — only the owner can read this update. Publishing makes it publicly readable on this Aitta."
          : " — this update is publicly readable on this Aitta. Unpublishing returns it to a private draft."}
      </p>
      <a className="button button-small button-quiet" href={`/owner/entries/${id}`} aria-label={`Edit ${updateLabel}, update ${actionReference}`}>Edit</a>
      {state === "draft" ? (
        <button className="button button-small" type="button" disabled={busy || lifecycleRecoveryRequired} onClick={requestPublish} aria-label={`Publish ${updateLabel}, update ${actionReference}`}>Publish</button>
      ) : (
        <>
          <a className="button button-small button-quiet" href={`/entries/${id}`} aria-label={`Open public permalink for ${updateLabel}, update ${actionReference}`}>Permalink</a>
          <button className="button button-small button-quiet" type="button" disabled={busy || lifecycleRecoveryRequired} onClick={() => void changeState("draft")} aria-label={`Unpublish ${updateLabel}, update ${actionReference}`}>Unpublish</button>
        </>
      )}
      <button className="button button-small button-danger" type="button" disabled={busy || deletionRecoveryRequired} onClick={remove} aria-label={`Delete ${updateLabel}, update ${actionReference}`}>Delete</button>
      <span className="form-status" role="status" aria-live="polite" aria-atomic="true">{message}</span>
      {lifecycleRecoveryRequired ? (
        <a className="button button-small button-quiet" href="/owner" aria-label={`Check current state of ${updateLabel}, update ${actionReference}`}>
          Check this Aitta’s current saved state
        </a>
      ) : null}
      {deletionRecoveryRequired ? (
        <a className="button button-small button-quiet" href="/owner" aria-label={`Check saved state of ${updateLabel}, update ${actionReference}`}>
          Check this Aitta’s saved state
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

function lifecycleFailureMessage(nextState: "draft" | "published", failure: string): string {
  return nextState === "published"
    ? `The server rejected this publication request. ${failure}`
    : `The server rejected this unpublish request. ${failure}`;
}
