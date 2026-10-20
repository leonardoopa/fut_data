from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.domain.club import INITIAL_CASH
from tests.api.conftest import FixedClock
from tests.api.factories import (
    DOCUMENTED_PURCHASE,
    DOCUMENTED_SALE,
    SOLD_AT,
    buy,
    buy_documented_example,
    cash_change_total,
    insert_player,
    player_url,
    recover_and_sell,
    register_club,
    sell,
    stored_cash,
    transactions_url,
)

pytestmark = pytest.mark.usefixtures("clock")

ZERO_SUMMARY = {
    "total_spent": 0.0,
    "total_received": 0.0,
    "total_fees": 0.0,
    "total_penalties": 0.0,
    "total_profit": 0.0,
}


@pytest.fixture
def documented_history(client: TestClient, clock: FixedClock) -> tuple[int, int]:
    player_id, club_id = buy_documented_example(client)
    clock.moment = SOLD_AT
    recover_and_sell(client, player_id)
    return player_id, club_id


def history(client: TestClient, club_id: int, **params: str) -> dict[str, object]:
    response = client.get(transactions_url(club_id), params=params)
    assert response.status_code == 200, response.text
    return response.json()


def test_documented_history_filtered_by_sales(
    client: TestClient, documented_history: tuple[int, int]
) -> None:
    player_id, club_id = documented_history

    body = history(client, club_id, type="VENDA")

    assert body == {
        "data": [
            {"id": body["data"][0]["id"], "club_id": club_id, "player_id": player_id}
            | DOCUMENTED_SALE
        ],
        "summary": {
            "total_spent": 0.0,
            "total_received": 35.7,
            "total_fees": 0.3,
            "total_penalties": 4.0,
            "total_profit": 3.0,
        },
    }


def test_documented_history_without_filters_lists_the_most_recent_first(
    client: TestClient, documented_history: tuple[int, int]
) -> None:
    _, club_id = documented_history

    body = history(client, club_id)

    assert [item["type"] for item in body["data"]] == ["VENDA", "COMPRA"]
    assert {
        key: body["data"][1][key] for key in DOCUMENTED_PURCHASE
    } == DOCUMENTED_PURCHASE
    assert body["summary"] == {
        "total_spent": 38.85,
        "total_received": 35.7,
        "total_fees": 2.15,
        "total_penalties": 4.0,
        "total_profit": 3.0,
    }
    assert history(client, club_id, type="COMPRA,VENDA") == body


def test_transactions_at_the_same_moment_are_ordered_by_id_descending(
    client: TestClient,
) -> None:
    club_id = register_club(client)["id"]
    players = [
        insert_player(name) for name in ("Primeiro Comprado", "Segundo Comprado")
    ]
    for player in players:
        buy(client, player.id, club_id)

    body = history(client, club_id)

    assert [item["player_name"] for item in body["data"]] == [
        "Segundo Comprado",
        "Primeiro Comprado",
    ]


def test_cash_is_always_the_initial_cash_plus_every_cash_change(
    client: TestClient, clock: FixedClock
) -> None:
    club_id = register_club(client)["id"]
    players = [
        insert_player(name, base_value=Decimal(value))
        for name, value in (("Alto Valor", "48.00"), ("Baixo Valor", "12.00"))
    ]
    for player in players:
        buy(client, player.id, club_id)
    clock.moment += timedelta(days=40)
    sell(client, players[0].id)

    assert stored_cash(club_id) == INITIAL_CASH + cash_change_total(club_id)
    assert stored_cash(club_id) == Decimal("280.80")


def test_history_filtered_by_player(client: TestClient) -> None:
    club_id = register_club(client)["id"]
    followed, other = (
        insert_player(name) for name in ("Seguido Aqui", "Outro Jogador")
    )
    for player in (followed, other):
        buy(client, player.id, club_id)

    body = history(client, club_id, player_id=str(followed.id))

    assert [item["player_id"] for item in body["data"]] == [followed.id]
    assert body["summary"]["total_spent"] == 10.0


def test_player_without_transactions_in_the_club_gives_an_empty_history(
    client: TestClient,
) -> None:
    club_id = register_club(client)["id"]
    player = insert_player("Nunca Comprado")

    assert history(client, club_id, player_id=str(player.id)) == {
        "data": [],
        "summary": ZERO_SUMMARY,
    }


def test_new_club_has_an_empty_history(client: TestClient) -> None:
    club_id = register_club(client)["id"]

    assert history(client, club_id) == {"data": [], "summary": ZERO_SUMMARY}


def test_transaction_keeps_the_player_name_of_the_moment(
    client: TestClient, documented_history: tuple[int, int]
) -> None:
    player_id, club_id = documented_history
    profile = {"name": "Novo Nome", "position": "MEI", "agility": 85, "age": 25}
    client.put(player_url(player_id), json=profile)

    names = {item["player_name"] for item in history(client, club_id)["data"]}

    assert names == {"Meia Lua"}


@pytest.mark.parametrize(
    ("params", "field"),
    [
        ({"type": ""}, "type"),
        ({"type": "compra"}, "type"),
        ({"type": "TROCA"}, "type"),
        ({"type": "COMPRA,COMPRA"}, "type"),
        ({"type": "COMPRA, VENDA"}, "type"),
        ({"type": "COMPRA,"}, "type"),
        ({"player_id": ""}, "player_id"),
        ({"player_id": "abc"}, "player_id"),
        ({"player_id": "0"}, "player_id"),
        ({"player_id": "01"}, "player_id"),
    ],
)
def test_invalid_filter_is_400(
    client: TestClient, params: dict[str, str], field: str
) -> None:
    club_id = register_club(client)["id"]

    response = client.get(transactions_url(club_id), params=params)

    assert response.status_code == 400
    assert response.json()["message"].startswith(f"Campo {field}:")


def test_missing_or_deleted_player_in_the_filter_is_404(client: TestClient) -> None:
    club_id = register_club(client)["id"]
    deleted = insert_player("Fora Daqui", deleted_at=timezone.now())

    responses = [
        client.get(transactions_url(club_id), params={"player_id": str(player_id)})
        for player_id in (999999, deleted.id)
    ]

    assert [response.status_code for response in responses] == [404, 404]
    assert all(
        response.json() == {"message": "Jogador não encontrado."}
        for response in responses
    )


@pytest.mark.parametrize("club_id", ["999999", "abc", "0"])
def test_history_of_a_missing_club_is_404(client: TestClient, club_id: str) -> None:
    response = client.get(transactions_url(club_id))

    assert response.status_code == 404
    assert response.json()["message"]
