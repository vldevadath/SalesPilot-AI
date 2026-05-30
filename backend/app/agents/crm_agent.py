"""SalesPilot AI — CRM Agent.

Syncs all research intelligence to HubSpot CRM automatically.
Creates/updates Company, Contact, Deal, and Note records.
"""

from app.models.schemas import FullResearchReport
from app.services.hubspot import get_hubspot_service


async def run_crm_agent(report: FullResearchReport) -> dict:
    """Push research results to HubSpot CRM."""
    hubspot = get_hubspot_service()

    try:
        result = await hubspot.sync_report(report)
        return {
            "success": True,
            "company_id": result.get("company_id"),
            "contact_id": result.get("contact_id"),
            "deal_id": result.get("deal_id"),
        }
    except Exception as e:
        print(f"[CRM Agent] Error syncing to HubSpot: {e}")
        return {
            "success": False,
            "error": str(e),
        }
