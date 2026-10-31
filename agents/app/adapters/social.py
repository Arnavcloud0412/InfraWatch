from __future__ import annotations

import httpx

from app.config import settings

QUERY = "Maharashtra (highway OR expressway OR railway OR metro OR port OR airport OR bridge OR hospital)"


def adapter_status() -> list[dict]:
    return [
        {
            "id": "x",
            "label": "X API",
            "configured": bool(settings.x_bearer_token),
            "detail": "Set X_BEARER_TOKEN for recent search. The prototype does not ship a token and does not imitate posts.",
        },
        {
            "id": "youtube",
            "label": "YouTube Data API",
            "configured": bool(settings.youtube_api_key),
            "detail": "Set YOUTUBE_API_KEY. Without it this adapter stays idle.",
        },
        {
            "id": "reddit",
            "label": "Reddit API",
            "configured": bool(settings.reddit_client_id and settings.reddit_client_secret),
            "detail": "Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET. Unauthenticated scraping is not used.",
        },
    ]


async def fetch_social() -> tuple[list[dict], list[str]]:
    items: list[dict] = []
    errors: list[str] = []
    async with httpx.AsyncClient(timeout=20) as client:
        if settings.youtube_api_key:
            try:
                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    params={
                        "part": "snippet",
                        "q": "Maharashtra highway OR expressway OR railway OR port OR airport",
                        "type": "video",
                        "maxResults": 5,
                        "relevanceLanguage": "en",
                        "key": settings.youtube_api_key,
                    },
                )
                response.raise_for_status()
                payload = response.json()
                for entry in payload.get("items") or []:
                    snippet = entry.get("snippet") or {}
                    video_id = (entry.get("id") or {}).get("videoId")
                    title = snippet.get("title") or "YouTube video"
                    description = snippet.get("description") or ""
                    items.append(
                        {
                            "title": title,
                            "url": f"https://www.youtube.com/watch?v={video_id}" if video_id else None,
                            "publisher": snippet.get("channelTitle") or "YouTube",
                            "source_type": "social",
                            "language": "en",
                            "published_at": snippet.get("publishedAt"),
                            "text": f"{title}. {description}".strip(),
                            "full_text_retrieved": True,
                            "adapter": "youtube",
                        }
                    )
            except (httpx.HTTPError, ValueError) as exc:
                errors.append(f"YouTube API failed: {exc}")
        if settings.x_bearer_token:
            try:
                response = await client.get(
                    "https://api.twitter.com/2/tweets/search/recent",
                    headers={"Authorization": f"Bearer {settings.x_bearer_token}"},
                    params={
                        "query": f"({QUERY}) -is:retweet lang:en",
                        "max_results": 10,
                        "tweet.fields": "created_at,lang",
                    },
                )
                response.raise_for_status()
                payload = response.json()
                for tweet in payload.get("data") or []:
                    text = tweet.get("text") or ""
                    tweet_id = tweet.get("id")
                    items.append(
                        {
                            "title": text[:140],
                            "url": f"https://x.com/i/web/status/{tweet_id}" if tweet_id else None,
                            "publisher": "X",
                            "source_type": "social",
                            "language": tweet.get("lang") or "en",
                            "published_at": tweet.get("created_at"),
                            "text": text,
                            "full_text_retrieved": True,
                            "adapter": "x",
                        }
                    )
            except (httpx.HTTPError, ValueError) as exc:
                errors.append(f"X API failed: {exc}")
        if settings.reddit_client_id and settings.reddit_client_secret:
            try:
                token_response = await client.post(
                    "https://www.reddit.com/api/v1/access_token",
                    auth=(settings.reddit_client_id, settings.reddit_client_secret),
                    data={"grant_type": "client_credentials"},
                    headers={"User-Agent": "InfraWatchPrototype/0.1"},
                )
                token_response.raise_for_status()
                token = token_response.json().get("access_token")
                if not token:
                    errors.append("Reddit did not return an access token.")
                else:
                    search = await client.get(
                        "https://oauth.reddit.com/search",
                        headers={"Authorization": f"Bearer {token}", "User-Agent": "InfraWatchPrototype/0.1"},
                        params={"q": "Maharashtra infrastructure", "limit": 5, "sort": "new"},
                    )
                    search.raise_for_status()
                    posts = ((search.json().get("data") or {}).get("children")) or []
                    for post in posts:
                        data = post.get("data") or {}
                        title = data.get("title") or "Reddit post"
                        permalink = data.get("permalink")
                        items.append(
                            {
                                "title": title,
                                "url": f"https://www.reddit.com{permalink}" if permalink else None,
                                "publisher": "Reddit",
                                "source_type": "social",
                                "language": "en",
                                "published_at": None,
                                "text": f"{title}. {data.get('selftext') or ''}"[:4000],
                                "full_text_retrieved": bool(data.get("selftext")),
                                "adapter": "reddit",
                            }
                        )
            except (httpx.HTTPError, ValueError) as exc:
                errors.append(f"Reddit API failed: {exc}")
    return items, errors
