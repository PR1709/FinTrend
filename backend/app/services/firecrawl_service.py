import asyncio
import httpx
from typing import List, Optional
from app.config import settings
import structlog

log = structlog.get_logger()


async def scrape_urls(urls: List[str]) -> List[dict]:
    if not urls or not settings.firecrawl_api_key:
        return []

    results = []
    urls = urls[:settings.max_scrape_urls]

    async with httpx.AsyncClient(timeout=30.0) as client:
        for url in urls:
            try:
                resp = await client.post(
                    "https://api.firecrawl.dev/v1/scrape",
                    headers={"Authorization": f"Bearer {settings.firecrawl_api_key}"},
                    json={"url": url, "formats": ["markdown"], "onlyMainContent": True}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("data", {}).get("markdown", "") or ""
                    title = data.get("data", {}).get("metadata", {}).get("title", url)
                    results.append({
                        "url": url,
                        "title": title[:200],
                        "content": content[:2000]
                    })
                else:
                    log.warning("firecrawl_error", url=url, status=resp.status_code)
            except Exception as e:
                log.warning("firecrawl_exception", url=url, error=str(e))

    return results
