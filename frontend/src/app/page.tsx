"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { startResearch, getResearchHistory } from "@/lib/api";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<
    { job_id: string; company_name: string; status: string; created_at: string; intent_score: number | null }[]
  >([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const router = useRouter();

  const toggleSelect = useCallback((jobId: string, status: string) => {
    if (status !== "complete") return;
    setSelected(prev => {
      if (prev.includes(jobId)) return prev.filter(id => id !== jobId);
      if (prev.length >= 2) return [prev[1], jobId];
      return [...prev, jobId];
    });
  }, []);

  const handleCompare = useCallback(() => {
    if (selected.length === 2) router.push(`/compare/${selected[0]}/${selected[1]}`);
  }, [selected, router]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const load = () => getResearchHistory().then(setHistory).catch(() => {});

    load(); // initial fetch

    // Poll every 5s if any jobs are still running/queued
    intervalId = setInterval(() => {
      setHistory(prev => {
        const hasRunning = prev.some(h => h.status === "running" || h.status === "queued");
        if (hasRunning) load();
        return prev;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleResearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await startResearch({ company_name: query.trim() });
      router.push(`/research/${res.job_id}`);
    } catch {
      setError("Could not connect to backend. Run: uvicorn app.main:app --port 8000");
      setLoading(false);
    }
  }, [query, router]);

  return (
    <div className="bg-[#0a0a0a] text-[#e5e5e5] font-['Inter',sans-serif] antialiased min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-[#0a0a0a] w-full top-0 sticky z-50 border-b border-[#1e1e1e] font-['Inter',sans-serif] text-[#e5e5e5]">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-full mx-auto">
          <div className="flex items-center gap-6">
            <a className="flex items-center gap-2 hover:brightness-110 transition-all duration-200" href="#">
              <div className="w-8 h-8 rounded-md bg-[#e5a00d] flex items-center justify-center text-[#0a0a0a] font-['Space_Grotesk',sans-serif] font-black text-xs">SP</div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk',sans-serif] font-bold text-lg tracking-tight">SalesPilot</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[rgba(229,160,13,0.1)] text-[#e5a00d] border border-[rgba(229,160,13,0.2)]">AI</span>
              </div>
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a className="text-[#e5a00d] border-b-2 border-[#e5a00d] py-3 px-1" href="#">Dashboard</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 bg-[rgba(229,160,13,0.1)] text-[#e5a00d] border border-[rgba(229,160,13,0.3)] hover:bg-[rgba(229,160,13,0.2)] transition-all px-3 py-1.5 rounded-lg text-sm font-semibold">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Research
            </button>
            <button className="hover:brightness-110 transition-all rounded-full overflow-hidden border border-[#1e1e1e] w-8 h-8 bg-[#1e1e1e] flex items-center justify-center text-[#888888] text-xs font-semibold">
              U
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-start pt-20 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto w-full mb-12">
          <h1 className="font-['Space_Grotesk',sans-serif] text-4xl md:text-5xl font-bold mb-4 tracking-tight text-[#e5e5e5]">Research any company in seconds</h1>
          <p className="text-[#888888] text-base md:text-lg mb-8">Deep intelligence on hiring, funding, tech stack &amp; buying intent — powered by 9 autonomous AI agents</p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#555555] group-focus-within:text-[#e5a00d] transition-colors">
                <span className="material-symbols-outlined">search</span>
              </div>
              <input
                className="w-full bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl py-4 pl-12 pr-4 text-[#e5e5e5] placeholder-[#555555] focus:outline-none focus:border-[#e5a00d] focus:ring-1 focus:ring-[#e5a00d] transition-all"
                placeholder="e.g. Notion, Stripe, Linear..."
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                autoFocus
              />
            </div>
            <button
              onClick={handleResearch}
              disabled={loading || !query.trim()}
              className="bg-[#e5a00d] text-[#0a0a0a] font-semibold px-8 py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 whitespace-nowrap group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Start Research"}
              {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-xs text-[#ef4444] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-2 w-full text-left">{error}</p>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-16 w-full max-w-2xl mx-auto border-t border-b border-[#1e1e1e] py-6">
          <div className="text-center">
            <div className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#e5a00d]">847</div>
            <div className="text-[10px] uppercase tracking-widest text-[#555555] font-['Geist_Mono',monospace]">companies researched</div>
          </div>
          <div className="w-px h-10 bg-[#1e1e1e]"></div>
          <div className="text-center">
            <div className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#e5a00d]">92%</div>
            <div className="text-[10px] uppercase tracking-widest text-[#555555] font-['Geist_Mono',monospace]">accuracy rate</div>
          </div>
          <div className="w-px h-10 bg-[#1e1e1e]"></div>
          <div className="text-center">
            <div className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#e5a00d]">9</div>
            <div className="text-[10px] uppercase tracking-widest text-[#555555] font-['Geist_Mono',monospace]">AI agents</div>
          </div>
        </div>

        {/* Recently Researched Table */}
        <div className="w-full bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl mb-12">
          <div className="border-b border-[#1e1e1e] px-5 py-4 flex items-center justify-between bg-[#0e0e0e]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#e5a00d] text-[18px]">bolt</span>
              <h2 className="font-['Geist_Mono',monospace] text-[11px] uppercase tracking-widest font-bold text-[#888888]">Recently Researched</h2>
            </div>
            <button
              onClick={() => { setCompareMode(m => !m); setSelected([]); }}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                compareMode
                  ? "bg-[rgba(229,160,13,0.15)] text-[#e5a00d] border-[rgba(229,160,13,0.3)]"
                  : "border-[#1e1e1e] text-[#555555] hover:text-[#e5e5e5] hover:border-[#333333]"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">compare_arrows</span>
              {compareMode ? "Cancel Compare" : "Compare"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e1e1e] text-[#555555] font-['Geist_Mono',monospace] text-[10px] uppercase tracking-widest bg-[#0a0a0a]">
                  {compareMode && <th className="py-3 pl-5 pr-2 font-normal w-10"></th>}
                  <th className="py-3 px-5 font-normal">Company</th>
                  <th className="py-3 px-5 font-normal text-right">Intent Score</th>
                  <th className="py-3 px-5 font-normal">Status</th>
                  <th className="py-3 px-5 font-normal hidden md:table-cell">Data Sources</th>
                  <th className="py-3 px-5 font-normal text-right hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#555555] text-sm">
                      No research history found. Start a new research above.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => {
                    const isSelected = selected.includes(h.job_id);
                    const isComplete = h.status === "complete";
                    const isDisabled = compareMode && !isComplete;
                    return (
                      <tr
                        key={h.job_id}
                        className={`border-b border-[#1e1e1e] last:border-b-0 transition-colors ${
                          isDisabled ? "opacity-40 cursor-not-allowed" :
                          isSelected ? "bg-[rgba(229,160,13,0.05)] border-l-2 border-l-[#e5a00d] cursor-pointer" :
                          "hover:bg-[#1a1a1a] cursor-pointer"
                        } group`}
                        onClick={() => compareMode ? toggleSelect(h.job_id, h.status) : router.push(`/research/${h.job_id}`)}
                      >
                        {compareMode && (
                          <td className="pl-5 pr-2 py-4" onClick={e => e.stopPropagation()}>
                            <div
                              onClick={() => toggleSelect(h.job_id, h.status)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                !isComplete ? "border-[#333] cursor-not-allowed" :
                                isSelected ? "bg-[#e5a00d] border-[#e5a00d]" : "border-[#333] hover:border-[#e5a00d] cursor-pointer"
                              }`}
                            >
                              {isSelected && <span className="material-symbols-outlined text-black text-[13px] font-bold">check</span>}
                            </div>
                          </td>
                        )}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-['Space_Grotesk',sans-serif] font-bold shadow-sm ${
                              isSelected ? "bg-[rgba(229,160,13,0.15)] border-[rgba(229,160,13,0.3)] text-[#e5a00d]" : "bg-[#0e0e0e] border-[#1e1e1e] text-[#e5e5e5]"
                            }`}>
                              {h.company_name.charAt(0).toUpperCase()}
                            </div>
                            <span className={`font-semibold transition-colors ${
                              isSelected ? "text-[#e5a00d]" : "text-[#e5e5e5] group-hover:text-white"
                            }`}>{h.company_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <span className={`font-['Space_Grotesk',sans-serif] font-bold text-xl ${
                            h.intent_score == null ? "text-[#555555]" :
                            h.intent_score >= 80 ? "text-[#22c55e]" :
                            h.intent_score >= 60 ? "text-[#e5a00d]" : "text-[#888888]"
                          }`}>
                            {h.intent_score != null ? h.intent_score : "—"}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <StatusPill status={h.status} />
                        </td>
                        <td className="py-4 px-5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-[#0e0e0e] border border-[#1e1e1e] flex items-center justify-center text-[10px] text-[#888] cursor-help" title="LinkedIn">in</span>
                            <span className="w-4 h-4 rounded bg-[#0e0e0e] border border-[#1e1e1e] flex items-center justify-center text-[10px] text-[#888] cursor-help" title="GitHub">gh</span>
                            <span className="w-4 h-4 rounded bg-[#0e0e0e] border border-[#1e1e1e] flex items-center justify-center text-[10px] text-[#888] cursor-help" title="Glassdoor">gd</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right text-[#555555] text-xs font-['Geist_Mono',monospace] hidden sm:table-cell">
                          {timeAgo(h.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compare floating bar */}
        {compareMode && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
            selected.length > 0 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          }`}>
            <div className="flex items-center gap-4 bg-[#111111] border border-[#1e1e1e] rounded-2xl px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-[#e5a00d] text-[20px]">compare_arrows</span>
                <span className="text-[#888888]">
                  {selected.length === 1 ? (
                    <><span className="text-[#e5e5e5] font-semibold">1</span> selected — pick 1 more</>
                  ) : (
                    <><span className="text-[#22c55e] font-semibold">2</span> companies ready to compare</>
                  )}
                </span>
              </div>
              <button
                onClick={handleCompare}
                disabled={selected.length < 2}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e5a00d] text-black font-bold text-sm hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Generate Report
              </button>
              <button
                onClick={() => setSelected([])}
                className="text-[#555555] hover:text-[#e5e5e5] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e1e] py-6 px-6 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-['Geist_Mono',monospace] text-[#555555] uppercase tracking-widest">
          <span>© 2026 SalesPilot AI</span>
          <span>Powered by Bright Data · 8 data sources active</span>
        </div>
      </footer>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "complete"
      ? "bg-[rgba(34,197,94,0.1)] text-[#22c55e] border-[rgba(34,197,94,0.2)]"
      : status === "running" || status === "queued"
      ? "bg-[rgba(229,160,13,0.1)] text-[#e5a00d] border-[rgba(229,160,13,0.2)]"
      : "bg-[rgba(239,68,68,0.1)] text-[#ef4444] border-[rgba(239,68,68,0.2)]";

  const label =
    status === "complete" ? "Complete"
    : status === "running" ? "Processing"
    : status === "queued" ? "Queued"
    : "Failed";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles}`}>
      {status === "complete" && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
      {(status === "running" || status === "queued") && (
        <span className="material-symbols-outlined text-[12px] animate-spin" style={{animationDuration:"2s"}}>sync</span>
      )}
      {status === "failed" && <span className="material-symbols-outlined text-[12px]">error</span>}
      {label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  // Backend returns UTC without 'Z' — append it so JS parses correctly
  const normalized = dateStr.endsWith("Z") ? dateStr : dateStr + "Z";
  const diff = Date.now() - new Date(normalized).getTime();
  if (diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
