from decimal import Decimal
from typing import Any

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.models import Player
from tests.api.factories import create_club, player_url, register_player, sign_player

DAVI_MELO = {"name": "Davi Melo", "position": "ATA", "agility": 70, "age": 26}


def stored_profile(player_id: int) -> tuple[str, str, int, int]:
    player = Player.objects.get(pk=player_id)
    return player.name, player.position, player.agility, player.age


def test_update_changes_the_profile_and_recalculates_overall_but_not_base_value(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]

    response = client.put(player_url(player_id), json=DAVI_MELO)

    body = response.json()
    assert response.status_code == 200
    assert {field: body[field] for field in DAVI_MELO} == DAVI_MELO
    assert (body["overall"], body["base_value"], body["market_value"]) == (
        72,
        40.0,
        40.0,
    )
    assert stored_profile(player_id) == ("Davi Melo", "ATA", 70, 26)


def test_update_ignores_indicators_potential_and_system_fields(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]
    ignored = {
        "pace": 1,
        "potential": 1,
        "base_value": 1,
        "condition": "DOENTE",
        "club_id": 1,
    }

    response = client.put(player_url(player_id), json={**DAVI_MELO, **ignored})

    player = Player.objects.get(pk=player_id)
    assert response.status_code == 200
    assert (player.pace, player.potential, player.base_value) == (
        70,
        86,
        Decimal("40.00"),
    )
    assert (player.condition, player.club_id) == ("APTO", None)


def test_update_normalizes_the_name(client: TestClient) -> None:
    player_id = register_player(client)["id"]

    response = client.put(
        player_url(player_id), json={**DAVI_MELO, "name": "  Davi   Melo "}
    )

    assert response.json()["name"] == "Davi Melo"


def test_update_to_33_years_or_more_is_accepted_without_changing_the_potential(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]

    response = client.put(player_url(player_id), json={**DAVI_MELO, "age": 33})

    assert response.status_code == 200
    assert response.json()["potential"] == 86


def test_player_with_club_can_be_updated_keeping_the_position(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]
    club = create_club()
    sign_player(player_id, club)

    response = client.put(player_url(player_id), json={**DAVI_MELO, "position": "MEI"})

    assert response.status_code == 200
    assert response.json()["club_id"] == club.id
    assert stored_profile(player_id) == ("Davi Melo", "MEI", 70, 26)


def test_player_with_club_cannot_change_position(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    sign_player(player_id, create_club())

    response = client.put(player_url(player_id), json=DAVI_MELO)

    assert response.status_code == 409
    assert response.json() == {
        "message": "Jogador com clube não pode mudar de posição."
    }
    assert stored_profile(player_id) == ("Meia Lua", "MEI", 85, 25)


def test_age_cannot_be_lower_than_the_current_age(client: TestClient) -> None:
    player_id = register_player(client)["id"]

    response = client.put(player_url(player_id), json={**DAVI_MELO, "age": 24})

    assert response.status_code == 409
    assert response.json() == {
        "message": "A idade não pode ser menor que a atual (25 anos)."
    }
    assert stored_profile(player_id) == ("Meia Lua", "MEI", 85, 25)


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        (
            {"age": 35, "agility": 86},
            "Com 35 anos ou mais, a agilidade (agility) deve ser no máximo 85.",
        ),
        ({"position": "ata"}, "Campo position: valor fora da lista aceita."),
        ({"agility": "70"}, "Campo agility: deve ser um número inteiro."),
        ({"age": 46}, "Campo age: deve ser menor ou igual a 45."),
        ({"name": "Davi"}, "Campo name: deve ter pelo menos 2 palavras."),
        ({"name": None}, "Campo name: deve ser um texto."),
    ],
)
def test_invalid_update_is_refused_with_400_and_nothing_is_written(
    client: TestClient, changes: dict[str, Any], message: str
) -> None:
    player_id = register_player(client)["id"]

    response = client.put(player_url(player_id), json={**DAVI_MELO, **changes})

    assert response.status_code == 400
    assert response.json() == {"message": message}
    assert stored_profile(player_id) == ("Meia Lua", "MEI", 85, 25)


@pytest.mark.parametrize("field", list(DAVI_MELO))
def test_update_requires_the_four_fields(client: TestClient, field: str) -> None:
    player_id = register_player(client)["id"]
    body = {name: value for name, value in DAVI_MELO.items() if name != field}

    response = client.put(player_url(player_id), json=body)

    assert response.status_code == 400
    assert response.json() == {"message": f"Campo {field}: é obrigatório."}


def test_update_of_a_missing_player_is_404(client: TestClient) -> None:
    response = client.put(player_url(999999), json=DAVI_MELO)

    assert response.status_code == 404
    assert response.json() == {"message": "Jogador não encontrado."}


def test_update_of_a_deleted_player_is_404(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    Player.objects.filter(pk=player_id).update(deleted_at=timezone.now())

    response = client.put(player_url(player_id), json=DAVI_MELO)

    assert response.status_code == 404
    assert stored_profile(player_id) == ("Meia Lua", "MEI", 85, 25)


@pytest.mark.parametrize("player_id", ["abc", "0", "01", "2147483648"])
def test_update_with_a_malformed_id_is_404(client: TestClient, player_id: str) -> None:
    assert client.put(player_url(player_id), json=DAVI_MELO).status_code == 404
