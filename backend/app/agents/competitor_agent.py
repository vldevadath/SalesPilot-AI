"""SalesPilot AI — Competitor Agent. Maps competitive landscape."""

from app.models.schemas import CompetitorIntel
from app.services.brightdata import get_bright_data_service
from app.services.llm import get_llm_service

SYSTEM_PROMPT = """You are an expert competitive intelligence analyst for B2B sales.
Identify current vendors, competitor products, pricing frustrations, and displacement opportunities.
If no web data is provided, use your knowledge of the company's competitive landscape."""


async def run_competitor_agent(company_name: str) -> CompetitorIntel:
    bd = get_bright_data_service()
    llm = get_llm_service()

    raw_data = ""
    try:
        comp = await bd.search_google(f"{company_name} competitors alternatives vs comparison")
        raw_data += _fmt(comp)
    except Exception as e:
        print(f"[Competitor] Web data unavailable: {e}")

    prompt = f"Analyze the competitive landscape for '{company_name}'."
    if raw_data.strip():
        prompt += f"\n\nCompetitive data:\n{raw_data}"
    else:
        prompt += "\n\nNo web data available — use your knowledge of this company's competitors and market position."

    return await llm.analyze(system_prompt=SYSTEM_PROMPT, user_prompt=prompt, response_model=CompetitorIntel)


def _fmt(results: dict) -> str:
    lines = []
    for item in results.get("organic", [])[:8]:
        lines.append(f"- {item.get('title', '')}: {item.get('description', item.get('snippet', ''))}")
    return "\n".join(lines) if lines else "No results found."
