import os
import uuid
import json
import asyncio
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security.api_key import APIKeyHeader
from app.config import settings
from app.models.requests import AnalysisRequest
from app.models.responses import ok, err, FullAnalysisResult
from app.services import pandas_engine, firecrawl_service, llm_service, memento_service
from app.db.database import DB_PATH
import aiosqlite

router = APIRouter()
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "uploads")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "reports")


def require_key(key: str = Depends(api_key_header)):
    if key != settings.fintrend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return key


@router.post("/analysis/run")
async def run_analysis(req: AnalysisRequest, _=Depends(require_key)):
    # Load dataset
    meta_path = os.path.join(UPLOAD_DIR, f"{req.dataset_id}.json")
    if not os.path.exists(meta_path):
        return err("DATASET_NOT_FOUND", "Dataset not found. Please upload first.")

    with open(meta_path) as f:
        meta = json.load(f)

    file_path = meta["path"]
    ext = meta["ext"]

    try:
        df = pd.read_csv(file_path) if ext == ".csv" else pd.read_excel(file_path)
    except Exception as e:
        return err("READ_ERROR", f"Could not read dataset: {e}")

    if req.value_column not in df.columns:
        return err("COLUMN_NOT_FOUND", f"Column '{req.value_column}' not found in dataset")
    if req.date_column not in df.columns:
        return err("COLUMN_NOT_FOUND", f"Column '{req.date_column}' not found in dataset")

    # Run Pandas analysis + memory retrieval in parallel
    try:
        trend, chart_data, summary = await asyncio.to_thread(
            pandas_engine.analyze_dataset, df, req.value_column, req.date_column, req.date_format
        )
        scraped, memory = await asyncio.gather(
            firecrawl_service.scrape_urls(req.scrape_urls or []),
            memento_service.retrieve_context(req.asset_context, top_k=5)
        )
    except Exception as e:
        return err("ANALYSIS_ERROR", f"Analysis failed: {str(e)}")

    # Generate LLM report
    try:
        report = await asyncio.to_thread(
            lambda: asyncio.run(llm_service.generate_report(trend, scraped, memory, req.asset_context))
        )
    except Exception:
        # Fallback: generate without asyncio.run inside thread
        try:
            report = await llm_service.generate_report(trend, scraped, memory, req.asset_context)
        except Exception as e:
            return err("REPORT_ERROR", f"Report generation failed: {str(e)}")

    # Save to DB and Memento
    analysis_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    os.makedirs(REPORTS_DIR, exist_ok=True)
    report_path = os.path.join(REPORTS_DIR, f"{analysis_id}.json")

    # Extract key signals
    key_signals = [s.signal for s in (report.key_signals or [])][:5]
    summary_text = report.executive_summary or f"{req.asset_context} {trend.direction} trend with {trend.risk_level} risk."

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO analysis_runs (id, created_at, asset_context, status) VALUES (?, ?, ?, ?)",
            (analysis_id, now, req.asset_context, "complete")
        )
        await db.commit()

    await memento_service.store_snapshot(
        analysis_id, req.asset_context, trend.direction,
        trend.risk_level, key_signals, summary_text
    )

    result = FullAnalysisResult(
        analysis_id=analysis_id,
        asset_context=req.asset_context,
        created_at=now,
        dataset_summary=summary,
        trend_analysis=trend,
        chart_data=chart_data[:200],  # Cap for response size
        report=report
    )

    # Save full result to disk
    with open(report_path, "w") as f:
        json.dump(result.model_dump(), f, default=str)

    return ok(result.model_dump())


@router.get("/analysis/history")
async def get_history(_=Depends(require_key)):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM analysis_runs ORDER BY created_at DESC LIMIT 50"
        ) as cursor:
            rows = await cursor.fetchall()

    results = []
    for r in rows:
        report_path = os.path.join(REPORTS_DIR, f"{r['id']}.json")
        entry = dict(r)
        if os.path.exists(report_path):
            with open(report_path) as f:
                full = json.load(f)
            entry["trend_direction"] = full.get("trend_analysis", {}).get("direction", "unknown")
            entry["risk_level"] = full.get("trend_analysis", {}).get("risk_level", "unknown")
            entry["report_title"] = full.get("report", {}).get("report_title", "")
        results.append(entry)

    return ok(results)


@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, _=Depends(require_key)):
    report_path = os.path.join(REPORTS_DIR, f"{analysis_id}.json")
    if not os.path.exists(report_path):
        return err("NOT_FOUND", "Analysis not found")
    with open(report_path) as f:
        data = json.load(f)
    return ok(data)
