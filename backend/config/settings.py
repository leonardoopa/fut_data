import pymysql

from config.environment import Environment

environment = Environment()

pymysql.install_as_MySQLdb()

INSTALLED_APPS = ["app.apps.LeagueConfig"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "HOST": environment.mysql_host,
        "PORT": environment.mysql_port,
        "NAME": environment.mysql_database,
        "USER": environment.mysql_user,
        "PASSWORD": environment.mysql_password,
        "OPTIONS": {"charset": "utf8mb4"},
    }
}

USE_TZ = True
TIME_ZONE = "UTC"

CORS_ORIGINS = environment.cors_origin_list

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
    "root": {"handlers": ["console"], "level": environment.log_level},
}
