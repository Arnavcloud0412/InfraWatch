from __future__ import annotations

from app.classification import classify
from app.correlation import correlate
from app.evidence import evidence_rows
from app.schemas import CATEGORIES
from app.textutil import detect_language

CATEGORY_HINTS = (
    ("emergency_healthcare", ("trauma", "casualty", "ambulance", "emergency care")),
    ("hospital", ("hospital", "medical college")),
    ("airport", ("airport", "airside", "runway", "helipad")),
    ("port", ("port", "harbour", "harbor", "jetty", "jnpt")),
    ("tunnel", ("tunnel",)),
    ("bridge", ("bridge", "flyover", "viaduct")),
    ("expressway", ("expressway", "express way")),
    ("national_highway", ("national highway", "nhai", "nh-")),
    ("railway", ("railway", "rail ", "metro", "siding")),
    ("energy", ("solar", "power plant", "generation", "mw ")),
    ("utilities", ("substation", "water treatment", "pipeline", "feeder", "sewage")),
)

LIFECYCLE_HINTS = (
    ("cancelled", ("cancelled", "canceled", "scrapped")),
    ("on_hold", ("on hold", "stalled", "deferred")),
    ("completed", ("inaugurated", "opened", "commissioned", "completed")),
    ("partially_operational", ("partially open", "partially operational")),
    ("under_construction", ("under construction", "work in progress")),
    ("construction_started", ("foundation stone", "groundbreaking", "work began", "construction started")),
    ("tendering", ("tender", "bid invited", "rfp")),
    ("approved", ("approved", "sanctioned", "cabinet")),
)

EVENT_HINTS = (
    ("cancellation", ("cancelled", "canceled", "scrapped")),
    ("delay", ("delay", "stalled", "overrun")),
    ("completion", ("inaugurated", "opened", "commissioned", "completed")),
    ("tender", ("tender", "bid invited")),
    ("budget", ("budget", "allocation", "outlay", "crore")),
    ("approval", ("approved", "sanctioned")),
    ("milestone", ("foundation", "groundbreaking", "milestone")),
)

DISTRICT_NAMES = (
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Thane",
    "Palghar",
    "Raigad",
    "Ratnagiri",
    "Sindhudurg",
    "Kolhapur",
    "Satara",
    "Sangli",
    "Solapur",
    "Ahilyanagar",
    "Chhatrapati Sambhajinagar",
    "Jalna",
    "Beed",
    "Latur",
    "Nanded",
    "Parbhani",
    "Hingoli",
    "Dharashiv",
    "Akola",
    "Amravati",
    "Yavatmal",
    "Wardha",
    "Washim",
    "Buldhana",
    "Jalgaon",
    "Dhule",
    "Nandurbar",
    "Nagpur",
    "Bhandara",
    "Gondia",
    "Chandrapur",
    "Gadchiroli",
)

ALIASES = {
    "aurangabad": "Chhatrapati Sambhajinagar",
    "sambhajinagar": "Chhatrapati Sambhajinagar",
    "osmanabad": "Dharashiv",
    "ahmednagar": "Ahilyanagar",
    "ahmadnagar": "Ahilyanagar",
    "bombay": "Mumbai",
    "navi mumbai": "Thane",
}


def _mentioned(lowered: str, hint: str) -> bool:
    start = 0
    while True:
        index = lowered.find(hint, start)
        if index < 0:
            return False
        prefix = lowered[max(0, index - 4) : index]
        if not prefix.endswith(("no ", "not ")):
            return True
        start = index + len(hint)


def _first(text: str, pairs: tuple[tuple[str, tuple[str, ...]], ...], default: str) -> str:
    lowered = text.lower()
    for label, hints in pairs:
        if any(_mentioned(lowered, hint) for hint in hints):
            return label
    return default


def find_district(text: str) -> str | None:
    lowered = text.lower()
    for alias, name in ALIASES.items():
        if alias in lowered:
            return name
    for name in DISTRICT_NAMES:
        if name.lower() in lowered:
            return name
    return None


def in_scope(text: str) -> bool:
    lowered = text.lower()
    places = ("maharashtra", "mumbai", "pune", "nagpur", "nashik", "thane")
    infra = ("highway", "expressway", "railway", "metro", "port", "airport", "bridge", "tunnel", "hospital", "power", "water", "infrastructure", "flyover", "road")
    return any(place in lowered for place in places) and any(word in lowered for word in infra)


def fallback_assessment(title: str, text: str, source_type: str, existing_projects: list[dict], hinted_language: str | None) -> dict:
    blob = f"{title}\n{text}"
    relevant = in_scope(blob)
    category = _first(blob, CATEGORY_HINTS, "other")
    if category not in CATEGORIES:
        category = "other"
    district = find_district(blob)
    lifecycle = _first(blob, LIFECYCLE_HINTS, "proposed")
    event_type = _first(blob, EVENT_HINTS, "announcement")
    language = detect_language(blob, hinted_language)
    extraction = {
        "relevant": relevant,
        "relevance_reason": "Keyword screen for a Maharashtra infrastructure announcement."
        if relevant
        else "The text did not match both a Maharashtra place and an infrastructure topic.",
        "project_name": title.strip()[:180] or "Untitled announcement",
        "description": (text or title).strip()[:500],
        "state": "Maharashtra" if relevant else "",
        "district": district,
        "location_name": district,
        "infrastructure_category": category,
        "event_type": event_type,
        "reported_lifecycle": lifecycle,
        "investment_amount": None,
        "currency": None,
        "expected_completion_raw": None,
        "claims": [sentence.strip() for sentence in (text or title).split(".") if sentence.strip()][:3],
        "original_language": language,
        "confidence": 0.35 if relevant else 0.1,
    }
    correlation = correlate(extraction, [item if isinstance(item, dict) else item for item in existing_projects])
    recommended = "under_verification" if source_type == "official" else "newly_detected"
    evidence = {
        "recommended_state": recommended,
        "source_assessment": f"Source type recorded as {source_type}. This fallback did not call a model.",
        "supporting_points": [],
        "conflicting_points": [],
        "missing_evidence": [
            "Full independent corroboration is not available from this single intake.",
            "A human reviewer must read the source before the claim is treated as established.",
        ],
        "official_or_secondary": "Recorded official source." if source_type == "official" else "Secondary or unverified intake.",
        "corroboration_note": "One source is not corroboration.",
        "rule_notes": ["Deterministic fallback. No model declared this item verified."],
        "evidence_rows": evidence_rows(
            {
                "missing_evidence": [
                    "Full independent corroboration is not available from this single intake.",
                    "A human reviewer must read the source before the claim is treated as established.",
                ]
            }
        ),
    }
    classification = classify(category, blob)
    return {
        "relevant": relevant,
        "extraction": extraction,
        "correlation": correlation,
        "evidence": evidence,
        "classification": classification,
        "pipeline_mode": "deterministic_fallback",
        "agent_trace": [
            "discovery_filter",
            "fallback_extractor",
            "correlation_function",
            "evidence_rules",
            "classification_function",
        ],
    }
