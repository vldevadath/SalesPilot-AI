"""SalesPilot AI — CRM API Router."""

from fastapi import APIRouter, HTTPException

from app.routers.research import _jobs
from app.services.hubspot import get_hubspot_service

router = APIRouter()


@router.post("/crm/sync/{job_id}")
async def sync_to_crm(job_id: str):
    """Push research results to HubSpot CRM."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    report = _jobs[job_id]
    if report.status.value != "complete":
        raise HTTPException(status_code=400, detail="Research not yet complete")

    try:
        hubspot = get_hubspot_service()
        result = await hubspot.sync_report(report)
        report.crm_synced = True
        report.crm_record_id = result.get("company_id")
        return {
            "status": "synced",
            "company_id": result.get("company_id"),
            "contact_id": result.get("contact_id"),
            "deal_id": result.get("deal_id"),
            "message": f"Successfully synced {report.company_name} to HubSpot",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"CRM sync failed: {str(e)}",
        )


@router.get("/crm/status/{job_id}")
async def get_crm_status(job_id: str):
    """Check CRM sync status for a job."""
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    report = _jobs[job_id]
    return {
        "job_id": job_id,
        "crm_synced": report.crm_synced,
        "crm_record_id": report.crm_record_id,
    }
