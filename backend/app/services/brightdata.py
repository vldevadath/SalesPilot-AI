"""SalesPilot AI — Bright Data Web Intelligence Service.

Provides access to Bright Data's SERP API, Web Scraper API, and Web Unlocker
for gathering company intelligence from the web.
"""

import json
import asyncio
from typing import Optional
import httpx

from app.config import get_settings


class BrightDataService:
    """Wrapper around Bright Data's APIs for web intelligence gathering."""

    BASE_URL = "https://api.brightdata.com"

    def __init__(self):
        settings = get_settings()
        self.api_token = settings.bright_data_api_token
        self.serp_zone = settings.bright_data_serp_zone
        self.web_unlocker_zone = settings.bright_data_web_unlocker_zone
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=10.0),
                headers={
                    "Authorization": f"Bearer {self.api_token}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ─── SERP API ─────────────────────────────────────────

    async def search_google(
        self,
        query: str,
        num_results: int = 10,
        country: str = "us",
        language: str = "en",
    ) -> dict:
        """Search Google via Bright Data SERP API and return structured results."""
        from urllib.parse import quote_plus
        client = await self._get_client()
        encoded_query = quote_plus(query)
        search_url = (
            f"https://www.google.com/search?q={encoded_query}&num={num_results}"
            f"&gl={country}&hl={language}"
        )
        try:
            response = await client.post(
                f"{self.BASE_URL}/request",
                json={
                    "zone": self.serp_zone,
                    "url": search_url,
                    "format": "json",
                },
            )
            response.raise_for_status()
            data = response.json()
            # Bright Data wraps: {status_code, headers, body}
            if "body" in data:
                import json as _json
                body = data["body"]
                return _json.loads(body) if isinstance(body, str) else body
            return data
        except Exception as e:
            print(f"[BrightData SERP] Error searching '{query}': {e}")
            return {"organic": [], "error": str(e)}

    async def search_google_news(
        self,
        query: str,
        num_results: int = 10,
    ) -> dict:
        """Search Google News via Bright Data SERP API."""
        from urllib.parse import quote_plus
        client = await self._get_client()
        encoded_query = quote_plus(query)
        search_url = (
            f"https://www.google.com/search?q={encoded_query}&tbm=nws"
            f"&num={num_results}&gl=us&hl=en"
        )
        try:
            response = await client.post(
                f"{self.BASE_URL}/request",
                json={
                    "zone": self.serp_zone,
                    "url": search_url,
                    "format": "json",
                },
            )
            response.raise_for_status()
            data = response.json()
            if "body" in data:
                import json as _json
                body = data["body"]
                return _json.loads(body) if isinstance(body, str) else body
            return data
        except Exception as e:
            print(f"[BrightData News] Error searching '{query}': {e}")
            return {"news_results": [], "error": str(e)}

    # ─── Web Scraper / Unlocker ───────────────────────────

    async def scrape_page(self, url: str) -> str:
        """Scrape a page using Bright Data Web Unlocker and return text content."""
        client = await self._get_client()
        try:
            response = await client.post(
                f"{self.BASE_URL}/request",
                json={
                    "zone": self.web_unlocker_zone,
                    "url": url,
                    "format": "raw",
                },
            )
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"[BrightData Scrape] Error scraping '{url}': {e}")
            return ""

    async def scrape_linkedin_company(self, company_url: str) -> dict:
        """Scrape LinkedIn company profile using Bright Data Web Scraper API."""
        client = await self._get_client()
        try:
            # Trigger scraping job
            response = await client.post(
                f"{self.BASE_URL}/dca/trigger",
                params={"dataset_id": "gd_l1viktl72bvl7bjuj0"},  # LinkedIn Company dataset
                json=[{"url": company_url}],
            )
            response.raise_for_status()
            snapshot_id = response.json().get("snapshot_id")

            if not snapshot_id:
                return {"error": "No snapshot_id returned"}

            # Poll for results (max 30 seconds)
            for _ in range(15):
                await asyncio.sleep(2)
                result = await client.get(
                    f"{self.BASE_URL}/dca/get_snapshot",
                    params={"id": snapshot_id},
                )
                if result.status_code == 200:
                    data = result.json()
                    if data:
                        return data[0] if isinstance(data, list) else data
            return {"error": "Timeout waiting for LinkedIn data"}
        except Exception as e:
            print(f"[BrightData LinkedIn] Error scraping '{company_url}': {e}")
            return {"error": str(e)}

    # ─── Batch Operations ─────────────────────────────────

    async def parallel_search(self, queries: list[str]) -> list[dict]:
        """Run multiple SERP searches in parallel."""
        tasks = [self.search_google(q) for q in queries]
        return await asyncio.gather(*tasks, return_exceptions=True)


# Singleton instance
_bright_data_service: Optional[BrightDataService] = None


def get_bright_data_service() -> BrightDataService:
    global _bright_data_service
    if _bright_data_service is None:
        _bright_data_service = BrightDataService()
    return _bright_data_service
