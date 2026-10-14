"""Ponto de entrada ASGI: inicializa o Django ORM antes de carregar a API."""

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from app.main import create_app

app = create_app()
