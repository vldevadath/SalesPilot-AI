"""SalesPilot AI — News Agent. Scans funding, press, and growth events."""

from app.models.schemas import FundingNews
from app.services.brightdata import get_bright_data_service
from app.services.llm import get_llm_service

SYSTEM_PROMPT = """You are an expert business news analyst for B2B sales intelligence.
Identify funding rounds, acquisitions, partnerships, and growth events.
If no web data is provided, use your knowledge of the company's known funding history and news."""


async def run_news_agent(company_name: str) -> FundingNews:
    bd = get_bright_data_service()
    llm = get_llm_service()

    raw_data = ""
    try:
        news = await bd.search_google(f"{company_name} funding round acquisition news 2024 2025")
        raw_data += _fmt(news)
    except Exception as e:
        print(f"[News] Web data unavailable: {e}")

    prompt = f"Analyze recent funding, news, and growth events for '{company_name}'."
    if raw_data.strip():
        prompt += f"\n\nNews data:\n{raw_data}"
    else:
        prompt += "\n\nNo web data available — use your knowledge of this company's funding and news history."

    return await llm.analyze(system_prompt=SYSTEM_PROMPT, user_prompt=prompt, response_model=FundingNews)


def _fmt(results: dict) -> str:
    lines = []
    for item in results.get("organic", [])[:8]:
        lines.append(f"- {item.get('title', '')}: {item.get('description', item.get('snippet', ''))}")
    return "\n".join(lines) if lines else "No results found."
