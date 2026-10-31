from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.agents.runtime import adk_available
from app.config import settings
from app.pipeline import adapter_catalog, discover, process_document
from app.schemas import DiscoverRequest, ProcessRequest

app = FastAPI(title="InfraWatch AI agents", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "adk_available": adk_available(),
        "llm_enabled": settings.llm_enabled and adk_available(),
        "model": settings.gemini_model,
        "prototype": True,
    }


@app.get("/adapters")
async def adapters() -> dict:
    return {"adapters": adapter_catalog()}


@app.post("/pipeline/process")
async def process_route(body: ProcessRequest) -> dict:
    return await process_document(body.model_dump())


@app.post("/pipeline/discover")
async def discover_route(body: DiscoverRequest) -> dict:
    return await discover(body.model_dump())
