import inspect
from collections.abc import Callable
from functools import wraps
from typing import Any

from django.db import close_old_connections, connection
from fastapi import APIRouter


def database_scoped[**P, R](endpoint: Callable[P, R]) -> Callable[P, R]:
    """Recycle the ORM connection in the endpoint's own thread; Django keeps one per thread."""
    if inspect.iscoroutinefunction(endpoint):
        message = f"Endpoint {endpoint.__name__} uses the Django ORM and must be synchronous (def)."
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
    def add_api_route(self, path: str, endpoint: Callable[..., Any], **kwargs: Any) -> None:
        super().add_api_route(path, database_scoped(endpoint), **kwargs)


def check_database_connection() -> None:
    connection.ensure_connection()
