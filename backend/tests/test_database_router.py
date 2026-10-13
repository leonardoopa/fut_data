import threading

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core import database
from app.core.database import DatabaseRouter


def test_connections_are_recycled_in_the_thread_that_runs_the_endpoint(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    recycling_threads: list[int] = []
    endpoint_threads: list[int] = []
    monkeypatch.setattr(
        database, "close_old_connections", lambda: recycling_threads.append(threading.get_ident())
    )
    router = DatabaseRouter()

    @router.get("/probe")
    def probe() -> dict[str, str]:
        endpoint_threads.append(threading.get_ident())
        return {"status": "ok"}

    app = FastAPI()
    app.include_router(router)
    response = TestClient(app).get("/probe")

    assert response.json() == {"status": "ok"}
    assert recycling_threads == endpoint_threads * 2


def test_async_endpoint_is_rejected() -> None:
    router = DatabaseRouter()

    async def probe() -> None:
        return None

    with pytest.raises(TypeError, match="deve ser síncrono"):
        router.add_api_route("/probe", probe)
