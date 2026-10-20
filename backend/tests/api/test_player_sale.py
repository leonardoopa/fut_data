from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.models import Club, Contract, LineupSlot, MarketTransaction, Player
from tests.api.conftest import FixedClock
from tests.api.factories import (
    DOCUMENTED_SALE,
    SOLD_AT,
    buy,
    buy_documented_example,
    insert_player,
    recover_and_sell,
    register_club,
    register_player,
    sell,
    stored_cash,
)


def test_documented_sale(client: TestClient, clock: FixedClock) -> None:
    player_id, club_id = buy_documented_example(client)
    clock.moment = SOLD_AT

    response = recover_and_sell(client, player_id)

    body = response.json()
    assert response.status_code == 200
    assert body == {
        "id": body["id"],
        "club_id": club_id,
        "player_id": player_id,
        **DOCUMENTED_SALE,
        "purchase_value": 37.0,
        "remaining_days": 117,
        "penalty_rate": 10,
        "contract_status": "RESCINDIDO",
        "club_cash": 296.85,
    }
    contract = Contract.objects.get()
    assert (contract.status, contract.ended_at) == ("RESCINDIDO", SOLD_AT)
    assert Player.objects.get(pk=player_id).club_id is None
    assert stored_cash(club_id) == Decimal("296.85")
    assert client.get(f"/api/v1/clubs/{club_id}").json()["players"] == []


def test_sale_after_the_loyalty_period_ends_the_contract_without_penalty(
    client: TestClient, clock: FixedClock
) -> None:
    club_id = register_club(client)["id"]
    player = insert_player("Fiel Ate Hoje", base_value=Decimal("20.00"))
    buy(client, player.id, club_id, "2026-11-03T10:15-03:00")
    clock.moment += timedelta(days=2)

    body = sell(client, player.id).json()

    assert (body["penalty"], body["remaining_days"], body["penalty_rate"]) == (
        0.0,
        0,
        0,
    )
    assert (body["contract_status"], body["cash_change"], body["club_cash"]) == (
        "ENCERRADO",
        20.0,
        300.0,
    )
    assert Contract.objects.get().status == "ENCERRADO"


def test_sold_starter_leaves_the_lineup_and_the_formation_stays(
    client: TestClient, clock: FixedClock
) -> None:
    club_id = register_club(client)["id"]
    starter, teammate = (insert_player(name) for name in ("Sai Agora", "Fica Aqui"))
    for player in (starter, teammate):
        buy(client, player.id, club_id)
        LineupSlot.objects.create(club_id=club_id, player=player)
    Club.objects.filter(pk=club_id).update(formation="2-2")

    response = sell(client, starter.id)

    assert response.status_code == 200
    assert list(LineupSlot.objects.values_list("player_id", flat=True)) == [teammate.id]
    assert Club.objects.get(pk=club_id).formation == "2-2"


def test_sale_ignores_a_body_sent_with_the_request(
    client: TestClient, clock: FixedClock
) -> None:
    player_id, _ = buy_documented_example(client)

    response = client.post(f"/api/v1/players/{player_id}/sell", json={"club_id": 999})

    assert response.status_code == 200


def test_free_player_cannot_be_sold_and_nothing_is_written(client: TestClient) -> None:
    player_id = register_player(client)["id"]

    response = sell(client, player_id)

    assert response.status_code == 409
    assert response.json() == {"message": "Jogador livre não pode ser vendido."}
    assert not MarketTransaction.objects.exists()


@pytest.mark.parametrize("player_id", ["999999", "abc", "0", "01"])
def test_sale_of_a_missing_player_is_404(client: TestClient, player_id: str) -> None:
    response = sell(client, player_id)

    assert response.status_code == 404
    assert response.json()["message"]


def test_sale_of_a_deleted_player_is_404(client: TestClient) -> None:
    player = insert_player("Fora Daqui", deleted_at=timezone.now())

    response = sell(client, player.id)

    assert response.status_code == 404
    assert response.json() == {"message": "Jogador não encontrado."}
