"""SalesPilot AI — Intent Scoring Agent.

AI-powered weighted buying intent score from funding, hiring, tech adoption,
competitor dissatisfaction, and expansion signals. Fully explainable.
"""

import json
from app.models.schemas import (
    BuyingIntentScore,
    SignalBreakdown,
    CompanyProfile,
    HiringSignals,
    FundingNews,
    TechStack,
    PainPoints,
    CompetitorIntel,
)
from app.services.llm import get_llm_service


SYSTEM_PROMPT = """You are an expert B2B buying intent scoring analyst. Given research data from
multiple intelligence sources about a company, calculate a buying intent score from 0 to 100.

Use this weighted scoring framework:
- Funding signals (25%): Recent funding = budget available, higher score
- Hiring signals (20%): Active hiring, especially sales/ops roles = growth phase
- Tech adoption gaps (20%): Missing tools or outdated stack = opportunity
- Competitor dissatisfaction (15%): Pricing complaints, migration signals = displacement chance
- Growth/expansion signals (10%): New markets, products, partnerships = budget allocation
- Pain points severity (10%): Operational frustrations = urgent need

For EACH signal category, provide:
- A score from 0-100
- The weight (as decimal, e.g. 0.25)
- The weighted_score (score * weight)
- Specific evidence bullets from the research data

The overall_score should be the sum of all weighted_scores, rounded to nearest integer.
Set confidence to "high" if 4+ signals have strong evidence, "medium" for 2-3, "low" for 0-1.
Provide top_reasons as 3-5 human-readable sentences explaining why this score.

CRITICAL: Be transparent and explainable. This is NOT a black box — judges need to see the reasoning."""


async def run_intent_scoring_agent(
    company_profile: CompanyProfile,
    hiring_signals: HiringSignals,
    funding_news: FundingNews,
    tech_stack: TechStack,
    pain_points: PainPoints,
    competitor_intel: CompetitorIntel,
) -> BuyingIntentScore:
    """Calculate explainable buying intent score from all research signals."""
    llm = get_llm_service()

    # Compile all research into a structured summary
    research_summary = f"""
COMPANY PROFILE:
- Name: {company_profile.name}
- Industry: {company_profile.industry}
- Employees: {company_profile.employee_count}
- Revenue: {company_profile.revenue_estimate}
- Business Model: {company_profile.business_model}
- Key Facts: {', '.join(company_profile.key_facts)}

HIRING SIGNALS:
- Total Open Roles: {hiring_signals.total_open_roles}
- Departments Hiring: {', '.join(hiring_signals.departments_hiring)}
- Hiring Velocity: {hiring_signals.hiring_velocity}
- Growth Flags: {', '.join(hiring_signals.growth_intent_flags)}
- Summary: {hiring_signals.summary}

FUNDING & NEWS:
- Total Funding: {funding_news.total_funding}
- Latest Round: {funding_news.latest_round}
- Investors: {', '.join(funding_news.investors)}
- Growth Signals: {', '.join(funding_news.growth_signals)}
- Summary: {funding_news.summary}

TECH STACK:
- Current Tools: {json.dumps(tech_stack.current_tools)}
- Platforms: {', '.join(tech_stack.platforms)}
- Potential Gaps: {', '.join(tech_stack.potential_gaps)}
- Summary: {tech_stack.summary}

PAIN POINTS:
- Pain Points: {json.dumps(pain_points.pain_points)}
- Summary: {pain_points.summary}

COMPETITOR INTEL:
- Current Vendors: {json.dumps(competitor_intel.current_vendors)}
- Pricing Frustrations: {', '.join(competitor_intel.pricing_frustrations)}
- Migration Signals: {', '.join(competitor_intel.migration_signals)}
- Displacement Opportunities: {', '.join(competitor_intel.displacement_opportunities)}
- Summary: {competitor_intel.summary}
"""

    return await llm.analyze(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Calculate the buying intent score for this company:\n\n{research_summary}",
        response_model=BuyingIntentScore,
    )
