from __future__ import annotations

AUTOMATED_STATES = {"newly_detected", "under_verification", "corroborated", "conflicting"}


def clamp_recommendation(state: str, distinct_publishers: int) -> tuple[str, list[str]]:
    notes: list[str] = []
    if state == "officially_confirmed":
        state = "under_verification"
        notes.append("Automated review cannot mark a record officially confirmed.")
    if state == "rejected":
        state = "under_verification"
        notes.append("Rejection is reserved for a human reviewer.")
    if state not in AUTOMATED_STATES:
        state = "newly_detected"
        notes.append("Unrecognised recommendation was reset to newly detected.")
    if state == "corroborated" and distinct_publishers < 2:
        state = "under_verification"
        notes.append("Repeats of one release are not independent corroboration.")
    return state, notes


def evidence_rows(assessment: dict) -> list[dict]:
    rows: list[dict] = []
    for point in assessment.get("supporting_points") or []:
        if point:
            rows.append(
                {
                    "evidence_type": "supporting_claim",
                    "evidence_description": point,
                    "supporting_or_conflicting": "supporting",
                }
            )
    for point in assessment.get("conflicting_points") or []:
        if point:
            rows.append(
                {
                    "evidence_type": "conflicting_claim",
                    "evidence_description": point,
                    "supporting_or_conflicting": "conflicting",
                }
            )
    for point in assessment.get("missing_evidence") or []:
        if point:
            rows.append(
                {
                    "evidence_type": "missing_evidence",
                    "evidence_description": point,
                    "supporting_or_conflicting": "insufficient",
                }
            )
    if not rows:
        rows.append(
            {
                "evidence_type": "missing_evidence",
                "evidence_description": "No independent check has been recorded. A human reviewer still needs to read the source.",
                "supporting_or_conflicting": "insufficient",
            }
        )
    return rows
