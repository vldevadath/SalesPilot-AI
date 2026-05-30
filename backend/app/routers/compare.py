"""SalesPilot AI — Compare Router.

Accepts two completed research job IDs and returns an AI-generated
head-to-head comparison report with a recommended winner.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import FullResearchReport
from app.services.llm import get_llm_service
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


# ─── Response Schema ──────────────────────────────────────

class DimensionComparison(BaseModel):
    dimension: str = ""
    company_a_value: str = ""
    company_b_value: str = ""
    winner: str = ""          # "a" | "b" | "tie"
    rationale: str = ""

class ComparisonReport(BaseModel):
    company_a: str = ""
    company_b: str = ""
    winner: str = ""          # "a" or "b"
    winner_company_name: str = ""
    confidence: str = ""      # "high" | "medium" | "low"
    win_margin: str = ""      # "decisive" | "moderate" | "close"
    executive_summary: str = ""
    dimensions: list[DimensionComparison] = Field(default_factory=list)
    top_reasons_winner: list[str] = Field(default_factory=list)
    top_risks_winner: list[str] = Field(default_factory=list)
    recommended_action: str = ""
    score_a: int = 0          # 0-100 overall priority score
    score_b: int = 0


COMPARE_SYSTEM_PROMPT = """You are an elite B2B sales strategy analyst. You will receive intelligence dossiers on two companies and produce a definitive, opinionated head-to-head comparison report to help a sales team decide where to invest their time first.

Be decisive — pick a clear winner unless it's genuinely too close to call. Sales reps need clear guidance, not wishy-washy analysis.

Analyze these dimensions:
1. Intent Score (buying signals, urgency)
2. Budget & Funding (ability to pay)
3. Hiring Signals (growth trajectory)
4. Tech Stack Fit (gaps that indicate need)
5. Competitive Displacement (switching likelihood)
6. Pain Point Severity (urgency of need)
7. Deal Size Potential (revenue opportunity)
8. Time to Close (sales cycle estimate)

Score each company 0-100 on overall sales priority (score_a / score_b).

For winner field: use "a" for company A or "b" for company B.
For dimension winner: use "a", "b", or "tie".
Win margin: "decisive" = 15+ point gap, "moderate" = 8-14 points, "close" = <8 points."""


# ─── Endpoint ────────────────────────────────────────────

@router.post("/compare", response_model=ComparisonReport)
async def compare_companies(payload: dict):
    """Generate AI comparison report for two completed research jobs."""
    from app.routers.research import _jobs   # local import to avoid circular dep

    job_id_a = payload.get("job_id_a", "")
    job_id_b = payload.get("job_id_b", "")

    if not job_id_a or not job_id_b:
        raise HTTPException(status_code=400, detail="job_id_a and job_id_b are required")
    if job_id_a not in _jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id_a}' not found")
    if job_id_b not in _jobs:
        raise HTTPException(status_code=404, detail=f"Job '{job_id_b}' not found")

    report_a: FullResearchReport = _jobs[job_id_a]
    report_b: FullResearchReport = _jobs[job_id_b]

    if report_a.status.value != "complete":
        raise HTTPException(status_code=400, detail=f"Research for '{report_a.company_name}' is not complete yet")
    if report_b.status.value != "complete":
        raise HTTPException(status_code=400, detail=f"Research for '{report_b.company_name}' is not complete yet")

    llm = get_llm_service()

    prompt = f"""Compare these two sales target companies and produce a structured comparison report.

═══════════════════════════════════════════════
COMPANY A: {report_a.company_name}
═══════════════════════════════════════════════
Intent Score: {report_a.buying_intent.overall_score if report_a.buying_intent else 'N/A'}/100
Confidence: {report_a.buying_intent.confidence if report_a.buying_intent else 'N/A'}
Top Signals: {', '.join(report_a.buying_intent.top_reasons[:3]) if report_a.buying_intent else 'N/A'}

Company Profile:
- Industry: {report_a.company_profile.industry if report_a.company_profile else 'N/A'}
- Employees: {report_a.company_profile.employee_count if report_a.company_profile else 'N/A'}
- Revenue: {report_a.company_profile.revenue_estimate if report_a.company_profile else 'N/A'}
- HQ: {report_a.company_profile.headquarters if report_a.company_profile else 'N/A'}
- Model: {report_a.company_profile.business_model if report_a.company_profile else 'N/A'}

Hiring: {report_a.hiring_signals.total_open_roles if report_a.hiring_signals else 0} open roles, velocity: {report_a.hiring_signals.hiring_velocity if report_a.hiring_signals else 'N/A'}
Funding: {report_a.funding_news.latest_round if report_a.funding_news else 'N/A'} | Total: {report_a.funding_news.total_funding if report_a.funding_news else 'N/A'}
Tech Gaps: {', '.join(report_a.tech_stack.potential_gaps[:3]) if report_a.tech_stack else 'N/A'}
Pain Points: {report_a.pain_points.summary if report_a.pain_points else 'N/A'}
Competitor Intel: {report_a.competitor_intel.summary if report_a.competitor_intel else 'N/A'}

═══════════════════════════════════════════════
COMPANY B: {report_b.company_name}
═══════════════════════════════════════════════
Intent Score: {report_b.buying_intent.overall_score if report_b.buying_intent else 'N/A'}/100
Confidence: {report_b.buying_intent.confidence if report_b.buying_intent else 'N/A'}
Top Signals: {', '.join(report_b.buying_intent.top_reasons[:3]) if report_b.buying_intent else 'N/A'}

Company Profile:
- Industry: {report_b.company_profile.industry if report_b.company_profile else 'N/A'}
- Employees: {report_b.company_profile.employee_count if report_b.company_profile else 'N/A'}
- Revenue: {report_b.company_profile.revenue_estimate if report_b.company_profile else 'N/A'}
- HQ: {report_b.company_profile.headquarters if report_b.company_profile else 'N/A'}
- Model: {report_b.company_profile.business_model if report_b.company_profile else 'N/A'}

Hiring: {report_b.hiring_signals.total_open_roles if report_b.hiring_signals else 0} open roles, velocity: {report_b.hiring_signals.hiring_velocity if report_b.hiring_signals else 'N/A'}
Funding: {report_b.funding_news.latest_round if report_b.funding_news else 'N/A'} | Total: {report_b.funding_news.total_funding if report_b.funding_news else 'N/A'}
Tech Gaps: {', '.join(report_b.tech_stack.potential_gaps[:3]) if report_b.tech_stack else 'N/A'}
Pain Points: {report_b.pain_points.summary if report_b.pain_points else 'N/A'}
Competitor Intel: {report_b.competitor_intel.summary if report_b.competitor_intel else 'N/A'}

═══════════════════════════════════════════════

Return a JSON comparison report with this exact structure:
{{
  "company_a": "{report_a.company_name}",
  "company_b": "{report_b.company_name}",
  "winner": "a",
  "winner_company_name": "Name of the winner",
  "confidence": "high",
  "win_margin": "decisive",
  "executive_summary": "2-3 sentence summary of the comparison and recommendation",
  "dimensions": [
    {{
      "dimension": "Intent Score",
      "company_a_value": "82/100 — Hot Lead",
      "company_b_value": "61/100 — Warm Lead",
      "winner": "a",
      "rationale": "Company A shows 35% stronger buying signals driven by recent funding..."
    }}
  ],
  "top_reasons_winner": ["Reason 1", "Reason 2", "Reason 3"],
  "top_risks_winner": ["Risk 1", "Risk 2"],
  "recommended_action": "Specific 1-sentence action for the sales rep",
  "score_a": 78,
  "score_b": 61
}}

Include exactly 8 dimensions. Be specific, opinionated, and actionable."""

    result = await llm.analyze(
        system_prompt=COMPARE_SYSTEM_PROMPT,
        user_prompt=prompt,
        response_model=ComparisonReport,
    )

    # Inject company names as fallback
    result.company_a = result.company_a or report_a.company_name
    result.company_b = result.company_b or report_b.company_name
    if not result.winner_company_name:
        result.winner_company_name = report_a.company_name if result.winner == "a" else report_b.company_name

    return result
