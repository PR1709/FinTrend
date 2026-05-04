from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    firecrawl_api_key: str = ""
    fintrend_api_key: str = "dev-secret-key"
    allowed_origins: str = "http://localhost:3000"
    max_upload_size_bytes: int = 100 * 1024 * 1024
    max_scrape_urls: int = 5
    llm_model: str = "gemini-2.5-flash"

    class Config:
        env_file = ".env"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
