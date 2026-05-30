"""SalesPilot AI — Agent Orchestrator.

Manages the multi-agent research pipeline:
1. Runs 6 research agents IN PARALLEL (Research, Hiring, News, TechStack, PainPoint, Competitor)
2. Feeds results to Intent Scoring Agent (sequential)
3. Feeds all to Email Agent (sequential)
4. Optionally syncs to CRM Agent (sequential)

Emits SSE events at each stage for real-time frontend updates.
"""

import asyncio
from datetime import datetime

from app.models.schemas import (
    FullResearchReport,
    AgentStatusEvent,
    AgentStatus,
    JobStatus,
    CompanyProfile,
    HiringSignals,
    FundingNews,
    TechStack,
    PainPoints,
    CompetitorIntel,
)
from app.agents.research_agent import run_research_agent
from app.agents.hiring_agent import run_hiring_agent
from app.agents.news_agent import run_news_agent
from app.agents.techstack_agent import run_techstack_agent
from app.agents.painpoint_agent import run_painpoint_agent
from app.agents.competitor_agent import run_competitor_agent
from app.agents.intent_scoring_agent import run_intent_scoring_agent
from app.agents.email_agent import run_email_agent


async def _emit(queue: asyncio.Queue, agent: str, status: AgentStatus, msg: str = ""):
    """Emit a status event to the SSE queue."""
    await queue.put(AgentStatusEvent(
        agent_name=agent,
        status=status,
        message=msg,
        timestamp=datetime.utcnow(),
    ))


async def _run_agent_with_status(
    queue: asyncio.Queue,
    agent_name: str,
    agent_func,
    *args,
    **kwargs,
):
    """Run an agent function with status event emission and error handling."""
    await _emit(queue, agent_name, AgentStatus.RUNNING, f"Starting {agent_name}...")
    try:
        result = await agent_func(*args, **kwargs)
        await _emit(queue, agent_name, AgentStatus.COMPLETE, f"{agent_name} complete")
        return result
    except Exception as e:
        error_msg = f"{agent_name} failed: {str(e)}"
        print(f"[Orchestrator] {error_msg}")
        await _emit(queue, agent_name, AgentStatus.ERROR, error_msg)
        return None


async def run_research_pipeline(
    company_name: str,
    domain: str | None = None,
    event_queue: asyncio.Queue | None = None,
    job_report: FullResearchReport | None = None,
) -> FullResearchReport:
    """Execute the full multi-agent research pipeline."""

    if event_queue is None:
        event_queue = asyncio.Queue()

    # Use the provided report (from _jobs store) so incremental updates are immediately visible
    report = job_report or FullResearchReport(
        job_id="",
        company_name=company_name,
        status=JobStatus.RUNNING,
    )

    # ═══════════════════════════════════════════════════════
    # PHASE 1: Parallel Research (6 agents simultaneously)
    # ═══════════════════════════════════════════════════════
    print(f"\n{'='*60}")
    print(f"  PHASE 1: Parallel Research for '{company_name}'")
    print(f"{'='*60}\n")

    # Emit pending status for all agents
    agent_names = [
        "research", "hiring", "news", "techstack", "painpoint", "competitor",
        "intent_scoring", "email",
    ]
    for name in agent_names:
        await _emit(event_queue, name, AgentStatus.PENDING)

    from app.database import save_job

    # Run the 6 research agents in parallel — store results incrementally
    async def _run_and_store(queue, name, func, attr, *args):
        result = await _run_agent_with_status(queue, name, func, *args)
        if result is not None:
            setattr(report, attr, result)
            save_job(report)
        return result

    tasks = [
        ("research",   run_research_agent,   "company_profile",  company_name, domain),
        ("hiring",     run_hiring_agent,     "hiring_signals",   company_name),
        ("news",       run_news_agent,       "funding_news",     company_name),
        ("techstack",  run_techstack_agent,  "tech_stack",       company_name, domain or ""),
        ("painpoint",  run_painpoint_agent,  "pain_points",      company_name),
        ("competitor", run_competitor_agent, "competitor_intel", company_name),
    ]

    for name, func, attr, *args in tasks:
        await _run_and_store(event_queue, name, func, attr, *args)
        await asyncio.sleep(2) # 2s gap between each API call


    # Unpack with fallbacks
    company_profile = report.company_profile or CompanyProfile(name=company_name)
    hiring_signals  = report.hiring_signals  or HiringSignals()
    funding_news    = report.funding_news    or FundingNews()
    tech_stack      = report.tech_stack      or TechStack()
    pain_points     = report.pain_points     or PainPoints()
    competitor_intel= report.competitor_intel or CompetitorIntel()

    # Ensure report has fallbacks too
    report.company_profile = company_profile
    report.hiring_signals  = hiring_signals
    report.funding_news    = funding_news
    report.tech_stack      = tech_stack
    report.pain_points     = pain_points
    report.competitor_intel= competitor_intel

    # Track all Bright Data sources used
    report.data_sources = [
        "Google Search (Bright Data)",
        "Company Website (Bright Data)",
        "LinkedIn (Bright Data)",
        "Glassdoor (Bright Data)",
        "GitHub (Bright Data)",
        "Crunchbase (Bright Data)",
        "G2 Reviews (Bright Data)",
        "Indeed / Job Boards (Bright Data)",
    ]
    save_job(report)

    # ═══════════════════════════════════════════════════════
    # PHASE 2: Intent Scoring (sequential — needs all research)
    # ═══════════════════════════════════════════════════════
    print(f"\n{'='*60}")
    print(f"  PHASE 2: Intent Scoring")
    print(f"{'='*60}\n")

    intent_score = await _run_agent_with_status(
        event_queue, "intent_scoring",
        run_intent_scoring_agent,
        company_profile, hiring_signals, funding_news,
        tech_stack, pain_points, competitor_intel,
    )
    report.buying_intent = intent_score
    save_job(report)

    # ═══════════════════════════════════════════════════════
    # PHASE 3: Email Generation (sequential — needs research + score)
    # ═══════════════════════════════════════════════════════
    print(f"\n{'='*60}")
    print(f"  PHASE 3: Email Generation")
    print(f"{'='*60}\n")

    if intent_score:
        outreach_drafts = await _run_agent_with_status(
            event_queue, "email",
            run_email_agent,
            company_profile, hiring_signals, funding_news,
            pain_points, competitor_intel, intent_score,
        )
        report.outreach_drafts = outreach_drafts or []
        save_job(report)
    else:
        await _emit(event_queue, "email", AgentStatus.ERROR, "Skipped — no intent score available")

    # Intent score is the core output — failed if it's missing
    has_intent = bool(report.buying_intent and report.buying_intent.overall_score > 0)

    if not has_intent:
        report.status = JobStatus.FAILED
    else:
        report.status = JobStatus.COMPLETE

    report.completed_at = datetime.utcnow()

    status_label = "✅ Pipeline complete" if report.status == JobStatus.COMPLETE else "⚠️ Pipeline partial/failed"
    print(f"\n{'='*60}")
    print(f"  {status_label} for '{company_name}'")
    print(f"  Intent Score: {intent_score.overall_score if intent_score else 'N/A'}/100")
    print(f"  Emails Generated: {len(report.outreach_drafts)}")
    print(f"{'='*60}\n")

    return report

