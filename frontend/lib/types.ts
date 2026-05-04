export interface DatasetMeta {
  dataset_id: string;
  filename: string;
  row_count: number;
  columns: string[];
  preview: Record<string, unknown>[];
}

export interface Anomaly {
  date: string;
  value: number;
  z_score: number;
}

export interface TrendAnalysis {
  direction: "bullish" | "bearish" | "neutral" | "volatile";
  slope: number;
  period_changes: Record<string, number>;
  moving_averages: Record<string, number | null>;
  volatility: number;
  peak: { date: string; value: number };
  trough: { date: string; value: number };
  anomalies: Anomaly[];
  risk_level: "low" | "medium" | "high" | "critical";
  risk_factors: string[];
}

export interface KeySignal {
  signal: string;
  strength: "weak" | "moderate" | "strong";
  direction: "positive" | "negative" | "neutral";
}

export interface StructuredReport {
  report_title: string;
  executive_summary: string;
  trend_direction: string;
  trend_confidence: number;
  key_signals: KeySignal[];
  risk_assessment: {
    overall_risk: string;
    risk_factors: string[];
    risk_narrative: string;
  };
  web_intelligence: {
    narrative_sentiment: string;
    key_themes: string[];
    notable_developments: string | null;
  };
  memory_insights: {
    repeated_signals_detected: string[];
    trend_persistence: string | null;
    emerging_risks: string[];
    snapshots_referenced: number;
  };
  actionable_takeaways: string[];
  data_quality_notes: string | null;
}

export interface ChartPoint {
  date: string;
  value: number;
  ma7?: number;
  is_anomaly: boolean;
}

export interface FullAnalysisResult {
  analysis_id: string;
  asset_context: string;
  created_at: string;
  dataset_summary: Record<string, unknown>;
  trend_analysis: TrendAnalysis;
  chart_data: ChartPoint[];
  report: StructuredReport;
}

export interface AnalysisHistoryEntry {
  id: string;
  created_at: string;
  asset_context: string;
  status: string;
  trend_direction?: string;
  risk_level?: string;
  report_title?: string;
}

export interface MementoSnapshot {
  id: string;
  created_at: string;
  analysis_id: string;
  asset_context: string;
  trend_direction: string;
  risk_level: string;
  key_signals: string[];
  summary_text: string;
}

export interface RepeatedSignal {
  signal: string;
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}
