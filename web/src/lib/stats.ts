import { categoryLabel, lifecycleLabel, LIFECYCLE_ORDER, tierLabel } from "./labels";
import type { Snapshot } from "./types";
import { isOpenForReview } from "./workflow";

export function summarise(snapshot: Snapshot) {
  const byCategory = new Map<string, number>();
  const byTier = new Map<number, number>();
  const byLifecycle = new Map<string, number>();
  const byVerification = new Map<string, number>();

  for (const project of snapshot.projects) {
    byCategory.set(project.infrastructure_category, (byCategory.get(project.infrastructure_category) ?? 0) + 1);
    byTier.set(project.proposed_criticality_tier, (byTier.get(project.proposed_criticality_tier) ?? 0) + 1);
    byLifecycle.set(project.lifecycle_status, (byLifecycle.get(project.lifecycle_status) ?? 0) + 1);
  }
  for (const event of snapshot.events) {
    byVerification.set(event.evidence_status, (byVerification.get(event.evidence_status) ?? 0) + 1);
  }

  const tierColours: Record<number, string> = {
    1: "#061f18",
    2: "#0f5c45",
    3: "#3d6b58",
    4: "#8a4b12",
    5: "#9a9a9a",
  };

  return {
    totalProjects: snapshot.projects.length,
    pending: snapshot.events.filter((event) => isOpenForReview(event.evidence_status)).length,
    corroborated: byVerification.get("corroborated") ?? 0,
    conflicting: byVerification.get("conflicting") ?? 0,
    rejected: byVerification.get("rejected") ?? 0,
    confirmed: byVerification.get("officially_confirmed") ?? 0,
    categories: [...byCategory.entries()]
      .map(([key, count]) => ({ name: categoryLabel(key), count }))
      .sort((a, b) => b.count - a.count),
    tiers: [1, 2, 3, 4, 5].map((tier) => ({
      name: `T${tier} ${tierLabel(tier)}`,
      count: byTier.get(tier) ?? 0,
      fill: tierColours[tier],
    })),
    lifecycles: LIFECYCLE_ORDER.filter((status) => byLifecycle.has(status)).map((status) => ({
      name: lifecycleLabel(status),
      count: byLifecycle.get(status) ?? 0,
    })),
    verification: [...byVerification.entries()].map(([name, count]) => ({ name, count })),
  };
}

export function latestStatus(snapshot: Snapshot, projectId: string): string {
  const events = snapshot.events
    .filter((event) => event.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return events[0]?.evidence_status ?? "newly_detected";
}
