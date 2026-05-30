"""SalesPilot AI — Email Agent.

Generates personalized cold outreach in 4 formats:
Enterprise, Startup-friendly, Consultative, and Challenger-sale.
All backed by actual intelligence from the research pipeline.
"""

import json
from app.models.schemas import (
    OutreachDraft,
    OutreachFormat,
    BuyingIntentScore,
    CompanyProfile,
    HiringSignals,
    FundingNews,
    PainPoints,
    CompetitorIntel,
)
from app.services.llm import get_llm_service


SYSTEM_PROMPT = """You are an expert B2B sales copywriter specializing in personalized cold outreach.
Given detailed research intelligence about a target company, generate a cold email that:

1. Opens with a SPECIFIC, RESEARCHED hook (not generic flattery)
2. References actual signals: funding, hiring, pain points, or competitor issues
3. Connects the signal to a relevant value proposition
4. Keeps it concise (under 150 words for body)
5. Ends with a clear, low-friction CTA

You must generate emails in the requested format:
- ENTERPRISE: Formal, ROI-focused, data-driven, mentions compliance/scale
- STARTUP: Casual, growth-focused, mentions speed/agility, uses first names
- CONSULTATIVE: Advisory tone, asks insightful questions, positions as a partner
- CHALLENGER: Bold, challenges status quo, presents contrarian insight

CRITICAL: Every email MUST reference at least 2 specific data points from the research.
Generic emails are a failure. Personalization points must be listed."""


async def run_email_agent(
    company_profile: CompanyProfile,
    hiring_signals: HiringSignals,
    funding_news: FundingNews,
    pain_points: PainPoints,
    competitor_intel: CompetitorIntel,
    intent_score: BuyingIntentScore,
) -> list[OutreachDraft]:
    """Generate 4 personalized outreach drafts grounded in research signals."""
    llm = get_llm_service()

    # Build the intelligence context
    context = f"""
COMPANY: {company_profile.name} ({company_profile.industry})
EMPLOYEES: {company_profile.employee_count}
INTENT SCORE: {intent_score.overall_score}/100
TOP REASONS: {'; '.join(intent_score.top_reasons)}

KEY SIGNALS:
- Funding: {funding_news.total_funding or 'N/A'} — {funding_news.latest_round or 'No recent funding'}
- Hiring: {hiring_signals.total_open_roles} open roles, velocity: {hiring_signals.hiring_velocity}
- Growth Flags: {', '.join(hiring_signals.growth_intent_flags[:3])}
- Pain Points: {json.dumps(pain_points.pain_points[:3])}
- Competitor Issues: {', '.join(competitor_intel.pricing_frustrations[:2])}
- Migration Signals: {', '.join(competitor_intel.migration_signals[:2])}

LEADERSHIP: {json.dumps(company_profile.leadership[:3])}
"""

    formats = [
        OutreachFormat.ENTERPRISE,
        OutreachFormat.STARTUP,
        OutreachFormat.CONSULTATIVE,
        OutreachFormat.CHALLENGER,
    ]

    drafts = []
    for fmt in formats:
        prompt = f"""Generate a {fmt.value.upper()} format cold email for {company_profile.name}.

Research context:
{context}

Respond with ONLY valid JSON:
{{
  "format_type": "{fmt.value}",
  "subject": "email subject line",
  "body": "full email body",
  "key_personalization_points": ["point 1", "point 2", "point 3"]
}}"""

        draft = await llm.analyze(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=prompt,
            response_model=OutreachDraft,
        )
        draft.format_type = fmt.value
        drafts.append(draft)

    return drafts
