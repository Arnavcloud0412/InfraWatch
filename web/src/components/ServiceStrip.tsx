"use client";

import { useEffect, useState } from "react";

export function ServiceStrip() {
  const [line, setLine] = useState("Checking the agent service…");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => {
        const storage = data.storage === "supabase" ? "Supabase" : "Local file store";
        if (data.agent?.status === "ok") {
          const model = data.agent.llm_enabled ? data.agent.model : "deterministic fallback, no Gemini key";
          setLine(`${storage} · Agent up · ${model}`);
        } else {
          setLine(`${storage} · Agent service offline · seeded records still visible`);
        }
      })
      .catch(() => setLine("Status unavailable"));
  }, []);

  return (
    <p className="service">
      <em>{line}</em>
    </p>
  );
}
