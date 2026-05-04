import aiosqlite
import os

# On Vercel, the file system is read-only except for /tmp
if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/memento.db"
else:
    DB_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "memento.db")


async def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    return await aiosqlite.connect(DB_PATH)


async def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS analysis_runs (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                asset_context TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                error_message TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS memento_snapshots (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                analysis_id TEXT NOT NULL,
                asset_context TEXT NOT NULL,
                trend_direction TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                key_signals TEXT NOT NULL,
                summary_text TEXT NOT NULL,
                tfidf_terms TEXT NOT NULL
            )
        """)
        await db.commit()
