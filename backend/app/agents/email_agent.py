"""SalesPilot AI — Email Agent.

Generates personalized cold outreach in 4 strategy formats:
  - Pain Point: "I noticed your team struggles with..."
  - ROI:        "Companies like yours save $X by..."
  - News Hook:  "Congrats on your Series B! That's why..."
  - Mutual Connection: "I noticed your CTO previously worked at..."

All grounded in actual intelligence from the research pipeline.
Each draft includes a predicted response rate estimate.
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


SYSTEM_PROMPT = """You are an expert B2B sales copywriter specializing in highly personalized cold outreach.
Given detailed research intelligence about a target company, generate a cold email that:

1. Opens with a SPECIFIC, RESEARCHED hook (not generic flattery)
2. References actual signals: funding, hiring, pain points, or competitor issues
3. Connects the signal to a relevant value proposition
4. Keeps it concise (under 150 words for body)
5. Ends with a clear, low-friction CTA

You must generate emails in the requested strategy:
- PAIN_POINT: Lead with a specific pain you've identified. "I noticed your team is struggling with [X]..."
- ROI: Lead with financial impact. "Companies in [industry] similar to [name] typically save $X / gain Y% by..."
- NEWS_HOOK: Lead with a recent event (funding, product launch, leadership hire). "Congrats on [event]! As you scale..."
- MUTUAL_CONNECTION: Lead with a shared signal (alum, investor, tool). "I noticed your [CTO/VP] previously worked at [company]..." or "You're backed by [investor] who..."

CRITICAL: Every email MUST reference at least 2 specific data points from the research.
Generic emails are a failure. Always include a realistic predicted_response_rate (%) for the strategy given the company profile.
Predicted response rates: Pain Point 18-28%, ROI 15-22%, News Hook 22-35%, Mutual Connection 20-30%."""


STRATEGY_CONFIGS = [
    {
        "format": OutreachFormat.PAIN_POINT,
        "label": "Pain Point",
        "instruction": "Lead with the most critical pain point you identified. Show you understand their specific operational struggle.",
    },
    {
        "format": OutreachFormat.ROI,
        "label": "ROI",
        "instruction": "Lead with a concrete financial or efficiency outcome. Use their company size, funding stage, and industry to make the ROI feel realistic and tailored.",
    },
    {
        "format": OutreachFormat.NEWS_HOOK,
        "label": "News Hook",
        "instruction": "Lead with the most recent funding event, product news, or leadership change. Connect it directly to a growth challenge they will face.",
    },
    {
        "format": OutreachFormat.MUTUAL_CONNECTION,
        "label": "Mutual Connection",
        "instruction": "Lead with a shared signal — a common investor, leadership alum, tech stack choice, or mutual contact. Make it feel like insider knowledge.",
    },
]


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
HEADQUARTERS: {company_profile.headquarters}
FOUNDED: {company_profile.founded}
INTENT SCORE: {intent_score.overall_score}/100
TOP REASONS: {'; '.join(intent_score.top_reasons[:3])}

KEY SIGNALS:
- Latest Funding: {funding_news.latest_round or 'No recent funding'} (Total: {funding_news.total_funding or 'N/A'})
- Investors: {', '.join(funding_news.investors[:3]) or 'Unknown'}
- Hiring: {hiring_signals.total_open_roles} open roles — velocity: {hiring_signals.hiring_velocity}
- Top Hiring Departments: {', '.join(hiring_signals.departments_hiring[:4])}
- Growth Flags: {', '.join(hiring_signals.growth_intent_flags[:3])}
- Pain Points: {json.dumps([p.get('description', p.get('category', '')) for p in pain_points.pain_points[:3]])}
- Current Vendors: {', '.join([v.get('name', '') for v in competitor_intel.current_vendors[:3]])}
- Pricing Frustrations: {', '.join(competitor_intel.pricing_frustrations[:2])}
- Migration Signals: {', '.join(competitor_intel.migration_signals[:2])}
- Displacement Opportunities: {', '.join(competitor_intel.displacement_opportunities[:2])}

LEADERSHIP: {json.dumps([{{'name': l.get('name',''), 'title': l.get('title','')}} for l in company_profile.leadership[:3]])}
"""

    drafts = []
    for config in STRATEGY_CONFIGS:
        fmt = config["format"]
        label = config["label"]
        instruction = config["instruction"]

        prompt = f"""Generate a {label.upper()} strategy cold email for {company_profile.name}.

Strategy instruction: {instruction}

Research context:
{context}

Respond with ONLY valid JSON (no markdown, no extra text):
{{
  "format_type": "{fmt.value}",
  "subject": "compelling subject line under 60 chars",
  "body": "full email body under 150 words",
  "key_personalization_points": ["specific data point 1", "specific data point 2", "specific data point 3"],
  "predicted_response_rate": <integer 1-100 realistic open rate for this strategy>,
  "strategy_rationale": "1 sentence explaining why this strategy fits this company"
}}"""

        draft = await llm.analyze(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=prompt,
            response_model=OutreachDraft,
        )
        draft.format_type = fmt.value
        drafts.append(draft)

    return drafts
