from __future__ import annotations

from datetime import datetime, timezone

import httpx

from app.textutil import html_to_text, is_public_url

GDELT_ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc"
DEFAULT_QUERY = (
    '(Maharashtra OR Mumbai OR Pune OR Nagpur OR Nashik OR Thane) '
    '(highway OR expressway OR railway OR metro OR port OR airport OR bridge OR tunnel OR hospital OR "power plant" OR infrastructure)'
)


def _parse_seen(value: str | None) -> str | None:
    if not value:
        return None
    for pattern in ("%Y%m%dT%H%M%SZ", "%Y%m%dT%H%M%S"):
        try:
            return datetime.strptime(value, pattern).replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            continue
    return None


async def _read_article(client: httpx.AsyncClient, url: str) -> str | None:
    if not url or not is_public_url(url):
        return None
    try:
        response = await client.get(url, timeout=12, follow_redirects=True)
        if not is_public_url(str(response.url)):
            return None
    except httpx.HTTPError:
        return None
    if response.status_code >= 400:
        return None
    content_type = response.headers.get("content-type", "")
    if "html" not in content_type and "text" not in content_type:
        return None
    text = html_to_text(response.text)
    return text or None


async def search_gdelt(query: str | None = None, max_records: int = 12) -> tuple[list[dict], list[str]]:
    errors: list[str] = []
    params = {
        "query": query or DEFAULT_QUERY,
        "mode": "artlist",
        "format": "json",
        "maxrecords": str(max(1, min(max_records, 25))),
        "timespan": "3months",
        "sort": "datedesc",
    }
    headers = {"User-Agent": "InfraWatchPrototype/0.1 (educational; Maharashtra public-source monitor)"}
    async with httpx.AsyncClient(headers=headers) as client:
        try:
            response = await client.get(GDELT_ENDPOINT, params=params, timeout=25)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            return [], [f"GDELT request failed: {exc}"]
        try:
            payload = response.json()
        except ValueError:
            return [], ["GDELT did not return JSON. The service sometimes answers with an error page."]
        articles = payload.get("articles") if isinstance(payload, dict) else None
        if not isinstance(articles, list):
            return [], ["GDELT response did not include an article list."]
        items: list[dict] = []
        for article in articles:
            if not isinstance(article, dict):
                continue
            url = article.get("url") or None
            title = (article.get("title") or "").strip()
            if not title and not url:
                continue
            items.append(
                {
                    "title": title or url,
                    "url": url,
                    "publisher": article.get("domain") or "GDELT",
                    "source_type": "news",
                    "language": article.get("language") or None,
                    "published_at": _parse_seen(article.get("seendate")),
                    "text": title,
                    "full_text_retrieved": False,
                    "adapter": "gdelt",
                }
            )
        return items, errors


async def enrich_with_article_text(items: list[dict]) -> list[dict]:
    headers = {"User-Agent": "InfraWatchPrototype/0.1 (educational; Maharashtra public-source monitor)"}
    async with httpx.AsyncClient(headers=headers) as client:
        enriched: list[dict] = []
        for item in items:
            text = await _read_article(client, item.get("url") or "")
            if text and len(text) > len(item.get("text") or ""):
                item = {**item, "text": text, "full_text_retrieved": True}
            enriched.append(item)
        return enriched
