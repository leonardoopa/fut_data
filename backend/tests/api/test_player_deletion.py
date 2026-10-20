import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from app.models import Player
from tests.api.factories import (
    PLAYERS_URL,
    create_club,
    player_url,
    register_player,
    sign_player,
)


def test_delete_answers_204_without_body_and_only_marks_the_row(
    client: TestClient,
) -> None:
    player_id = register_player(client)["id"]
    before = timezone.now()

    response = client.delete(player_url(player_id))

    deleted_at = Player.objects.get(pk=player_id).deleted_at
    assert response.status_code == 204
    assert response.content == b""
    assert "content-type" not in response.headers
    assert deleted_at is not None
    assert before <= deleted_at <= timezone.now()


def test_deleted_player_counts_as_missing_in_every_endpoint(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    client.delete(player_url(player_id))
    profile = {"name": "Davi Melo", "position": "MEI", "agility": 70, "age": 26}

    responses = [
        client.get(player_url(player_id)),
        client.put(player_url(player_id), json=profile),
        client.patch(
            f"{player_url(player_id)}/condition", json={"condition": "DOENTE"}
        ),
        client.delete(player_url(player_id)),
    ]

    assert [response.status_code for response in responses] == [404, 404, 404, 404]
    assert all(response.json()["message"] for response in responses)
    assert client.get(PLAYERS_URL).json()["data"] == []


def test_player_in_a_club_cannot_be_deleted(client: TestClient) -> None:
    player_id = register_player(client)["id"]
    sign_player(player_id, create_club())

    response = client.delete(player_url(player_id))

    assert response.status_code == 409
    assert response.json() == {
        "message": "Só jogador livre pode ser excluído; este jogador está no elenco de um clube."
    }
    assert Player.objects.get(pk=player_id).deleted_at is None


def test_delete_ignores_a_body_sent_with_the_request(client: TestClient) -> None:
    player_id = register_player(client)["id"]

    response = client.request(
        "DELETE", player_url(player_id), json={"reason": "ignored"}
    )

    assert response.status_code == 204


def test_delete_of_a_missing_player_is_404(client: TestClient) -> None:
    response = client.delete(player_url(999999))

    assert response.status_code == 404
    assert response.json() == {"message": "Jogador não encontrado."}


@pytest.mark.parametrize("player_id", ["abc", "0", "-1", "1.5", "01", "2147483648"])
def test_delete_with_a_malformed_id_is_404(client: TestClient, player_id: str) -> None:
    assert client.delete(player_url(player_id)).status_code == 404
