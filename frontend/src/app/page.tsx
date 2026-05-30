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
  const router = useRouter();

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
    <>
      {/* Top Bar */}
      <header className="h-14 border-b border-[#222] flex justify-between items-center px-8 sticky top-0 z-50 bg-[#0a0a0a]">
        <div className="flex items-center gap-6">
          <span className="text-[#e5e5e5] text-lg font-bold tracking-tight cursor-pointer">SalesPilot</span>
          <nav className="hidden md:flex gap-4 text-sm">
            <span className="text-[#e5e5e5] font-semibold border-b-2 border-[#e5e5e5] pb-[17px] pt-[19px]">Dashboard</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#888] text-xs font-semibold">
            U
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center px-4 md:px-8 py-12">
        {/* Hero */}
        <section className="w-full max-w-2xl flex flex-col items-center text-center mt-12 mb-12">
          <h1 className="text-2xl md:text-[32px] font-semibold text-[#e5e5e5] leading-tight tracking-tight mb-2">
            Research any company in seconds
          </h1>
          <p className="text-[#888] text-base mb-8">
            Deep intelligence, hiring signals, tech stack, and intent scoring.
          </p>
          <div className="w-full flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#555] text-[20px]">search</span>
              <input
                className="w-full bg-[#0a0a0a] border border-[#222] rounded text-[#e5e5e5] text-sm py-3 pl-11 pr-4 placeholder-[#555] focus:outline-none focus:border-[#e5a00d] transition-colors"
                placeholder="e.g. Notion, Stripe, Linear..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                autoFocus
              />
            </div>
            <button
              onClick={handleResearch}
              disabled={loading || !query.trim()}
              className="w-full md:w-auto bg-[#e5a00d] text-black text-xs font-medium px-6 py-3 rounded whitespace-nowrap hover:brightness-110 transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Start Research"}
              {!loading && <span className="material-symbols-outlined text-[16px]">arrow_forward</span>}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-xs text-red-400 bg-red-400/5 border border-red-400/10 rounded px-4 py-2 w-full text-left">{error}</p>
          )}
        </section>

        {/* Recent Research */}
        {history.length > 0 && (
          <section className="w-full max-w-4xl mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#e5e5e5] tracking-tight">Recent Research</h2>
            </div>
            <div className="bg-[#111] border border-[#222] rounded overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#222] text-[#888] text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4 text-right">Intent Score</th>
                    <th className="py-3 px-4 hidden md:table-cell">Status</th>
                    <th className="py-3 px-4 text-right hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {history.map((h) => (
                    <tr
                      key={h.job_id}
                      className="border-b border-[#222] last:border-b-0 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                      onClick={() => router.push(`/research/${h.job_id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#222] border border-[#333] flex items-center justify-center text-[#888] text-[11px] font-semibold shrink-0">
                            {h.company_name.charAt(0)}
                          </div>
                          <span className="text-[#e5e5e5] font-medium">{h.company_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {h.intent_score != null ? (
                          <span className={`font-medium ${h.intent_score >= 80 ? "text-[#e5a00d]" : h.intent_score >= 60 ? "text-[#e5e5e5]" : "text-[#888]"}`}>
                            {h.intent_score}
                          </span>
                        ) : (
                          <span className="text-[#555]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <StatusPill status={h.status} />
                      </td>
                      <td className="py-3 px-4 text-right text-[#888] hidden lg:table-cell">
                        {timeAgo(h.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222] py-3 px-8 flex justify-between items-center text-xs text-[#555] mt-auto">
        <span>© 2025 SalesPilot AI</span>
        <div className="flex gap-4">
          <span className="hover:text-[#888] transition-colors cursor-pointer">Docs</span>
          <span className="hover:text-[#888] transition-colors cursor-pointer">Github</span>
        </div>
      </footer>
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "complete"
      ? "bg-[#0d1f0d] text-green-400 border-green-500/20"
      : status === "running" || status === "queued"
      ? "bg-[rgba(229,160,13,0.08)] text-[#e5a00d] border-[rgba(229,160,13,0.2)]"
      : "bg-[#1a0000] text-red-400 border-red-400/20";

  const label =
    status === "complete" ? "Completed"
    : status === "running" ? "Processing"
    : status === "queued" ? "Queued"
    : "Failed";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${styles}`}>
      {status === "complete" && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
      {(status === "running" || status === "queued") && <span className="material-symbols-outlined text-[12px] animate-spin" style={{animationDuration:"2s"}}>refresh</span>}
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
