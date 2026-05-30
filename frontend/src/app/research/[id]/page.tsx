"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getResearchResults, streamResearch, syncToCRM,
  type FullResearchReport, type AgentStatusEvent,
} from "@/lib/api";

const AGENTS = [
  { key: "research", label: "Company Profile" },
  { key: "hiring", label: "Hiring Signals" },
  { key: "news", label: "News & Funding" },
  { key: "techstack", label: "Tech Stack" },
  { key: "painpoint", label: "Pain Points" },
  { key: "competitor", label: "Competitors" },
  { key: "intent_scoring", label: "Intent Scoring" },
  { key: "email", label: "Outreach Drafts" },
  { key: "crm", label: "CRM Sync" },
];

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [phase, setPhase] = useState<"pipeline" | "results">("pipeline");
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [results, setResults] = useState<FullResearchReport | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    getResearchResults(jobId).then((data) => {
      if (data.status === "complete" || data.status === "failed") {
        // Job done — show results directly with all agents marked complete
        setStatuses(deriveStatuses(data));
        setResults(data);
        setPhase("results");
      } else {
        // Job still running — hydrate statuses from existing data, then listen for updates
        setStatuses(deriveStatuses(data));
        connectSSE();
      }
    }).catch(() => connectSSE());

    function connectSSE() {
      esRef.current = streamResearch(jobId,
        (e: AgentStatusEvent) => setStatuses(p => ({ ...p, [e.agent_name]: e.status })),
        () => getResearchResults(jobId).then(d => { setResults(d); setPhase("results"); }),
        (err: string) => console.error(err),
      );
    }
    return () => { esRef.current?.close(); };
  }, [jobId]);

  /** Derive completed agent statuses from what's already in the report data. */
  function deriveStatuses(data: FullResearchReport): Record<string, string> {
    const s: Record<string, string> = {};
    if (data.company_profile != null) s["research"] = "complete";
    if (data.hiring_signals != null) s["hiring"] = "complete";
    if (data.funding_news != null) s["news"] = "complete";
    if (data.tech_stack != null) s["techstack"] = "complete";
    if (data.pain_points != null) s["painpoint"] = "complete";
    if (data.competitor_intel != null) s["competitor"] = "complete";
    if (data.buying_intent != null) s["intent_scoring"] = "complete";
    if (data.outreach_drafts?.length > 0) s["email"] = "complete";
    if (data.crm_synced) s["crm"] = "complete";
    return s;
  }


  const handleCopy = useCallback(() => {
    if (!results?.outreach_drafts?.[activeTab]) return;
    const d = results.outreach_drafts[activeTab];
    navigator.clipboard.writeText(`Subject: ${d.subject}\n\n${d.body}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, [results, activeTab]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try { await syncToCRM(jobId); } catch { /* ok */ }
    setSyncing(false);
  }, [jobId]);

  const done = Object.values(statuses).filter(s => s === "complete").length;

  /* ─── PIPELINE ─── */
  if (phase === "pipeline") {
    return (
      <Shell onBack={() => router.push("/")}>
        <div className="w-full max-w-xl mx-auto pt-16">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-semibold text-[#e5e5e5] tracking-tight">Deploying agents...</h1>
            <span className="text-xs text-[#888]">{done}/{AGENTS.length}</span>
          </div>
          <div className="h-0.5 w-full bg-[#222] rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-[#e5a00d] rounded-full transition-all duration-700" style={{ width: `${(done / AGENTS.length) * 100}%` }} />
          </div>
          <div className="space-y-px">
            {AGENTS.map((a) => {
              const s = statuses[a.key] || "pending";
              return (
                <div key={a.key} className={`flex items-center justify-between py-2.5 px-3 rounded text-sm ${s === "running" ? "bg-[rgba(229,160,13,0.05)]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[16px] ${s === "complete" ? "text-green-500" : s === "running" ? "text-[#e5a00d]" : "text-[#333]"}`}>
                      {s === "complete" ? "check_circle" : s === "running" ? "sync" : s === "error" ? "error" : "radio_button_unchecked"}
                    </span>
                    <span className={s === "pending" ? "text-[#555]" : "text-[#e5e5e5]"}>{a.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Shell>
    );
  }

  /* ─── RESULTS ─── */
  const r = results!;
  const cp = r.company_profile;
  const hi = r.hiring_signals;
  const fn = r.funding_news;
  const ts = r.tech_stack;
  const pp = r.pain_points;
  const ci = r.competitor_intel;
  const bi = r.buying_intent;
  const drafts = r.outreach_drafts;

  return (
    <Shell
      onBack={() => router.push("/")}
      right={
        <button onClick={handleSync} disabled={syncing || r.crm_synced}
          className="text-xs text-[#888] hover:text-[#e5e5e5] border border-[#222] hover:border-[#333] rounded px-3 py-1.5 transition-all disabled:opacity-40">
          {r.crm_synced ? "✓ Synced" : syncing ? "Syncing..." : "Sync to CRM"}
        </button>
      }
    >
      <div className="w-full max-w-4xl mx-auto pt-8 pb-16">
        {/* Failed banner */}
        {r.status === "failed" && (
          <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/15 rounded px-4 py-3 mb-6">
            <span className="material-symbols-outlined text-red-400 text-[18px]">error</span>
            <div>
              <p className="text-sm font-medium text-red-400">Research failed</p>
              <p className="text-xs text-[#555] mt-0.5">All LLM providers were rate-limited or exhausted. Try again in a few minutes.</p>
            </div>
            <button onClick={() => router.push("/")} className="ml-auto text-xs text-[#555] hover:text-[#888] transition-colors">Try again →</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#e5e5e5] tracking-tight mb-1">{r.company_name}</h1>
            <p className="text-sm text-[#888] flex flex-wrap gap-x-3">
              {cp?.industry && <span>{cp.industry}</span>}
              {cp?.headquarters && <span>· {cp.headquarters}</span>}
              {cp?.employee_count && <span>· {cp.employee_count} employees</span>}
            </p>
          </div>
          {bi && (
            <div className="flex items-center gap-3 bg-[#111] border border-[#222] rounded px-5 py-3 shrink-0">
              <div className="relative w-10 h-10">
                <div className="intent-gauge w-full h-full" style={{ "--value": bi.overall_score } as React.CSSProperties} />
                <div className="intent-gauge-inner absolute inset-[3px]" />
              </div>
              <div>
                <div className="text-[10px] text-[#888] uppercase tracking-wider font-medium">Intent</div>
                <div className="text-xl font-bold text-[#e5a00d]">{bi.overall_score}<span className="text-xs text-[#555] font-normal">/100</span></div>
              </div>
            </div>
          )}
        </div>

        {cp?.description && (
          <p className="text-sm text-[#888] leading-relaxed mb-8 max-w-3xl">{cp.description}</p>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {hi && hi.total_open_roles > 0 && (
            <Card title="Hiring Signals">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xl font-bold text-[#e5e5e5]">{hi.total_open_roles}</span>
                <span className="text-xs text-[#888]">open roles</span>
                {hi.hiring_velocity && <span className="text-[10px] text-[#e5a00d] bg-[rgba(229,160,13,0.08)] px-1.5 py-0.5 rounded ml-auto font-medium">{hi.hiring_velocity}</span>}
              </div>
              {hi.departments_hiring.length > 0 && <Tags items={hi.departments_hiring} />}
              {hi.summary && <p className="text-xs text-[#555] mt-2">{hi.summary}</p>}
            </Card>
          )}

          {fn && fn.events.length > 0 && (
            <Card title="News & Funding">
              {fn.latest_round && <p className="text-sm text-[#e5e5e5] font-medium mb-2">{fn.latest_round}{fn.total_funding && ` · ${fn.total_funding}`}</p>}
              <div className="space-y-2">
                {fn.events.slice(0, 3).map((ev, i) => (
                  <div key={i} className="border-l border-[#333] pl-3">
                    <div className="text-[10px] text-[#555] uppercase tracking-wider">{ev.date}</div>
                    <div className="text-sm text-[#e5e5e5]">{ev.title}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {ts && ts.current_tools.length > 0 && (
            <Card title="Tech Stack">
              <Tags items={ts.current_tools.map(t => t.name || "")} />
              {ts.potential_gaps.length > 0 && (
                <div className="mt-3 bg-red-500/5 border border-red-500/10 rounded p-2.5">
                  <span className="text-[10px] text-red-400 font-medium uppercase tracking-wider">Gap detected</span>
                  {ts.potential_gaps.map((g, i) => <p key={i} className="text-xs text-[#888] mt-1">{g}</p>)}
                </div>
              )}
            </Card>
          )}

          {pp && pp.pain_points.length > 0 && (
            <Card title="Pain Points">
              {pp.pain_points.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-[#e5e5e5]">{p.description || p.category}</span>
                  {p.severity && <Severity level={p.severity} />}
                </div>
              ))}
            </Card>
          )}

          {ci && ci.current_vendors.length > 0 && (
            <Card title="Competitors">
              {ci.current_vendors.map((v, i) => (
                <div key={i} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-[#e5e5e5]">{v.name}</span>
                  <span className="text-xs text-[#555]">{v.category}</span>
                </div>
              ))}
              {ci.displacement_opportunities.length > 0 && (
                <div className="mt-3 bg-[rgba(229,160,13,0.04)] border border-[rgba(229,160,13,0.12)] rounded p-2.5">
                  <span className="text-[10px] text-[#e5a00d] font-medium uppercase tracking-wider">Opportunity</span>
                  <p className="text-xs text-[#888] mt-1">{ci.displacement_opportunities[0]}</p>
                </div>
              )}
            </Card>
          )}

          {bi && bi.breakdown.length > 0 && (
            <Card title="Score Breakdown">
              {bi.breakdown.map((sig, i) => (
                <div key={sig.signal_name}>
                  <button onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex justify-between items-center py-1.5 text-sm text-left hover:bg-[#1a1a1a] rounded px-1 -mx-1 transition-colors">
                    <span className="text-[#e5e5e5]">{sig.signal_name}</span>
                    <span className="text-xs text-[#e5a00d] font-medium">+{sig.weighted_score.toFixed(0)}</span>
                  </button>
                  {expanded === i && sig.evidence.length > 0 && (
                    <ul className="pl-3 pb-1.5 space-y-0.5">
                      {sig.evidence.map((e, j) => <li key={j} className="text-xs text-[#555] list-disc">{e}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Outreach Drafts */}
        {drafts && drafts.length > 0 && (
          <div className="bg-[#111] border border-[#222] rounded overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
              <h3 className="text-sm font-medium text-[#e5e5e5]">Outreach Drafts</h3>
              <div className="flex gap-1">
                {drafts.map((d, i) => (
                  <button key={d.format_type} onClick={() => setActiveTab(i)}
                    className={`text-[11px] px-2 py-1 rounded transition-colors ${activeTab === i ? "bg-[rgba(229,160,13,0.08)] text-[#e5a00d] font-medium" : "text-[#555] hover:text-[#888]"}`}>
                    {d.format_type}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-2 border-b border-[#222] flex items-center justify-between">
              <div className="text-sm"><span className="text-[#555]">Subject: </span><span className="text-[#e5e5e5]">{drafts[activeTab].subject}</span></div>
              <button onClick={handleCopy} className="text-[#555] hover:text-[#e5e5e5] transition-colors text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-[#888] whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
              {drafts[activeTab].body}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ─── Shell ─── */
function Shell({ children, onBack, right }: { children: React.ReactNode; onBack: () => void; right?: React.ReactNode }) {
  return (
    <>
      <header className="h-14 border-b border-[#222] flex justify-between items-center px-8 sticky top-0 z-50 bg-[#0a0a0a]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-[#888] hover:text-[#e5e5e5] transition-colors flex items-center gap-1 text-sm">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
          </button>
        </div>
        {right && <div>{right}</div>}
      </header>
      <main className="flex-grow px-4 md:px-8">{children}</main>
    </>
  );
}

/* ─── Card ─── */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#222] rounded p-4">
      <h3 className="text-xs text-[#888] font-medium uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

/* ─── Tags ─── */
function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.filter(Boolean).map(t => (
        <span key={t} className="text-xs text-[#e5e5e5] bg-[#1a1a1a] border border-[#222] px-2 py-0.5 rounded">{t}</span>
      ))}
    </div>
  );
}

/* ─── Severity ─── */
function Severity({ level }: { level: string }) {
  const l = level.toLowerCase();
  const color = l === "high" || l === "severe" ? "text-red-400 bg-red-400/8" : l === "medium" || l === "moderate" ? "text-[#e5a00d] bg-[#e5a00d]/8" : "text-[#555] bg-[#1a1a1a]";
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${color}`}>{level}</span>;
}
