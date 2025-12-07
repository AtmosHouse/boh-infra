"""Application configuration settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the backend directory (where .env file should be)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API settings
    app_name: str = "Recipe & Shopping List API"
    app_version: str = "1.0.0"
    debug: bool = False

    # OpenAI API settings
    
    openai_api_key: str = "sk-placeholder"
    openai_model: str = "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8"

    # Database settings
    database_url: str

    # CORS settings
    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def sync_database_url(self) -> str:
        """Get synchronous database URL for Alembic migrations."""
        return self.database_url.replace("+asyncpg", "")


settings = Settings()
