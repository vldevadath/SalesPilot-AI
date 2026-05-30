"""SalesPilot AI — Hiring Agent. Analyzes recruitment signals."""

from app.models.schemas import HiringSignals
from app.services.brightdata import get_bright_data_service
from app.services.llm import get_llm_service

SYSTEM_PROMPT = """You are an expert hiring signal analyst for B2B sales intelligence.
Analyze hiring patterns to identify hiring velocity, expanding departments,
key roles, and growth intent flags. If no web data is provided, use your
knowledge of the company's known hiring and growth patterns."""


async def run_hiring_agent(company_name: str) -> HiringSignals:
    bd = get_bright_data_service()
    llm = get_llm_service()

    raw_data = ""
    try:
        jobs_search = await bd.search_google(f"{company_name} careers jobs open positions hiring 2025")
        raw_data += _format_results(jobs_search)
    except Exception as e:
        print(f"[Hiring] Web data unavailable: {e}")

    prompt = f"Analyze hiring signals and growth intent for '{company_name}'."
    if raw_data.strip():
        prompt += f"\n\nJob listing data:\n{raw_data}"
    else:
        prompt += "\n\nNo web data available — use your knowledge of this company's hiring patterns."

    return await llm.analyze(system_prompt=SYSTEM_PROMPT, user_prompt=prompt, response_model=HiringSignals)


def _format_results(results: dict) -> str:
    lines = []
    for item in results.get("organic", [])[:8]:
        title = item.get("title", "")
        snippet = item.get("description", item.get("snippet", ""))
        lines.append(f"- {title}: {snippet}")
    return "\n".join(lines) if lines else "No results found."
