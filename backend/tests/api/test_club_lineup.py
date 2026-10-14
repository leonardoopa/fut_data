from typing import Any

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.domain.club import INITIAL_CASH
from app.models import Club, LineupSlot, Player
from tests.api.conftest import FixedClock
from tests.api.factories import (
    FORMATION_POSITIONS,
    buy_squad,
    create_club,
    field_lineup,
    insert_player,
    lineup_url,
    player_url,
    put_lineup,
    register_club,
    sell,
    sign_squad,
    stored_cash,
)

TWO_ONE_ONE = FORMATION_POSITIONS["2-1-1"]


@pytest.fixture
def club() -> Club:
    return create_club(formation=None)


@pytest.fixture
def squad(club: Club) -> list[Player]:
    """GOL, ZAG, LAT, MEI e ATA, nessa ordem do elenco."""
    return sign_squad(club, TWO_ONE_ONE)


@pytest.fixture
def bought_squad(client: TestClient, clock: FixedClock) -> tuple[int, list[Player]]:
    """Clube criado pela API, com os 5 jogadores do 2-1-1 comprados no mercado."""
    club_id = register_club(client)["id"]
    return club_id, buy_squad(client, club_id, TWO_ONE_ONE)


def ids(players: list[Player]) -> list[int]:
    return [player.id for player in players]


def lineup_state(club_id: int) -> tuple[str | None, set[int]]:
    formation = Club.objects.get(pk=club_id).formation
    return formation, set(
        LineupSlot.objects.filter(club_id=club_id).values_list("player_id", flat=True)
    )


def test_lineup_is_saved_with_the_starters_in_squad_order(
    client: TestClient, club: Club, squad: list[Player]
) -> None:
    response = put_lineup(client, club.id, "2-1-1", ids(squad)[::-1])

    assert response.status_code == 200
    body = response.json()
    assert (body["club_id"], body["formation"], body["complete"]) == (club.id, "2-1-1", True)
    assert [player["id"] for player in body["players"]] == ids(squad)
    assert body["players"][0] == client.get(player_url(squad[0].id)).json()
    assert lineup_state(club.id) == ("2-1-1", set(ids(squad)))
    assert client.get(lineup_url(club.id)).json() == body


def test_new_lineup_replaces_the_whole_previous_one(client: TestClient, club: Club) -> None:
    first = sign_squad(club, TWO_ONE_ONE)
    field_lineup(client, club, "2-1-1", first)
    reserves = [insert_player(f"Reserva {letter}", position="ATA") for letter in "AB"]
    for reserve in reserves:
        Player.objects.filter(pk=reserve.id).update(club=club)
    second = [*first[:3], *reserves]

    response = put_lineup(client, club.id, "2-2", ids(second))

    assert response.status_code == 200
    assert lineup_state(club.id) == ("2-2", set(ids(second)))


def test_unfit_player_can_start(client: TestClient, club: Club, squad: list[Player]) -> None:
    Player.objects.filter(pk=squad[1].id).update(condition="MAL_CONDICIONADO")

    response = put_lineup(client, club.id, "2-1-1", ids(squad))

    assert response.status_code == 200
    assert response.json()["players"][1]["condition"] == "MAL_CONDICIONADO"


def test_lineup_does_not_change_the_cash(
    client: TestClient, bought_squad: tuple[int, list[Player]]
) -> None:
    club_id, players = bought_squad
    cash = stored_cash(club_id)

    assert put_lineup(client, club_id, "2-1-1", ids(players)).status_code == 200
    assert stored_cash(club_id) == cash < INITIAL_CASH


def test_club_without_lineup_has_no_formation_and_no_players(
    client: TestClient, club: Club
) -> None:
    response = client.get(lineup_url(club.id))

    assert response.status_code == 200
    assert response.json() == {
        "club_id": club.id,
        "formation": None,
        "complete": False,
        "players": [],
    }


def test_sold_starter_leaves_an_incomplete_lineup_with_the_same_formation(
    client: TestClient, bought_squad: tuple[int, list[Player]]
) -> None:
    club_id, players = bought_squad
    assert put_lineup(client, club_id, "2-1-1", ids(players)).status_code == 200

    sell(client, players[0].id)
    body = client.get(lineup_url(club_id)).json()

    assert (body["formation"], body["complete"]) == ("2-1-1", False)
    assert [player["id"] for player in body["players"]] == ids(players[1:])


@pytest.mark.parametrize("club_id", ["999999", "abc", "0"])
def test_lineup_of_a_missing_club_is_404(client: TestClient, club_id: str) -> None:
    responses = [
        client.get(lineup_url(club_id)),
        put_lineup(client, club_id, "2-2", [1, 2, 3, 4, 5]),
    ]

    assert [response.status_code for response in responses] == [404, 404]
    assert all(response.json()["message"] for response in responses)


VALID_IDS = [1, 2, 3, 4, 5]


@pytest.mark.parametrize(
    ("body", "field"),
    [
        ({"player_ids": VALID_IDS}, "formation"),
        ({"formation": None, "player_ids": VALID_IDS}, "formation"),
        ({"formation": "4-4", "player_ids": VALID_IDS}, "formation"),
        ({"formation": "2-1-1 ", "player_ids": VALID_IDS}, "formation"),
        ({"formation": 211, "player_ids": VALID_IDS}, "formation"),
        ({"formation": "2-1-1"}, "player_ids"),
        ({"formation": "2-1-1", "player_ids": None}, "player_ids"),
        ({"formation": "2-1-1", "player_ids": "1,2,3,4,5"}, "player_ids"),
        ({"formation": "2-1-1", "player_ids": [1, 2, 3, 4]}, "player_ids"),
        ({"formation": "2-1-1", "player_ids": [1, 2, 3, 4, 5, 6]}, "player_ids"),
        ({"formation": "2-1-1", "player_ids": [1, 2, 3, 4, 0]}, "player_ids.4"),
        ({"formation": "2-1-1", "player_ids": [1, 2, 3, 4, -5]}, "player_ids.4"),
        ({"formation": "2-1-1", "player_ids": [1, 2, 3, 4, "5"]}, "player_ids.4"),
        ({"formation": "2-1-1", "player_ids": [1, 2, 3, 4, 5.5]}, "player_ids.4"),
    ],
)
def test_invalid_body_is_400_and_writes_nothing(
    client: TestClient, club: Club, squad: list[Player], body: dict[str, Any], field: str
) -> None:
    response = client.put(lineup_url(club.id), json=body)

    assert response.status_code == 400
    assert response.json()["message"].startswith(f"Campo {field}:")
    assert lineup_state(club.id) == (None, set())


@pytest.mark.parametrize("body", [[], "x", 10])
def test_body_that_is_not_an_object_is_400(client: TestClient, club: Club, body: Any) -> None:
    response = client.put(lineup_url(club.id), json=body)

    assert response.status_code == 400
    assert response.json()["message"]


def test_repeated_ids_are_400(client: TestClient, club: Club, squad: list[Player]) -> None:
    response = put_lineup(client, club.id, "2-1-1", [*ids(squad)[:4], squad[0].id])

    assert response.status_code == 400
    assert "distintos" in response.json()["message"]
    assert lineup_state(club.id) == (None, set())


def test_integral_float_id_is_accepted(client: TestClient, club: Club, squad: list[Player]) -> None:
    response = put_lineup(client, club.id, "2-1-1", [float(player_id) for player_id in ids(squad)])

    assert response.status_code == 200


def test_missing_or_deleted_player_is_404_and_writes_nothing(
    client: TestClient, club: Club, squad: list[Player]
) -> None:
    deleted = insert_player("Fora Daqui", position="ATA", deleted_at=timezone.now())
    field_lineup(client, club, "2-1-1", squad)
    responses = [
        put_lineup(client, club.id, "2-1-1", [*ids(squad)[:4], missing_id])
        for missing_id in (999999, deleted.id)
    ]

    assert [response.status_code for response in responses] == [404, 404]
    assert all(response.json() == {"message": "Jogador não encontrado."} for response in responses)
    assert lineup_state(club.id) == ("2-1-1", set(ids(squad)))


def test_player_outside_the_squad_is_409(
    client: TestClient, club: Club, squad: list[Player]
) -> None:
    free = insert_player("Sem Clube", position="ATA")
    other_club = create_club("OUT")
    stranger = sign_squad(other_club, ("ATA",))[0]
    field_lineup(client, club, "2-1-1", squad)

    responses = [
        put_lineup(client, club.id, "2-1-1", [*ids(squad)[:4], outsider.id])
        for outsider in (free, stranger)
    ]

    assert [response.status_code for response in responses] == [409, 409]
    assert all("elenco" in response.json()["message"] for response in responses)
    assert lineup_state(club.id) == ("2-1-1", set(ids(squad)))


def test_sick_player_is_409(client: TestClient, club: Club, squad: list[Player]) -> None:
    Player.objects.filter(pk=squad[4].id).update(condition="DOENTE")

    response = put_lineup(client, club.id, "2-1-1", ids(squad))

    assert response.status_code == 409
    assert "DOENTE" in response.json()["message"]
    assert lineup_state(club.id) == (None, set())


@pytest.mark.parametrize("formation", ["3-1", "2-2", "1-2-1"])
def test_positions_that_do_not_close_the_formation_are_409(
    client: TestClient, club: Club, squad: list[Player], formation: str
) -> None:
    response = put_lineup(client, club.id, formation, ids(squad))

    assert response.status_code == 409
    assert formation in response.json()["message"]
    assert lineup_state(club.id) == (None, set())
