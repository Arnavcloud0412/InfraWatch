"use client";

import { useEffect, useState } from "react";

const NAMES = [
  "source attribution",
  "publisher",
  "published and retrieved times",
  "supporting evidence",
  "conflicts kept",
  "duplicate detection",
  "independent corroboration",
  "human verification",
  "review history",
  "auditable changes",
];

export function LitTrail() {
  const [lit, setLit] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLit((value) => (value + 1) % NAMES.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="proof">
      <p className="proof-sentence">
        <span className="lead-words">Every claim keeps </span>
        {NAMES.map((name, index) => (
          <span key={name}>
            <span className={index === lit ? "lit" : undefined}>{name}</span>
            {index < NAMES.length - 1 ? ", " : "."}
          </span>
        ))}
      </p>
      <p className="proof-aside">
        Official sources start higher. Open-source posts stay low until another record or a person supports the update.
      </p>
    </div>
  );
}
