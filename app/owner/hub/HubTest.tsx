"use client";

import { useState } from "react";

export function HubTest() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function test() {
    setBusy(true);
    setStatus("Testing the protected server connection…");
    const response = await fetch("/api/private/hub/test", { method: "POST" });
    try {
      const result = await response.json() as { data?: { message?: string }; error?: string };
      setStatus(result.data?.message ?? result.error ?? "No safe status was returned.");
    } catch { setStatus("No safe status was returned."); }
    setBusy(false);
  }
  return <div className="hub-test"><button className="button" type="button" disabled={busy} onClick={test}>Test Hub connection</button><p className="form-status" role="status" aria-live="polite">{status}</p></div>;
}
