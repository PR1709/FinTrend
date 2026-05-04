"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { FullAnalysisResult } from "@/lib/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowLeft,
  Globe, Brain, Zap, Shield, CheckCircle
} from "lucide-react";

function Badge({ direction }: { direction: string }) {
  const m: Record<string, string> = { bullish: "badge-bull", bearish: "badge-bear", neutral: "badge-neutral", volatile: "badge-volatile" };
  const icons: Record<string, React.ReactNode> = {
    bullish: <TrendingUp size={12} />, bearish: <TrendingDown size={12} />,
    neutral: <Minus size={12} />, volatile: <AlertTriangle size={12} />
  };
  const d = direction?.toLowerCase() || "neutral";
  return <span className={`badge ${m[d] || "badge-neutral"}`}>{icons[d]} {direction}</span>;
}

function RiskBadge({ risk }: { risk: string }) {
  return <span className={`badge badge-${risk}`}>{risk.toUpperCase()} RISK</span>;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{size?: number; className?: string}>; children: React.ReactNode }) {
  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} className="text-accent" />
        <p className="section-label mb-0">{title}</p>
      </div>
      {children}
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const [data, setData] = useState<FullAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.analysis.get(id as string)
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {[...Array(6)].map((_, i) => <div key={i} className="h-32 shimmer rounded-xl mb-6" />)}
    </div>
  );

  if (error || !data) return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-center">
      <p className="text-bear mb-4">{error || "Report not found"}</p>
      <Link href="/reports" className="btn-ghost">Back to Reports</Link>
    </div>
  );

  const { report, trend_analysis: trend, chart_data, dataset_summary, asset_context, created_at } = data;
  const anomalyDates = new Set(trend.anomalies.map(a => a.date));

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 fade-in">
      {/* Header */}
      <Link href="/reports" className="flex items-center gap-2 text-muted hover:text-white text-sm mb-8 transition-colors w-fit">
        <ArrowLeft size={15} /> Back to Reports
      </Link>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-muted text-sm mono">{asset_context}</span>
          <Badge direction={report.trend_direction} />
          <RiskBadge risk={report.risk_assessment.overall_risk} />
          <span className="text-muted text-xs mono ml-auto">{new Date(created_at).toLocaleString()}</span>
        </div>
        <h1 className="text-3xl font-bold">{report.report_title}</h1>
      </div>

      {/* Executive Summary */}
      <div className="card p-6 mb-6" style={{ borderLeft: "3px solid #4ECDC4" }}>
        <p className="section-label">Executive Summary</p>
        <p className="text-lg leading-relaxed" style={{ fontStyle: "italic", color: "#D0D0F0" }}>
          {report.executive_summary}
        </p>
      </div>

      {/* Chart */}
      {chart_data.length > 0 && (
        <div className="card p-6 mb-6">
          <p className="section-label">Price Chart</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chart_data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#242436" />
              <XAxis dataKey="date" tick={{ fill: "#8888AA", fontSize: 11 }}
                tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#8888AA", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#14141F", border: "1px solid #242436", borderRadius: "8px" }}
                labelStyle={{ color: "#8888AA" }}
                itemStyle={{ color: "#F0F0FA" }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#4ECDC4" dot={false} strokeWidth={2} name="Value" />
              {chart_data.some(d => d.ma7 !== undefined) && (
                <Line type="monotone" dataKey="ma7" stroke="#F5A623" dot={false} strokeWidth={1.5} strokeDasharray="4 2" name="MA7" />
              )}
              {trend.anomalies.slice(0, 10).map((a, i) => (
                <ReferenceDot key={i} x={a.date} y={a.value} r={4} fill="#FF4D6A" stroke="none" />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {trend.anomalies.length > 0 && (
            <p className="text-muted text-xs mt-2">
              <span className="text-bear">●</span> {trend.anomalies.length} anomaly{trend.anomalies.length > 1 ? "ies" : ""} detected
            </p>
          )}
        </div>
      )}

      {/* Trend Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Volatility", value: `${(trend.volatility * 100).toFixed(1)}%`, mono: true },
          { label: "Peak", value: `${trend.peak.value}`, sub: trend.peak.date, mono: true },
          { label: "Trough", value: `${trend.trough.value}`, sub: trend.trough.date, mono: true },
          { label: "Anomalies", value: `${trend.anomalies.length}`, mono: true },
        ].map(({ label, value, sub, mono }) => (
          <div key={label} className="card p-4">
            <p className="section-label">{label}</p>
            <p className={`text-xl font-bold text-accent ${mono ? "mono" : ""}`}>{value}</p>
            {sub && <p className="text-muted text-xs mt-1 mono">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Period Changes */}
      {Object.keys(trend.period_changes).length > 0 && (
        <div className="card p-6 mb-6">
          <p className="section-label">Period Changes</p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(trend.period_changes).map(([k, v]) => (
              <div key={k}>
                <p className="text-muted text-xs uppercase">{k === "wow" ? "Week/Week" : k === "mom" ? "Month/Month" : k}</p>
                <p className={`text-xl font-bold mono ${v >= 0 ? "text-bull" : "text-bear"}`}>
                  {v >= 0 ? "+" : ""}{v.toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Signals */}
      {report.key_signals?.length > 0 && (
        <Section title="Key Signals" icon={Zap}>
          <div className="flex flex-wrap gap-3">
            {report.key_signals.map((s, i) => {
              const color = s.direction === "positive" ? "#22D17A" : s.direction === "negative" ? "#FF4D6A" : "#8888AA";
              const bg = s.direction === "positive" ? "rgba(34,209,122,0.1)" : s.direction === "negative" ? "rgba(255,77,106,0.1)" : "rgba(136,136,170,0.1)";
              return (
                <div key={i} className="px-3 py-2 rounded-lg text-sm" style={{ background: bg, color, border: `1px solid ${color}30` }}>
                  <span>{s.signal}</span>
                  <span className="ml-2 opacity-60 text-xs">{s.strength}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Risk Assessment */}
      <Section title="Risk Assessment" icon={Shield}>
        <div className="flex items-center gap-3 mb-3">
          <RiskBadge risk={report.risk_assessment.overall_risk} />
        </div>
        <p className="text-muted text-sm mb-4">{report.risk_assessment.risk_narrative}</p>
        {report.risk_assessment.risk_factors?.length > 0 && (
          <ul className="flex flex-col gap-2">
            {report.risk_assessment.risk_factors.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-bear mt-0.5">▲</span> {f}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Web Intelligence */}
      <Section title="Web Intelligence" icon={Globe}>
        <div className="flex items-center gap-3 mb-3">
          <span className="badge badge-neutral">{report.web_intelligence.narrative_sentiment}</span>
        </div>
        {report.web_intelligence.notable_developments && (
          <p className="text-sm text-muted mb-3">{report.web_intelligence.notable_developments}</p>
        )}
        {report.web_intelligence.key_themes?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {report.web_intelligence.key_themes.map((t, i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs"
                style={{ background: "#1C1C2E", color: "#8888AA", border: "1px solid #242436" }}>{t}</span>
            ))}
          </div>
        )}
        {report.web_intelligence.narrative_sentiment === "insufficient_data" && (
          <p className="text-muted text-sm">No web sources were provided for this analysis.</p>
        )}
      </Section>

      {/* Memory Insights */}
      <Section title="Memory Insights" icon={Brain}>
        <div className="text-muted text-xs mb-4">
          Referenced {report.memory_insights.snapshots_referenced} past snapshot{report.memory_insights.snapshots_referenced !== 1 ? "s" : ""}
        </div>
        {report.memory_insights.trend_persistence && (
          <div className="mb-3 p-3 rounded-lg" style={{ background: "rgba(78,205,196,0.05)", border: "1px solid rgba(78,205,196,0.2)" }}>
            <p className="text-sm text-accent">{report.memory_insights.trend_persistence}</p>
          </div>
        )}
        {report.memory_insights.repeated_signals_detected?.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-2">Repeated Signals</p>
            <div className="flex flex-wrap gap-2">
              {report.memory_insights.repeated_signals_detected.map((s, i) => (
                <span key={i} className="badge badge-neutral">{s}</span>
              ))}
            </div>
          </div>
        )}
        {report.memory_insights.emerging_risks?.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Emerging Risks</p>
            <ul className="flex flex-col gap-1">
              {report.memory_insights.emerging_risks.map((r, i) => (
                <li key={i} className="text-sm text-muted flex items-start gap-2">
                  <span className="text-neutral mt-0.5">!</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!report.memory_insights.trend_persistence &&
         report.memory_insights.repeated_signals_detected?.length === 0 &&
         report.memory_insights.emerging_risks?.length === 0 && (
          <p className="text-muted text-sm">Run more analyses for this asset to build memory context.</p>
        )}
      </Section>

      {/* Takeaways */}
      <Section title="Actionable Takeaways" icon={CheckCircle}>
        <ol className="flex flex-col gap-3">
          {report.actionable_takeaways?.map((t, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-accent font-bold mono shrink-0">0{i + 1}</span>
              <span className="text-sm leading-relaxed">{t}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Data quality */}
      {report.data_quality_notes && (
        <div className="card p-4 mb-6">
          <p className="section-label">Data Quality Notes</p>
          <p className="text-muted text-sm">{report.data_quality_notes}</p>
        </div>
      )}
    </div>
  );
}
