from decimal import Decimal
from typing import Any

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.models import Club, Contract, MarketTransaction, Player
from tests.api.factories import (
    BOUGHT_AT,
    DOCUMENTED_PURCHASE,
    buy,
    insert_player,
    player_url,
    recover_and_sell,
    register_club,
    register_player,
    sign_player,
    stored_cash,
)

pytestmark = pytest.mark.usefixtures("clock")


@pytest.fixture
def club_id(client: TestClient) -> int:
    return register_club(client)["id"]


@pytest.fixture
def player_id(client: TestClient) -> int:
    player_id = register_player(client)["id"]
    client.patch(f"{player_url(player_id)}/condition", json={"condition": "MAL_CONDICIONADO"})
    return player_id


def assert_nothing_bought(player_id: int, club_id: int) -> None:
    assert Player.objects.get(pk=player_id).club_id is None
    assert stored_cash(club_id) == Decimal("300.00")
    assert not Contract.objects.exists()
    assert not MarketTransaction.objects.exists()


def test_documented_purchase(client: TestClient, player_id: int, club_id: int) -> None:
    response = buy(client, player_id, club_id)

    body = response.json()
    assert response.status_code == 200
    assert body == {
        "id": body["id"],
        "club_id": club_id,
        "player_id": player_id,
        **DOCUMENTED_PURCHASE,
        "contract": {
            "purchase_value": 37.0,
            "loyalty_until": "2027-03-02T10:15:00-03:00",
            "status": "ATIVO",
        },
        "club_cash": 261.15,
    }
    contract = Contract.objects.get()
    assert (contract.player_id, contract.club_id, contract.started_at) == (
        player_id,
        club_id,
        BOUGHT_AT,
    )
    assert Player.objects.get(pk=player_id).club_id == club_id
    assert stored_cash(club_id) == Decimal("261.15")


def test_player_up_to_30_pays_no_fee(client: TestClient, club_id: int) -> None:
    player = insert_player("Barato Bom", base_value=Decimal("30.00"))

    body = buy(client, player.id, club_id).json()

    assert (body["value"], body["fee"], body["cash_change"]) == (30.0, 0.0, -30.0)


@pytest.mark.parametrize(
    ("body", "message"),
    [
        ({"loyalty_until": "2027-03-02T10:15-03:00"}, "Campo club_id: é obrigatório."),
        ({"club_id": None, "loyalty_until": "2027-03-02T10:15-03:00"}, "Campo club_id:"),
        ({"club_id": 0, "loyalty_until": "2027-03-02T10:15-03:00"}, "Campo club_id: deve ser"),
        ({"club_id": -1, "loyalty_until": "2027-03-02T10:15-03:00"}, "Campo club_id: deve ser"),
        ({"club_id": "1", "loyalty_until": "2027-03-02T10:15-03:00"}, "Campo club_id: deve ser"),
        ({"club_id": 1.5, "loyalty_until": "2027-03-02T10:15-03:00"}, "Campo club_id: deve ser"),
        ({"club_id": 1}, "Campo loyalty_until: é obrigatório."),
        ({"club_id": 1, "loyalty_until": "2027-03-02T10:15:00-03:00"}, "Campo loyalty_until:"),
        ({"club_id": 1, "loyalty_until": "2027-03-02T10:15Z"}, "Campo loyalty_until:"),
        ({"club_id": 1, "loyalty_until": "2027-02-30T10:15-03:00"}, "Campo loyalty_until:"),
        ({"club_id": 1, "loyalty_until": 20270302}, "Campo loyalty_until:"),
    ],
)
def test_invalid_purchase_body_is_400_and_nothing_is_written(
    client: TestClient, player_id: int, club_id: int, body: dict[str, Any], message: str
) -> None:
    response = client.post(f"{player_url(player_id)}/buy", json=body)

    assert response.status_code == 400
    assert response.json()["message"].startswith(message)
    assert_nothing_bought(player_id, club_id)


@pytest.mark.parametrize(
    ("loyalty_until", "message"),
    [
        ("2026-11-01T10:15-03:00", "posterior ao momento da compra"),
        ("2026-11-02T10:15-03:00", "posterior ao momento da compra"),
        ("2029-11-01T10:16-03:00", "no máximo 1095 dias"),
    ],
)
def test_loyalty_outside_the_window_is_400_and_nothing_is_written(
    client: TestClient, player_id: int, club_id: int, loyalty_until: str, message: str
) -> None:
    response = buy(client, player_id, club_id, loyalty_until)

    assert response.status_code == 400
    assert message in response.json()["message"]
    assert_nothing_bought(player_id, club_id)


@pytest.mark.parametrize("loyalty_until", ["2026-11-02T10:16-03:00", "2029-11-01T10:15-03:00"])
def test_loyalty_at_the_edges_of_the_window_is_accepted(
    client: TestClient, player_id: int, club_id: int, loyalty_until: str
) -> None:
    assert buy(client, player_id, club_id, loyalty_until).status_code == 200


def test_missing_club_is_404_and_nothing_is_written(client: TestClient, player_id: int) -> None:
    response = buy(client, player_id, 999999)

    assert response.status_code == 404
    assert response.json() == {"message": "Clube não encontrado."}
    assert Player.objects.get(pk=player_id).club_id is None


def test_missing_or_deleted_player_is_404(client: TestClient, club_id: int) -> None:
    deleted = insert_player("Fora Daqui", deleted_at=timezone.now())

    responses = [buy(client, player, club_id) for player in (999999, deleted.id, "abc", "01")]

    assert [response.status_code for response in responses] == [404, 404, 404, 404]
    assert responses[1].json() == {"message": "Jogador não encontrado."}
    assert stored_cash(club_id) == Decimal("300.00")


def test_player_who_is_not_free_is_409(client: TestClient, player_id: int, club_id: int) -> None:
    buy(client, player_id, club_id)
    other_club_id = register_club(client, name="Sport Recife", acronym="SPR")["id"]

    response = buy(client, player_id, other_club_id)

    assert response.status_code == 409
    assert response.json() == {"message": "O jogador não está livre: já pertence a um clube."}
    assert stored_cash(other_club_id) == Decimal("300.00")
    assert MarketTransaction.objects.count() == 1


def test_cost_above_half_of_the_cash_is_409(client: TestClient, club_id: int) -> None:
    player = insert_player("Caro Demais", base_value=Decimal("143.00"))

    response = buy(client, player.id, club_id)

    assert response.status_code == 409
    assert "passa de 50% do caixa" in response.json()["message"]
    assert_nothing_bought(player.id, club_id)


def test_thirteenth_player_is_409(client: TestClient, player_id: int, club_id: int) -> None:
    club = Club.objects.get(pk=club_id)
    for number in range(12):
        sign_player(insert_player(f"Titular {chr(65 + number)}").id, club)

    response = buy(client, player_id, club_id)

    assert response.status_code == 409
    assert response.json() == {"message": "O elenco já tem o máximo de 12 jogadores."}
    assert_nothing_bought(player_id, club_id)


def test_club_cannot_buy_back_a_player_it_sold_but_others_can(
    client: TestClient, player_id: int, club_id: int
) -> None:
    buy(client, player_id, club_id)
    recover_and_sell(client, player_id)
    other_club_id = register_club(client, name="Sport Recife", acronym="SPR")["id"]

    refused = buy(client, player_id, club_id)
    accepted = buy(client, player_id, other_club_id)

    assert refused.status_code == 409
    assert refused.json() == {
        "message": "O clube não pode comprar um jogador que ele mesmo já vendeu."
    }
    assert accepted.status_code == 200
    assert accepted.json()["club_id"] == other_club_id
