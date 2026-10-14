"""Montagem dos cenários dos testes de API.

As escalações são criadas direto pelo ORM, porque o endpoint de escalação ainda não existe;
`create_club` e `sign_player` montam pelo ORM os cenários que não dependem do mercado.
"""

from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi.testclient import TestClient
from httpx2 import Response

from app.domain.brasilia_time import BRASILIA
from app.models import Club, LineupSlot, MarketTransaction, Player

PLAYERS_URL = "/api/v1/players"
CLUBS_URL = "/api/v1/clubs"

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


def register_player(client: TestClient, **changes: Any) -> dict[str, Any]:
    response = client.post(PLAYERS_URL, json={**MEIA_LUA, **changes})
    assert response.status_code == 201, response.text
    return response.json()


def insert_player(name: str, **fields: Any) -> Player:
    """Jogador gravado direto no banco, com o valor base escolhido pelo cenário.

    Com agilidade 50, APTO e idade entre 22 e 31 anos, o valor de mercado é o valor base.
    """
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


def create_club(acronym: str = "AGU", formation: str = "2-2") -> Club:
    return Club.objects.create(
        name=f"Clube {acronym}",
        name_key=f"clube {acronym.lower()}",
        acronym=acronym,
        formation=formation,
    )


def sign_player(player_id: int, club: Club, *, starter: bool = False) -> None:
    Player.objects.filter(pk=player_id).update(club=club)
    if starter:
        LineupSlot.objects.create(club=club, player_id=player_id)


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
    """Compra do enunciado: Meia Lua MAL_CONDICIONADO (37,00) pelo Águias FC.

    Precisa do relógio fixo no momento da compra; devolve os ids do jogador e do clube.
    """
    player_id = register_player(client)["id"]
    client.patch(f"{player_url(player_id)}/condition", json={"condition": "MAL_CONDICIONADO"})
    club_id = register_club(client)["id"]
    assert buy(client, player_id, club_id).status_code == 200
    return player_id, club_id


def recover_and_sell(client: TestClient, player_id: int) -> Response:
    """Venda do enunciado: o jogador volta a APTO (40,00) antes da venda."""
    client.patch(f"{player_url(player_id)}/condition", json={"condition": "APTO"})
    return sell(client, player_id)
