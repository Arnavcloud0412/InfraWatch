export type WorkflowStepId = "discover" | "extract" | "correlate" | "assess" | "review" | "track";

export interface WorkflowStep {
  id: WorkflowStepId;
  number: number;
  label: string;
  summary: string;
  owner: string;
  href?: string;
}

/** Canonical intelligence workflow shown on every workspace page. */
export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "discover",
    number: 1,
    label: "Discover",
    summary: "Collect public information from official sources, news and permitted public APIs.",
    owner: "Data Acquisition",
    href: "/ingest",
  },
  {
    id: "extract",
    number: 2,
    label: "Extract",
    summary: "Identify project names, locations, dates, investments, milestones and claims.",
    owner: "AI processing",
  },
  {
    id: "correlate",
    number: 3,
    label: "Correlate",
    summary: "Identify related records, duplicate reports and conflicting information.",
    owner: "Intelligence processing",
  },
  {
    id: "assess",
    number: 4,
    label: "Assess",
    summary: "Evaluate source provenance, supporting evidence and information gaps.",
    owner: "Evidence assessment",
  },
  {
    id: "review",
    number: 5,
    label: "Review",
    summary: "A human reviewer accepts, rejects or requests further verification.",
    owner: "Verification Centre",
    href: "/verification",
  },
  {
    id: "track",
    number: 6,
    label: "Track",
    summary: "Maintain the project's history, lifecycle and associated intelligence.",
    owner: "Project Explorer",
    href: "/projects",
  },
];

export const OPEN_REVIEW_STATUSES = new Set(["newly_detected", "under_verification", "conflicting"]);

export function isOpenForReview(status: string): boolean {
  return OPEN_REVIEW_STATUSES.has(status);
}
