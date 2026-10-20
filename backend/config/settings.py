import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]

load_dotenv(REPOSITORY_ROOT / ".env")

pymysql.install_as_MySQLdb()

INSTALLED_APPS = ["app.apps.LeagueConfig"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "HOST": os.getenv("MYSQL_HOST", "localhost"),
        "PORT": os.getenv("MYSQL_PORT", "3306"),
        "NAME": os.getenv("MYSQL_DATABASE", "passe"),
        "USER": os.getenv("MYSQL_USER", "passe"),
        "PASSWORD": os.getenv("MYSQL_PASSWORD"),
        "OPTIONS": {"charset": "utf8mb4"},
    }
}

USE_TZ = True
TIME_ZONE = "UTC"

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
            "datefmt": "%Y-%m-%dT%H:%M:%S%z",
        }
    },
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "standard"}},
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
