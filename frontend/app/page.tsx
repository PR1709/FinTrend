import Link from "next/link";
import { TrendingUp, Brain, Globe, BarChart2, ArrowRight } from "lucide-react";

const features = [
  {
    icon: BarChart2,
    title: "Smart Data Analysis",
    desc: "Upload any CSV or Excel dataset. Pandas computes trend direction, volatility, anomalies, moving averages, and risk signals automatically.",
  },
  {
    icon: Globe,
    title: "Web Intelligence",
    desc: "Provide up to 5 URLs and Firecrawl scrapes them for qualitative context — blog posts, news, analyst commentary.",
  },
  {
    icon: Brain,
    title: "Memento Memory",
    desc: "Every analysis is stored. Future runs reference past snapshots to detect repeated signals, trend persistence, and emerging risks over time.",
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      {/* Hero */}
      <div className="text-center mb-24 fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ background: "rgba(78,205,196,0.1)", border: "1px solid rgba(78,205,196,0.3)" }}>
          <TrendingUp size={14} className="text-accent" />
          <span className="text-accent text-sm font-medium">AI-Powered Financial Intelligence</span>
        </div>

        <h1 className="text-6xl font-bold mb-6 leading-tight">
          Turn Data into<br />
          <span className="text-accent">Analyst-Grade</span> Reports
        </h1>

        <p className="text-muted text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your financial dataset, add news sources, and get a structured trend report with
          AI memory that tracks signals across time.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/analyze" className="btn-primary flex items-center gap-2">
            Start Analysis <ArrowRight size={16} />
          </Link>
          <Link href="/reports" className="btn-ghost">
            View Reports
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: "rgba(78,205,196,0.1)" }}>
              <Icon size={20} className="text-accent" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-muted text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-8">
        <p className="section-label">How It Works</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { n: "01", t: "Upload Dataset", d: "Drop a CSV or XLSX file with date and value columns" },
            { n: "02", t: "Add Sources", d: "Optionally paste URLs of relevant financial news or blogs" },
            { n: "03", t: "AI Analysis", d: "Pandas + Firecrawl + Claude synthesize everything" },
            { n: "04", t: "Get Report", d: "Structured report with memory-backed trend detection" },
          ].map(({ n, t, d }) => (
            <div key={n}>
              <div className="text-4xl font-bold text-border mb-3 mono">{n}</div>
              <h4 className="font-semibold mb-1">{t}</h4>
              <p className="text-muted text-sm">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-20">
        <Link href="/analyze" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
          Generate Your First Report <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
