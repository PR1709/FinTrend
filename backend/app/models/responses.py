from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


def ok(data: Any) -> dict:
    return {"success": True, "data": data, "error": None, "timestamp": datetime.utcnow().isoformat()}


def err(code: str, message: str) -> dict:
    return {"success": False, "data": None, "error": {"code": code, "message": message}, "timestamp": datetime.utcnow().isoformat()}


class DatasetMeta(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    columns: List[str]
    preview: List[dict]


class Anomaly(BaseModel):
    date: str
    value: float
    z_score: float


class TrendAnalysis(BaseModel):
    direction: str
    slope: float
    period_changes: dict
    moving_averages: dict
    volatility: float
    peak: dict
    trough: dict
    anomalies: List[Anomaly]
    risk_level: str
    risk_factors: List[str]


class KeySignal(BaseModel):
    signal: str
    strength: str
    direction: str


class StructuredReport(BaseModel):
    report_title: str
    executive_summary: str
    trend_direction: str
    trend_confidence: float
    key_signals: List[KeySignal]
    risk_assessment: dict
    web_intelligence: dict
    memory_insights: dict
    actionable_takeaways: List[str]
    data_quality_notes: Optional[str] = None


class FullAnalysisResult(BaseModel):
    analysis_id: str
    asset_context: str
    created_at: str
    dataset_summary: dict
    trend_analysis: TrendAnalysis
    chart_data: List[dict]
    report: StructuredReport


class MementoSnapshot(BaseModel):
    id: str
    created_at: str
    analysis_id: str
    asset_context: str
    trend_direction: str
    risk_level: str
    key_signals: List[str]
    summary_text: str
