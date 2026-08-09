"use client";

import { useState } from "react";

export function HubTest() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function test() {
    setBusy(true);
    setStatus("Running the provisional protected-server probe…");
    const response = await fetch("/api/private/hub/test", { method: "POST" });
    try {
      const result = await response.json() as { data?: { message?: string }; error?: string };
      const message = result.data?.message ?? result.error ?? "No safe status was returned.";
      setStatus(`Provisional probe result: ${message}`);
    } catch { setStatus("Provisional probe result: No safe status was returned."); }
    setBusy(false);
  }
  return <div className="hub-test"><button className="button" type="button" disabled={busy} onClick={test}>Run provisional Hub probe</button><p className="form-status" role="status" aria-live="polite">{status}</p></div>;
}
