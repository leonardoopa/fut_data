from decimal import Decimal
from typing import Any

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.models import Player
from tests.api.factories import MEIA_LUA, PLAYERS_URL, player_url, register_player

RESPONSE_FIELDS = [
    "id",
    "name",
    "position",
    "agility",
    "age",
    "condition",
    "base_value",
    "market_value",
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physical",
    "potential",
    "overall",
    "club_id",
]


def registered_meia_lua(player_id: int) -> dict[str, Any]:
    return {
        "id": player_id,
        "name": "Meia Lua",
        "position": "MEI",
        "agility": 85,
        "age": 25,
        "condition": "APTO",
        "base_value": 40.0,
        "market_value": 40.0,
        "pace": 70,
        "shooting": 68,
        "passing": 82,
        "dribbling": 79,
        "defending": 55,
        "physical": 64,
        "potential": 86,
        "overall": 75,
        "club_id": None,
    }


def test_registration_returns_201_with_location_and_calculated_values(client: TestClient) -> None:
    response = client.post(PLAYERS_URL, json=MEIA_LUA)

    body = response.json()
    assert response.status_code == 201
    assert response.headers["location"] == f"/api/v1/players/{body['id']}"
    assert response.headers["content-type"] == "application/json"
    assert body == registered_meia_lua(body["id"])
    assert list(body) == RESPONSE_FIELDS


def test_registration_stores_a_free_apt_player_with_the_base_value(client: TestClient) -> None:
    player = Player.objects.get(pk=register_player(client)["id"])

    assert player.base_value == Decimal("40.00")
    assert player.condition == "APTO"
    assert player.club_id is None
    assert player.deleted_at is None


def test_registration_ignores_fields_controlled_by_the_system(client: TestClient) -> None:
    body = register_player(
        client,
        id=999,
        condition="DOENTE",
        club_id=1,
        base_value=1,
        market_value=1,
        overall=1,
    )

    assert body == registered_meia_lua(body["id"])


def test_registration_normalizes_the_name(client: TestClient) -> None:
    assert register_player(client, name="  Meia   Lua ")["name"] == "Meia Lua"


def test_young_prospect_base_value_and_market_value_follow_rn06_and_rn04(
    client: TestClient,
) -> None:
    body = register_player(
        client,
        age=21,
        agility=50,
        pace=70,
        shooting=70,
        passing=70,
        dribbling=70,
        defending=70,
        physical=70,
        potential=84,
    )

    assert (body["overall"], body["base_value"], body["market_value"]) == (70, 34.2, 37.62)


@pytest.mark.parametrize(
    "changes",
    [
        {"age": 35, "agility": 85, "potential": 82},
        {"pace": 99, "shooting": 99, "physical": 66, "potential": 99},
        {"age": 33, "potential": 82},
        {"age": 32, "potential": 99},
        {"agility": 85.0},
    ],
)
def test_values_on_the_limits_are_accepted(client: TestClient, changes: dict[str, Any]) -> None:
    assert client.post(PLAYERS_URL, json={**MEIA_LUA, **changes}).status_code == 201


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        ({"agility": "85"}, "Campo agility: deve ser um número inteiro."),
        ({"agility": 85.5}, "Campo agility: deve ser um número inteiro."),
        ({"agility": None}, "Campo agility: deve ser um número inteiro."),
        ({"agility": 0}, "Campo agility: deve ser maior ou igual a 1."),
        ({"agility": 101}, "Campo agility: deve ser menor ou igual a 100."),
        ({"age": 15}, "Campo age: deve ser maior ou igual a 16."),
        ({"age": 46}, "Campo age: deve ser menor ou igual a 45."),
        ({"pace": 0}, "Campo pace: deve ser maior ou igual a 1."),
        ({"physical": 100}, "Campo physical: deve ser menor ou igual a 99."),
        ({"potential": 100}, "Campo potential: deve ser menor ou igual a 99."),
        ({"position": "mei"}, "Campo position: valor fora da lista aceita."),
        ({"name": "Pelé"}, "Campo name: deve ter pelo menos 2 palavras."),
        ({"name": "Meia Lua 10"}, "Campo name: não pode conter dígitos."),
        ({"name": "   "}, "Campo name: é obrigatório."),
        (
            {"age": 35, "agility": 86, "potential": 82},
            "Com 35 anos ou mais, a agilidade (agility) deve ser no máximo 85.",
        ),
        (
            {"pace": 99, "shooting": 99, "physical": 67, "potential": 99},
            "A soma dos seis atributos técnicos não pode passar de 480.",
        ),
        (
            {"potential": 81},
            "O potencial (potential) deve ser maior ou igual ao maior dos seis atributos (82).",
        ),
        (
            {"age": 33},
            "No cadastro com 33 anos ou mais, o potencial (potential) deve ser igual ao maior "
            "dos seis atributos (82).",
        ),
    ],
)
def test_invalid_registration_is_refused_with_400_and_nothing_is_written(
    client: TestClient, changes: dict[str, Any], message: str
) -> None:
    response = client.post(PLAYERS_URL, json={**MEIA_LUA, **changes})

    assert response.status_code == 400
    assert response.json() == {"message": message}
    assert not Player.objects.exists()


@pytest.mark.parametrize("field", list(MEIA_LUA))
def test_registration_requires_every_field(client: TestClient, field: str) -> None:
    body = {name: value for name, value in MEIA_LUA.items() if name != field}

    response = client.post(PLAYERS_URL, json=body)

    assert response.status_code == 400
    assert response.json() == {"message": f"Campo {field}: é obrigatório."}
    assert not Player.objects.exists()


def test_field_sent_with_another_name_counts_as_missing(client: TestClient) -> None:
    body = {name: value for name, value in MEIA_LUA.items() if name != "agility"}

    response = client.post(PLAYERS_URL, json={**body, "Agility": 85})

    assert response.status_code == 400
    assert response.json() == {"message": "Campo agility: é obrigatório."}


@pytest.mark.parametrize("content", ["[]", '"x"', "10", '{"name": '])
def test_body_that_is_not_a_json_object_is_refused(client: TestClient, content: str) -> None:
    response = client.post(
        PLAYERS_URL, content=content, headers={"Content-Type": "application/json"}
    )

    assert response.status_code == 400
    assert response.json()["message"]
    assert not Player.objects.exists()


def test_get_returns_the_player_with_overall_and_market_value(client: TestClient) -> None:
    player_id = register_player(client)["id"]

    response = client.get(player_url(player_id), params={"sort": "ignored"})

    assert response.status_code == 200
    assert response.json() == registered_meia_lua(player_id)


def test_get_of_a_missing_player_is_404(client: TestClient) -> None:
    response = client.get(player_url(999999))

    assert response.status_code == 404
    assert response.json() == {"message": "Jogador não encontrado."}


@pytest.mark.parametrize("player_id", ["abc", "0", "-1", "1.5", "01", "2147483648"])
def test_get_with_a_malformed_id_is_404(client: TestClient, player_id: str) -> None:
    response = client.get(player_url(player_id))

    assert response.status_code == 404
    assert response.json()["message"]


def test_get_of_a_deleted_player_is_404(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    Player.objects.filter(pk=player_id).update(deleted_at=timezone.now())

    response = client.get(player_url(player_id))

    assert response.status_code == 404
    assert response.json() == {"message": "Jogador não encontrado."}
