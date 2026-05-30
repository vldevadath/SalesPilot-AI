"""SalesPilot AI — Research Agent.

Gathers company overview, industry, employee size, revenue estimates,
leadership info, and business model using Bright Data + Gemini.
Falls back to LLM knowledge when web data is unavailable.
"""

from app.models.schemas import CompanyProfile
from app.services.brightdata import get_bright_data_service
from app.services.llm import get_llm_service


SYSTEM_PROMPT = """You are an expert B2B company research analyst. Given any available web data about a company,
extract a comprehensive company profile. If web data is limited, use your own knowledge to fill in
publicly known facts about the company. Be precise — only state things you are confident about.
For well-known companies, you should know their industry, HQ, approximate size, and business model."""


async def run_research_agent(company_name: str, domain: str | None = None) -> CompanyProfile:
    """Gather comprehensive company profile."""
    bd = get_bright_data_service()
    llm = get_llm_service()

    raw_data = ""
    try:
        search_results = await bd.search_google(
            f"{company_name} company overview about founded employees revenue"
        )
        raw_data += f"SEARCH RESULTS:\n{_format_search_results(search_results)}\n\n"

        if domain:
            website_content = await bd.scrape_page(f"https://{domain}")
            if website_content:
                raw_data += f"WEBSITE CONTENT:\n{website_content[:3000]}\n\n"
    except Exception as e:
        print(f"[Research] Web data unavailable: {e}")

    prompt = f"Create a comprehensive company profile for '{company_name}'."
    if raw_data.strip():
        prompt += f"\n\nAvailable web data:\n{raw_data}"
    else:
        prompt += "\n\nNo web data available — use your own knowledge of this company."

    profile = await llm.analyze(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=prompt,
        response_model=CompanyProfile,
    )
    profile.name = profile.name or company_name
    profile.domain = profile.domain or domain or ""
    return profile


def _format_search_results(results: dict) -> str:
    lines = []
    for item in results.get("organic", [])[:8]:
        title = item.get("title", "")
        snippet = item.get("description", item.get("snippet", ""))
        link = item.get("link", "")
        lines.append(f"- {title}\n  {snippet}\n  URL: {link}")
    return "\n".join(lines) if lines else "No results found."
