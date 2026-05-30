"""SalesPilot AI — LLM Service with Gemini → Groq automatic fallback."""

import json
import asyncio
from typing import Type, TypeVar
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import get_settings

T = TypeVar("T", bound=BaseModel)

EXAMPLES = {
    "CompanyProfile": '{"name":"Acme Corp","domain":"acme.com","industry":"Enterprise Software","description":"Acme Corp is a leading provider of...","employee_count":"500","revenue_estimate":"$50M ARR","headquarters":"San Francisco, CA","founded":"2015","business_model":"SaaS subscription","leadership":[{"name":"Jane Doe","title":"CEO"}],"key_facts":["Series C funded","500+ enterprise customers"]}',
    "HiringSignals": '{"total_open_roles":45,"departments_hiring":["Engineering","Sales","Marketing"],"key_roles":[{"title":"Senior SDR","department":"Sales"}],"hiring_velocity":"aggressive","growth_intent_flags":["8 SDR hires signals sales expansion"],"summary":"Active hiring across sales and engineering..."}',
    "FundingNews": '{"events":[{"date":"2024-03","title":"Series C Funding","type":"funding","amount":"$100M","source":"TechCrunch"}],"total_funding":"$180M","latest_round":"Series C - $100M","investors":["Sequoia","a16z"],"growth_signals":["Expanding to EMEA"],"summary":"Recently raised Series C..."}',
    "TechStack": '{"current_tools":[{"name":"Salesforce","category":"CRM"},{"name":"AWS","category":"Cloud"}],"platforms":["AWS","Kubernetes"],"potential_gaps":["No data analytics platform"],"summary":"Modern cloud stack with gaps in analytics..."}',
    "PainPoints": '{"pain_points":[{"category":"Operations","description":"Slow onboarding process","severity":"high","source":"Glassdoor"}],"summary":"Key frustrations around operations..."}',
    "CompetitorIntel": '{"current_vendors":[{"name":"Salesforce","category":"CRM","sentiment":"mixed"}],"pricing_frustrations":["Salesforce pricing too high"],"migration_signals":["Evaluating alternatives"],"displacement_opportunities":["CRM consolidation opportunity"],"summary":"Using Salesforce but frustrated with pricing..."}',
    "BuyingIntentScore": '{"overall_score":78,"confidence":"high","breakdown":[{"signal_name":"Funding signals","score":85,"weight":0.25,"weighted_score":21.25,"evidence":["Series C raised in 2024"]},{"signal_name":"Hiring signals","score":70,"weight":0.20,"weighted_score":14.0,"evidence":["45 open roles"]}],"top_reasons":["Recent funding provides budget","Aggressive sales hiring"],"summary":"Strong buying signals..."}',
    "OutreachDraft": '{"format_type":"enterprise","subject":"Optimizing Operations at Acme Corp","body":"Hi [Name],\\n\\nI noticed Acme Corp recently raised a Series C...","key_personalization_points":["Series C funding","45 open roles in sales"]}',
}


def _parse_response(content: str, response_model: Type[T]) -> T:
    """Parse LLM response string into a Pydantic model."""
    content = content.strip()
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:]).strip()
    try:
        data = json.loads(content)
        return response_model.model_validate(data)
    except Exception:
        # Try to extract JSON substring
        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            data = json.loads(content[start:end])
            return response_model.model_validate(data)
        raise


class LLMService:
    """Gemini primary → Groq fallback for all LLM calls."""

    def __init__(self):
        settings = get_settings()
        self.gemini = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=settings.google_api_key,
            temperature=0.3,
            max_output_tokens=4096,
        ) if settings.google_api_key else None

        self.groq = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            temperature=0.3,
            max_tokens=4096,
        ) if settings.groq_api_key else None

        if self.groq:
            print("   Groq fallback: ready (llama-3.3-70b)")

    def _build_messages(self, system_prompt: str, user_prompt: str, example: str):
        return [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
            HumanMessage(content=(
                f"\n\nRespond with ONLY a valid JSON object. No text before or after.\n"
                f"Use EXACTLY this format with real data:\n{example}"
            )),
        ]

    async def analyze(self, system_prompt: str, user_prompt: str, response_model: Type[T]) -> T:
        example = EXAMPLES.get(response_model.__name__, "{}")
        messages = self._build_messages(system_prompt, user_prompt, example)

        # Try Gemini first (with 1 retry on rate limit), then fall back to Groq
        providers = []
        if self.gemini:
            providers.append(("Gemini", self.gemini, True))   # True = retry on 429
        if self.groq:
            providers.append(("Groq", self.groq, False))

        for provider_name, llm, retry_on_ratelimit in providers:
            for attempt in range(2 if retry_on_ratelimit else 1):
                try:
                    response = await llm.ainvoke(messages)
                    result = _parse_response(response.content, response_model)
                    if provider_name != "Gemini":
                        print(f"[LLM] Used {provider_name} for {response_model.__name__}")
                    return result
                except Exception as e:
                    err = str(e)
                    if ("429" in err or "RESOURCE_EXHAUSTED" in err) and retry_on_ratelimit:
                        print(f"[LLM] Gemini rate limited → switching to Groq instantly...")
                        break  # Break retry loop → fall through to Groq immediately
                    elif attempt == 0 and retry_on_ratelimit:
                        continue
                    else:
                        print(f"[LLM] {provider_name} error: {e}")
                        break  # Try next provider

        print(f"[LLM] All providers failed for {response_model.__name__}, returning empty")
        return response_model()

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]

        providers = []
        if self.gemini:
            providers.append(("Gemini", self.gemini))
        if self.groq:
            providers.append(("Groq", self.groq))

        for provider_name, llm in providers:
            try:
                response = await llm.ainvoke(messages)
                return response.content.strip()
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print(f"[LLM] Gemini rate limited for text gen → trying Groq...")
                    continue
                print(f"[LLM] {provider_name} text error: {e}")
                continue
        return ""


_llm_service = None

def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
