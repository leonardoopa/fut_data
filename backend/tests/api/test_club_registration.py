from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.models import Club
from tests.api.factories import AGUIAS, CLUBS_URL, create_club, register_club


def test_create_club_answers_201_with_location_and_the_initial_cash(client: TestClient) -> None:
    response = client.post(CLUBS_URL, json={**AGUIAS, "cash": 1000})

    body = response.json()
    assert response.status_code == 201
    assert response.headers["location"] == f"/api/v1/clubs/{body['id']}"
    assert body == {
        "id": body["id"],
        "name": "Águias FC",
        "acronym": "AGU",
        "cash": 300.0,
        "squad_value": 0.0,
        "net_worth": 300.0,
    }
    club = Club.objects.get(pk=body["id"])
    assert (club.name_key, club.cash) == ("águias fc", 300)


def test_club_name_is_normalized_before_saving(client: TestClient) -> None:
    body = register_club(client, name="  Santa   Cruz  ", acronym="SCZ")

    assert body["name"] == "Santa Cruz"


@pytest.mark.parametrize(
    ("body", "message"),
    [
        ({"acronym": "AGU"}, "Campo name: é obrigatório."),
        ({"name": "Águias FC"}, "Campo acronym: é obrigatório."),
        ({"name": "   ", "acronym": "AGU"}, "Campo name: é obrigatório."),
        ({"name": "Águias", "acronym": "AGU"}, "Campo name: deve ter de 2 a 5 palavras."),
        (
            {"name": "Águias FC 1", "acronym": "AGU"},
            "Campo name: só pode conter letras, espaços, hífen e ponto.",
        ),
        ({"name": "Águias FC", "acronym": "agu"}, "Campo acronym: deve ter exatamente"),
        ({"name": "Águias FC", "acronym": 123}, "Campo acronym: deve ser um texto."),
        ({"name": "Aaa Aaa", "acronym": "AAA"}, "Campo acronym: não pode ter as três letras"),
        ({"name": "Águias FC", "acronym": "GAF"}, "A sigla (acronym) deve começar"),
        ({"name": "Águias FC", "acronym": "AUG"}, "A sigla (acronym) deve começar"),
    ],
)
def test_invalid_club_is_refused_with_400_and_nothing_is_written(
    client: TestClient, body: dict[str, Any], message: str
) -> None:
    response = client.post(CLUBS_URL, json=body)

    assert response.status_code == 400
    assert response.json()["message"].startswith(message)
    assert not Club.objects.exists()


@pytest.mark.parametrize("name", ["Águias FC", " águias   fc ", "ÁGUIAS FC"])
def test_club_name_already_registered_ignoring_case_is_409(client: TestClient, name: str) -> None:
    register_club(client)

    response = client.post(CLUBS_URL, json={"name": name, "acronym": "ASC"})

    assert response.status_code == 409
    assert response.json() == {"message": "Já existe um clube com este nome."}
    assert Club.objects.count() == 1


def test_club_name_that_differs_only_by_accents_is_accepted(client: TestClient) -> None:
    register_club(client)

    response = client.post(CLUBS_URL, json={"name": "Aguias FC", "acronym": "ASC"})

    assert response.status_code == 201


def test_acronym_already_registered_is_409(client: TestClient) -> None:
    register_club(client)

    response = client.post(CLUBS_URL, json={"name": "Atlético Gurupi", "acronym": "AGU"})

    assert response.status_code == 409
    assert response.json() == {"message": "Já existe um clube com esta sigla."}
    assert Club.objects.count() == 1


def test_twenty_first_club_is_refused(client: TestClient) -> None:
    for letter in "BCDEFGHIJKLMNOPQRSTU":
        create_club(acronym=f"X{letter}Z")

    response = client.post(CLUBS_URL, json=AGUIAS)

    assert response.status_code == 409
    assert response.json() == {"message": "A liga já tem o máximo de 20 clubes."}
    assert Club.objects.count() == 20
