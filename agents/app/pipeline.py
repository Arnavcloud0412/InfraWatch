from __future__ import annotations

import json
from datetime import datetime, timezone

from app.adapters.gdelt import enrich_with_article_text, search_gdelt
from app.adapters.official import adapter_status as official_status
from app.adapters.official import fetch_official_feeds
from app.adapters.social import adapter_status as social_status
from app.adapters.social import fetch_social
from app.agents.prompts import (
    CLASSIFICATION_INSTRUCTION,
    CORRELATION_INSTRUCTION,
    DISCOVERY_INSTRUCTION,
    EVIDENCE_INSTRUCTION,
    EXTRACTION_INSTRUCTION,
)
from app.agents.runtime import adk_available, build_llm_agent, build_review_sequence, run_agent
from app.classification import classify, template_rationale
from app.config import settings
from app.correlation import correlate, may_link_after_agent
from app.evidence import clamp_recommendation, evidence_rows
from app.fallback import fallback_assessment
from app.schemas import (
    ClassificationAdjustment,
    CorrelationOpinion,
    DiscoveryFilter,
    EvidenceOutput,
    ExtractionOutput,
)
from app.scope import keyword_relevant
from app.textutil import content_hash, detect_language


def adapter_catalog() -> list[dict]:
    catalog = [
        {
            "id": "gdelt",
            "label": "GDELT DOC API",
            "configured": True,
            "detail": "Public document API. No key is required. Article pages are fetched only when a result is selected.",
        }
    ]
    catalog.extend(official_status())
    catalog.extend(social_status())
    return catalog


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_error(exc: Exception) -> str:
    message = f"{type(exc).__name__}: {exc}"
    if settings.gemini_api_key:
        message = message.replace(settings.gemini_api_key, "[redacted]")
    return message[:500]


def _projects(existing) -> list[dict]:
    rows = []
    for item in existing or []:
        if hasattr(item, "model_dump"):
            rows.append(item.model_dump())
        else:
            rows.append(dict(item))
    return rows


def _source_fields(payload: dict, digest: str) -> dict:
    text = payload.get("text") or ""
    return {
        "title": payload.get("title") or "Untitled",
        "url": payload.get("url"),
        "publisher": payload.get("publisher") or "Unknown",
        "source_type": payload.get("source_type") or "manual",
        "language": detect_language(f"{payload.get('title') or ''}\n{text}", payload.get("language")),
        "published_at": payload.get("published_at"),
        "retrieved_at": _now(),
        "raw_content": text[:8000],
        "content_hash": digest,
        "full_text_retrieved": bool(payload.get("full_text_retrieved")),
    }


async def _review_with_adk(user_text: str) -> tuple[dict, dict, list[str]]:
    trace = ["infrawatch_review_sequence"]
    evidence_agent = build_llm_agent(
        "evidence_review_agent",
        "Assesses source evidence without declaring a fact.",
        EVIDENCE_INSTRUCTION,
        EvidenceOutput,
        "evidence",
    )
    classification_agent = build_llm_agent(
        "classification_agent",
        "Suggests bounded public-service criticality adjustments.",
        CLASSIFICATION_INSTRUCTION,
        ClassificationAdjustment,
        "classification_adjustment",
    )
    sequence = build_review_sequence(evidence_agent, classification_agent)
    try:
        state = await _run_for_state(sequence, user_text)
        evidence = EvidenceOutput.model_validate(state.get("evidence") or {}).model_dump()
        adjustment = ClassificationAdjustment.model_validate(state.get("classification_adjustment") or {}).model_dump()
        if not state.get("evidence"):
            raise RuntimeError("Review sequence did not store an evidence assessment.")
        return evidence, adjustment, trace
    except Exception as exc:
        trace.append(f"review_sequence_fallback:{_safe_error(exc)}")
        evidence_agent = build_llm_agent(
            "evidence_review_agent",
            "Assesses source evidence without declaring a fact.",
            EVIDENCE_INSTRUCTION,
            EvidenceOutput,
            "evidence",
        )
        classification_agent = build_llm_agent(
            "classification_agent",
            "Suggests bounded public-service criticality adjustments.",
            CLASSIFICATION_INSTRUCTION,
            ClassificationAdjustment,
            "classification_adjustment",
        )
        evidence = EvidenceOutput.model_validate(await run_agent(evidence_agent, user_text, "evidence")).model_dump()
        adjustment = ClassificationAdjustment.model_validate(
            await run_agent(classification_agent, user_text, "classification_adjustment")
        ).model_dump()
        trace.extend(["evidence_review_agent", "classification_agent"])
        return evidence, adjustment, trace


async def _run_for_state(agent, user_text: str) -> dict:
    import uuid

    from google.adk.runners import InMemoryRunner
    from google.genai import types

    runner = InMemoryRunner(agent=agent, app_name="infrawatch")
    user_id = "infrawatch-pipeline"
    session_id = str(uuid.uuid4())
    await runner.session_service.create_session(app_name="infrawatch", user_id=user_id, session_id=session_id)
    message = types.Content(role="user", parts=[types.Part(text=user_text)])
    async for _event in runner.run_async(user_id=user_id, session_id=session_id, new_message=message):
        pass
    session = await runner.session_service.get_session(app_name="infrawatch", user_id=user_id, session_id=session_id)
    state = dict(getattr(session, "state", None) or {})
    normalised = {}
    for key, value in state.items():
        if hasattr(value, "model_dump"):
            normalised[key] = value.model_dump()
        elif isinstance(value, str):
            try:
                normalised[key] = json.loads(value)
            except json.JSONDecodeError:
                normalised[key] = value
        else:
            normalised[key] = value
    return normalised


async def process_document(payload: dict) -> dict:
    text = payload.get("text") or ""
    title = payload.get("title") or "Untitled"
    digest = content_hash(payload.get("url"), text or title)
    if digest in set(payload.get("known_hashes") or []):
        return {
            "disposition": "duplicate",
            "reason": "This source URL or text was already ingested.",
            "content_hash": digest,
            "agent_trace": [],
            **_source_fields(payload, digest),
        }

    projects = _projects(payload.get("existing_projects"))
    source_type = payload.get("source_type") or "manual"
    if not settings.llm_enabled or not adk_available():
        assessed = fallback_assessment(title, text, source_type, projects, payload.get("language"))
        assessed.update(_source_fields(payload, digest))
        assessed["disposition"] = "stored" if assessed["relevant"] else "irrelevant"
        assessed["reason"] = assessed["extraction"]["relevance_reason"]
        return assessed

    trace = ["extraction_agent"]
    try:
        extraction_agent = build_llm_agent(
            "extraction_agent",
            "Extracts structured infrastructure claims from one announcement.",
            EXTRACTION_INSTRUCTION,
            ExtractionOutput,
            "extraction",
        )
        extraction = ExtractionOutput.model_validate(
            await run_agent(
                extraction_agent,
                f"Title: {title}\nPublisher: {payload.get('publisher')}\nSource type: {source_type}\n\nText:\n{text[:7000]}",
                "extraction",
            )
        ).model_dump()
        if extraction.get("original_language") in {None, "", "unknown"}:
            extraction["original_language"] = detect_language(f"{title}\n{text}", payload.get("language"))
        if not extraction["relevant"]:
            assessed = {
                "relevant": False,
                "disposition": "irrelevant",
                "reason": extraction.get("relevance_reason") or "The extraction agent marked this item as out of scope.",
                "extraction": extraction,
                "correlation": None,
                "evidence": None,
                "classification": None,
                "pipeline_mode": "adk",
                "agent_trace": trace,
            }
            assessed.update(_source_fields(payload, digest))
            return assessed

        trace.append("correlation_function")
        correlation = correlate(extraction, projects)
        if correlation["ambiguous"] and correlation["candidates"]:
            trace.append("correlation_agent")
            opinion_agent = build_llm_agent(
                "correlation_agent",
                "Judges whether two reports may describe the same project.",
                CORRELATION_INSTRUCTION,
                CorrelationOpinion,
                "correlation_opinion",
            )
            opinion = CorrelationOpinion.model_validate(
                await run_agent(
                    opinion_agent,
                    json.dumps(
                        {
                            "extraction": extraction,
                            "candidates": correlation["candidates"],
                        },
                        ensure_ascii=False,
                    ),
                    "correlation_opinion",
                )
            ).model_dump()
            correlation["agent_opinion"] = opinion
            linked = may_link_after_agent(correlation, opinion, extraction, projects)
            correlation["linked_project_id"] = linked
            if opinion.get("rationale"):
                correlation["candidates"][0]["rationale"] += " Agent: " + opinion["rationale"]

        preliminary = classify(extraction["infrastructure_category"], f"{title}\n{text}")
        review_input = json.dumps(
            {
                "source_type": source_type,
                "publisher": payload.get("publisher"),
                "title": title,
                "text": text[:6000],
                "extraction": extraction,
                "known_candidates": correlation["candidates"],
                "preliminary_classification": {
                    "baseline_tier": preliminary["baseline_criticality_tier"],
                    "factors": preliminary["contextual_factors"],
                    "score": preliminary["contextual_criticality_score"],
                },
            },
            ensure_ascii=False,
        )
        evidence, adjustment, review_trace = await _review_with_adk(review_input)
        trace.extend(review_trace)
        publishers = {payload.get("publisher")}
        state, notes = clamp_recommendation(evidence["recommended_state"], len(publishers))
        if evidence.get("conflicting_points"):
            state = "conflicting"
            notes.append("Conflicting points were preserved.")
        evidence["recommended_state"] = state
        evidence["rule_notes"] = notes
        evidence["evidence_rows"] = evidence_rows(evidence)
        trace.append("classification_function")
        classification = classify(
            extraction["infrastructure_category"],
            f"{title}\n{text}",
            adjustment,
            adjustment.get("rationale")
            or template_rationale(
                extraction["infrastructure_category"],
                preliminary["baseline_criticality_tier"],
                preliminary["contextual_factors"],
                preliminary["contextual_criticality_score"],
                preliminary["proposed_criticality_tier"],
            ),
        )
        assessed = {
            "relevant": True,
            "disposition": "stored",
            "reason": extraction.get("relevance_reason") or "Extracted as a Maharashtra infrastructure claim.",
            "extraction": extraction,
            "correlation": correlation,
            "evidence": evidence,
            "classification": classification,
            "pipeline_mode": "adk",
            "agent_trace": trace,
        }
        assessed.update(_source_fields(payload, digest))
        return assessed
    except Exception as exc:
        assessed = fallback_assessment(title, text, source_type, projects, payload.get("language"))
        assessed.update(_source_fields(payload, digest))
        assessed["disposition"] = "stored" if assessed["relevant"] else "irrelevant"
        assessed["reason"] = assessed["extraction"]["relevance_reason"]
        assessed["agent_trace"] = ["adk_failed:" + _safe_error(exc), *assessed["agent_trace"]]
        assessed["pipeline_mode"] = "deterministic_fallback"
        return assessed


async def _filter_with_discovery_agent(items: list[dict]) -> list[dict]:
    if not items or not settings.llm_enabled or not adk_available():
        return items
    listing = "\n".join(
        f"{index}. [{item.get('source_type')}] {item.get('publisher')}: {item.get('title')}"
        for index, item in enumerate(items)
    )
    agent = build_llm_agent(
        "discovery_agent",
        "Selects Maharashtra infrastructure announcements from a candidate list.",
        DISCOVERY_INSTRUCTION,
        DiscoveryFilter,
        "discovery",
    )
    decision = DiscoveryFilter.model_validate(await run_agent(agent, listing, "discovery"))
    chosen = []
    for index in decision.relevant_indexes:
        if isinstance(index, int) and 0 <= index < len(items):
            chosen.append(items[index])
    return chosen


async def discover(payload: dict) -> dict:
    errors: list[str] = []
    gdelt_items, gdelt_errors = await search_gdelt(payload.get("query"), max_records=12)
    official_items, official_errors = await fetch_official_feeds()
    social_items, social_errors = await fetch_social()
    errors.extend(gdelt_errors)
    errors.extend(official_errors)
    errors.extend(social_errors)

    pool = gdelt_items + official_items[:20] + social_items
    seen = set(payload.get("known_hashes") or [])
    fresh: list[dict] = []
    duplicates = 0
    for item in pool:
        digest = content_hash(item.get("url"), item.get("title") or "")
        if digest in seen:
            duplicates += 1
            continue
        seen.add(digest)
        item["content_hash"] = digest
        fresh.append(item)

    keyworded = []
    for item in fresh:
        require_place = item.get("adapter") != "gdelt"
        if keyword_relevant(item.get("title") or "", item.get("text") or "", require_place=require_place):
            keyworded.append(item)
    filtered_out = len(fresh) - len(keyworded)
    shortlist = keyworded[:12]
    try:
        shortlist = await _filter_with_discovery_agent(shortlist)
    except Exception as exc:
        errors.append("Discovery agent failed, so the keyword shortlist was kept. " + _safe_error(exc))
    shortlist = shortlist[: int(payload.get("max_items") or 3)]
    needs_text = [item for item in shortlist if not item.get("full_text_retrieved")]
    if needs_text:
        enriched = {item.get("url"): item for item in await enrich_with_article_text(needs_text)}
        shortlist = [enriched.get(item.get("url"), item) if not item.get("full_text_retrieved") else item for item in shortlist]

    processed = []
    for item in shortlist:
        processed.append(
            await process_document(
                {
                    **item,
                    "existing_projects": payload.get("existing_projects") or [],
                    "known_hashes": [],
                }
            )
        )
    return {
        "items": processed,
        "errors": errors,
        "duplicates": duplicates,
        "filtered_out": filtered_out,
        "considered": len(pool),
        "llm_enabled": settings.llm_enabled and adk_available(),
        "model": settings.gemini_model if settings.llm_enabled else None,
        "adapters": adapter_catalog(),
    }
