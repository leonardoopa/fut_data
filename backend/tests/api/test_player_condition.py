from typing import Any

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.models import LineupSlot, Player
from tests.api.factories import create_club, player_url, register_player, sign_player


def condition_url(player_id: int | str) -> str:
    return f"{player_url(player_id)}/condition"


def stored_condition(player_id: int) -> str:
    return Player.objects.get(pk=player_id).condition


def test_condition_change_returns_the_player_with_the_new_market_value(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]

    response = client.patch(
        condition_url(player_id), json={"condition": "MAL_CONDICIONADO"}
    )

    body = response.json()
    assert response.status_code == 200
    assert (body["condition"], body["market_value"], body["base_value"]) == (
        "MAL_CONDICIONADO",
        37.0,
        40.0,
    )
    assert stored_condition(player_id) == "MAL_CONDICIONADO"


def test_sending_the_current_condition_is_accepted_without_change(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]
    updated_at = Player.objects.get(pk=player_id).updated_at

    response = client.patch(condition_url(player_id), json={"condition": "APTO"})

    assert response.status_code == 200
    assert response.json()["condition"] == "APTO"
    assert Player.objects.get(pk=player_id).updated_at == updated_at


def test_sick_player_cannot_go_straight_to_apt(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    client.patch(condition_url(player_id), json={"condition": "DOENTE"})

    response = client.patch(condition_url(player_id), json={"condition": "APTO"})

    assert response.status_code == 409
    assert response.json() == {
        "message": "Jogador DOENTE não pode passar direto para APTO; altere antes para "
        "MAL_CONDICIONADO."
    }
    assert stored_condition(player_id) == "DOENTE"


def test_sick_player_recovers_through_mal_condicionado(client: TestClient) -> None:
    player_id = register_player(client)["id"]

    for condition in ("DOENTE", "MAL_CONDICIONADO", "APTO"):
        response = client.patch(condition_url(player_id), json={"condition": condition})
        assert (response.status_code, response.json()["condition"]) == (200, condition)


def test_starter_who_becomes_sick_leaves_the_lineup_and_the_formation_stays(
    client: TestClient,
) -> None:
    sick_id = register_player(client)["id"]
    teammate_id = register_player(client)["id"]
    club = create_club(formation="2-2")
    sign_player(sick_id, club, starter=True)
    sign_player(teammate_id, club, starter=True)

    response = client.patch(condition_url(sick_id), json={"condition": "DOENTE"})

    club.refresh_from_db()
    assert response.status_code == 200
    assert response.json()["club_id"] == club.id
    assert list(LineupSlot.objects.values_list("player_id", flat=True)) == [teammate_id]
    assert club.formation == "2-2"


def test_starter_who_becomes_unfit_stays_in_the_lineup(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    sign_player(player_id, create_club(), starter=True)

    client.patch(condition_url(player_id), json={"condition": "MAL_CONDICIONADO"})

    assert LineupSlot.objects.filter(player_id=player_id).exists()


def test_refused_condition_change_keeps_the_starter_in_the_lineup(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]
    Player.objects.filter(pk=player_id).update(condition="DOENTE")
    sign_player(player_id, create_club(), starter=True)

    response = client.patch(condition_url(player_id), json={"condition": "APTO"})

    assert response.status_code == 409
    assert LineupSlot.objects.filter(player_id=player_id).exists()


@pytest.mark.parametrize(
    ("body", "message"),
    [
        ({}, "Campo condition: é obrigatório."),
        ({"Condition": "DOENTE"}, "Campo condition: é obrigatório."),
        ({"condition": None}, "Campo condition: valor fora da lista aceita."),
        ({"condition": "apto"}, "Campo condition: valor fora da lista aceita."),
        ({"condition": "LESIONADO"}, "Campo condition: valor fora da lista aceita."),
        ({"condition": 1}, "Campo condition: valor fora da lista aceita."),
    ],
)
def test_invalid_condition_is_refused_with_400_and_nothing_is_written(
    client: TestClient, body: dict[str, Any], message: str
) -> None:
    player_id = register_player(client)["id"]

    response = client.patch(condition_url(player_id), json=body)

    assert response.status_code == 400
    assert response.json() == {"message": message}
    assert stored_condition(player_id) == "APTO"


def test_condition_change_ignores_fields_of_other_endpoints(client: TestClient) -> None:
    player_id = register_player(client)["id"]

    response = client.patch(
        condition_url(player_id),
        json={"condition": "DOENTE", "name": "Outro Nome", "age": 40},
    )

    assert (response.json()["name"], response.json()["age"]) == ("Meia Lua", 25)


def test_condition_change_of_a_missing_player_is_404(client: TestClient) -> None:
    response = client.patch(condition_url(999999), json={"condition": "DOENTE"})

    assert response.status_code == 404
    assert response.json() == {"message": "Jogador não encontrado."}


def test_condition_change_of_a_deleted_player_is_404(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    Player.objects.filter(pk=player_id).update(deleted_at=timezone.now())

    response = client.patch(condition_url(player_id), json={"condition": "DOENTE"})

    assert response.status_code == 404
    assert stored_condition(player_id) == "APTO"


@pytest.mark.parametrize("player_id", ["abc", "0", "-1", "01"])
def test_condition_change_with_a_malformed_id_is_404(
    client: TestClient, player_id: str
) -> None:
    assert (
        client.patch(condition_url(player_id), json={"condition": "DOENTE"}).status_code
        == 404
    )
