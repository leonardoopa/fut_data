from datetime import timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.models import Player
from tests.api.conftest import FixedClock
from tests.api.factories import (
    CLUBS_URL,
    buy,
    buy_documented_example,
    club_url,
    insert_player,
    register_club,
)


def test_club_detail_right_after_the_documented_purchase(
    client: TestClient, clock: FixedClock
) -> None:
    player_id, club_id = buy_documented_example(client)

    response = client.get(club_url(club_id))

    assert response.status_code == 200
    assert response.json() == {
        "id": club_id,
        "name": "Águias FC",
        "acronym": "AGU",
        "cash": 261.15,
        "squad_value": 37.0,
        "net_worth": 298.15,
        "players": [
            {
                "id": player_id,
                "name": "Meia Lua",
                "position": "MEI",
                "agility": 85,
                "age": 25,
                "condition": "MAL_CONDICIONADO",
                "base_value": 40.0,
                "market_value": 37.0,
                "pace": 70,
                "shooting": 68,
                "passing": 82,
                "dribbling": 79,
                "defending": 55,
                "physical": 64,
                "potential": 86,
                "overall": 75,
                "club_id": club_id,
                "contract": {
                    "purchase_value": 37.0,
                    "loyalty_until": "2027-03-02T10:15:00-03:00",
                    "remaining_days": 120,
                    "penalty_rate": 10,
                },
            }
        ],
    }


def test_contract_terms_are_calculated_at_each_query(client: TestClient, clock: FixedClock) -> None:
    _, club_id = buy_documented_example(client)

    clock.moment += timedelta(days=100, minutes=1)
    contract = client.get(club_url(club_id)).json()["players"][0]["contract"]

    assert (contract["remaining_days"], contract["penalty_rate"]) == (20, 5)


def test_squad_is_ordered_by_position_then_name_then_id(
    client: TestClient, clock: FixedClock
) -> None:
    club_id = register_club(client)["id"]
    names_and_positions = [
        ("Zeca Atacante", "ATA"),
        ("Bruno Meia", "MEI"),
        ("Ana-Maria Zaga", "ZAG"),
        ("Ana Lima", "ZAG"),
        ("Caio Goleiro", "GOL"),
        ("Ana Lima", "ZAG"),
    ]
    for name, position in names_and_positions:
        player = insert_player(name, position=position, base_value=Decimal("5.00"))
        assert buy(client, player.id, club_id).status_code == 200

    players = client.get(club_url(club_id)).json()["players"]

    assert [(player["name"], player["position"]) for player in players] == [
        ("Caio Goleiro", "GOL"),
        ("Ana Lima", "ZAG"),
        ("Ana Lima", "ZAG"),
        ("Ana-Maria Zaga", "ZAG"),
        ("Bruno Meia", "MEI"),
        ("Zeca Atacante", "ATA"),
    ]
    assert players[1]["id"] < players[2]["id"]


def club_names(client: TestClient, query: str = "") -> list[str]:
    response = client.get(f"{CLUBS_URL}{query}")
    assert response.status_code == 200, response.text
    return [club["name"] for club in response.json()]


def buy_and_revalue(client: TestClient, club_id: int, base_value: str) -> None:
    player = insert_player("Rico Valor", base_value=Decimal("10.00"))
    assert buy(client, player.id, club_id).status_code == 200
    Player.objects.filter(pk=player.id).update(base_value=Decimal(base_value))


@pytest.fixture
def league(client: TestClient, clock: FixedClock) -> None:
    gama_id = register_club(client, name="Gama FC", acronym="GFC")["id"]
    epsilon_id = register_club(client, name="Épsilon FC", acronym="EFC")["id"]
    register_club(client, name="Delta FC", acronym="DFC")
    register_club(client, name="Beta FC", acronym="BFC")
    buy_and_revalue(client, gama_id, "6.00")
    buy_and_revalue(client, epsilon_id, "15.00")


def test_clubs_are_listed_by_name_by_default_without_the_squad(
    client: TestClient, league: None
) -> None:
    response = client.get(CLUBS_URL)

    assert club_names(client) == ["Beta FC", "Delta FC", "Épsilon FC", "Gama FC"]
    assert "players" not in response.json()[0]
    assert club_names(client, "?sort=name&unknown=1") == club_names(client)


def test_clubs_are_listed_by_net_worth_with_ties_broken_by_name(
    client: TestClient, league: None
) -> None:
    epsilon = next(club for club in client.get(CLUBS_URL).json() if club["acronym"] == "EFC")

    assert (epsilon["cash"], epsilon["squad_value"], epsilon["net_worth"]) == (290.0, 15.0, 305.0)
    assert club_names(client, "?sort=net_worth_asc") == [
        "Gama FC",
        "Beta FC",
        "Delta FC",
        "Épsilon FC",
    ]
    assert club_names(client, "?sort=net_worth_desc") == [
        "Épsilon FC",
        "Beta FC",
        "Delta FC",
        "Gama FC",
    ]


def test_club_list_is_an_empty_array_without_clubs(client: TestClient) -> None:
    assert client.get(CLUBS_URL).json() == []


@pytest.mark.parametrize("sort", ["", "NAME", "net_worth", "name,net_worth_asc"])
def test_invalid_club_sort_is_400(client: TestClient, sort: str) -> None:
    response = client.get(CLUBS_URL, params={"sort": sort})

    assert response.status_code == 400
    assert response.json() == {"message": "Campo sort: valor fora da lista aceita."}


@pytest.mark.parametrize("club_id", ["999999", "abc", "0", "-1", "01", "2147483648"])
def test_missing_club_is_404(client: TestClient, club_id: str) -> None:
    response = client.get(club_url(club_id))

    assert response.status_code == 404
    assert response.json()["message"]
