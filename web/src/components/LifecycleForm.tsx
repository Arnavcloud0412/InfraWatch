"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LIFECYCLE_LABELS, LIFECYCLE_ORDER } from "@/lib/labels";
import type { LifecycleStatus } from "@/lib/types";

export function LifecycleForm({
  projectId,
  current,
}: {
  projectId: string;
  current: LifecycleStatus;
}) {
  const router = useRouter();
  const [lifecycle, setLifecycle] = useState<LifecycleStatus>(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    if (lifecycle === current) return;
    setPending(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch(`/api/projects/${projectId}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycle }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Update failed.");
      setSaved(true);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Update failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack" style={{ marginTop: 12 }}>
      <label>
        Recorded project stage
        <select
          value={lifecycle}
          onChange={(event) => {
            setLifecycle(event.target.value as LifecycleStatus);
            setSaved(false);
          }}
        >
          {LIFECYCLE_ORDER.map((status) => (
            <option key={status} value={status}>
              {LIFECYCLE_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <div className="actions">
        <button type="button" disabled={pending || lifecycle === current} onClick={save}>
          {pending ? "Saving…" : "Update stage"}
        </button>
      </div>
      {saved ? <p className="badge good">Stage updated</p> : null}
      {error ? <p className="badge bad">{error}</p> : null}
    </div>
  );
}
