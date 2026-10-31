from __future__ import annotations

import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.textutil import html_to_text, is_public_url


def adapter_status() -> list[dict]:
    status = [
        {
            "id": "pwd_maharashtra",
            "label": "Maharashtra Public Works Department",
            "configured": False,
            "detail": "https://pwd.maharashtra.gov.in/en/ has no documented public API. Submit announcement URLs manually. This prototype does not crawl the site.",
        }
    ]
    status.append(
        {
            "id": "pib_rss",
            "label": "PIB RSS",
            "configured": bool(settings.official_rss_urls),
            "detail": "Attempts the configured RSS feeds. A failed feed is reported and skipped.",
        }
    )
    status.append(
        {
            "id": "data_gov_in",
            "label": "data.gov.in",
            "configured": bool(settings.data_gov_api_key and settings.data_gov_resource_ids),
            "detail": "Set DATA_GOV_IN_API_KEY and DATA_GOV_IN_RESOURCE_IDS. No key is bundled with the prototype.",
        }
    )
    return status


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _find_text(node: ET.Element, name: str) -> str:
    for child in node.iter():
        if _local(child.tag) == name and child.text:
            return child.text.strip()
    return ""


async def fetch_official_feeds() -> tuple[list[dict], list[str]]:
    items: list[dict] = []
    errors: list[str] = []
    headers = {"User-Agent": "InfraWatchPrototype/0.1"}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
        for url in settings.official_rss_urls:
            if not is_public_url(url):
                errors.append(f"Skipped non-public feed URL: {url}")
                continue
            try:
                response = await client.get(url, timeout=20)
                response.raise_for_status()
                root = ET.fromstring(response.text)
            except (httpx.HTTPError, ET.ParseError) as exc:
                errors.append(f"Official feed failed ({url}): {exc}")
                continue
            for node in root.iter():
                if _local(node.tag) != "item":
                    continue
                title = _find_text(node, "title")
                link = _find_text(node, "link")
                description = html_to_text(_find_text(node, "description"))
                if not title:
                    continue
                items.append(
                    {
                        "title": title,
                        "url": link or None,
                        "publisher": "PIB",
                        "source_type": "official",
                        "language": "en",
                        "published_at": datetime.now(timezone.utc).isoformat(),
                        "text": description or title,
                        "full_text_retrieved": bool(description),
                        "adapter": "official_rss",
                    }
                )
        if settings.data_gov_api_key and settings.data_gov_resource_ids:
            for resource_id in settings.data_gov_resource_ids:
                endpoint = f"https://api.data.gov.in/resource/{resource_id}"
                try:
                    response = await client.get(
                        endpoint,
                        params={"api-key": settings.data_gov_api_key, "format": "json", "limit": 5},
                        timeout=20,
                    )
                    response.raise_for_status()
                    payload = response.json()
                except (httpx.HTTPError, ValueError) as exc:
                    errors.append(f"data.gov.in resource {resource_id} failed: {exc}")
                    continue
                records = payload.get("records") if isinstance(payload, dict) else None
                if not isinstance(records, list):
                    errors.append(f"data.gov.in resource {resource_id} returned no records.")
                    continue
                for record in records[:5]:
                    if not isinstance(record, dict):
                        continue
                    text = "; ".join(f"{key}: {value}" for key, value in record.items() if value)
                    items.append(
                        {
                            "title": f"data.gov.in record {resource_id}",
                            "url": endpoint,
                            "publisher": "data.gov.in",
                            "source_type": "official",
                            "language": "en",
                            "published_at": None,
                            "text": text[:4000],
                            "full_text_retrieved": True,
                            "adapter": "data_gov_in",
                        }
                    )
        elif settings.data_gov_api_key:
            errors.append("DATA_GOV_IN_API_KEY is set but DATA_GOV_IN_RESOURCE_IDS is empty, so no dataset was queried.")
    return items, errors
