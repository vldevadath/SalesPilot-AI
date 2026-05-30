"""SalesPilot AI — Pydantic schemas for all data models."""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime
from enum import Enum


# ─── Enums ────────────────────────────────────────────────

class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    ERROR = "error"


class OutreachFormat(str, Enum):
    ENTERPRISE = "enterprise"
    STARTUP = "startup"
    CONSULTATIVE = "consultative"
    CHALLENGER = "challenger"


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETE = "complete"
    FAILED = "failed"


# ─── Request Models ──────────────────────────────────────

class CompanyResearchRequest(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    domain: Optional[str] = Field(None)


# ─── Agent Output Models ─────────────────────────────────

class CompanyProfile(BaseModel):
    name: str = ""
    domain: str = ""
    industry: str = ""
    description: str = ""
    employee_count: Optional[str] = None
    revenue_estimate: Optional[str] = None
    headquarters: Optional[str] = None
    founded: Optional[str] = None
    business_model: Optional[str] = None
    leadership: list[Any] = Field(default_factory=list)
    key_facts: list[str] = Field(default_factory=list)

    @field_validator("employee_count", "revenue_estimate", "headquarters", "founded", "business_model", mode="before")
    @classmethod
    def coerce_to_str(cls, v):
        if v is None:
            return None
        return str(v)


class HiringSignals(BaseModel):
    total_open_roles: int = 0
    departments_hiring: list[str] = Field(default_factory=list)
    key_roles: list[Any] = Field(default_factory=list)
    hiring_velocity: str = ""
    growth_intent_flags: list[str] = Field(default_factory=list)
    summary: str = ""

    @field_validator("total_open_roles", mode="before")
    @classmethod
    def coerce_int(cls, v):
        try:
            return int(v)
        except (ValueError, TypeError):
            return 0


class FundingNews(BaseModel):
    events: list[Any] = Field(default_factory=list)
    total_funding: Optional[str] = None
    latest_round: Optional[str] = None
    investors: list[str] = Field(default_factory=list)
    growth_signals: list[str] = Field(default_factory=list)
    summary: str = ""

    @field_validator("latest_round", "total_funding", mode="before")
    @classmethod
    def coerce_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, dict):
            return str(v.get("type", v.get("name", str(v))))
        return str(v)


class TechStack(BaseModel):
    current_tools: list[Any] = Field(default_factory=list)
    platforms: list[str] = Field(default_factory=list)
    potential_gaps: list[str] = Field(default_factory=list)
    summary: str = ""

    @field_validator("current_tools", mode="before")
    @classmethod
    def normalize_tools(cls, v):
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if isinstance(item, str):
                result.append({"name": item, "category": ""})
            elif isinstance(item, dict):
                result.append(item)
        return result

    @field_validator("platforms", "potential_gaps", mode="before")
    @classmethod
    def normalize_str_list(cls, v):
        if not isinstance(v, list):
            return []
        return [str(x) for x in v]


class PainPoints(BaseModel):
    pain_points: list[Any] = Field(default_factory=list)
    summary: str = ""

    @field_validator("pain_points", mode="before")
    @classmethod
    def normalize_pains(cls, v):
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if isinstance(item, str):
                result.append({"category": "", "description": item, "severity": "medium", "source": ""})
            elif isinstance(item, dict):
                result.append(item)
        return result


class CompetitorIntel(BaseModel):
    current_vendors: list[Any] = Field(default_factory=list)
    pricing_frustrations: list[str] = Field(default_factory=list)
    migration_signals: list[str] = Field(default_factory=list)
    displacement_opportunities: list[str] = Field(default_factory=list)
    summary: str = ""


# ─── Scoring & Outreach Models ───────────────────────────

class SignalBreakdown(BaseModel):
    signal_name: str = ""
    score: int = Field(default=0, ge=0, le=100)
    weight: float = 0.0
    weighted_score: float = 0.0
    evidence: list[str] = Field(default_factory=list)

    @field_validator("score", mode="before")
    @classmethod
    def coerce_score(cls, v):
        try:
            return max(0, min(100, int(v)))
        except (ValueError, TypeError):
            return 0

    @field_validator("weight", "weighted_score", mode="before")
    @classmethod
    def coerce_float(cls, v):
        try:
            return float(v)
        except (ValueError, TypeError):
            return 0.0


class BuyingIntentScore(BaseModel):
    overall_score: int = Field(default=0, ge=0, le=100)
    confidence: str = ""
    breakdown: list[Any] = Field(default_factory=list)
    top_reasons: list[str] = Field(default_factory=list)
    summary: str = ""

    @field_validator("overall_score", mode="before")
    @classmethod
    def coerce_score(cls, v):
        try:
            return max(0, min(100, int(v)))
        except (ValueError, TypeError):
            return 0

    @field_validator("breakdown", mode="before")
    @classmethod
    def normalize_breakdown(cls, v):
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if isinstance(item, dict):
                # Normalize field names — LLM sometimes uses 'category' instead of 'signal_name'
                normalized = {
                    "signal_name": item.get("signal_name", item.get("category", item.get("name", "Unknown"))),
                    "score": item.get("score", 0),
                    "weight": item.get("weight", 0.0),
                    "weighted_score": item.get("weighted_score", 0.0),
                    "evidence": item.get("evidence", []),
                }
                result.append(normalized)
        return result


class OutreachDraft(BaseModel):
    format_type: str = ""
    subject: str = ""
    body: str = ""
    key_personalization_points: list[str] = Field(default_factory=list)

    @field_validator("format_type", mode="before")
    @classmethod
    def coerce_format(cls, v):
        if isinstance(v, str):
            return v.lower()
        return str(v)


# ─── Aggregated Report ───────────────────────────────────

class FullResearchReport(BaseModel):
    job_id: str
    company_name: str
    status: JobStatus = JobStatus.QUEUED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    company_profile: Optional[CompanyProfile] = None
    hiring_signals: Optional[HiringSignals] = None
    funding_news: Optional[FundingNews] = None
    tech_stack: Optional[TechStack] = None
    pain_points: Optional[PainPoints] = None
    competitor_intel: Optional[CompetitorIntel] = None
    buying_intent: Optional[BuyingIntentScore] = None
    outreach_drafts: list[OutreachDraft] = Field(default_factory=list)

    crm_synced: bool = False
    crm_record_id: Optional[str] = None


# ─── SSE Status Events ───────────────────────────────────

class AgentStatusEvent(BaseModel):
    agent_name: str
    status: AgentStatus
    message: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ResearchStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    agent_statuses: dict[str, AgentStatus] = Field(default_factory=dict)
    report: Optional[FullResearchReport] = None
