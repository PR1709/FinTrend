"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MementoSnapshot, RepeatedSignal } from "@/lib/types";
import Link from "next/link";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw } from "lucide-react";
import clsx from "clsx";

function TrendDot({ direction }: { direction: string }) {
  const colors: Record<string, string> = { bullish: "bg-bull", bearish: "bg-bear", neutral: "bg-neutral", volatile: "bg-accent" };
  return <span className={clsx("inline-block w-2 h-2 rounded-full", colors[direction] || "bg-muted")} />;
}

function RiskBadge({ risk }: { risk: string }) {
  return <span className={`badge badge-${risk} text-xs`}>{risk}</span>;
}

export default function MemoryPage() {
  const [assets, setAssets] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [history, setHistory] = useState<MementoSnapshot[]>([]);
  const [signals, setSignals] = useState<RepeatedSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);

  useEffect(() => {
    api.memento.assets()
      .then(a => { setAssets(a); if (a.length > 0) setSelected(a[0]); })
      .catch(() => {})
      .finally(() => setAssetsLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([
      api.memento.history(selected),
      api.memento.signals(selected),
    ]).then(([h, s]) => {
      setHistory(h);
      setSignals(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={20} className="text-accent" />
            <h1 className="text-3xl font-bold">Memento Memory</h1>
          </div>
          <p className="text-muted">Track how signals and trends evolve over time for each asset.</p>
        </div>
      </div>

      {assetsLoading ? (
        <div className="h-10 w-64 shimmer rounded mb-8" />
      ) : assets.length === 0 ? (
        <div className="card p-16 text-center">
          <Brain size={40} className="text-muted mx-auto mb-4" />
          <p className="text-muted text-lg mb-4">No memory yet</p>
          <p className="text-muted text-sm mb-6">Run analyses to start building longitudinal memory for your assets.</p>
          <Link href="/analyze" className="btn-primary inline-flex items-center gap-2">
            Run First Analysis
          </Link>
        </div>
      ) : (
        <>
          {/* Asset Selector */}
          <div className="flex items-center gap-4 mb-8">
            <label className="text-muted text-sm">Asset:</label>
            <select className="input max-w-xs" value={selected} onChange={e => setSelected(e.target.value)}>
              {assets.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="md:col-span-2">
              <p className="section-label mb-4">Analysis Timeline — {selected}</p>
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-24 shimmer rounded-xl mb-4" />)
              ) : history.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-muted">No history for {selected}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: "#242436" }} />
                  <div className="flex flex-col gap-4">
                    {history.map((snap, i) => (
                      <div key={snap.id} className="flex gap-5 pl-10 relative">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-4 flex items-center justify-center w-6 h-6 rounded-full"
                          style={{ background: "#0D0D14", border: "1px solid #242436" }}>
                          <TrendDot direction={snap.trend_direction} />
                        </div>
                        <Link href={`/reports/${snap.analysis_id}`} className="card p-4 flex-1 hover:no-underline">
                          <div className="flex items-center justify-between mb-2">
                            <span className="mono text-xs text-muted">{new Date(snap.created_at).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                              <span className={`badge badge-${snap.trend_direction === "bullish" ? "bull" : snap.trend_direction === "bearish" ? "bear" : snap.trend_direction === "volatile" ? "volatile" : "neutral"}`}>
                                {snap.trend_direction}
                              </span>
                              <RiskBadge risk={snap.risk_level} />
                            </div>
                          </div>
                          <p className="text-sm text-muted">{snap.summary_text}</p>
                          {snap.key_signals.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {snap.key_signals.slice(0, 4).map((s, j) => (
                                <span key={j} className="px-2 py-0.5 rounded text-xs"
                                  style={{ background: "#1C1C2E", color: "#8888AA" }}>{s}</span>
                              ))}
                            </div>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <p className="section-label mb-4">Repeated Signals</p>
              <div className="card p-5">
                {loading ? (
                  <div className="h-32 shimmer rounded" />
                ) : signals.length === 0 ? (
                  <p className="text-muted text-sm">
                    No repeated signals yet. Signals appearing in 3+ analyses will appear here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {signals.map((s, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <p className="text-sm">{s.signal}</p>
                        <span className="badge badge-neutral shrink-0">{s.count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              {history.length > 0 && (
                <div className="card p-5 mt-4">
                  <p className="section-label mb-3">Summary</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Total runs</span>
                      <span className="font-bold">{history.length}</span>
                    </div>
                    {(["bullish", "bearish", "neutral", "volatile"] as const).map(d => {
                      const count = history.filter(h => h.trend_direction === d).length;
                      if (count === 0) return null;
                      return (
                        <div key={d} className="flex justify-between text-sm">
                          <span className="text-muted capitalize">{d}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full bg-surface-2" style={{ width: "60px" }}>
                              <div className="h-full rounded-full bg-accent" style={{ width: `${(count / history.length) * 100}%` }} />
                            </div>
                            <span className="font-bold mono text-xs">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Last run</span>
                      <span className="mono text-xs">{new Date(history[0]?.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
