from __future__ import annotations

import json
import uuid
from typing import Any

from pydantic import BaseModel

from app.config import settings


def adk_available() -> bool:
    try:
        import google.adk  # noqa: F401

        return True
    except Exception:
        return False


def _parse_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        cleaned = cleaned[start : end + 1]
    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Agent returned a JSON value that is not an object.")
    return parsed


async def run_agent(agent: Any, user_text: str, output_key: str) -> dict:
    from google.adk.runners import InMemoryRunner
    from google.genai import types

    runner = InMemoryRunner(agent=agent, app_name="infrawatch")
    user_id = "infrawatch-pipeline"
    session_id = str(uuid.uuid4())
    await runner.session_service.create_session(
        app_name="infrawatch",
        user_id=user_id,
        session_id=session_id,
    )
    message = types.Content(role="user", parts=[types.Part(text=user_text)])
    final_text = ""
    async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=message):
        content = getattr(event, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            text = getattr(part, "text", None)
            if text and not getattr(part, "thought", False):
                final_text = text
    session = await runner.session_service.get_session(
        app_name="infrawatch",
        user_id=user_id,
        session_id=session_id,
    )
    state = dict(getattr(session, "state", None) or {})
    stored = state.get(output_key)
    if isinstance(stored, BaseModel):
        return stored.model_dump()
    if isinstance(stored, dict):
        return stored
    if isinstance(stored, str) and stored.strip():
        return _parse_json(stored)
    if not final_text.strip():
        raise RuntimeError(f"{getattr(agent, 'name', 'agent')} returned an empty response.")
    return _parse_json(final_text)


def build_llm_agent(name: str, description: str, instruction: str, output_model: type[BaseModel], output_key: str):
    from google.adk.agents import LlmAgent

    return LlmAgent(
        name=name,
        model=settings.gemini_model,
        description=description,
        instruction=instruction,
        output_schema=output_model,
        output_key=output_key,
        mode="single_turn",
        include_contents="none",
    )


def build_review_sequence(evidence_agent, classification_agent):
    """ADK sequential workflow for evidence review followed by classification commentary."""
    from google.adk.agents import SequentialAgent

    return SequentialAgent(
        name="infrawatch_review_sequence",
        description="Runs evidence review and then classification commentary.",
        sub_agents=[evidence_agent, classification_agent],
    )
