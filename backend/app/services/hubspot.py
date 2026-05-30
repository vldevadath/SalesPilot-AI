"""SalesPilot AI — HubSpot CRM Service (Free Tier).

Creates/updates Company, Contact, Deal, and Note records
from research intelligence data.
"""

import json
from typing import Optional
import httpx

from app.config import get_settings
from app.models.schemas import FullResearchReport


class HubSpotService:
    """HubSpot CRM API client for syncing research data."""

    BASE_URL = "https://api.hubapi.com"

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.hubspot_api_key
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def sync_report(self, report: FullResearchReport) -> dict:
        """Sync a full research report to HubSpot."""
        result = {}

        # 1. Create/Update Company
        company_id = await self._create_company(report)
        result["company_id"] = company_id

        # 2. Create Contact (if leadership data available)
        if report.company_profile and report.company_profile.leadership:
            contact_id = await self._create_contact(report, company_id)
            result["contact_id"] = contact_id

        # 3. Create Deal with intent score
        if report.buying_intent:
            deal_id = await self._create_deal(report, company_id)
            result["deal_id"] = deal_id

        # 4. Add research note
        await self._add_note(report, company_id)

        return result

    async def _create_company(self, report: FullResearchReport) -> str:
        """Create or update a company in HubSpot."""
        client = await self._get_client()
        profile = report.company_profile

        properties = {
            "name": report.company_name,
            "domain": profile.domain if profile else "",
            "industry": profile.industry if profile else "",
            "description": profile.description[:1000] if profile and profile.description else "",
            "numberofemployees": profile.employee_count if profile else "",
            "annualrevenue": profile.revenue_estimate if profile else "",
            "city": profile.headquarters if profile else "",
        }

        try:
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/companies",
                json={"properties": properties},
            )
            response.raise_for_status()
            return response.json().get("id", "")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 409:
                # Company already exists, try to find and update
                return await self._search_and_update_company(report.company_name, properties)
            raise

    async def _search_and_update_company(self, name: str, properties: dict) -> str:
        """Search for existing company and update it."""
        client = await self._get_client()
        try:
            search_response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/companies/search",
                json={
                    "filterGroups": [{
                        "filters": [{
                            "propertyName": "name",
                            "operator": "EQ",
                            "value": name,
                        }]
                    }]
                },
            )
            search_response.raise_for_status()
            results = search_response.json().get("results", [])
            if results:
                company_id = results[0]["id"]
                await client.patch(
                    f"{self.BASE_URL}/crm/v3/objects/companies/{company_id}",
                    json={"properties": properties},
                )
                return company_id
        except Exception:
            pass
        return ""

    async def _create_contact(self, report: FullResearchReport, company_id: str) -> str:
        """Create a contact from leadership data."""
        client = await self._get_client()
        leader = report.company_profile.leadership[0]

        # Parse name
        full_name = leader.get("name", "Unknown")
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        properties = {
            "firstname": first_name,
            "lastname": last_name,
            "jobtitle": leader.get("title", ""),
            "company": report.company_name,
        }

        try:
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/contacts",
                json={"properties": properties},
            )
            response.raise_for_status()
            contact_id = response.json().get("id", "")

            # Associate contact with company
            if contact_id and company_id:
                await client.put(
                    f"{self.BASE_URL}/crm/v3/objects/contacts/{contact_id}/associations/companies/{company_id}/contact_to_company",
                    json={},
                )

            return contact_id
        except Exception as e:
            print(f"[HubSpot] Error creating contact: {e}")
            return ""

    async def _create_deal(self, report: FullResearchReport, company_id: str) -> str:
        """Create a deal based on buying intent score."""
        client = await self._get_client()
        score = report.buying_intent.overall_score if report.buying_intent else 0

        # Map intent score to deal stage
        if score >= 80:
            stage = "qualifiedtobuy"
        elif score >= 60:
            stage = "presentationscheduled"
        elif score >= 40:
            stage = "appointmentscheduled"
        else:
            stage = "qualifiedtobuy"

        properties = {
            "dealname": f"SalesPilot - {report.company_name}",
            "dealstage": stage,
            "pipeline": "default",
            "amount": "",
            "description": (
                f"Auto-generated by SalesPilot AI\n"
                f"Buying Intent Score: {score}/100\n"
                f"Top Reasons: {'; '.join(report.buying_intent.top_reasons[:3]) if report.buying_intent else 'N/A'}"
            ),
        }

        try:
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/deals",
                json={"properties": properties},
            )
            response.raise_for_status()
            deal_id = response.json().get("id", "")

            # Associate deal with company
            if deal_id and company_id:
                await client.put(
                    f"{self.BASE_URL}/crm/v3/objects/deals/{deal_id}/associations/companies/{company_id}/deal_to_company",
                    json={},
                )

            return deal_id
        except Exception as e:
            print(f"[HubSpot] Error creating deal: {e}")
            return ""

    async def _add_note(self, report: FullResearchReport, company_id: str):
        """Add a research summary note to the company."""
        client = await self._get_client()

        note_body = f"""🤖 SalesPilot AI Research Report — {report.company_name}
{'='*50}

📊 BUYING INTENT SCORE: {report.buying_intent.overall_score if report.buying_intent else 'N/A'}/100

🏢 COMPANY OVERVIEW:
{report.company_profile.description[:500] if report.company_profile else 'N/A'}

📈 HIRING SIGNALS:
{report.hiring_signals.summary if report.hiring_signals else 'N/A'}

💰 FUNDING & NEWS:
{report.funding_news.summary if report.funding_news else 'N/A'}

🔧 TECH STACK:
{report.tech_stack.summary if report.tech_stack else 'N/A'}

😤 PAIN POINTS:
{report.pain_points.summary if report.pain_points else 'N/A'}

⚔️ COMPETITOR INTEL:
{report.competitor_intel.summary if report.competitor_intel else 'N/A'}

{'='*50}
Generated by SalesPilot AI | {report.created_at.isoformat() if report.created_at else 'N/A'}
"""

        try:
            response = await client.post(
                f"{self.BASE_URL}/crm/v3/objects/notes",
                json={
                    "properties": {
                        "hs_note_body": note_body,
                        "hs_timestamp": report.created_at.isoformat() if report.created_at else "",
                    }
                },
            )
            response.raise_for_status()
            note_id = response.json().get("id", "")

            # Associate note with company
            if note_id and company_id:
                await client.put(
                    f"{self.BASE_URL}/crm/v3/objects/notes/{note_id}/associations/companies/{company_id}/note_to_company",
                    json={},
                )
        except Exception as e:
            print(f"[HubSpot] Error adding note: {e}")


# Singleton
_hubspot_service = None


def get_hubspot_service() -> HubSpotService:
    global _hubspot_service
    if _hubspot_service is None:
        _hubspot_service = HubSpotService()
    return _hubspot_service
