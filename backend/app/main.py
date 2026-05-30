"""SalesPilot AI — FastAPI Application Entry Point."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import research, crm


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — startup and shutdown events."""
    settings = get_settings()
    print(f"🚀 SalesPilot AI starting in {settings.app_env} mode")
    print(f"   Demo mode: {settings.demo_mode}")
    print(f"   Bright Data: {'configured' if settings.bright_data_api_token else 'NOT configured'}")
    print(f"   Gemini: {'configured' if settings.google_api_key else 'NOT configured'}")
    print(f"   HubSpot: {'configured' if settings.hubspot_api_key else 'NOT configured'}")
    yield
    print("👋 SalesPilot AI shutting down")


app = FastAPI(
    title="SalesPilot AI",
    description="Autonomous AI-Powered Account Research & Personalized Outreach Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(research.router, prefix="/api", tags=["Research"])
app.include_router(crm.router, prefix="/api", tags=["CRM"])
app.include_router(compare.router, prefix="/api", tags=["Compare"])


@app.get("/")
async def root():
    return {
        "name": "SalesPilot AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
