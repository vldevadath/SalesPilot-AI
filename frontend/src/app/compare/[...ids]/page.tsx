"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { compareCompanies, ComparisonReport } from "@/lib/api";

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();
  const jobIdA = params.ids?.[0] as string;
  const jobIdB = params.ids?.[1] as string;

  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobIdA || !jobIdB) { setError("Missing job IDs"); setLoading(false); return; }
    compareCompanies(jobIdA, jobIdB)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobIdA, jobIdB]);

  if (loading) return <LoadingScreen />;
  if (error || !report) return <ErrorScreen message={error} onBack={() => router.push("/")} />;

  const winnerIsA = report.winner === "a";
  const loserScore = winnerIsA ? report.score_b : report.score_a;
  const winnerScore = winnerIsA ? report.score_a : report.score_b;
  const loserName = winnerIsA ? report.company_b : report.company_a;

  const confidenceColor =
    report.confidence === "high" ? "#22c55e" :
    report.confidence === "medium" ? "#e5a00d" : "#888888";

  const marginLabel =
    report.win_margin === "decisive" ? "Decisive Win" :
    report.win_margin === "moderate" ? "Moderate Edge" : "Close Call";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-['Inter',sans-serif] antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1e1e1e]">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-[#888888] hover:text-[#e5e5e5] transition-colors flex items-center gap-2 p-2 rounded-lg hover:bg-[#1a1a1a]"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#e5a00d] flex items-center justify-center text-black font-bold text-[10px]">SP</div>
              <span className="font-['Space_Grotesk',sans-serif] font-bold text-lg text-[#e5a00d]">SalesPilot AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-['Geist_Mono',monospace] text-[11px] uppercase tracking-widest text-[#555555]">Intelligence Comparison</span>
          </div>
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm border border-[#1e1e1e] rounded-lg text-[#e5e5e5] hover:bg-[#1a1a1a] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ─── VERDICT BANNER ─── */}
        <section className="relative bg-[#0e0e0e] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          {/* Glow on winner side */}
          <div className={`absolute inset-0 ${winnerIsA ? "bg-gradient-to-r" : "bg-gradient-to-l"} from-[rgba(34,197,94,0.05)] via-transparent to-transparent pointer-events-none`} />

          <div className="relative z-10 p-8 flex flex-col lg:flex-row items-center gap-8">
            {/* Company A Score */}
            <div className={`flex-1 text-center p-6 rounded-xl border ${winnerIsA ? "border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.05)]" : "border-[#1e1e1e] bg-[#111111]"}`}>
              <div className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] mb-2">Company A</div>
              <div className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white mb-3">{report.company_a}</div>
              <div className={`text-6xl font-['Space_Grotesk',sans-serif] font-black mb-2 ${winnerIsA ? "text-[#22c55e]" : "text-[#555555]"}`}>
                {report.score_a}
              </div>
              <div className="text-xs text-[#555555] uppercase tracking-widest">Priority Score</div>
              {winnerIsA && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-[#22c55e] text-xs font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                  WINNER
                </div>
              )}
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border border-[#333333] flex items-center justify-center">
                <span className="font-['Space_Grotesk',sans-serif] font-black text-[#555555] text-sm">VS</span>
              </div>
              <div className="text-center">
                <div className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] mb-1">Margin</div>
                <div className={`text-sm font-bold ${report.win_margin === "decisive" ? "text-[#22c55e]" : report.win_margin === "moderate" ? "text-[#e5a00d]" : "text-[#888888]"}`}>{marginLabel}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] mb-1">Confidence</div>
                <div className="text-sm font-bold capitalize" style={{ color: confidenceColor }}>{report.confidence}</div>
              </div>
            </div>

            {/* Company B Score */}
            <div className={`flex-1 text-center p-6 rounded-xl border ${!winnerIsA ? "border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.05)]" : "border-[#1e1e1e] bg-[#111111]"}`}>
              <div className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] mb-2">Company B</div>
              <div className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-white mb-3">{report.company_b}</div>
              <div className={`text-6xl font-['Space_Grotesk',sans-serif] font-black mb-2 ${!winnerIsA ? "text-[#22c55e]" : "text-[#555555]"}`}>
                {report.score_b}
              </div>
              <div className="text-xs text-[#555555] uppercase tracking-widest">Priority Score</div>
              {!winnerIsA && (
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] text-[#22c55e] text-xs font-bold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                  WINNER
                </div>
              )}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="relative z-10 border-t border-[#1e1e1e] px-8 py-6">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#e5a00d] shrink-0">auto_awesome</span>
              <div>
                <div className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] mb-2">AI Executive Summary</div>
                <p className="text-sm text-[#e5e5e5] leading-relaxed">{report.executive_summary}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── RECOMMENDED ACTION ─── */}
        <section className="bg-[rgba(229,160,13,0.05)] border border-[rgba(229,160,13,0.2)] rounded-xl px-6 py-4 flex items-start gap-4">
          <span className="material-symbols-outlined text-[#e5a00d] text-[24px] shrink-0 mt-0.5">bolt</span>
          <div>
            <div className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest text-[#e5a00d] mb-1">Recommended Action</div>
            <p className="text-sm text-[#e5e5e5] font-medium">{report.recommended_action}</p>
          </div>
        </section>

        {/* ─── DIMENSION TABLE ─── */}
        <section className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="border-b border-[#1e1e1e] px-6 py-4 flex items-center gap-2 bg-[#111111]">
            <span className="material-symbols-outlined text-[#e5a00d] text-[18px]">compare_arrows</span>
            <h2 className="font-['Geist_Mono',monospace] text-[11px] uppercase tracking-widest font-bold text-[#888888]">Head-to-Head Dimension Analysis</h2>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_2fr_2fr_80px] border-b border-[#1e1e1e] bg-[#0a0a0a]">
            <div className="px-5 py-3 text-[10px] font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555]">Dimension</div>
            <div className="px-5 py-3 text-[10px] font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] border-l border-[#1e1e1e]">{report.company_a}</div>
            <div className="px-5 py-3 text-[10px] font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] border-l border-[#1e1e1e]">{report.company_b}</div>
            <div className="px-5 py-3 text-[10px] font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] border-l border-[#1e1e1e] text-center">Edge</div>
          </div>

          {report.dimensions.map((dim, i) => {
            const aWins = dim.winner === "a";
            const bWins = dim.winner === "b";
            return (
              <div key={i} className="grid grid-cols-[1fr_2fr_2fr_80px] border-b border-[#1e1e1e] last:border-b-0 hover:bg-[#111111] transition-colors group">
                <div className="px-5 py-4 flex flex-col gap-1">
                  <span className="font-['Space_Grotesk',sans-serif] font-semibold text-sm text-[#e5e5e5]">{dim.dimension}</span>
                  <span className="text-[11px] text-[#555555] leading-snug hidden group-hover:block">{dim.rationale}</span>
                </div>
                <div className={`px-5 py-4 border-l border-[#1e1e1e] flex items-center gap-2 ${aWins ? "bg-[rgba(34,197,94,0.03)]" : ""}`}>
                  {aWins && <span className="material-symbols-outlined text-[#22c55e] text-[14px] shrink-0">check_circle</span>}
                  <span className={`text-sm ${aWins ? "text-[#22c55e] font-semibold" : "text-[#888888]"}`}>{dim.company_a_value}</span>
                </div>
                <div className={`px-5 py-4 border-l border-[#1e1e1e] flex items-center gap-2 ${bWins ? "bg-[rgba(34,197,94,0.03)]" : ""}`}>
                  {bWins && <span className="material-symbols-outlined text-[#22c55e] text-[14px] shrink-0">check_circle</span>}
                  <span className={`text-sm ${bWins ? "text-[#22c55e] font-semibold" : "text-[#888888]"}`}>{dim.company_b_value}</span>
                </div>
                <div className="px-5 py-4 border-l border-[#1e1e1e] flex items-center justify-center">
                  {dim.winner === "tie" ? (
                    <span className="text-[10px] font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555]">Tie</span>
                  ) : (
                    <span className={`text-xs font-bold font-['Geist_Mono',monospace] uppercase ${dim.winner === "a" ? "text-[#22c55e]" : "text-[#e5a00d]"}`}>
                      {dim.winner === "a" ? report.company_a.split(" ")[0] : report.company_b.split(" ")[0]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* ─── WHY WINNER + RISKS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Why Winner */}
          <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#22c55e] text-[20px]">verified</span>
              <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-white">Why {report.winner_company_name} Wins</h3>
            </div>
            <div className="flex flex-col gap-3">
              {report.top_reasons_winner.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#22c55e] text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-[#888888] leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#e5a00d] text-[20px]">warning</span>
              <h3 className="font-['Space_Grotesk',sans-serif] font-bold text-white">Risks to Watch</h3>
            </div>
            <div className="flex flex-col gap-3">
              {report.top_risks_winner.map((r, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[rgba(229,160,13,0.1)] border border-[rgba(229,160,13,0.3)] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[#e5a00d] text-[11px]">priority_high</span>
                  </div>
                  <p className="text-sm text-[#888888] leading-relaxed">{r}</p>
                </div>
              ))}
            </div>

            {/* Score bar comparison */}
            <div className="mt-4 pt-4 border-t border-[#1e1e1e] flex flex-col gap-3">
              <div className="text-xs font-['Geist_Mono',monospace] uppercase tracking-widest text-[#555555] mb-1">Score Gap</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#888888] w-20 truncate">{report.company_a}</span>
                <div className="flex-1 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22c55e] rounded-full transition-all duration-1000"
                    style={{ width: `${report.score_a}%`, opacity: winnerIsA ? 1 : 0.4 }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 text-right ${winnerIsA ? "text-[#22c55e]" : "text-[#555555]"}`}>{report.score_a}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#888888] w-20 truncate">{report.company_b}</span>
                <div className="flex-1 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#22c55e] rounded-full transition-all duration-1000"
                    style={{ width: `${report.score_b}%`, opacity: !winnerIsA ? 1 : 0.4 }}
                  />
                </div>
                <span className={`text-xs font-bold w-8 text-right ${!winnerIsA ? "text-[#22c55e]" : "text-[#555555]"}`}>{report.score_b}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CTA FOOTER ─── */}
        <section className="flex flex-col sm:flex-row gap-4 justify-center pb-10">
          <button
            onClick={() => router.push(`/research/${jobIdA}`)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#1e1e1e] text-[#888888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            View {report.company_a} Dossier
          </button>
          <button
            onClick={() => router.push(`/research/${jobIdB}`)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#1e1e1e] text-[#888888] hover:text-[#e5e5e5] hover:bg-[#1a1a1a] transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            View {report.company_b} Dossier
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#e5a00d] text-black font-bold hover:brightness-110 transition-all text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Research Another Company
          </button>
        </section>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-['Inter',sans-serif] flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-[#e5a00d] flex items-center justify-center animate-pulse">
          <span className="material-symbols-outlined text-black text-[32px]">compare_arrows</span>
        </div>
        <div className="text-center space-y-2">
          <h1 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold">Generating Comparison Report</h1>
          <p className="text-[#888888] text-sm max-w-sm text-center">AI is analyzing both dossiers and determining the best opportunity...</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-[#e5a00d] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-['Inter',sans-serif] flex flex-col items-center justify-center gap-6">
      <span className="material-symbols-outlined text-[#ef4444] text-[48px]">error</span>
      <h1 className="font-['Space_Grotesk',sans-serif] text-xl font-bold">Comparison Failed</h1>
      <p className="text-[#888888] text-sm max-w-sm text-center">{message || "Both researches must be complete before comparing."}</p>
      <button onClick={onBack} className="px-6 py-3 bg-[#e5a00d] text-black font-bold rounded-xl text-sm hover:brightness-110 transition-all">
        Go Back
      </button>
    </div>
  );
}
