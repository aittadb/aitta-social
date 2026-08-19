"use client";

import { useState } from "react";
import { readDeletionResponse } from "../entries/deletion-response";
import { changeEntryStateRequest, deleteEntryRequest } from "../entries/entry-mutation-requests";
import { readPublicationStateResponse } from "../entries/publication-state-response";
import styles from "./EntryActions.module.css";

type Copy = {
  edit: string;
  publish: string;
  permalink: string;
  unpublish: string;
  delete: string;
  stateDraft: string;
  statePublished: string;
  stateDraftContext: string;
  statePublishedContext: string;
  stateDraftLabel: string;
  statePublishedLabel: string;
  checkSavedStateAction: string;
  checkSavedStateTitle: string;
  checkCurrentState: string;
  checkSavedState: string;
  saveUnknown: string;
  publicationFailureDraft: string;
  publicationFailureUnpublish: string;
  deletionFailure: string;
  publishCanceled: string;
  deleteCanceled: string;
  confirmPublish: string;
  confirmDelete: string;
  confirmUnpublish: string;
  saveStateSaving: string;
  draftActionPrefix: string;
  statusPrivateVisibility: string;
  statusPublicVisibility: string;
  serverRejectedPublish: string;
  serverRejectedUnpublish: string;
};

function formatCopyTemplate(message: string, updateLabel: string, actionReference: string): string {
  return message.replaceAll("{label}", updateLabel).replaceAll("{reference}", actionReference);
}

export function EntryActions({
  id,
  state,
  label,
  copy,
}: {
  id: string;
  state: "draft" | "published";
  label: string;
  copy: Copy;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lifecycleRecoveryRequired, setLifecycleRecoveryRequired] = useState(false);
  const [deletionRecoveryRequired, setDeletionRecoveryRequired] = useState(false);
  const updateLabel = boundedUpdateLabel(label);
  const actionReference = id;
  const lifecycleDescriptionId = `entry-lifecycle-${id}`;
  const recoverySavedStateTitleBoth = `${copy.checkCurrentState}. ${copy.checkSavedState}`;

  function showUnconfirmedResult(message: string) {
    setMessage(message);
    setDeletionRecoveryRequired(true);
    setBusy(false);
  }

  async function changeState(nextState: "draft" | "published") {
    if (lifecycleRecoveryRequired) return;
    setBusy(true);
    setMessage(copy.saveStateSaving);
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
      setMessage(lifecycleFailureMessage(nextState, result.message, copy));
      setBusy(false);
    } catch {
      showUnconfirmedLifecycleResult(nextState);
    }
  }

  function showUnconfirmedLifecycleResult(nextState: "draft" | "published") {
    setMessage(
      nextState === "published"
        ? copy.publicationFailureDraft
        : copy.publicationFailureUnpublish,
    );
    setLifecycleRecoveryRequired(true);
    setBusy(false);
  }

  function requestPublish() {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      state === "draft"
        ? formatCopyTemplate(copy.confirmPublish, updateLabel, actionReference)
        : formatCopyTemplate(copy.confirmUnpublish, updateLabel, actionReference),
    );
    if (!confirmed) {
      setMessage(copy.publishCanceled);
      return;
    }
    if (state === "draft") {
      void changeState("published");
      return;
    }
    void changeState("draft");
  }

  async function remove() {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(formatCopyTemplate(copy.confirmDelete, updateLabel, actionReference));
    if (!confirmed) {
      setMessage(copy.deleteCanceled);
      return;
    }
    await removeEntry();
  }

  async function removeEntry() {
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
        showUnconfirmedResult(copy.deletionFailure);
        return;
      }
      setMessage(`The server rejected this deletion request. ${outcome.message}`);
      setBusy(false);
    } catch {
      showUnconfirmedResult(copy.deletionFailure);
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
      <p className={styles['entry-actions-status']} id={lifecycleDescriptionId}>
        <strong>{state === "draft" ? copy.stateDraftLabel : copy.statePublishedLabel}</strong>
        <span>{state === "draft"
          ? copy.stateDraftContext
          : copy.statePublishedContext}</span>
      </p>
      <a className="button button-small button-quiet" href={`/owner/entries/${id}`} aria-label={`Edit ${updateLabel}, update ${actionReference}`}>{copy.edit}</a>
      {state === "draft" ? (
        <button className="button button-small" type="button" disabled={busy || lifecycleRecoveryRequired} onClick={requestPublish} aria-label={`Publish ${updateLabel}, update ${actionReference}`}>{copy.publish}</button>
      ) : (
        <>
          <a className="button button-small button-quiet" href={`/entries/${id}`} aria-label={`Open public permalink for ${updateLabel}, update ${actionReference}`}>{copy.permalink}</a>
          <button className="button button-small button-quiet" type="button" disabled={busy || lifecycleRecoveryRequired} onClick={requestPublish} aria-label={`Unpublish ${updateLabel}, update ${actionReference}`}>{copy.unpublish}</button>
        </>
      )}
      <button className="button button-small button-danger" type="button" disabled={busy || deletionRecoveryRequired} onClick={remove} aria-label={`Delete ${updateLabel}, update ${actionReference}`}>{copy.delete}</button>
      <span className={styles['entry-actions-status']} role="status" aria-live="polite" aria-atomic="true">{message}</span>
      {lifecycleRecoveryRequired ? (
        <a
          className="button button-small button-quiet"
          href="/owner"
          aria-label={`Check current state ${copy.checkSavedStateTitle} ${updateLabel}, update ${actionReference}`}
          title={recoverySavedStateTitleBoth}
        >
          {copy.checkSavedStateAction}
        </a>
      ) : null}
      {deletionRecoveryRequired ? (
        <a
          className="button button-small button-quiet"
          href="/owner"
          aria-label={`Check saved state ${copy.checkSavedStateAction} ${updateLabel}, update ${actionReference}`}
          title={copy.checkSavedState}
        >
          {copy.checkSavedStateAction}
        </a>
      ) : null}
    </div>
  );
}

function boundedUpdateLabel(value: string): string {
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (!normalized) return "untitled update";
  return normalized.length > 80 ? `${normalized.slice(0, 77).trimEnd()}…` : normalized;
}

function lifecycleFailureMessage(
  nextState: "draft" | "published",
  failure: string,
  copy: Copy,
): string {
  return nextState === "published"
    ? `${copy.serverRejectedPublish} ${failure}`
    : `${copy.serverRejectedUnpublish} ${failure}`;
}
