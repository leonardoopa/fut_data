import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client(transactional_db: None) -> TestClient:
    return TestClient(create_app())
