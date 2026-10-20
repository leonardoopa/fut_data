from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi.testclient import TestClient
from httpx2 import Response

from app.domain.brasilia_time import BRASILIA
from app.models import Club, LineupSlot, MarketTransaction, Match, Player

PLAYERS_URL = "/api/v1/players"
CLUBS_URL = "/api/v1/clubs"
MATCHES_URL = "/api/v1/matches"
STANDINGS_URL = "/api/v1/standings"

AGUIAS: dict[str, Any] = {"name": "Águias FC", "acronym": "AGU"}

BOUGHT_AT = datetime(2026, 11, 2, 10, 15, tzinfo=BRASILIA)
SOLD_AT = datetime(2026, 11, 5, 16, 40, tzinfo=BRASILIA)
LOYALTY_UNTIL = "2027-03-02T10:15-03:00"

MEIA_LUA: dict[str, Any] = {
    "name": "Meia Lua",
    "position": "MEI",
    "agility": 85,
    "age": 25,
    "pace": 70,
    "shooting": 68,
    "passing": 82,
    "dribbling": 79,
    "defending": 55,
    "physical": 64,
    "potential": 86,
}


def player_url(player_id: int | str) -> str:
    return f"{PLAYERS_URL}/{player_id}"


def club_url(club_id: int | str) -> str:
    return f"{CLUBS_URL}/{club_id}"


def transactions_url(club_id: int | str) -> str:
    return f"{club_url(club_id)}/transactions"


def export_url(club_id: int | str) -> str:
    return f"{transactions_url(club_id)}/export"


def lineup_url(club_id: int | str) -> str:
    return f"{club_url(club_id)}/lineup"


def match_url(match_id: int | str) -> str:
    return f"{MATCHES_URL}/{match_id}"


def register_player(client: TestClient, **changes: Any) -> dict[str, Any]:
    response = client.post(PLAYERS_URL, json={**MEIA_LUA, **changes})
    assert response.status_code == 201, response.text
    return response.json()


def insert_player(name: str, **fields: Any) -> Player:
    defaults: dict[str, Any] = {
        "position": "MEI",
        "agility": 50,
        "age": 25,
        "base_value": Decimal("10.00"),
        "condition": "APTO",
        "pace": 50,
        "shooting": 50,
        "passing": 50,
        "dribbling": 50,
        "defending": 50,
        "physical": 50,
        "potential": 50,
    }
    return Player.objects.create(name=name, **{**defaults, **fields})


def create_club(
    acronym: str = "AGU", formation: str | None = "2-2", name: str | None = None
) -> Club:
    club_name = name or f"Clube {acronym}"
    return Club.objects.create(
        name=club_name, name_key=club_name.lower(), acronym=acronym, formation=formation
    )


def sign_player(player_id: int, club: Club, *, starter: bool = False) -> None:
    Player.objects.filter(pk=player_id).update(club=club)
    if starter:
        LineupSlot.objects.create(club=club, player_id=player_id)


FORMATION_POSITIONS: dict[str, tuple[str, ...]] = {
    "3-1": ("GOL", "ZAG", "ZAG", "LAT", "ATA"),
    "2-2": ("GOL", "ZAG", "LAT", "ATA", "ATA"),
    "2-1-1": ("GOL", "ZAG", "LAT", "MEI", "ATA"),
    "1-2-1": ("GOL", "LAT", "MEI", "MEI", "ATA"),
}


def sign_squad(club: Club, positions: Sequence[str]) -> list[Player]:
    players = [
        insert_player(f"Titular {club.acronym} {chr(ord('A') + index)}", position=position)
        for index, position in enumerate(positions)
    ]
    for player in players:
        sign_player(player.id, club)
    return players


def put_lineup(client: TestClient, club_id: int | str, formation: Any, player_ids: Any) -> Response:
    return client.put(lineup_url(club_id), json={"formation": formation, "player_ids": player_ids})


def field_lineup(client: TestClient, club: Club, formation: str, players: Sequence[Player]) -> None:
    response = put_lineup(client, club.id, formation, [player.id for player in players])
    assert response.status_code == 200, response.text


def ready_club(client: TestClient, acronym: str, formation: str = "2-1-1") -> Club:
    club = create_club(acronym, formation=None)
    field_lineup(client, club, formation, sign_squad(club, FORMATION_POSITIONS[formation]))
    return club


def buy_squad(client: TestClient, club_id: int, positions: Sequence[str]) -> list[Player]:
    players = [
        insert_player(f"Comprado {chr(ord('A') + index)}", position=position)
        for index, position in enumerate(positions)
    ]
    for player in players:
        assert buy(client, player.id, club_id).status_code == 200
    return players


def insert_match(home: Club, away: Club, home_goals: int, away_goals: int) -> Match:
    return Match.objects.create(
        home_club=home,
        away_club=away,
        home_goals=home_goals,
        away_goals=away_goals,
        home_formation="2-2",
        away_formation="2-2",
        played_at=BOUGHT_AT,
    )


def register_club(client: TestClient, **changes: Any) -> dict[str, Any]:
    response = client.post(CLUBS_URL, json={**AGUIAS, **changes})
    assert response.status_code == 201, response.text
    return response.json()


def buy(
    client: TestClient, player_id: int | str, club_id: Any, loyalty_until: Any = LOYALTY_UNTIL
) -> Response:
    return client.post(
        f"{player_url(player_id)}/buy",
        json={"club_id": club_id, "loyalty_until": loyalty_until},
    )


def sell(client: TestClient, player_id: int | str) -> Response:
    return client.post(f"{player_url(player_id)}/sell")


def stored_cash(club_id: int) -> Decimal:
    return Club.objects.get(pk=club_id).cash


def cash_change_total(club_id: int) -> Decimal:
    return sum(
        MarketTransaction.objects.filter(club_id=club_id).values_list("cash_change", flat=True),
        Decimal(0),
    )


DOCUMENTED_PURCHASE: dict[str, Any] = {
    "player_name": "Meia Lua",
    "type": "COMPRA",
    "value": 37.0,
    "fee": 1.85,
    "penalty": 0.0,
    "profit": None,
    "cash_change": -38.85,
    "created_at": "2026-11-02T10:15:00-03:00",
}

DOCUMENTED_SALE: dict[str, Any] = {
    "player_name": "Meia Lua",
    "type": "VENDA",
    "value": 40.0,
    "fee": 0.3,
    "penalty": 4.0,
    "profit": 3.0,
    "cash_change": 35.7,
    "created_at": "2026-11-05T16:40:00-03:00",
}


def buy_documented_example(client: TestClient) -> tuple[int, int]:
    player_id = register_player(client)["id"]
    client.patch(f"{player_url(player_id)}/condition", json={"condition": "MAL_CONDICIONADO"})
    club_id = register_club(client)["id"]
    assert buy(client, player_id, club_id).status_code == 200
    return player_id, club_id


def recover_and_sell(client: TestClient, player_id: int) -> Response:
    client.patch(f"{player_url(player_id)}/condition", json={"condition": "APTO"})
    return sell(client, player_id)
