"""SalesPilot AI — Pain Point Agent. Extracts frustrations from reviews."""

from app.models.schemas import PainPoints
from app.services.brightdata import get_bright_data_service
from app.services.llm import get_llm_service

SYSTEM_PROMPT = """You are an expert at identifying business pain points for B2B sales intelligence.
Extract operational frustrations, challenges, and areas where a company might need solutions.
If no web data is provided, use your knowledge of common pain points for companies in this industry."""


async def run_painpoint_agent(company_name: str) -> PainPoints:
    bd = get_bright_data_service()
    llm = get_llm_service()

    raw_data = ""
    try:
        reviews = await bd.search_google(f"{company_name} challenges problems complaints reviews")
        raw_data += _fmt(reviews)
    except Exception as e:
        print(f"[PainPoint] Web data unavailable: {e}")

    prompt = f"Identify key pain points and challenges for '{company_name}'."
    if raw_data.strip():
        prompt += f"\n\nReview data:\n{raw_data}"
    else:
        prompt += "\n\nNo web data available — use your knowledge of this company and its industry challenges."

    return await llm.analyze(system_prompt=SYSTEM_PROMPT, user_prompt=prompt, response_model=PainPoints)


def _fmt(results: dict) -> str:
    lines = []
    for item in results.get("organic", [])[:8]:
        lines.append(f"- {item.get('title', '')}: {item.get('description', item.get('snippet', ''))}")
    return "\n".join(lines) if lines else "No results found."
