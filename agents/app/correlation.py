from __future__ import annotations

import re

STOP = {
    "a",
    "an",
    "the",
    "of",
    "and",
    "or",
    "for",
    "to",
    "in",
    "on",
    "at",
    "by",
    "with",
    "from",
    "project",
    "projects",
    "demonstration",
    "demo",
    "maharashtra",
    "infrastructure",
    "construction",
    "work",
    "works",
    "phase",
    "stage",
    "package",
    "proposed",
    "new",
    "road",
    "roads",
}


def tokens(name: str) -> set[str]:
    parts = re.findall(r"[a-z0-9]+", name.lower())
    return {part for part in parts if len(part) > 2 and part not in STOP}


def correlate(candidate: dict, existing_projects: list[dict]) -> dict:
    candidate_tokens = tokens(candidate.get("project_name") or "")
    ranked: list[dict] = []
    for project in existing_projects:
        existing_tokens = tokens(project.get("project_name") or "")
        if not candidate_tokens or not existing_tokens:
            overlap = 0.0
            shared: set[str] = set()
        else:
            shared = candidate_tokens & existing_tokens
            overlap = len(shared) / len(candidate_tokens | existing_tokens)
        score = overlap
        reasons: list[str] = []
        if shared:
            reasons.append("Shared name tokens: " + ", ".join(sorted(shared)) + ".")
        if candidate.get("district") and candidate.get("district") == project.get("district"):
            score += 0.15
            reasons.append("Same district.")
        if (
            candidate.get("infrastructure_category")
            and candidate.get("infrastructure_category") == project.get("infrastructure_category")
        ):
            score += 0.1
            reasons.append("Same infrastructure category.")
        score = round(min(score, 1.0), 3)
        if score < 0.35:
            continue
        ranked.append(
            {
                "project_id": project["id"],
                "project_name": project.get("project_name"),
                "score": score,
                "rationale": " ".join(reasons) or "Limited overlap.",
                "infrastructure_category": project.get("infrastructure_category"),
            }
        )
    ranked.sort(key=lambda item: item["score"], reverse=True)
    top = ranked[0] if ranked else None
    shared_count = 0
    if top:
        shared_count = len(candidate_tokens & tokens(top.get("project_name") or ""))
    link = bool(
        top
        and top["score"] >= 0.8
        and top.get("infrastructure_category") == candidate.get("infrastructure_category")
        and shared_count >= 2
    )
    return {
        "candidates": [
            {key: value for key, value in item.items() if key != "infrastructure_category"}
            for item in ranked[:5]
        ],
        "linked_project_id": top["project_id"] if link and top else None,
        "ambiguous": bool(top and not link and top["score"] >= 0.45),
        "auto_merged": False,
        "method": "token_overlap_v1",
    }


def may_link_after_agent(correlation: dict, opinion: dict, candidate: dict, existing_projects: list[dict]) -> str | None:
    """Attach an event only when both the deterministic score and the agent agree.

    Project fields are never overwritten. Ambiguous pairs stay unlinked.
    """
    if correlation.get("linked_project_id"):
        return correlation["linked_project_id"]
    if not correlation.get("candidates"):
        return None
    if opinion.get("ambiguous") or not opinion.get("same_project"):
        return None
    if float(opinion.get("confidence") or 0) < 0.75:
        return None
    top = correlation["candidates"][0]
    if top["score"] < 0.55:
        return None
    match = next((item for item in existing_projects if item["id"] == top["project_id"]), None)
    if not match or match.get("infrastructure_category") != candidate.get("infrastructure_category"):
        return None
    return top["project_id"]
