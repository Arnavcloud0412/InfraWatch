"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LIFECYCLE_LABELS, LIFECYCLE_ORDER, lifecycleLabel } from "@/lib/labels";
import type { LifecycleStatus } from "@/lib/types";

export function ReviewForm({
  eventId,
  reportedLifecycle,
}: {
  eventId: string;
  reportedLifecycle: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [applyLifecycle, setApplyLifecycle] = useState(Boolean(reportedLifecycle));
  const defaultStage =
    reportedLifecycle && LIFECYCLE_ORDER.includes(reportedLifecycle as LifecycleStatus)
      ? (reportedLifecycle as LifecycleStatus)
      : "proposed";
  const [lifecycle, setLifecycle] = useState<LifecycleStatus>(defaultStage);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function act(action: "accept" | "reject" | "request_verification") {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/review/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes,
          applyLifecycle: action === "accept" ? applyLifecycle : false,
          lifecycle: action === "accept" && applyLifecycle ? lifecycle : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Review failed.");
      setNotes("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <label>
        Reviewer notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What you read, and what is still missing." />
      </label>
      <label className="check">
        <input type="checkbox" checked={applyLifecycle} onChange={(event) => setApplyLifecycle(event.target.checked)} />
        On accept, update the recorded project stage
        {reportedLifecycle ? ` (reported: ${lifecycleLabel(reportedLifecycle)})` : ""}.
      </label>
      {applyLifecycle ? (
        <label>
          Project stage
          <select value={lifecycle} onChange={(event) => setLifecycle(event.target.value as LifecycleStatus)}>
            {LIFECYCLE_ORDER.map((status) => (
              <option key={status} value={status}>
                {LIFECYCLE_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="actions">
        <button type="button" disabled={pending} onClick={() => act("accept")}>
          Accept
        </button>
        <button type="button" className="quiet" disabled={pending} onClick={() => act("request_verification")}>
          Request verification
        </button>
        <button type="button" className="danger" disabled={pending} onClick={() => act("reject")}>
          Reject
        </button>
      </div>
      {error ? <p className="badge bad">{error}</p> : null}
      <p className="muted" style={{ fontSize: 12 }}>
        Accept on a non-official or synthetic source becomes corroborated, not officially confirmed. Reject keeps the row and writes an audit entry.
      </p>
    </div>
  );
}
