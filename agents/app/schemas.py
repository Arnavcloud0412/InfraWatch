from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

CATEGORIES = (
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
)

EVENT_TYPES = (
    "announcement",
    "approval",
    "budget",
    "tender",
    "milestone",
    "completion",
    "delay",
    "cancellation",
    "other",
)

LIFECYCLE = (
    "proposed",
    "approved",
    "tendering",
    "construction_started",
    "under_construction",
    "partially_operational",
    "completed",
    "on_hold",
    "cancelled",
)

EVIDENCE_STATES = (
    "newly_detected",
    "under_verification",
    "corroborated",
    "conflicting",
)


class ExistingProject(BaseModel):
    id: str
    project_name: str
    district: str | None = None
    location_name: str | None = None
    infrastructure_category: str | None = None


class DiscoveredDocument(BaseModel):
    title: str
    url: str | None = None
    publisher: str
    source_type: Literal["official", "news", "social", "manual", "demonstration"]
    language: str | None = None
    published_at: str | None = None
    text: str
    full_text_retrieved: bool = False


class ExtractionOutput(BaseModel):
    relevant: bool = False
    relevance_reason: str = ""
    project_name: str = ""
    description: str = ""
    state: str = ""
    district: str | None = None
    location_name: str | None = None
    infrastructure_category: str = "other"
    event_type: str = "other"
    reported_lifecycle: str = "proposed"
    investment_amount: float | None = None
    currency: str | None = None
    expected_completion_raw: str | None = None
    claims: list[str] = Field(default_factory=list)
    original_language: str = "unknown"
    confidence: float = 0.0

    @field_validator("infrastructure_category")
    @classmethod
    def category(cls, value: str) -> str:
        return value if value in CATEGORIES else "other"

    @field_validator("event_type")
    @classmethod
    def event_type_ok(cls, value: str) -> str:
        return value if value in EVENT_TYPES else "other"

    @field_validator("reported_lifecycle")
    @classmethod
    def lifecycle_ok(cls, value: str) -> str:
        return value if value in LIFECYCLE else "proposed"

    @field_validator("confidence")
    @classmethod
    def confidence_ok(cls, value: float) -> float:
        return max(0.0, min(1.0, float(value)))

    @field_validator("investment_amount")
    @classmethod
    def amount_ok(cls, value: float | None) -> float | None:
        if value is None or value <= 0:
            return None
        return value


class CorrelationOpinion(BaseModel):
    same_project: bool = False
    ambiguous: bool = True
    confidence: float = 0.0
    rationale: str = ""


class EvidenceOutput(BaseModel):
    recommended_state: str = "newly_detected"
    source_assessment: str = ""
    supporting_points: list[str] = Field(default_factory=list)
    conflicting_points: list[str] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)
    official_or_secondary: str = ""
    corroboration_note: str = ""

    @field_validator("recommended_state")
    @classmethod
    def state_ok(cls, value: str) -> str:
        if value == "officially_confirmed":
            return "under_verification"
        if value not in EVIDENCE_STATES:
            return "newly_detected"
        return value


class ClassificationAdjustment(BaseModel):
    connectivity_delta: int = 0
    essential_service_delta: int = 0
    economic_delta: int = 0
    public_dependency_delta: int = 0
    emergency_delta: int = 0
    rationale: str = ""

    @field_validator(
        "connectivity_delta",
        "essential_service_delta",
        "economic_delta",
        "public_dependency_delta",
        "emergency_delta",
    )
    @classmethod
    def clamp_delta(cls, value: int) -> int:
        return max(-4, min(4, int(value)))


class DiscoveryFilter(BaseModel):
    relevant_indexes: list[int] = Field(default_factory=list)
    notes: str = ""


class ProcessRequest(BaseModel):
    title: str
    text: str
    url: str | None = None
    publisher: str = "Manual submission"
    source_type: Literal["official", "news", "social", "manual", "demonstration"] = "manual"
    language: str | None = None
    published_at: str | None = None
    full_text_retrieved: bool = True
    existing_projects: list[ExistingProject] = Field(default_factory=list)
    known_hashes: list[str] = Field(default_factory=list)


class DiscoverRequest(BaseModel):
    max_items: int = 3
    query: str | None = None
    existing_projects: list[ExistingProject] = Field(default_factory=list)
    known_hashes: list[str] = Field(default_factory=list)

    @field_validator("max_items")
    @classmethod
    def cap(cls, value: int) -> int:
        return max(1, min(8, int(value)))
