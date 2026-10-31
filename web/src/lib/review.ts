import { applyReview, getSnapshot } from "./repository";
import type { LifecycleStatus, VerificationStatus } from "./types";

const LIFECYCLES = new Set<LifecycleStatus>([
  "proposed",
  "approved",
  "tendering",
  "construction_started",
  "under_construction",
  "partially_operational",
  "completed",
  "on_hold",
  "cancelled",
]);

export async function reviewEvent(input: {
  eventId: string;
  action: "accept" | "reject" | "request_verification";
  notes: string;
  applyLifecycle: boolean;
  lifecycle?: string | null;
}) {
  const snapshot = await getSnapshot();
  const event = snapshot.events.find((item) => item.id === input.eventId);
  if (!event) throw new Error("Event not found.");
  const project = snapshot.projects.find((item) => item.id === event.project_id);
  const source = snapshot.sources.find((item) => item.id === event.source_id);
  if (!project || !source) throw new Error("The event is missing its project or source.");

  let next: VerificationStatus;
  if (input.action === "reject") next = "rejected";
  else if (input.action === "request_verification") next = "under_verification";
  else next = source.source_type === "official" && !project.synthetic ? "officially_confirmed" : "corroborated";

  let lifecycle: LifecycleStatus | null = null;
  if (input.action === "accept" && input.applyLifecycle) {
    if (input.lifecycle && LIFECYCLES.has(input.lifecycle as LifecycleStatus)) {
      lifecycle = input.lifecycle as LifecycleStatus;
    } else {
      const reported = event.extracted_data?.reported_lifecycle;
      if (typeof reported === "string" && LIFECYCLES.has(reported as LifecycleStatus)) {
        lifecycle = reported as LifecycleStatus;
      }
    }
  }

  const now = new Date().toISOString();
  await applyReview({
    eventId: event.id,
    evidenceStatus: next,
    projectId: project.id,
    lifecycleStatus: lifecycle,
    evidenceReviewStatus: input.action === "accept" ? "accepted" : input.action === "reject" ? "rejected" : "pending",
    log: {
      id: crypto.randomUUID(),
      event_id: event.id,
      reviewer_action: input.action,
      reviewer_notes: input.notes.trim(),
      previous_status: event.evidence_status,
      new_status: next,
      created_at: now,
    },
  });
  return { status: next, lifecycle };
}
