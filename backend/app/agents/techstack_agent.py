"""SalesPilot AI — Tech Stack Agent. Detects technologies and platform gaps."""

from app.models.schemas import TechStack
from app.services.brightdata import get_bright_data_service
from app.services.llm import get_llm_service

SYSTEM_PROMPT = """You are an expert technology stack analyst for B2B sales intelligence.
Identify current tools, platforms, and potential technology gaps.
If no web data is provided, use your knowledge of the company's known tech stack."""


async def run_techstack_agent(company_name: str, domain: str = "") -> TechStack:
    bd = get_bright_data_service()
    llm = get_llm_service()

    raw_data = ""
    try:
        search = await bd.search_google(f"{company_name} tech stack technology tools platform")
        raw_data += _fmt(search)
        if domain:
            page = await bd.scrape_page(f"https://{domain}")
            if page:
                raw_data += f"\n\nWEBSITE:\n{page[:2000]}"
    except Exception as e:
        print(f"[TechStack] Web data unavailable: {e}")

    prompt = f"Analyze the technology stack for '{company_name}'."
    if raw_data.strip():
        prompt += f"\n\nTech data:\n{raw_data}"
    else:
        prompt += "\n\nNo web data available — use your knowledge of this company's known tech stack."

    return await llm.analyze(system_prompt=SYSTEM_PROMPT, user_prompt=prompt, response_model=TechStack)


def _fmt(results: dict) -> str:
    lines = []
    for item in results.get("organic", [])[:8]:
        lines.append(f"- {item.get('title', '')}: {item.get('description', item.get('snippet', ''))}")
    return "\n".join(lines) if lines else "No results found."
