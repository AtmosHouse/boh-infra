"""Application configuration settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the service directory (where .env file should be)
SERVICE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API settings
    app_name: str = "Invite & RSVP API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database settings — SQLite for local dev, Postgres via DATABASE_URL
    database_url: str = "sqlite+aiosqlite:///./invite.db"

    # CORS settings
    cors_origins: list[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=SERVICE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def sync_database_url(self) -> str:
        """Get synchronous database URL for Alembic migrations."""
        return self.database_url.replace("+asyncpg", "").replace("+aiosqlite", "")


settings = Settings()
