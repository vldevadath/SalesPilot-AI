"""SalesPilot AI — Research Agent.

Gathers company overview, industry, employee size, revenue estimates,
leadership info, and business model using Bright Data + LLM.
Also extracts GitHub activity, Glassdoor ratings, and LinkedIn signals
to power the multi-source intelligence dossier.
Falls back to LLM knowledge when web data is unavailable.
"""

from app.models.schemas import CompanyProfile
from app.services.brightdata import get_bright_data_service
from app.services.llm import get_llm_service


SYSTEM_PROMPT = """You are an expert B2B company research analyst. Given any available web data about a company,
extract a comprehensive company profile. If web data is limited, use your own knowledge to fill in
publicly known facts about the company. Be precise — only state things you are confident about.
For well-known companies, you should know their industry, HQ, approximate size, and business model.

Also extract these additional intelligence signals if available:
- glassdoor_rating: Glassdoor employee satisfaction score (1.0-5.0 scale), null if unknown
- github_stars: Total GitHub stars for main repository, null if not a tech company or unknown
- github_commits_30d: Approximate commits in the last 30 days on their main repo, null if unknown
- linkedin_employee_trend: LinkedIn employee growth trend e.g. "Growing +12% YoY", "Stable", "Declining", null if unknown

These signals power our multi-source intelligence feature and are critical for the hackathon demo."""


async def run_research_agent(company_name: str, domain: str | None = None) -> CompanyProfile:
    """Gather comprehensive company profile with multi-source intelligence signals."""
    bd = get_bright_data_service()
    llm = get_llm_service()

    raw_data = ""
    sources_used = []

    try:
        # Main web search via Bright Data
        search_results = await bd.search_google(
            f"{company_name} company overview about founded employees revenue headquarters"
        )
        raw_data += f"SEARCH RESULTS (Google via Bright Data):\n{_format_search_results(search_results)}\n\n"
        sources_used.append("Google Search (Bright Data)")

        if domain:
            website_content = await bd.scrape_page(f"https://{domain}")
            if website_content:
                raw_data += f"WEBSITE CONTENT (Bright Data Scraper):\n{website_content[:3000]}\n\n"
                sources_used.append("Company Website (Bright Data)")

        # Try to get LinkedIn/Glassdoor data via additional search
        try:
            linkedin_results = await bd.search_google(
                f"{company_name} site:linkedin.com employees OR glassdoor rating OR github stars"
            )
            linkedin_data = _format_search_results(linkedin_results)
            if linkedin_data and linkedin_data != "No results found.":
                raw_data += f"LINKEDIN/GLASSDOOR/GITHUB SIGNALS (Bright Data):\n{linkedin_data}\n\n"
                sources_used.append("LinkedIn (Bright Data)")
                sources_used.append("Glassdoor (Bright Data)")
        except Exception:
            pass

    except Exception as e:
        print(f"[Research] Web data unavailable: {e}")

    prompt = f"""Create a comprehensive company profile for '{company_name}'.

Include ALL standard fields PLUS these multi-source intelligence fields:
- glassdoor_rating (float 1.0-5.0 or null)
- github_stars (integer or null)
- github_commits_30d (integer or null)
- linkedin_employee_trend (string describing growth trend or null)
"""
    if raw_data.strip():
        prompt += f"\n\nAvailable web data from {len(sources_used)} Bright Data sources:\n{raw_data}"
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
