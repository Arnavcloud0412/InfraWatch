from __future__ import annotations

FACTORS = (
    "connectivity",
    "essential_service",
    "economic",
    "public_dependency",
    "emergency",
)

# Equal weights. Change a weight to emphasise that public-service factor.
WEIGHTS = {
    "connectivity": 1.0,
    "essential_service": 1.0,
    "economic": 1.0,
    "public_dependency": 1.0,
    "emergency": 1.0,
}

BASELINE_TIER = {
    "national_highway": 1,
    "expressway": 1,
    "railway": 1,
    "bridge": 1,
    "tunnel": 1,
    "port": 1,
    "airport": 3,
    "hospital": 2,
    "emergency_healthcare": 2,
    "energy": 3,
    "utilities": 2,
    "other": 5,
}

PRIORS: dict[str, dict[str, int]] = {
    "national_highway": {
        "connectivity": 18,
        "essential_service": 6,
        "economic": 14,
        "public_dependency": 16,
        "emergency": 12,
    },
    "expressway": {
        "connectivity": 18,
        "essential_service": 5,
        "economic": 16,
        "public_dependency": 15,
        "emergency": 10,
    },
    "railway": {
        "connectivity": 17,
        "essential_service": 7,
        "economic": 15,
        "public_dependency": 16,
        "emergency": 11,
    },
    "bridge": {
        "connectivity": 16,
        "essential_service": 6,
        "economic": 10,
        "public_dependency": 14,
        "emergency": 12,
    },
    "tunnel": {
        "connectivity": 15,
        "essential_service": 5,
        "economic": 10,
        "public_dependency": 12,
        "emergency": 10,
    },
    "port": {
        "connectivity": 14,
        "essential_service": 6,
        "economic": 18,
        "public_dependency": 12,
        "emergency": 8,
    },
    "airport": {
        "connectivity": 12,
        "essential_service": 8,
        "economic": 16,
        "public_dependency": 12,
        "emergency": 14,
    },
    "hospital": {
        "connectivity": 4,
        "essential_service": 18,
        "economic": 8,
        "public_dependency": 16,
        "emergency": 18,
    },
    "emergency_healthcare": {
        "connectivity": 4,
        "essential_service": 18,
        "economic": 6,
        "public_dependency": 14,
        "emergency": 20,
    },
    "energy": {
        "connectivity": 6,
        "essential_service": 14,
        "economic": 16,
        "public_dependency": 16,
        "emergency": 8,
    },
    "utilities": {
        "connectivity": 5,
        "essential_service": 16,
        "economic": 10,
        "public_dependency": 18,
        "emergency": 10,
    },
    "other": {
        "connectivity": 4,
        "essential_service": 4,
        "economic": 4,
        "public_dependency": 6,
        "emergency": 2,
    },
}

UPGRADE_AT = 75
DOWNGRADE_AT = 30
METHOD = "hybrid_weighted_v1"


def clamp_factor(value: int) -> int:
    return max(0, min(20, int(value)))


def apply_text_signals(factors: dict[str, int], text: str) -> dict[str, int]:
    updated = dict(factors)
    lowered = text.lower()

    def bump(key: str, delta: int) -> None:
        updated[key] = clamp_factor(updated[key] + delta)

    if any(word in lowered for word in ("emergency", "trauma", "disaster", "ambulance")):
        bump("emergency", 3)
        bump("essential_service", 2)
    if any(word in lowered for word in ("freight", "logistics", "cargo", "warehouse")):
        bump("economic", 3)
    if any(word in lowered for word in ("national highway", "expressway", "nhai", "nh-")):
        bump("connectivity", 2)
    if any(word in lowered for word in ("rural", "village", "gram ")):
        bump("public_dependency", 2)
        bump("economic", -2)
    if any(word in lowered for word in ("landscap", "beautification", "garden", "fountain")):
        bump("connectivity", -8)
        bump("essential_service", -4)
        bump("economic", -4)
        bump("emergency", -4)
    if any(word in lowered for word in ("local road", "street light", "footpath", "resurfacing")):
        bump("connectivity", -6)
        bump("economic", -3)
    return updated


def apply_deltas(factors: dict[str, int], deltas: dict[str, int]) -> dict[str, int]:
    mapping = {
        "connectivity": "connectivity_delta",
        "essential_service": "essential_service_delta",
        "economic": "economic_delta",
        "public_dependency": "public_dependency_delta",
        "emergency": "emergency_delta",
    }
    updated = dict(factors)
    for factor, key in mapping.items():
        raw = int(deltas.get(key, 0) or 0)
        raw = max(-4, min(4, raw))
        updated[factor] = clamp_factor(updated[factor] + raw)
    return updated


def contextual_score(factors: dict[str, int]) -> float:
    weight_total = sum(WEIGHTS.values()) or 1
    weighted = sum(factors[name] * WEIGHTS[name] for name in FACTORS)
    # Each factor is 0–20. Equal weights make the result the sum, on a 0–100 scale.
    return round(weighted / weight_total * 5, 1)


def propose_tier(baseline: int, score: float) -> int:
    tier = baseline
    if score >= UPGRADE_AT:
        tier -= 1
    elif score <= DOWNGRADE_AT:
        tier += 1
    return max(1, min(5, tier))


def template_rationale(category: str, baseline: int, factors: dict[str, int], score: float, tier: int) -> str:
    return (
        f"Baseline tier {baseline} is the prototype taxonomy entry for '{category}'. "
        f"Contextual score {score} weights connectivity {factors['connectivity']}, "
        f"essential service {factors['essential_service']}, economic significance {factors['economic']}, "
        f"public dependency {factors['public_dependency']} and emergency relevance {factors['emergency']} "
        f"(each scored 0–20). Proposed tier is {tier}. "
        "The score describes civilian public-service significance. It does not measure whether the report is true."
    )


def classify(category: str, text: str, deltas: dict[str, int] | None = None, rationale: str | None = None) -> dict:
    baseline = BASELINE_TIER.get(category, 5)
    factors = apply_text_signals(dict(PRIORS.get(category, PRIORS["other"])), text)
    if deltas:
        factors = apply_deltas(factors, deltas)
    score = contextual_score(factors)
    tier = propose_tier(baseline, score)
    return {
        "baseline_criticality_tier": baseline,
        "contextual_factors": factors,
        "contextual_criticality_score": score,
        "proposed_criticality_tier": tier,
        "classification_method": METHOD,
        "classification_rationale": rationale or template_rationale(category, baseline, factors, score, tier),
        "classification_review_status": "proposed",
        "weights": WEIGHTS,
        "thresholds": {"upgrade_at": UPGRADE_AT, "downgrade_at": DOWNGRADE_AT},
    }
