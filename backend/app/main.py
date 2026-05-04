from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import init_db
from app.routers import health, datasets, analysis, memento

app = FastAPI(title="FinTrend AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(datasets.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(memento.router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    await init_db()
