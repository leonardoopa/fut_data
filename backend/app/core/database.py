import inspect
from collections.abc import Callable
from functools import wraps
from typing import Any

from django.db import close_old_connections, connection
from fastapi import APIRouter


def database_scoped[**P, R](endpoint: Callable[P, R]) -> Callable[P, R]:
    """Aplica ao endpoint o ciclo de conexão que o Django faz em cada requisição.

    O Django ORM guarda uma conexão por thread, e o FastAPI executa endpoints
    síncronos num pool de threads: por isso a reciclagem precisa acontecer
    dentro do próprio endpoint, na mesma thread que usa o ORM.
    """
    if inspect.iscoroutinefunction(endpoint):
        message = f"O endpoint {endpoint.__name__} usa o Django ORM e deve ser síncrono (def)."
        raise TypeError(message)

    @wraps(endpoint)
    def run(*args: P.args, **kwargs: P.kwargs) -> R:
        close_old_connections()
        try:
            return endpoint(*args, **kwargs)
        finally:
            close_old_connections()

    return run


class DatabaseRouter(APIRouter):
    """APIRouter cujos endpoints acessam o banco pelo Django ORM."""

    def add_api_route(self, path: str, endpoint: Callable[..., Any], **kwargs: Any) -> None:
        super().add_api_route(path, database_scoped(endpoint), **kwargs)


def check_database_connection() -> None:
    connection.ensure_connection()
