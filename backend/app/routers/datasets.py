import os
import uuid
import json
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security.api_key import APIKeyHeader
from app.config import settings
from app.models.responses import ok, err, DatasetMeta

router = APIRouter()
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "uploads")


def require_key(key: str = Depends(api_key_header)):
    if key != settings.fintrend_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return key


@router.post("/datasets/upload")
async def upload_dataset(file: UploadFile = File(...), _=Depends(require_key)):
    if file.size and file.size > settings.max_upload_size_bytes:
        return err("FILE_TOO_LARGE", f"File exceeds {settings.max_upload_size_bytes // (1024 * 1024)}MB limit")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".csv", ".xlsx"):
        return err("INVALID_FORMAT", "Only .csv and .xlsx files are supported")

    dataset_id = str(uuid.uuid4())
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(UPLOAD_DIR, f"{dataset_id}{ext}")

    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    try:
        if ext == ".csv":
            df = pd.read_csv(save_path, nrows=5)
            df_full = pd.read_csv(save_path)
        else:
            df = pd.read_excel(save_path, nrows=5)
            df_full = pd.read_excel(save_path)
    except Exception as e:
        os.remove(save_path)
        return err("PARSE_ERROR", f"Could not parse file: {str(e)}")

    # Save metadata
    meta = {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "row_count": len(df_full),
        "columns": list(df_full.columns),
        "path": save_path,
        "ext": ext
    }
    with open(os.path.join(UPLOAD_DIR, f"{dataset_id}.json"), "w") as f:
        json.dump(meta, f)

    preview = df.fillna("").to_dict(orient="records")
    return ok(DatasetMeta(
        dataset_id=dataset_id,
        filename=file.filename or "",
        row_count=len(df_full),
        columns=list(df_full.columns),
        preview=preview
    ).model_dump())


@router.get("/datasets/{dataset_id}")
async def get_dataset(dataset_id: str, _=Depends(require_key)):
    meta_path = os.path.join(UPLOAD_DIR, f"{dataset_id}.json")
    if not os.path.exists(meta_path):
        return err("NOT_FOUND", "Dataset not found")
    with open(meta_path) as f:
        meta = json.load(f)
    return ok(meta)
