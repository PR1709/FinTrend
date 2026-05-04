from pydantic import BaseModel
from typing import Optional, List


class AnalysisRequest(BaseModel):
    dataset_id: str
    value_column: str
    date_column: str
    date_format: Optional[str] = None
    asset_context: str
    scrape_urls: Optional[List[str]] = []
