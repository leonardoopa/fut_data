from datetime import datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.domain.brasilia_time import BRASILIA
from app.models import Club, LineupSlot, Match, MatchDuel, Player
from tests.api.conftest import FixedClock
from tests.api.factories import (
    FORMATION_POSITIONS,
    MATCHES_URL,
    buy_squad,
    create_club,
    field_lineup,
    insert_player,
    match_url,
    player_url,
    put_lineup,
    ready_club,
    register_club,
    sell,
)

PLAYED_AT = datetime(2026, 11, 12, 15, 0, tzinfo=BRASILIA)

StarterSpec = tuple[str, str, dict[str, Any]]
DuelSideSpec = tuple[str, str, int]

AGUIAS_STARTERS: tuple[StarterSpec, ...] = (
    ("Rui Prado", "GOL", {"defending": 77}),
    ("Téo Brandão", "ZAG", {"defending": 84}),
    ("Davi Lins", "LAT", {"dribbling": 74, "defending": 66, "condition": "MAL_CONDICIONADO"}),
    ("Lauro Neves", "MEI", {"passing": 82}),
    ("Otto Rangel", "ATA", {"shooting": 75}),
)
DELTA_STARTERS: tuple[StarterSpec, ...] = (
    ("Ivo Teles", "GOL", {"defending": 72}),
    ("Hugo Vaz", "ZAG", {"defending": 84}),
    ("Lino Matos", "LAT", {"dribbling": 79, "defending": 63}),
    ("Nei Soares", "MEI", {"passing": 70}),
    ("Ugo Falcão", "ATA", {"shooting": 81}),
)


def documented_club(
    client: TestClient, name: str, acronym: str, specs: tuple[StarterSpec, ...]
) -> tuple[Club, dict[str, Player]]:
    """Clube do exemplo do enunciado, escalado no 2-1-1; devolve os titulares pelo nome."""
    club = create_club(acronym, formation=None, name=name)
    starters = {
        player_name: insert_player(player_name, position=position, club=club, **fields)
        for player_name, position, fields in specs
    }
    field_lineup(client, club, "2-1-1", list(starters.values()))
    return club, starters


@pytest.fixture
def documented_clubs(client: TestClient, clock: FixedClock) -> tuple[Club, Club, dict[str, Player]]:
    clock.moment = PLAYED_AT
    aguias, home_starters = documented_club(client, "Águias FC", "AGU", AGUIAS_STARTERS)
    delta, away_starters = documented_club(client, "Delta FC", "DEL", DELTA_STARTERS)
    return aguias, delta, home_starters | away_starters


def play(client: TestClient, home: Any, away: Any) -> Any:
    return client.post(MATCHES_URL, json={"home_club_id": home, "away_club_id": away})


def played(client: TestClient, home: Club, away: Club) -> dict[str, Any]:
    response = play(client, home.id, away.id)
    assert response.status_code == 201, response.text
    return response.json()


def nothing_written() -> bool:
    return not Match.objects.exists() and not MatchDuel.objects.exists()


def test_documented_match_is_played_and_recorded(
    client: TestClient, documented_clubs: tuple[Club, Club, dict[str, Player]]
) -> None:
    aguias, delta, starters = documented_clubs

    def duel_side(name: str, attribute: str, value: int) -> dict[str, Any]:
        player = starters[name]
        return {
            "player_id": player.id,
            "player_name": name,
            "position": player.position,
            "condition": player.condition,
            "attribute": attribute,
            "value": value,
        }

    def duel(
        order: int, club: Club, attack: DuelSideSpec, defense: DuelSideSpec, goal: bool
    ) -> dict[str, Any]:
        return {
            "order": order,
            "attacking_club_id": club.id,
            "attacker": duel_side(*attack),
            "defender": duel_side(*defense),
            "goal": goal,
        }

    response = play(client, aguias.id, delta.id)

    assert response.status_code == 201
    body = response.json()
    assert response.headers["location"] == match_url(body["id"])
    assert body == {
        "id": body["id"],
        "played_at": "2026-11-12T15:00:00-03:00",
        "home": {"club_id": aguias.id, "club_name": "Águias FC", "formation": "2-1-1", "goals": 1},
        "away": {"club_id": delta.id, "club_name": "Delta FC", "formation": "2-1-1", "goals": 2},
        "result": "VISITANTE",
        "duels": [
            duel(1, aguias, ("Otto Rangel", "shooting", 75), ("Ivo Teles", "defending", 72), True),
            duel(2, aguias, ("Lauro Neves", "passing", 82), ("Hugo Vaz", "defending", 84), False),
            duel(3, aguias, ("Davi Lins", "dribbling", 63), ("Lino Matos", "defending", 63), False),
            duel(4, delta, ("Ugo Falcão", "shooting", 81), ("Rui Prado", "defending", 77), True),
            duel(5, delta, ("Nei Soares", "passing", 70), ("Téo Brandão", "defending", 84), False),
            duel(6, delta, ("Lino Matos", "dribbling", 79), ("Davi Lins", "defending", 56), True),
        ],
    }
    assert client.get(match_url(body["id"])).json() == body
    assert (Match.objects.count(), MatchDuel.objects.count()) == (1, 6)


def test_match_has_no_other_effects(
    client: TestClient, documented_clubs: tuple[Club, Club, dict[str, Player]]
) -> None:
    aguias, delta, _ = documented_clubs
    clubs_before = list(Club.objects.values_list("cash", "formation"))
    players_before = list(Player.objects.values())
    lineup_before = list(LineupSlot.objects.values_list("club_id", "player_id"))

    played(client, aguias, delta)

    assert list(Club.objects.values_list("cash", "formation")) == clubs_before
    assert list(Player.objects.values()) == players_before
    assert list(LineupSlot.objects.values_list("club_id", "player_id")) == lineup_before


def test_match_keeps_the_data_of_the_moment(
    client: TestClient, documented_clubs: tuple[Club, Club, dict[str, Player]]
) -> None:
    aguias, delta, starters = documented_clubs
    match_id = played(client, aguias, delta)["id"]
    otto = starters["Otto Rangel"]
    profile = {"name": "Otto Novo", "position": "ATA", "agility": 50, "age": 25}
    client.put(player_url(otto.id), json=profile)
    client.patch(f"{player_url(otto.id)}/condition", json={"condition": "MAL_CONDICIONADO"})

    attacker = client.get(match_url(match_id)).json()["duels"][0]["attacker"]

    assert (attacker["player_name"], attacker["condition"], attacker["value"]) == (
        "Otto Rangel",
        "APTO",
        75,
    )


def test_same_fixture_can_be_played_again(
    client: TestClient, documented_clubs: tuple[Club, Club, dict[str, Player]]
) -> None:
    aguias, delta, _ = documented_clubs

    first, second = played(client, aguias, delta), played(client, aguias, delta)

    assert second["id"] > first["id"]
    assert (Match.objects.count(), MatchDuel.objects.count()) == (2, 12)


@pytest.mark.parametrize(
    "body",
    [
        {"away_club_id": 2},
        {"home_club_id": 1},
        {"home_club_id": None, "away_club_id": 2},
        {"home_club_id": 0, "away_club_id": 2},
        {"home_club_id": 1, "away_club_id": -2},
        {"home_club_id": "1", "away_club_id": 2},
        {"home_club_id": 1.5, "away_club_id": 2},
        {"home_club_id": 1, "away_club_id": 1},
        [],
        "x",
        10,
    ],
)
def test_invalid_body_is_400_and_writes_nothing(client: TestClient, body: Any) -> None:
    ready_club(client, "AGU")
    ready_club(client, "DEL")

    response = client.post(MATCHES_URL, json=body)

    assert response.status_code == 400
    assert response.json()["message"]
    assert nothing_written()


def test_same_club_on_both_sides_is_400(client: TestClient) -> None:
    club = ready_club(client, "AGU")

    response = play(client, club.id, club.id)

    assert response.status_code == 400
    assert "diferentes" in response.json()["message"]
    assert nothing_written()


@pytest.mark.parametrize("missing_side", ["home", "away"])
def test_missing_club_is_404_and_writes_nothing(client: TestClient, missing_side: str) -> None:
    club = ready_club(client, "AGU")
    sides = {"home": club.id, "away": club.id} | {missing_side: 999999}

    response = play(client, sides["home"], sides["away"])

    assert response.status_code == 404
    assert response.json() == {"message": "Clube não encontrado."}
    assert nothing_written()


@pytest.mark.parametrize("unready_side", ["home", "away"])
def test_club_without_lineup_is_409_and_writes_nothing(
    client: TestClient, unready_side: str
) -> None:
    ready = ready_club(client, "AGU")
    unready = create_club("DEL", formation=None, name="Delta FC")
    sides = {"home": ready, "away": ready} | {unready_side: unready}

    response = play(client, sides["home"].id, sides["away"].id)

    assert response.status_code == 409
    assert "Delta FC" in response.json()["message"]
    assert nothing_written()


def test_lineup_incomplete_after_a_sale_blocks_the_match(
    client: TestClient, clock: FixedClock
) -> None:
    home = ready_club(client, "AGU")
    away_id = register_club(client, name="Delta FC", acronym="DEL")["id"]
    starters = buy_squad(client, away_id, FORMATION_POSITIONS["2-1-1"])
    assert (
        put_lineup(client, away_id, "2-1-1", [player.id for player in starters]).status_code == 200
    )
    assert sell(client, starters[0].id).status_code == 200

    response = play(client, home.id, away_id)

    assert response.status_code == 409
    assert "Delta FC" in response.json()["message"]
    assert nothing_written()


def test_starter_who_becomes_sick_blocks_the_match(client: TestClient) -> None:
    home, away = ready_club(client, "AGU"), ready_club(client, "DEL")
    starter = home.players.first()
    client.patch(f"{player_url(starter.id)}/condition", json={"condition": "DOENTE"})

    response = play(client, home.id, away.id)

    assert response.status_code == 409
    assert nothing_written()


@pytest.mark.parametrize("match_id", ["999999", "abc", "0"])
def test_missing_match_is_404(client: TestClient, match_id: str) -> None:
    response = client.get(match_url(match_id))

    assert response.status_code == 404
    assert response.json()["message"]


def list_matches(client: TestClient, **params: str) -> list[dict[str, Any]]:
    response = client.get(MATCHES_URL, params=params)
    assert response.status_code == 200, response.text
    return response.json()


def test_matches_are_listed_most_recent_first_without_duels(
    client: TestClient, clock: FixedClock
) -> None:
    first, second, third = (ready_club(client, acronym) for acronym in ("AGU", "DEL", "GAM"))
    clock.moment = PLAYED_AT
    earliest = played(client, first, second)
    same_moment = [played(client, second, third), played(client, third, first)]
    clock.moment = PLAYED_AT + timedelta(hours=1)
    latest = played(client, first, third)

    matches = list_matches(client)

    assert [match["id"] for match in matches] == [
        latest["id"],
        same_moment[1]["id"],
        same_moment[0]["id"],
        earliest["id"],
    ]
    assert matches[0] == {key: value for key, value in latest.items() if key != "duels"}


def test_matches_filtered_by_club_include_home_and_away(
    client: TestClient, clock: FixedClock
) -> None:
    first, second, third = (ready_club(client, acronym) for acronym in ("AGU", "DEL", "GAM"))
    as_home, as_away = played(client, first, second), played(client, third, first)
    played(client, second, third)

    matches = list_matches(client, club_id=str(first.id))

    assert {match["id"] for match in matches} == {as_home["id"], as_away["id"]}


def test_no_matches_gives_an_empty_list(client: TestClient) -> None:
    club = create_club()

    assert list_matches(client) == []
    assert list_matches(client, club_id=str(club.id)) == []


@pytest.mark.parametrize("club_id", ["", "abc", "0", "-1", "01", "1.5"])
def test_invalid_club_filter_is_400(client: TestClient, club_id: str) -> None:
    response = client.get(MATCHES_URL, params={"club_id": club_id})

    assert response.status_code == 400
    assert response.json()["message"].startswith("Campo club_id:")


def test_missing_club_filter_is_404(client: TestClient) -> None:
    response = client.get(MATCHES_URL, params={"club_id": "999999"})

    assert response.status_code == 404
    assert response.json() == {"message": "Clube não encontrado."}
