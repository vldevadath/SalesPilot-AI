"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getResearchResults, streamResearch, syncToCRM,
  type FullResearchReport, type AgentStatusEvent,
} from "@/lib/api";

const AGENTS = [
  { key: "research",       label: "Company Profile",   desc: "Gathered foundational data.", icon: "domain" },
  { key: "hiring",         label: "Hiring Signals",    desc: "Analyzed open roles and velocity.", icon: "work" },
  { key: "news",           label: "News & Funding",    desc: "Recent press and capital events.", icon: "newspaper" },
  { key: "techstack",      label: "Tech Stack",        desc: "Identified installed technologies.", icon: "memory" },
  { key: "painpoint",      label: "Pain Points",       desc: "Extracted common customer complaints.", icon: "warning" },
  { key: "competitor",     label: "Competitors",       desc: "Mapped primary market rivals.", icon: "compare_arrows" },
  { key: "intent_scoring", label: "Intent Scoring",    desc: "Calculating aggregate buyer intent...", icon: "lightbulb" },
  { key: "email",          label: "Outreach Drafts",   desc: "Awaiting intent data.", icon: "mail" },
  { key: "crm",            label: "CRM Sync",          desc: "Final step.", icon: "sync" },
];

/** Estimate deal value based on company size and funding */
function estimateDealValue(report: FullResearchReport): { low: number; high: number; tier: string } | null {
  const cp = report.company_profile;
  const fn = report.funding_news;
  if (!cp) return null;

  const empStr = cp.employee_count || "";
  const empNum = parseInt(empStr.replace(/[^0-9]/g, "")) || 0;
  const hasFunding = fn && (fn.total_funding || fn.latest_round);

  let low = 5000, high = 15000, tier = "SMB";

  if (empNum >= 5000 || empStr.includes("10,000+")) {
    low = 250000; high = 750000; tier = "Enterprise";
  } else if (empNum >= 1000) {
    low = 80000; high = 250000; tier = "Mid-Market";
  } else if (empNum >= 200) {
    low = 25000; high = 80000; tier = "Growth";
    if (hasFunding) { low = 40000; high = 120000; }
  } else if (empNum >= 50) {
    low = 10000; high = 35000; tier = "Startup";
    if (hasFunding) { low = 18000; high = 55000; }
  }

  return { low, high, tier };
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [phase, setPhase]       = useState<"pipeline" | "results">("pipeline");
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [results, setResults]   = useState<FullResearchReport | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied]     = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);
  const esRef = useRef<EventSource | null>(null);

  const [logs, setLogs] = useState<{time:string, text:string, type:string}[]>([]);

  useEffect(() => {
    getResearchResults(jobId).then((data) => {
      if (data.status === "complete" || data.status === "failed") {
        setStatuses(deriveStatuses(data));
        setResults(data);
        setPhase("results");
      } else {
        setStatuses(deriveStatuses(data));
        connectSSE();
      }
    }).catch(() => connectSSE());

    function connectSSE() {
      esRef.current = streamResearch(
        jobId,
        (e: AgentStatusEvent) => {
          setStatuses(p => ({ ...p, [e.agent_name]: e.status }));
          setLogs(prev => [...prev, {
            time: new Date().toLocaleTimeString([], { hour12: false }),
            text: `[sys] ${e.agent_name} ${e.status}`,
            type: e.status === 'complete' ? 'success' : e.status === 'running' ? 'running' : 'info'
          }]);
        },
        () => getResearchResults(jobId).then(d => { setResults(d); setPhase("results"); }),
        (err: string) => {
          console.error(err);
          getResearchResults(jobId).then(d => { setResults(d); setPhase("results"); });
        },
      );
    }
    return () => { esRef.current?.close(); };
  }, [jobId]);

  function deriveStatuses(data: FullResearchReport): Record<string, string> {
    const s: Record<string, string> = {};
    if (data.company_profile != null)      s["research"]       = "complete";
    if (data.hiring_signals != null)       s["hiring"]         = "complete";
    if (data.funding_news != null)         s["news"]           = "complete";
    if (data.tech_stack != null)           s["techstack"]      = "complete";
    if (data.pain_points != null)          s["painpoint"]      = "complete";
    if (data.competitor_intel != null)     s["competitor"]     = "complete";
    if (data.buying_intent != null)        s["intent_scoring"] = "complete";
    if (data.outreach_drafts?.length > 0)  s["email"]          = "complete";
    if (data.crm_synced)                   s["crm"]            = "complete";
    return s;
  }

  const handleCopy = useCallback(() => {
    if (!results?.outreach_drafts?.[activeTab]) return;
    const d = results.outreach_drafts[activeTab];
    navigator.clipboard.writeText(`Subject: ${d.subject}\n\n${d.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [results, activeTab]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try { await syncToCRM(jobId); } catch { /* ok */ }
    setSyncing(false);
  }, [jobId]);

  const done = Object.values(statuses).filter(s => s === "complete").length;

  /* ─── PIPELINE PHASE ─── */
  if (phase === "pipeline") {
    const progressPerc = Math.round((done / AGENTS.length) * 100);
    const strokeDashoffset = 283 - (283 * progressPerc) / 100;

    return (
      <div className="bg-[#0a0a0a] text-[#e5e5e5] font-['Inter',sans-serif] min-h-screen flex flex-col md:flex-row">
        {/* TopNavBar (Mobile Only) */}
        <nav className="md:hidden bg-[#0a0a0a] border-b border-[#1e1e1e] flex justify-between items-center w-full px-6 py-3 fixed top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-[#e5a00d] hover:brightness-110 transition-all duration-200">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#e5a00d] tracking-tight">SalesPilot AI</span>
          </div>
        </nav>

        {/* SideNavBar (Desktop Only) */}
        <aside className="hidden md:flex bg-[#111111] text-[#e5a00d] font-['Inter',sans-serif] text-sm font-medium border-r border-[#1e1e1e] flex-col fixed left-0 top-0 h-full w-64 pt-16 z-40">
          <div className="px-6 pb-6 flex items-center gap-3 border-b border-[#1e1e1e] mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#e5a00d] flex items-center justify-center text-black font-bold">SP</div>
            <div>
              <h2 className="font-['Space_Grotesk',sans-serif] text-lg font-black text-[#e5a00d] uppercase tracking-widest">SalesPilot</h2>
              <p className="text-xs text-[#888888]">Intelligence Engine</p>
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <button onClick={() => router.push("/")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#555555] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Back to Campaigns</span>
            </button>
            <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#e5a00d] border-r-2 border-[#e5a00d] bg-[#1a1a1a]" href="#">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
              <span>Pipeline</span>
            </a>
          </nav>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 md:ml-64 pt-20 md:pt-10 px-4 pb-20 w-full flex flex-col items-center">
          <div className="w-full max-w-3xl flex flex-col gap-8">
            <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 border border-[rgba(229,160,13,0.3)] bg-[rgba(229,160,13,0.1)] px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[#e5a00d] animate-spin text-[16px]">radar</span>
              <span className="text-[#e5a00d] font-['Geist_Mono',monospace] text-[10px] uppercase tracking-widest font-bold">INTELLIGENCE PIPELINE</span>
            </div>
            <h1 className="font-['Space_Grotesk',sans-serif] text-3xl md:text-4xl font-bold tracking-tight">Deploying AI Agents</h1>
            <p className="text-[#888888] text-sm max-w-md mx-auto">Autonomous research running across live data sources</p>
          </header>

          <section className="flex flex-col items-center justify-center pt-4">
            <div className="relative w-[120px] h-[120px]">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-[#1e1e1e]" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="4"></circle>
                <circle className="text-[#e5a00d] transition-all duration-1000 ease-out" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="283" strokeDashoffset={strokeDashoffset} strokeLinecap="round" strokeWidth="4"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline">
                  <span className="font-['Space_Grotesk',sans-serif] text-4xl font-bold text-[#e5a00d]">{done}</span>
                  <span className="text-[#555555] text-lg font-medium">/{AGENTS.length}</span>
                </div>
              </div>
            </div>
            <p className="text-[#888888] text-xs font-['Geist_Mono',monospace] mt-4 uppercase tracking-widest">Agents Complete</p>
          </section>

          <section className="flex flex-col gap-2">
            {AGENTS.map((a) => {
              const s = statuses[a.key] || "pending";
              const isDone = s === "complete";
              const isRunning = s === "running";

              if (isDone) {
                return (
                  <div key={a.key} className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl p-4 flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(34,197,94,0.1)] text-[#22c55e] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold">{a.label}</h3>
                        <p className="text-xs text-[#888888]">{a.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#22c55e]">
                      <span className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest font-bold">Done</span>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    </div>
                  </div>
                );
              } else if (isRunning) {
                return (
                  <div key={a.key} className="bg-[#0e0e0e] border border-[#e5a00d] rounded-xl p-4 flex items-center justify-between relative overflow-hidden shadow-[0_0_15px_rgba(229,160,13,0.1)]">
                    <div className="absolute inset-0 bg-[rgba(229,160,13,0.05)] animate-pulse pointer-events-none"></div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(229,160,13,0.2)] text-[#e5a00d] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#e5a00d]">{a.label}</h3>
                          <span className="w-2 h-2 rounded-full bg-[#e5a00d] animate-pulse"></span>
                        </div>
                        <p className="text-xs text-[#888888]">Processing...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[#e5a00d] relative z-10">
                      <span className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest font-bold">Running</span>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={a.key} className="bg-transparent border border-dashed border-[#1e1e1e] rounded-xl p-4 flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#555555] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-['Space_Grotesk',sans-serif] text-sm font-bold text-[#555555]">{a.label}</h3>
                        <p className="text-xs text-[#888888]">{a.desc}</p>
                      </div>
                    </div>
                    <div className="text-[#555555]">
                      <span className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest font-bold">Pending</span>
                    </div>
                  </div>
                );
              }
            })}
          </section>

          <section className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-4 font-['Geist_Mono',monospace] text-xs h-48 overflow-y-auto flex flex-col gap-1 shadow-inner relative">
            <div className="sticky top-0 bg-[#111111] pb-2 border-b border-[#1e1e1e] mb-2 flex items-center justify-between">
              <span className="text-[#555555] uppercase tracking-widest text-[10px] font-bold">System Logs</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1e1e1e]"></span>
                <span className="w-2 h-2 rounded-full bg-[#1e1e1e]"></span>
                <span className="w-2 h-2 rounded-full bg-[#1e1e1e]"></span>
              </div>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[#555555]">[{log.time}]</span>
                <span className={log.type === 'success' ? 'text-[#22c55e]' : log.type === 'running' ? 'text-[#e5a00d] font-bold' : 'text-[#888888]'}>
                  {log.text}
                </span>
              </div>
            ))}
            {logs.length === 0 && <div className="text-[#555555] flex gap-2"><span>[sys] Waiting for agent streams...</span></div>}
          </section>

          <footer className="text-center pt-8 border-t border-[#1e1e1e]">
            <p className="text-[#555555] text-[10px] font-['Geist_Mono',monospace] uppercase tracking-widest">
              Powered by Bright Data · NVIDIA NIM · Gemini · Groq
            </p>
          </footer>
          </div>
        </main>
      </div>
    );
  }

  /* ─── RESULTS PHASE ─── */
  const r       = results!;
  const cp      = r.company_profile;
  const hi      = r.hiring_signals;
  const fn      = r.funding_news;
  const ts      = r.tech_stack;
  const pp      = r.pain_points;
  const ci      = r.competitor_intel;
  const bi      = r.buying_intent;
  const drafts  = r.outreach_drafts;
  const deal    = estimateDealValue(r);

  const intentScore = bi?.overall_score || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-['Inter',sans-serif] text-[#e5e5e5] selection:bg-[rgba(229,160,13,0.1)] selection:text-[#e5a00d]">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1e1e1e] w-full">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-full mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-[#888888] hover:text-[#e5e5e5] transition-colors flex items-center justify-center p-2 rounded-lg hover:bg-[#1a1a1a] group">
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#e5a00d] flex items-center justify-center text-black font-bold text-[10px]">SP</div>
              <span className="text-xl font-['Space_Grotesk',sans-serif] font-bold text-[#e5a00d] tracking-tight">SalesPilot AI</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-[#e5e5e5] border border-[#1e1e1e] rounded-lg hover:bg-[#1a1a1a] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Export PDF
            </button>
            <button className="px-4 py-2 text-sm font-medium text-[#e5e5e5] border border-[#1e1e1e] rounded-lg hover:bg-[#1a1a1a] transition-all flex items-center gap-2" onClick={() => {navigator.clipboard.writeText(window.location.href); alert("Copied!")}}>
              <span className="material-symbols-outlined text-[18px]">link</span>
              Copy Link
            </button>
            <button 
              onClick={handleSync}
              disabled={syncing || r.crm_synced}
              className={`px-5 py-2 text-sm font-bold text-black rounded-lg transition-all flex items-center gap-2 ${r.crm_synced ? 'bg-[#22c55e]' : 'bg-[#e5a00d] hover:brightness-110 shadow-[0_0_15px_rgba(229,160,13,0.3)] hover:shadow-[0_0_20px_rgba(229,160,13,0.5)]'}`}
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              {r.crm_synced ? "Synced to HubSpot" : syncing ? "Pushing..." : "Push to HubSpot"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-[1600px] mx-auto px-6 pb-20">
        <section className="py-10 border-b border-[#1e1e1e] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="flex flex-col gap-4 flex-1">
            <div className="text-[#888888] font-['Geist_Mono',monospace] text-[11px] uppercase tracking-widest flex items-center gap-2">
              <span>SalesPilot Intelligence Report</span>
              <span className="text-[#333333]">•</span>
              <span>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-5">
              <h1 className="font-['Space_Grotesk',sans-serif] font-bold text-5xl tracking-tight text-white">{r.company_name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {cp?.industry && <span className="px-2.5 py-1 text-xs font-['Geist_Mono',monospace] bg-[#1a1a1a] border border-[#1e1e1e] rounded-md text-[#e5e5e5]">{cp.industry}</span>}
              {cp?.headquarters && <span className="px-2.5 py-1 text-xs font-['Geist_Mono',monospace] bg-[#1a1a1a] border border-[#1e1e1e] rounded-md text-[#e5e5e5] flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> {cp.headquarters}</span>}
              {cp?.employee_count && <span className="px-2.5 py-1 text-xs font-['Geist_Mono',monospace] bg-[#1a1a1a] border border-[#1e1e1e] rounded-md text-[#e5e5e5] flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">group</span> {cp.employee_count} employees</span>}
              {cp?.founded && <span className="px-2.5 py-1 text-xs font-['Geist_Mono',monospace] bg-[#1a1a1a] border border-[#1e1e1e] rounded-md text-[#e5e5e5]">Est. {cp.founded}</span>}
              {cp?.business_model && <span className="px-2.5 py-1 text-xs font-['Geist_Mono',monospace] bg-[#1a1a1a] border border-[#1e1e1e] rounded-md text-[#e5e5e5]">{cp.business_model}</span>}
            </div>
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
            {bi && (
              <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl p-5 flex flex-col items-center justify-center relative min-w-[200px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(34,197,94,0.05)] to-transparent pointer-events-none"></div>
                <div className="flex items-center justify-between w-full mb-2 z-10">
                  <span className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-widest text-[#888888]">Intent Score</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${intentScore >= 75 ? 'bg-[rgba(34,197,94,0.1)] text-[#22c55e] border border-[rgba(34,197,94,0.3)]' : 'bg-[rgba(229,160,13,0.1)] text-[#e5a00d] border border-[rgba(229,160,13,0.3)]'} rounded-full flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-[12px]">local_fire_department</span> {intentScore >= 75 ? 'Hot Lead' : 'Warm Lead'}
                  </span>
                </div>
                <div className="relative w-[140px] h-[70px] mt-4 z-10 flex items-end justify-center overflow-hidden">
                  <svg className="absolute top-0 left-0 w-full h-[140px]" viewBox="0 0 200 200" style={{ transformOrigin: 'center' }}>
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e1e1e" strokeLinecap="round" strokeWidth="12"></path>
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={intentScore >= 75 ? "#22c55e" : "#e5a00d"} strokeLinecap="round" strokeWidth="12" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - intentScore} style={{ transition: "stroke-dashoffset 1.5s ease-out" }}></path>
                  </svg>
                  <div className={`text-4xl font-['Space_Grotesk',sans-serif] font-bold mb-[-5px] ${intentScore >= 75 ? 'text-[#22c55e]' : 'text-[#e5a00d]'}`}>{intentScore}</div>
                </div>
              </div>
            )}
            
            {deal && (
              <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl p-5 flex flex-col justify-between min-w-[180px]">
                <div className="flex items-center justify-between w-full mb-6">
                  <span className="font-['Geist_Mono',monospace] text-[10px] uppercase tracking-widest text-[#888888]">Est. ACV</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[rgba(229,160,13,0.1)] text-[#e5a00d] border border-[rgba(229,160,13,0.3)] rounded-full">
                    {deal.tier}
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-['Space_Grotesk',sans-serif] font-bold text-white tracking-tight">{formatCurrency(deal.low)}–{formatCurrency(deal.high)}</div>
                  <div className="text-xs text-[#555555] mt-1">Based on stack &amp; scale</div>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className={`mt-8 grid grid-cols-1 gap-10 ${drafts && drafts.length > 0 ? 'xl:grid-cols-12' : ''}`}>
          {/* Left Column (Stats & Intel) */}
          <div className={`${drafts && drafts.length > 0 ? 'xl:col-span-8' : 'w-full'} flex flex-col gap-10`}>
            {cp?.description && (
              <p className="text-sm text-[#888888] leading-relaxed max-w-5xl">{cp.description}</p>
            )}

          {bi?.top_reasons && bi.top_reasons.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#e5a00d] text-[18px]">bolt</span>
                <span className="font-['Geist_Mono',monospace] text-xs font-bold text-[#e5e5e5] uppercase tracking-widest">Why They're a Strong Opportunity</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bi.top_reasons.map((reason, i) => (
                  <div key={i} className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 relative overflow-hidden group hover:border-[rgba(229,160,13,0.3)] transition-colors">
                    <div className="absolute -top-4 -right-4 text-[80px] font-black text-[rgba(255,255,255,0.02)] group-hover:text-[rgba(229,160,13,0.05)] transition-colors">0{i+1}</div>
                    <p className="text-sm text-[#888888] relative z-10 leading-relaxed">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hi && hi.total_open_roles > 0 && (
              <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#e5a00d]">work</span>
                    <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-lg text-white">Hiring Signals</h3>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{hi.total_open_roles}</span>
                  <span className="text-xs text-[#888888]">open roles</span>
                  {hi.hiring_velocity && <span className="ml-auto text-[10px] text-[#22c55e] bg-[rgba(34,197,94,0.1)] px-2 py-1 rounded font-bold uppercase">{hi.hiring_velocity}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {hi.departments_hiring.map(d => <span key={d} className="text-xs px-2 py-1 bg-[#1a1a1a] border border-[#333333] rounded text-[#888888]">{d}</span>)}
                </div>
              </div>
            )}

            {ts && ts.current_tools.length > 0 && (
              <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#e5a00d]">memory</span>
                  <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-lg text-white">Tech Stack</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ts.current_tools.map(t => <span key={t.name} className="text-xs px-2 py-1 bg-[#1a1a1a] border border-[#333333] rounded text-[#888888]">{t.name}</span>)}
                </div>
                {ts.potential_gaps.length > 0 && (
                  <div className="mt-auto bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-lg p-3">
                    <div className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider mb-1">Gap Detected</div>
                    <p className="text-xs text-[#888888]">{ts.potential_gaps[0]}</p>
                  </div>
                )}
              </div>
            )}

            {fn && fn.events.length > 0 && (
              <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#e5a00d]">attach_money</span>
                  <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-lg text-white">Funding</h3>
                </div>
                {fn.latest_round && (
                  <div>
                    <div className="text-sm font-bold text-white">{fn.latest_round}</div>
                    {fn.total_funding && <div className="text-xs text-[#e5a00d] mt-1">Total: {fn.total_funding}</div>}
                  </div>
                )}
                <div className="space-y-3 mt-2">
                  {fn.events.slice(0, 2).map((ev, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1 bg-[#333333] rounded-full"></div>
                      <div>
                        <div className="text-[10px] text-[#555555] font-bold uppercase">{ev.date}</div>
                        <div className="text-xs text-[#888888] mt-1">{ev.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Right Column (Outreach Drafts) */}
          {drafts && drafts.length > 0 && (
            <div className="xl:col-span-4">
              <div className="sticky top-[100px]">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#e5a00d] text-[18px]">mail</span>
                <span className="font-['Geist_Mono',monospace] text-xs font-bold text-[#e5e5e5] uppercase tracking-widest">AI-Generated Outreach Emails</span>
              </div>
              <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e1e1e] bg-[#0a0a0a]">
                  <div className="flex gap-2">
                    {drafts.map((d, i) => (
                      <button
                        key={d.format_type}
                        onClick={() => setActiveTab(i)}
                        className={`text-[11px] px-3 py-1.5 rounded-md font-['Geist_Mono',monospace] font-bold uppercase transition-all ${
                          activeTab === i
                            ? "bg-[rgba(229,160,13,0.1)] text-[#e5a00d] border border-[rgba(229,160,13,0.3)]"
                            : "text-[#555555] hover:text-[#e5e5e5] border border-transparent"
                        }`}
                      >
                        {d.format_type}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#e5e5e5] transition-colors">
                    <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "content_copy"}</span>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="px-5 py-4 border-b border-[#1e1e1e] bg-[#0e0e0e] flex flex-col gap-1">
                  <span className="text-[10px] text-[#555555] uppercase tracking-widest font-bold">Subject</span>
                  <span className="text-sm text-white font-medium">{drafts[activeTab].subject}</span>
                </div>
                <div className="px-5 py-6 text-sm text-[#888888] whitespace-pre-wrap leading-relaxed">
                  {drafts[activeTab].body}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Action (Mobile/bottom sticky like design) */}
      <div className="w-full bg-[#111111] border-t border-[#1e1e1e] mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[#888888] font-medium text-sm text-center md:text-left">
            Sync all enriched data including intent score, contacts, and signals to your CRM
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-5 py-2 text-sm font-bold text-black bg-[#e5a00d] rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(229,160,13,0.3)]" onClick={handleSync}>
              <span className="material-symbols-outlined text-[18px]">sync</span>
              {r.crm_synced ? "Synced" : syncing ? "Pushing..." : "HubSpot Sync"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
