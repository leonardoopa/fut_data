import logging

import pytest
from fastapi.testclient import TestClient

FRONTEND_ORIGIN = "http://localhost:5173"


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.parametrize("path", ["/api/v1/inexistente", "/api/v1/health/"])
def test_unknown_path_returns_json_404_without_redirect(client: TestClient, path: str) -> None:
    response = client.get(path, follow_redirects=False)

    assert response.status_code == 404
    assert response.headers["content-type"].startswith("application/json")
    assert response.json()["message"]


def test_unsupported_method_returns_json_message(client: TestClient) -> None:
    response = client.delete("/api/v1/health")

    assert response.status_code == 405
    assert response.json()["message"]


def test_cors_allows_only_configured_origin(client: TestClient) -> None:
    preflight = {"Access-Control-Request-Method": "GET"}

    allowed = client.options("/api/v1/health", headers={"Origin": FRONTEND_ORIGIN, **preflight})
    denied = client.options("/api/v1/health", headers={"Origin": "http://evil.test", **preflight})

    assert allowed.headers["access-control-allow-origin"] == FRONTEND_ORIGIN
    assert "access-control-allow-origin" not in denied.headers


def test_each_request_is_logged_with_method_path_and_status(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="app.access"):
        client.get("/api/v1/inexistente")

    assert "GET /api/v1/inexistente 404" in caplog.text
