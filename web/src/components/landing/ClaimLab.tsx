"use client";

import { useMemo, useState } from "react";

type Example = {
  label: string;
  query: string;
  source: string;
  trust: "Higher" | "Lower";
  category: string;
  importance: string;
  lifecycle: string;
  next: string;
};

const EXAMPLES: Example[] = [
  {
    label: "Official notice",
    query: "Harbour link upgrade",
    source: "Official notice",
    trust: "Higher",
    category: "Critical",
    importance: "1 of 5",
    lifecycle: "Under construction",
    next: "Reviewer",
  },
  {
    label: "News report",
    query: "Satara bridge deck work",
    source: "News report",
    trust: "Lower",
    category: "Critical",
    importance: "2 of 5",
    lifecycle: "Tendering",
    next: "More evidence",
  },
  {
    label: "Social post",
    query: "Wardha trauma annexe rumour",
    source: "Social post",
    trust: "Lower",
    category: "Essential",
    importance: "3 of 5",
    lifecycle: "Proposed",
    next: "Hold for review",
  },
];

export function ClaimLab() {
  const [query, setQuery] = useState(EXAMPLES[0].query);
  const [active, setActive] = useState(0);

  const claim = useMemo(() => {
    const match = EXAMPLES.find((example) => example.query.toLowerCase() === query.trim().toLowerCase());
    return match ?? {
      ...EXAMPLES[active],
      query: query.trim() || EXAMPLES[active].query,
      source: "Unmatched text",
      trust: "Lower" as const,
      next: "Needs correlation",
    };
  }, [query, active]);

  return (
    <div className="showcase">
      <label className="sr-only" htmlFor="claim-query">
        Type a notice title
      </label>
      <input
        id="claim-query"
        className="showcase-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="showcase-answer" data-ui>
        <article className="claim-ui" aria-live="polite">
          <header>
            <span>Structured claim</span>
            <span>Illustrative</span>
          </header>
          <h3>{claim.query}</h3>
          <dl>
            <div>
              <dt>Source</dt>
              <dd>{claim.source}</dd>
            </div>
            <div>
              <dt>Trust</dt>
              <dd className={claim.trust === "Higher" ? "trust-high" : "trust-low"}>{claim.trust}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{claim.category}</dd>
            </div>
            <div>
              <dt>Importance</dt>
              <dd>{claim.importance}</dd>
            </div>
            <div>
              <dt>Lifecycle</dt>
              <dd>{claim.lifecycle}</dd>
            </div>
            <div>
              <dt>Next</dt>
              <dd>{claim.next}</dd>
            </div>
          </dl>
        </article>
      </div>
      <div className="showcase-examples">
        {EXAMPLES.map((example, index) => (
          <button
            key={example.label}
            type="button"
            aria-pressed={active === index && query === example.query}
            onClick={() => {
              setActive(index);
              setQuery(example.query);
            }}
          >
            {example.label}
          </button>
        ))}
      </div>
    </div>
  );
}
