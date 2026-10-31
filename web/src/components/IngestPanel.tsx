"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Adapter {
  id: string;
  label: string;
  configured: boolean;
  detail: string;
}

export function IngestPanel() {
  const router = useRouter();
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [adapterError, setAdapterError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"discover" | "manual" | null>(null);
  const [maxItems, setMaxItems] = useState(3);

  useEffect(() => {
    fetch("/api/adapters")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) setAdapterError(data.error);
        setAdapters(data.adapters ?? []);
      })
      .catch(() => setAdapterError("Adapter status is unavailable until the agent service is running."));
  }, []);

  async function discover() {
    setPending("discover");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/ingest/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_items: maxItems }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Discovery failed.");
      const extra = (payload.errors as string[] | undefined)?.filter(Boolean) ?? [];
      setMessage(
        `Stored ${payload.stored}, set aside ${payload.irrelevant}, skipped ${payload.duplicates} duplicates.` +
          (extra.length ? ` Notes: ${extra.join(" ")}` : ""),
      );
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Discovery failed.");
    } finally {
      setPending(null);
    }
  }

  async function submit(formData: FormData) {
    setPending("manual");
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/ingest/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          url: formData.get("url"),
          publisher: formData.get("publisher"),
          source_type: formData.get("source_type"),
          language: formData.get("language"),
          text: formData.get("text"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Submission failed.");
      setMessage(payload.message || "Submission stored.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submission failed.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <h2>Collect public announcements</h2>
        <p className="prose">
          GDELT is queried without a key. Official RSS, data.gov.in and social APIs run only when their environment variables are set. Results stay unverified.
        </p>
        <div className="actions">
          <label style={{ width: 120 }}>
            Max items
            <select value={maxItems} onChange={(event) => setMaxItems(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={pending !== null} onClick={discover} style={{ alignSelf: "end" }}>
            {pending === "discover" ? "Collecting…" : "Run discovery"}
          </button>
        </div>
        {adapters.length ? (
          <div className="stack" style={{ marginTop: 14 }}>
            {adapters.map((adapter) => (
              <p key={adapter.id} className="prose" style={{ margin: 0 }}>
                <span className={`badge ${adapter.configured ? "good" : "warn"}`}>{adapter.configured ? "Ready" : "Not configured"}</span>{" "}
                {adapter.label}. {adapter.detail}
              </p>
            ))}
          </div>
        ) : null}
        {adapterError ? <p className="muted">{adapterError}</p> : null}
      </section>

      <section className="panel">
        <h2>Submit a URL or text</h2>
        <form action={submit} className="filters">
          <label>
            Title
            <input name="title" placeholder="Announcement title" />
          </label>
          <label>
            Source URL
            <input name="url" placeholder="https://" />
          </label>
          <div className="grid-3">
            <label>
              Publisher
              <input name="publisher" placeholder="Publisher" />
            </label>
            <label>
              Source type
              <select name="source_type" defaultValue="manual">
                <option value="manual">Manual</option>
                <option value="official">Official</option>
                <option value="news">News</option>
                <option value="social">Social</option>
              </select>
            </label>
            <label>
              Language
              <input name="language" placeholder="en or mr" />
            </label>
          </div>
          <label>
            Text
            <textarea name="text" placeholder="Paste the announcement if the URL cannot be fetched." />
          </label>
          <button type="submit" disabled={pending !== null}>
            {pending === "manual" ? "Submitting…" : "Submit for extraction"}
          </button>
        </form>
      </section>
      {message ? <p className="notice">{message}</p> : null}
      {error ? <p className="notice">{error}</p> : null}
    </div>
  );
}
