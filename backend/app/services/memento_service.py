import json
import uuid
import aiosqlite
from datetime import datetime
from typing import List
from app.db.database import DB_PATH
import os


async def store_snapshot(
    analysis_id: str,
    asset_context: str,
    trend_direction: str,
    risk_level: str,
    key_signals: List[str],
    summary_text: str,
) -> str:
    snapshot_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    # Simple keyword terms for similarity
    tfidf_terms = json.dumps(list(set(
        summary_text.lower().split() +
        [s.lower() for s in key_signals] +
        [asset_context.lower(), trend_direction.lower(), risk_level.lower()]
    )))

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO memento_snapshots
               (id, created_at, analysis_id, asset_context, trend_direction, risk_level, key_signals, summary_text, tfidf_terms)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (snapshot_id, now, analysis_id, asset_context, trend_direction,
             risk_level, json.dumps(key_signals), summary_text, tfidf_terms)
        )
        await db.commit()
    return snapshot_id


async def retrieve_context(asset_context: str, top_k: int = 5) -> List[dict]:
    """Get recent snapshots for this asset."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT * FROM memento_snapshots
               WHERE asset_context = ?
               ORDER BY created_at DESC LIMIT ?""",
            (asset_context, top_k)
        ) as cursor:
            rows = await cursor.fetchall()
    return [
        {
            "id": r["id"],
            "created_at": r["created_at"],
            "analysis_id": r["analysis_id"],
            "asset_context": r["asset_context"],
            "trend_direction": r["trend_direction"],
            "risk_level": r["risk_level"],
            "key_signals": json.loads(r["key_signals"]),
            "summary_text": r["summary_text"],
        }
        for r in rows
    ]


async def get_history(asset_context: str, limit: int = 20) -> List[dict]:
    return await retrieve_context(asset_context, limit)


async def detect_repeated_signals(asset_context: str) -> List[dict]:
    """Find signals appearing in 3+ snapshots in last 90 days."""
    from datetime import timedelta
    cutoff = (datetime.utcnow() - timedelta(days=90)).isoformat()

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT key_signals FROM memento_snapshots
               WHERE asset_context = ? AND created_at >= ?""",
            (asset_context, cutoff)
        ) as cursor:
            rows = await cursor.fetchall()

    signal_counts: dict = {}
    for r in rows:
        for sig in json.loads(r["key_signals"]):
            signal_counts[sig] = signal_counts.get(sig, 0) + 1

    return [
        {"signal": sig, "count": count}
        for sig, count in signal_counts.items()
        if count >= 3
    ]


async def get_all_assets() -> List[str]:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT DISTINCT asset_context FROM memento_snapshots ORDER BY asset_context"
        ) as cursor:
            rows = await cursor.fetchall()
    return [r[0] for r in rows]
