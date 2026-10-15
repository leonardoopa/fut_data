from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]


class Environment(BaseSettings):
    """Variáveis de ambiente da API, lidas do processo ou do arquivo .env da raiz."""

    model_config = SettingsConfigDict(env_file=REPOSITORY_ROOT / ".env", extra="ignore")

    mysql_host: str = "localhost"
    mysql_port: int = 3306
    mysql_database: str = "passe"
    mysql_user: str = "passe"
    mysql_password: str
    cors_origins: str = "http://localhost:5173"
    log_level: LogLevel = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
