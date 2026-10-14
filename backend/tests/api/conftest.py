from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.core.clock import get_clock
from tests.api.factories import BOUGHT_AT


class FixedClock:
    """Relógio parado no instante escolhido pelo teste."""

    def __init__(self, moment: datetime) -> None:
        self.moment = moment

    def __call__(self) -> datetime:
        return self.moment


@pytest.fixture
def clock(client: TestClient) -> FixedClock:
    """Para o relógio dos casos de uso no momento da compra do exemplo do enunciado."""
    fixed_clock = FixedClock(BOUGHT_AT)
    client.app.dependency_overrides[get_clock] = lambda: fixed_clock
    return fixed_clock
