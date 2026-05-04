"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AnalysisHistoryEntry } from "@/lib/types";
import { ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import clsx from "clsx";

function TrendBadge({ direction }: { direction?: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    bullish:  { label: "Bullish",  cls: "badge-bull",    icon: <TrendingUp size={11} /> },
    bearish:  { label: "Bearish",  cls: "badge-bear",    icon: <TrendingDown size={11} /> },
    neutral:  { label: "Neutral",  cls: "badge-neutral", icon: <Minus size={11} /> },
    volatile: { label: "Volatile", cls: "badge-volatile", icon: <AlertTriangle size={11} /> },
  };
  const d = direction?.toLowerCase() || "neutral";
  const t = map[d] || map.neutral;
  return <span className={`badge ${t.cls}`}>{t.icon} {t.label}</span>;
}

function RiskBadge({ risk }: { risk?: string }) {
  const cls = risk ? `badge-${risk}` : "badge-low";
  return <span className={`badge ${cls}`}>{risk?.toUpperCase() || "N/A"} RISK</span>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<AnalysisHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.analysis.history()
      .then(setReports)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="h-8 w-48 shimmer rounded mb-8" />
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl mb-4" />)}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reports</h1>
          <p className="text-muted">{reports.length} analysis run{reports.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/analyze" className="btn-primary flex items-center gap-2">
          New Analysis <ArrowRight size={15} />
        </Link>
      </div>

      {error && <p className="text-bear mb-6">{error}</p>}

      {reports.length === 0 && !error && (
        <div className="card p-16 text-center">
          <p className="text-muted text-lg mb-4">No reports yet</p>
          <Link href="/analyze" className="btn-primary inline-flex items-center gap-2">
            Run your first analysis <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {reports.map(r => (
          <Link key={r.id} href={`/reports/${r.id}`}
            className="card p-6 flex items-center justify-between hover:no-underline group">
            <div className="flex items-start gap-4">
              <div className={clsx("w-1 self-stretch rounded-full", {
                "bg-bull": r.trend_direction === "bullish",
                "bg-bear": r.trend_direction === "bearish",
                "bg-neutral": r.trend_direction === "neutral",
                "bg-accent": r.trend_direction === "volatile",
              })} />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-white">{r.asset_context}</span>
                  <TrendBadge direction={r.trend_direction} />
                  <RiskBadge risk={r.risk_level} />
                </div>
                <p className="text-muted text-sm">{r.report_title || "Financial Analysis Report"}</p>
                <p className="text-muted text-xs mt-1 mono">{new Date(r.created_at).toLocaleString()}</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-muted group-hover:text-accent transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
