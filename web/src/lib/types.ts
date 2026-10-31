export type InfrastructureCategory =
  | "national_highway"
  | "expressway"
  | "railway"
  | "bridge"
  | "tunnel"
  | "port"
  | "airport"
  | "hospital"
  | "emergency_healthcare"
  | "energy"
  | "utilities"
  | "other";

export type CriticalityTier = 1 | 2 | 3 | 4 | 5;

export type LifecycleStatus =
  | "proposed"
  | "approved"
  | "tendering"
  | "construction_started"
  | "under_construction"
  | "partially_operational"
  | "completed"
  | "on_hold"
  | "cancelled";

export type VerificationStatus =
  | "newly_detected"
  | "under_verification"
  | "corroborated"
  | "officially_confirmed"
  | "conflicting"
  | "rejected";

export type SourceType = "official" | "news" | "social" | "manual" | "demonstration";

export interface Project {
  id: string;
  project_name: string;
  description: string | null;
  state: string;
  district: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_source: string | null;
  infrastructure_category: InfrastructureCategory;
  baseline_criticality_tier: CriticalityTier;
  contextual_criticality_score: number;
  proposed_criticality_tier: CriticalityTier;
  classification_rationale: string | null;
  classification_method: string | null;
  classification_review_status: string;
  contextual_factors: Record<string, number> | null;
  lifecycle_status: LifecycleStatus;
  reported_lifecycle_status: LifecycleStatus | null;
  investment_amount: number | null;
  currency: string | null;
  investment_status: string | null;
  expected_completion_date: string | null;
  completion_date_status: string | null;
  record_origin: "demonstration" | "live";
  synthetic: boolean;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  source_url: string | null;
  title: string | null;
  publisher: string | null;
  source_type: SourceType;
  language: string | null;
  published_at: string | null;
  retrieved_at: string;
  raw_content: string | null;
  content_hash: string;
  full_text_retrieved: boolean;
}

export interface InfraEvent {
  id: string;
  project_id: string;
  source_id: string;
  event_type: string;
  reported_claim: string;
  extracted_data: Record<string, unknown> | null;
  evidence_status: VerificationStatus;
  ai_recommended_status: string | null;
  recommendation_rationale: string | null;
  event_date: string | null;
  pipeline_mode: string | null;
  created_at: string;
}

export interface Evidence {
  id: string;
  event_id: string;
  source_id: string;
  evidence_type: string;
  evidence_description: string;
  supporting_or_conflicting: "supporting" | "conflicting" | "insufficient";
  review_status: string;
}

export interface ReviewLog {
  id: string;
  event_id: string;
  reviewer_action: string;
  reviewer_notes: string | null;
  previous_status: string;
  new_status: string;
  created_at: string;
}

export interface CorrelationCandidate {
  id: string;
  event_id: string;
  candidate_project_id: string;
  score: number;
  rationale: string | null;
  auto_linked: boolean;
  created_at: string;
}

export interface Snapshot {
  projects: Project[];
  sources: Source[];
  events: InfraEvent[];
  evidence: Evidence[];
  review_logs: ReviewLog[];
  correlation_candidates: CorrelationCandidate[];
}

export interface AgentAssessment {
  disposition: "stored" | "irrelevant" | "duplicate";
  reason?: string;
  title?: string;
  url?: string | null;
  publisher?: string;
  source_type?: SourceType;
  language?: string;
  published_at?: string | null;
  retrieved_at?: string;
  raw_content?: string;
  content_hash?: string;
  full_text_retrieved?: boolean;
  extraction?: {
    relevant?: boolean;
    relevance_reason?: string;
    project_name?: string;
    description?: string;
    state?: string;
    district?: string | null;
    location_name?: string | null;
    infrastructure_category?: InfrastructureCategory;
    event_type?: string;
    reported_lifecycle?: LifecycleStatus;
    investment_amount?: number | null;
    currency?: string | null;
    expected_completion_raw?: string | null;
    claims?: string[];
    original_language?: string;
    confidence?: number;
  } | null;
  correlation?: {
    candidates?: { project_id: string; project_name?: string; score: number; rationale?: string }[];
    linked_project_id?: string | null;
    ambiguous?: boolean;
    auto_merged?: boolean;
    method?: string;
  } | null;
  evidence?: {
    recommended_state?: string;
    source_assessment?: string;
    supporting_points?: string[];
    conflicting_points?: string[];
    missing_evidence?: string[];
    official_or_secondary?: string;
    corroboration_note?: string;
    rule_notes?: string[];
    evidence_rows?: {
      evidence_type: string;
      evidence_description: string;
      supporting_or_conflicting: "supporting" | "conflicting" | "insufficient";
    }[];
  } | null;
  classification?: {
    baseline_criticality_tier?: CriticalityTier;
    contextual_factors?: Record<string, number>;
    contextual_criticality_score?: number;
    proposed_criticality_tier?: CriticalityTier;
    classification_method?: string;
    classification_rationale?: string;
    classification_review_status?: string;
  } | null;
  pipeline_mode?: string;
  agent_trace?: string[];
}
