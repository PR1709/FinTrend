from fastapi import APIRouter, Depends, HTTPException
from fastapi.security.api_key import APIKeyHeader
from app.config import settings
from app.models.responses import ok, err
from app.services import memento_service

router = APIRouter()
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_key(key: str = Depends(api_key_header)):
    if key != settings.fintrend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return key


@router.get("/memento/assets")
async def list_assets(_=Depends(require_key)):
    assets = await memento_service.get_all_assets()
    return ok(assets)


@router.get("/memento/history")
async def get_history(asset: str, limit: int = 20, _=Depends(require_key)):
    history = await memento_service.get_history(asset, limit)
    return ok(history)


@router.get("/memento/signals")
async def get_signals(asset: str, _=Depends(require_key)):
    signals = await memento_service.detect_repeated_signals(asset)
    return ok(signals)
