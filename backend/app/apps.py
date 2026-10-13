from django.apps import AppConfig


class LeagueConfig(AppConfig):
    """Registra o pacote `app` no Django apenas para o ORM e as migrations."""

    name = "app"
    label = "league"
    verbose_name = "Liga"
    default_auto_field = "django.db.models.AutoField"
