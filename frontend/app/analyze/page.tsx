"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Plus, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { DatasetMeta } from "@/lib/types";

export default function AnalyzePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const [valueCol, setValueCol] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [assetCtx, setAssetCtx] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);

  const uploadFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx)$/i)) {
      setError("Only .csv and .xlsx files are supported");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const meta = await api.datasets.upload(file);
      setDataset(meta);
      // Auto-detect columns
      const numericGuess = meta.columns.find(c =>
        ["close", "value", "price", "open", "high", "low", "volume", "revenue", "amount"].some(k => c.toLowerCase().includes(k))
      ) || meta.columns[1] || "";
      const dateGuess = meta.columns.find(c =>
        ["date", "time", "day", "period", "week", "month"].some(k => c.toLowerCase().includes(k))
      ) || meta.columns[0] || "";
      setValueCol(numericGuess);
      setDateCol(dateGuess);
    } catch (e) {
      setError(String(e));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const addUrl = () => setUrls(u => u.length < 5 ? [...u, ""] : u);
  const removeUrl = (i: number) => setUrls(u => u.filter((_, j) => j !== i));
  const setUrl = (i: number, v: string) => setUrls(u => u.map((x, j) => j === i ? v : x));

  const runAnalysis = async () => {
    if (!dataset || !valueCol || !dateCol || !assetCtx) {
      setError("Please fill in all required fields");
      return;
    }
    setAnalyzing(true);
    setError("");
    try {
      const result = await api.analysis.run({
        dataset_id: dataset.dataset_id,
        value_column: valueCol,
        date_column: dateCol,
        asset_context: assetCtx,
        scrape_urls: urls.filter(u => u.trim().startsWith("http")),
      });
      router.push(`/reports/${result.analysis_id}`);
    } catch (e) {
      setError(String(e));
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">New Analysis</h1>
      <p className="text-muted mb-10">Upload a dataset, configure columns, and generate an AI-powered report.</p>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl"
          style={{ background: "rgba(255,77,106,0.1)", border: "1px solid rgba(255,77,106,0.3)" }}>
          <AlertCircle size={16} className="text-bear shrink-0" />
          <span className="text-bear text-sm">{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="card p-6 mb-6">
        <p className="section-label">Step 1 — Upload Dataset</p>
        {!dataset ? (
          <div
            className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all"
            style={{ borderColor: dragging ? "#4ECDC4" : "#242436", background: dragging ? "rgba(78,205,196,0.05)" : "transparent" }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={onFileChange} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-accent animate-spin" />
                <p className="text-muted">Uploading and parsing...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={32} className="text-muted" />
                <p className="font-medium">Drop your file here or click to browse</p>
                <p className="text-muted text-sm">Supports .csv and .xlsx</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between p-4 rounded-xl" style={{ background: "#0D0D14" }}>
            <div>
              <p className="font-medium text-accent">{dataset.filename}</p>
              <p className="text-muted text-sm mt-1">{dataset.row_count.toLocaleString()} rows · {dataset.columns.length} columns</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {dataset.columns.map(c => (
                  <span key={c} className="px-2 py-1 rounded text-xs mono" style={{ background: "#1C1C2E", color: "#8888AA" }}>{c}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setDataset(null)} className="text-muted hover:text-white p-1">
              <X size={18} />
            </button>
          </div>
        )}

        {dataset && (
          <div className="mt-4 overflow-x-auto">
            <p className="section-label mb-2">Preview (first 5 rows)</p>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  {dataset.columns.map(c => (
                    <th key={c} className="text-left py-2 px-3 text-muted border-b border-border">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.preview.map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-surface-1">
                    {dataset.columns.map(c => (
                      <td key={c} className="py-2 px-3 mono text-xs">{String(row[c] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Configuration */}
      {dataset && (
        <>
          <div className="card p-6 mb-6">
            <p className="section-label">Step 2 — Configure Analysis</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted block mb-2">Date Column *</label>
                <select className="input" value={dateCol} onChange={e => setDateCol(e.target.value)}>
                  <option value="">Select column...</option>
                  {dataset.columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted block mb-2">Value Column *</label>
                <select className="input" value={valueCol} onChange={e => setValueCol(e.target.value)}>
                  <option value="">Select column...</option>
                  {dataset.columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted block mb-2">Asset Context * <span className="text-muted">(e.g. NIFTY50)</span></label>
                <input className="input" value={assetCtx} onChange={e => setAssetCtx(e.target.value)} placeholder="NIFTY50, RELIANCE, S&P500..." />
              </div>
            </div>
          </div>

          <div className="card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="section-label mb-0">Step 3 — Web Sources (optional)</p>
              <button onClick={addUrl} disabled={urls.length >= 5}
                className="flex items-center gap-1 text-accent text-sm hover:opacity-70 disabled:opacity-30">
                <Plus size={14} /> Add URL
              </button>
            </div>
            <p className="text-muted text-sm mb-4">Add up to 5 financial news or blog URLs for qualitative context.</p>
            <div className="flex flex-col gap-3">
              {urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" value={url} onChange={e => setUrl(i, e.target.value)}
                    placeholder="https://example.com/financial-article" />
                  {urls.length > 1 && (
                    <button onClick={() => removeUrl(i)} className="text-muted hover:text-bear p-2">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={runAnalysis} disabled={analyzing || !valueCol || !dateCol || !assetCtx}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4">
            {analyzing ? <><Loader2 size={18} className="animate-spin" /> Generating Report...</> : "Generate Report"}
          </button>
          {analyzing && (
            <p className="text-muted text-sm text-center mt-3">
              Running analysis · scraping sources · generating AI report — this takes 15–45 seconds
            </p>
          )}
        </>
      )}
    </div>
  );
}
