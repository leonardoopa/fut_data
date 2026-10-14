"""Montagem dos cenários dos testes de API.

Clubes, elencos e escalações são criados direto pelo ORM, porque os endpoints de clubes,
compra e escalação ainda não existem.
"""

from decimal import Decimal
from typing import Any

from fastapi.testclient import TestClient

from app.models import Club, LineupSlot, Player

PLAYERS_URL = "/api/v1/players"

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
