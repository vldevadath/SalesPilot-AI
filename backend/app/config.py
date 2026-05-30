"""SalesPilot AI — Application Configuration."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # LLM Provider (Google Gemini - primary)
    google_api_key: str = ""

    # Groq - 2nd fallback
    groq_api_key: str = ""

    # Cerebras - 3rd fallback (fast, separate quota)
    cerebras_api_key: str = ""

    # OpenRouter - 4th fallback (free models)
    openrouter_api_key: str = ""

    # Bright Data ($250 Hackathon Credit)
    bright_data_api_token: str = ""
    bright_data_serp_zone: str = "serp"
    bright_data_web_unlocker_zone: str = "web_unlocker"

    # CRM (HubSpot Free Tier)
    hubspot_api_key: str = ""

    # Database
    database_url: str = "postgresql+asyncpg://salespilot:salespilot@localhost:5432/salespilot"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # App Settings
    app_env: str = "development"
    demo_mode: bool = True
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
