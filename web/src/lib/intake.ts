import { centroidFor, canonicalDistrict } from "./districts";
import { applyIntake, getSnapshot, type IntakeChange } from "./repository";
import type { AgentAssessment, InfrastructureCategory, LifecycleStatus, Project, VerificationStatus } from "./types";

const CATEGORIES = new Set<InfrastructureCategory>([
  "national_highway",
  "expressway",
  "railway",
  "bridge",
  "tunnel",
  "port",
  "airport",
  "hospital",
  "emergency_healthcare",
  "energy",
  "utilities",
  "other",
]);

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

const AUTOMATED: Set<string> = new Set(["newly_detected", "under_verification", "corroborated", "conflicting"]);

function asCategory(value: string | undefined): InfrastructureCategory {
  return value && CATEGORIES.has(value as InfrastructureCategory) ? (value as InfrastructureCategory) : "other";
}

function asLifecycle(value: string | undefined): LifecycleStatus {
  return value && LIFECYCLES.has(value as LifecycleStatus) ? (value as LifecycleStatus) : "proposed";
}

export interface IntakeSummary {
  stored: number;
  irrelevant: number;
  duplicates: number;
  projectIds: string[];
}

export async function saveAssessments(items: AgentAssessment[]): Promise<IntakeSummary> {
  const summary: IntakeSummary = { stored: 0, irrelevant: 0, duplicates: 0, projectIds: [] };
  for (const item of items) {
    const outcome = await saveAssessment(item);
    if (outcome.kind === "stored") summary.stored += 1;
    else if (outcome.kind === "irrelevant") summary.irrelevant += 1;
    else summary.duplicates += 1;
    if (outcome.projectId) summary.projectIds.push(outcome.projectId);
  }
  return summary;
}

async function saveAssessment(item: AgentAssessment): Promise<{ kind: "stored" | "irrelevant" | "duplicates"; projectId?: string }> {
  if (!item.content_hash || item.disposition === "duplicate") {
    return { kind: "duplicates" };
  }
  const snapshot = await getSnapshot();
  if (snapshot.sources.some((source) => source.content_hash === item.content_hash)) {
    return { kind: "duplicates" };
  }
  const now = new Date().toISOString();
  const sourceId = crypto.randomUUID();
  const source = {
    id: sourceId,
    source_url: item.url ?? null,
    title: item.title ?? "Untitled announcement",
    publisher: item.publisher ?? "Unknown",
    source_type: item.source_type ?? "manual",
    language: item.language ?? item.extraction?.original_language ?? "unknown",
    published_at: item.published_at ?? null,
    retrieved_at: item.retrieved_at ?? now,
    raw_content: item.raw_content ?? "",
    content_hash: item.content_hash,
    full_text_retrieved: Boolean(item.full_text_retrieved),
  };

  if (item.disposition !== "stored" || !item.extraction) {
    const change: IntakeChange = {
      source,
      project: null,
      touchedProjectId: null,
      event: null,
      evidence: [],
      candidates: [],
    };
    await applyIntake(change);
    return { kind: "irrelevant" };
  }

  const extraction = item.extraction;
  const district = canonicalDistrict(extraction.district);
  const linkedId = item.correlation?.linked_project_id;
  const existing = linkedId ? snapshot.projects.find((project) => project.id === linkedId) : undefined;
  let project: Project | null = null;
  let projectId = existing?.id ?? "";
  if (!existing) {
    const point = centroidFor(district);
    const classification = item.classification;
    projectId = crypto.randomUUID();
    project = {
      id: projectId,
      project_name: extraction.project_name || source.title || "Untitled project",
      description: extraction.description || extraction.relevance_reason || null,
      state: "Maharashtra",
      district,
      location_name: extraction.location_name ?? district,
      latitude: point?.latitude ?? null,
      longitude: point?.longitude ?? null,
      coordinate_source: point ? "district_centroid" : null,
      infrastructure_category: asCategory(extraction.infrastructure_category),
      baseline_criticality_tier: classification?.baseline_criticality_tier ?? 5,
      contextual_criticality_score: Number(classification?.contextual_criticality_score ?? 0),
      proposed_criticality_tier: classification?.proposed_criticality_tier ?? 5,
      classification_rationale: classification?.classification_rationale ?? null,
      classification_method: classification?.classification_method ?? "hybrid_weighted_v1",
      classification_review_status: "proposed",
      contextual_factors: classification?.contextual_factors ?? null,
      lifecycle_status: "proposed",
      reported_lifecycle_status: asLifecycle(extraction.reported_lifecycle),
      investment_amount: extraction.investment_amount ?? null,
      currency: extraction.investment_amount ? extraction.currency || "INR" : null,
      investment_status: extraction.investment_amount ? "reported_unverified" : null,
      expected_completion_date: null,
      completion_date_status: null,
      record_origin: "live",
      synthetic: false,
      created_at: now,
      updated_at: now,
    };
  }

  const recommended = item.evidence?.recommended_state;
  const evidenceStatus = (recommended && AUTOMATED.has(recommended) ? recommended : "newly_detected") as VerificationStatus;
  const claim = extraction.claims?.find(Boolean) || extraction.description || source.title || "Claim extracted from the source.";
  const eventId = crypto.randomUUID();
  const rationale = [
    item.evidence?.source_assessment,
    item.evidence?.official_or_secondary,
    item.evidence?.corroboration_note,
    ...(item.evidence?.rule_notes ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const event = {
    id: eventId,
    project_id: projectId,
    source_id: sourceId,
    event_type: extraction.event_type || "announcement",
    reported_claim: claim,
    extracted_data: {
      ...(extraction as unknown as Record<string, unknown>),
      agent_trace: item.agent_trace ?? [],
      pipeline_mode: item.pipeline_mode ?? "unknown",
      correlation_ambiguous: Boolean(item.correlation?.ambiguous),
    },
    evidence_status: evidenceStatus,
    ai_recommended_status: evidenceStatus,
    recommendation_rationale: rationale || "Automated assessment only. This is not a finding of fact.",
    event_date: null,
    pipeline_mode: item.pipeline_mode ?? null,
    created_at: now,
  };

  const evidence = (item.evidence?.evidence_rows ?? []).map((row) => ({
    id: crypto.randomUUID(),
    event_id: eventId,
    source_id: sourceId,
    evidence_type: row.evidence_type,
    evidence_description: row.evidence_description,
    supporting_or_conflicting: row.supporting_or_conflicting,
    review_status: "pending",
  }));

  const candidates = (item.correlation?.candidates ?? [])
    .filter((candidate) => snapshot.projects.some((projectRow) => projectRow.id === candidate.project_id) || candidate.project_id === projectId)
    .map((candidate) => ({
      id: crypto.randomUUID(),
      event_id: eventId,
      candidate_project_id: candidate.project_id,
      score: Number(candidate.score),
      rationale: candidate.rationale ?? null,
      auto_linked: candidate.project_id === linkedId,
      created_at: now,
    }));

  await applyIntake({
    source,
    project,
    touchedProjectId: existing ? existing.id : null,
    event,
    evidence,
    candidates,
  });
  return { kind: "stored", projectId };
}
