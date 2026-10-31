from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(_ROOT / ".env")
load_dotenv(_ROOT / ".env.local")
load_dotenv(_ROOT.parent / ".env")


def _csv(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [part.strip() for part in raw.split(",") if part.strip()]


class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    data_gov_api_key: str = os.getenv("DATA_GOV_IN_API_KEY", "")
    data_gov_resource_ids: list[str] = _csv("DATA_GOV_IN_RESOURCE_IDS")
    x_bearer_token: str = os.getenv("X_BEARER_TOKEN", "")
    youtube_api_key: str = os.getenv("YOUTUBE_API_KEY", "")
    reddit_client_id: str = os.getenv("REDDIT_CLIENT_ID", "")
    reddit_client_secret: str = os.getenv("REDDIT_CLIENT_SECRET", "")
    official_rss_urls: list[str] = _csv("OFFICIAL_RSS_URLS") or [
        "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3"
    ]

    @property
    def llm_enabled(self) -> bool:
        return bool(self.gemini_api_key)

    def export_google_key(self) -> None:
        if self.gemini_api_key and not os.getenv("GOOGLE_API_KEY"):
            os.environ["GOOGLE_API_KEY"] = self.gemini_api_key


settings = Settings()
settings.export_google_key()
