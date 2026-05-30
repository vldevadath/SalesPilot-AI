/**
 * SalesPilot AI — API Client
 * Maps directly to backend FullResearchReport schema
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ─── Types matching backend schemas exactly ─── */

export interface ResearchRequest {
  company_name: string;
  domain?: string;
}

export interface AgentStatusEvent {
  agent_name: string;
  status: "pending" | "running" | "complete" | "error";
  message: string;
  timestamp: string;
}

export interface CompanyProfile {
  name: string;
  domain: string;
  industry: string;
  description: string;
  employee_count: string | null;
  revenue_estimate: string | null;
  headquarters: string | null;
  founded: string | null;
  business_model: string | null;
  leadership: { name?: string; title?: string }[];
  key_facts: string[];
}

export interface HiringSignals {
  total_open_roles: number;
  departments_hiring: string[];
  key_roles: { title?: string; department?: string }[];
  hiring_velocity: string;
  growth_intent_flags: string[];
  summary: string;
}

export interface FundingNews {
  events: { date?: string; title?: string; type?: string; amount?: string; source?: string }[];
  total_funding: string | null;
  latest_round: string | null;
  investors: string[];
  growth_signals: string[];
  summary: string;
}

export interface TechStack {
  current_tools: { name?: string; category?: string }[];
  platforms: string[];
  potential_gaps: string[];
  summary: string;
}

export interface PainPoints {
  pain_points: { category?: string; description?: string; severity?: string; source?: string }[];
  summary: string;
}

export interface CompetitorIntel {
  current_vendors: { name?: string; category?: string; sentiment?: string }[];
  pricing_frustrations: string[];
  migration_signals: string[];
  displacement_opportunities: string[];
  summary: string;
}

export interface SignalBreakdown {
  signal_name: string;
  score: number;
  weight: number;
  weighted_score: number;
  evidence: string[];
}

export interface BuyingIntentScore {
  overall_score: number;
  confidence: string;
  breakdown: SignalBreakdown[];
  top_reasons: string[];
  summary: string;
}

export interface OutreachDraft {
  format_type: string;
  subject: string;
  body: string;
  key_personalization_points: string[];
}

export interface FullResearchReport {
  job_id: string;
  company_name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  company_profile: CompanyProfile | null;
  hiring_signals: HiringSignals | null;
  funding_news: FundingNews | null;
  tech_stack: TechStack | null;
  pain_points: PainPoints | null;
  competitor_intel: CompetitorIntel | null;
  buying_intent: BuyingIntentScore | null;
  outreach_drafts: OutreachDraft[];
  crm_synced: boolean;
}

export interface DimensionComparison {
  dimension: string;
  company_a_value: string;
  company_b_value: string;
  winner: "a" | "b" | "tie";
  rationale: string;
}

export interface ComparisonReport {
  company_a: string;
  company_b: string;
  winner: "a" | "b";
  winner_company_name: string;
  confidence: string;
  win_margin: string;
  executive_summary: string;
  dimensions: DimensionComparison[];
  top_reasons_winner: string[];
  top_risks_winner: string[];
  recommended_action: string;
  score_a: number;
  score_b: number;
}

/* ─── API calls ─── */

export async function startResearch(data: ResearchRequest) {
  const res = await fetch(`${API_BASE}/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  return res.json();
}

export async function getResearchResults(jobId: string): Promise<FullResearchReport> {
  const res = await fetch(`${API_BASE}/research/${jobId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Not found: ${res.statusText}`);
  return res.json();
}

export async function getResearchHistory(): Promise<{ job_id: string; company_name: string; status: string; created_at: string; intent_score: number | null }[]> {
  const res = await fetch(`${API_BASE}/research`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function syncToCRM(jobId: string) {
  const res = await fetch(`${API_BASE}/crm/sync/${jobId}`, { method: "POST" });
  if (!res.ok) throw new Error(`CRM sync failed`);
  return res.json();
}

export function streamResearch(
  jobId: string,
  onEvent: (e: AgentStatusEvent) => void,
  onComplete: () => void,
  onError: (msg: string) => void
): EventSource {
  const es = new EventSource(`${API_BASE}/research/${jobId}/stream`);
  es.addEventListener("agent_status", (e) => {
    try {
      const data: AgentStatusEvent = JSON.parse(e.data);
      onEvent(data);
      if (data.agent_name === "pipeline" && (data.status === "complete" || data.status === "error")) {
        es.close();
        data.status === "complete" ? onComplete() : onError(data.message);
      }
    } catch { /* skip parse errors */ }
  });
  es.onerror = () => { es.close(); onError("Connection lost"); };
  return es;
}

export async function compareCompanies(jobIdA: string, jobIdB: string): Promise<ComparisonReport> {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id_a: jobIdA, job_id_b: jobIdB }),
  });
  if (!res.ok) throw new Error(`Compare failed: ${res.statusText}`);
  return res.json();
}
