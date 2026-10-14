from decimal import Decimal
from typing import Any

import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from tests.api.factories import (
    PLAYERS_URL,
    create_club,
    insert_player,
    player_url,
    register_player,
)

SQUAD_IN_INSERTION_ORDER = (
    ("Davi Rocha", "ATA", 28, "15.00"),
    ("Caio Nunes", "MEI", 22, "40.00"),
    ("Fábio Reis", "MEI", 29, "10.00"),
    ("Edu Prado", "LAT", 25, "35.00"),
    ("Ana Lima", "ZAG", 25, "30.00"),
    ("Bruno Dias", "GOL", 31, "25.00"),
)


def list_players(client: TestClient, **params: Any) -> dict[str, Any]:
    response = client.get(PLAYERS_URL, params=params)
    assert response.status_code == 200, response.text
    return response.json()


def listed_names(client: TestClient, **params: Any) -> list[str]:
    return [player["name"] for player in list_players(client, **params)["data"]]


@pytest.fixture
def squad(transactional_db: None) -> None:
    for name, position, age, value in SQUAD_IN_INSERTION_ORDER:
        insert_player(name, position=position, age=age, base_value=Decimal(value))


@pytest.fixture
def twenty_three_players(transactional_db: None) -> list[str]:
    names = [f"Atleta {chr(ord('A') + index)}" for index in range(23)]
    for name in names:
        insert_player(name)
    return names


def test_specification_example_lists_meia_lua_after_the_condition_change(
    client: TestClient,
) -> None:
    meia_lua_id = register_player(client)["id"]
    client.patch(f"{player_url(meia_lua_id)}/condition", json={"condition": "MAL_CONDICIONADO"})
    register_player(client, name="Lua Nova", position="ATA")
    register_player(client, name="Meia Sol")

    body = list_players(client, search="lua", position="MEI", sort="value_desc", page=1, limit=10)

    assert body["meta"] == {"page": 1, "limit": 10, "total_items": 1, "total_pages": 1}
    assert body["data"] == [client.get(player_url(meia_lua_id)).json()]
    assert body["data"][0] == {
        "id": meia_lua_id,
        "name": "Meia Lua",
        "position": "MEI",
        "agility": 85,
        "age": 25,
        "condition": "MAL_CONDICIONADO",
        "base_value": 40.0,
        "market_value": 37.0,
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


def test_listing_without_results_is_200_with_empty_data(client: TestClient) -> None:
    assert list_players(client) == {
        "data": [],
        "meta": {"page": 1, "limit": 10, "total_items": 0, "total_pages": 0},
    }


@pytest.mark.parametrize(
    ("limit", "page", "first", "last", "total_pages"),
    [(10, 1, 0, 10, 3), (10, 3, 20, 23, 3), (10, 4, 23, 23, 3), (50, 1, 0, 23, 1)],
)
def test_pagination_follows_the_specification_table(
    client: TestClient,
    twenty_three_players: list[str],
    limit: int,
    page: int,
    first: int,
    last: int,
    total_pages: int,
) -> None:
    body = list_players(client, limit=limit, page=page)

    assert [player["name"] for player in body["data"]] == twenty_three_players[first:last]
    assert body["meta"] == {
        "page": page,
        "limit": limit,
        "total_items": 23,
        "total_pages": total_pages,
    }


def test_default_page_and_limit_are_1_and_10(
    client: TestClient, twenty_three_players: list[str]
) -> None:
    body = list_players(client)

    assert [player["name"] for player in body["data"]] == twenty_three_players[:10]
    assert body["meta"] == {"page": 1, "limit": 10, "total_items": 23, "total_pages": 3}


@pytest.mark.parametrize(
    ("sort", "expected"),
    [
        ("name", ["Ana Lima", "Bruno Dias", "Caio Nunes", "Davi Rocha", "Edu Prado", "Fábio Reis"]),
        (
            "value_asc",
            ["Fábio Reis", "Davi Rocha", "Bruno Dias", "Ana Lima", "Edu Prado", "Caio Nunes"],
        ),
        (
            "value_desc",
            ["Caio Nunes", "Edu Prado", "Ana Lima", "Bruno Dias", "Davi Rocha", "Fábio Reis"],
        ),
        (
            "age_asc",
            ["Caio Nunes", "Ana Lima", "Edu Prado", "Davi Rocha", "Fábio Reis", "Bruno Dias"],
        ),
        (
            "age_desc",
            ["Bruno Dias", "Fábio Reis", "Davi Rocha", "Ana Lima", "Edu Prado", "Caio Nunes"],
        ),
        (
            "position",
            ["Bruno Dias", "Ana Lima", "Edu Prado", "Caio Nunes", "Fábio Reis", "Davi Rocha"],
        ),
        (
            "position,value_asc",
            ["Bruno Dias", "Ana Lima", "Edu Prado", "Fábio Reis", "Caio Nunes", "Davi Rocha"],
        ),
        (
            "age_asc,value_desc",
            ["Caio Nunes", "Edu Prado", "Ana Lima", "Davi Rocha", "Fábio Reis", "Bruno Dias"],
        ),
    ],
)
def test_each_sort_criterion_and_their_combination(
    client: TestClient, squad: None, sort: str, expected: list[str]
) -> None:
    assert listed_names(client, sort=sort) == expected


def test_alphabetical_order_ignores_case_and_accents_and_puts_space_before_hyphen(
    client: TestClient,
) -> None:
    for name in ("gama Reis", "Épsilon Dias", "Delta Melo", "Ana-Maria Lima", "Ana Lima"):
        insert_player(name)

    assert listed_names(client) == [
        "Ana Lima",
        "Ana-Maria Lima",
        "Delta Melo",
        "Épsilon Dias",
        "gama Reis",
    ]


def test_ties_are_broken_by_name_and_then_by_id(client: TestClient) -> None:
    insert_player("Zeca Lima", base_value=Decimal("20.00"))
    first_homonym = insert_player("Ana Souza", base_value=Decimal("20.00"))
    insert_player("Bruno Dias", base_value=Decimal("30.00"))
    second_homonym = insert_player("Ana Souza", base_value=Decimal("20.00"))

    data = list_players(client, sort="value_desc")["data"]

    assert [player["name"] for player in data] == [
        "Bruno Dias",
        "Ana Souza",
        "Ana Souza",
        "Zeca Lima",
    ]
    assert [data[1]["id"], data[2]["id"]] == [first_homonym.id, second_homonym.id]


@pytest.mark.parametrize(
    ("search", "expected"),
    [
        ("joao", ["João Silva"]),
        ("LUA", ["Meia Lua"]),
        ("conceicao", ["Conceição Dias"]),
        ("  meia   lua ", ["Meia Lua"]),
        ("sol", []),
    ],
)
def test_search_ignores_case_and_accents(
    client: TestClient, search: str, expected: list[str]
) -> None:
    for name in ("João Silva", "Meia Lua", "Conceição Dias"):
        insert_player(name)

    assert listed_names(client, search=search) == expected


def test_filters_by_position_and_by_condition(client: TestClient) -> None:
    insert_player("Ana Lima", position="GOL", condition="DOENTE")
    insert_player("Bruno Dias", position="GOL")
    insert_player("Caio Nunes", position="ATA", condition="DOENTE")

    assert listed_names(client, position="GOL") == ["Ana Lima", "Bruno Dias"]
    assert listed_names(client, condition="DOENTE") == ["Ana Lima", "Caio Nunes"]
    assert listed_names(client, position="GOL", condition="DOENTE") == ["Ana Lima"]


def test_filters_free_players_players_with_club_and_a_club_squad(client: TestClient) -> None:
    eagles, lions = create_club("AGU"), create_club("LEO")
    insert_player("Ana Lima", club=eagles)
    insert_player("Bruno Dias", club=lions)
    insert_player("Caio Nunes")

    assert listed_names(client, free="true") == ["Caio Nunes"]
    assert listed_names(client, free="false") == ["Ana Lima", "Bruno Dias"]
    assert listed_names(client, club_id=eagles.id) == ["Ana Lima"]
    assert listed_names(client, club_id=lions.id, free="false") == ["Bruno Dias"]


def test_club_filter_with_a_missing_club_is_404(client: TestClient) -> None:
    response = client.get(PLAYERS_URL, params={"club_id": 999999})

    assert response.status_code == 404
    assert response.json() == {"message": "Clube não encontrado."}


def test_club_filter_with_a_club_without_players_is_empty(client: TestClient) -> None:
    insert_player("Ana Lima")

    assert listed_names(client, club_id=create_club().id) == []


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"min_age": 25}, ["Bruno Dias", "Caio Nunes"]),
        ({"max_age": 25}, ["Ana Lima", "Bruno Dias"]),
        ({"min_age": 25, "max_age": 25}, ["Bruno Dias"]),
        ({"min_age": 16, "max_age": 45}, ["Ana Lima", "Bruno Dias", "Caio Nunes"]),
        ({"min_age": 45}, []),
    ],
)
def test_age_range_is_inclusive_and_a_missing_bound_assumes_the_extreme(
    client: TestClient, params: dict[str, int], expected: list[str]
) -> None:
    insert_player("Ana Lima", age=20)
    insert_player("Bruno Dias", age=25)
    insert_player("Caio Nunes", age=30)

    assert listed_names(client, **params) == expected


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"min_value": "34"}, ["Ana Lima", "Bruno Dias"]),
        ({"min_value": "34.01"}, ["Bruno Dias"]),
        ({"max_value": "34"}, ["Ana Lima"]),
        ({"min_value": "34.5", "max_value": "36"}, ["Bruno Dias"]),
        ({"min_value": "0", "max_value": "550"}, ["Ana Lima", "Bruno Dias"]),
        ({"min_value": "40"}, []),
    ],
)
def test_value_range_uses_the_market_value_and_is_inclusive(
    client: TestClient, params: dict[str, str], expected: list[str]
) -> None:
    insert_player("Ana Lima", base_value=Decimal("40.00"), condition="MAL_CONDICIONADO")
    insert_player("Bruno Dias", base_value=Decimal("36.00"))

    assert listed_names(client, **params) == expected


def test_filters_search_sort_and_pagination_combine(client: TestClient) -> None:
    club = create_club()
    insert_player("Ana Lima", position="MEI", age=24, base_value=Decimal("30.00"))
    insert_player("Bia Lima", position="MEI", age=27, base_value=Decimal("35.00"))
    insert_player("Caio Lima", position="MEI", age=29, base_value=Decimal("20.00"))
    insert_player("Davi Lima", position="ATA", age=26, base_value=Decimal("50.00"))
    insert_player("Edu Lima", position="MEI", age=26, base_value=Decimal("45.00"), club=club)
    insert_player("Fábio Souza", position="MEI", age=26, base_value=Decimal("40.00"))

    body = list_players(
        client,
        search="lima",
        position="MEI",
        free="true",
        min_age=24,
        max_age=28,
        min_value="25",
        sort="value_desc",
        limit=1,
        page=2,
    )

    assert [player["name"] for player in body["data"]] == ["Ana Lima"]
    assert body["meta"] == {"page": 2, "limit": 1, "total_items": 2, "total_pages": 2}


def test_deleted_players_are_never_listed(client: TestClient) -> None:
    insert_player("Ana Lima", deleted_at=timezone.now())
    insert_player("Bruno Dias")

    assert listed_names(client) == ["Bruno Dias"]
    assert listed_names(client, search="ana") == []


def test_unknown_or_differently_cased_params_are_ignored(client: TestClient) -> None:
    insert_player("Ana Lima", position="GOL")

    assert listed_names(client, Position="ATA", unknown="x") == ["Ana Lima"]


@pytest.mark.parametrize(
    "query",
    [
        "search=",
        "search=a",
        "search=%20%20%20",
        "position=",
        "position=mei",
        "condition=apto",
        "free=",
        "free=TRUE",
        "club_id=",
        "club_id=abc",
        "club_id=0",
        "club_id=01",
        "club_id=1.0",
        "min_age=15",
        "max_age=46",
        "min_age=+20",
        "min_age=2e1",
        "min_value=550.01",
        "min_value=-1",
        "min_value=1e2",
        "min_value=010",
        "max_value=10,5",
        "max_value=10.555",
        "sort=",
        "sort=POSITION",
        "sort=value_asc,value_desc",
        "sort=name,name",
        "sort=name,value_asc,age_asc",
        "sort=name,%20value_asc",
        "sort=name,",
        "page=",
        "page=0",
        "page=-1",
        "limit=0",
        "limit=51",
    ],
)
def test_malformed_query_param_is_refused_with_400(client: TestClient, query: str) -> None:
    response = client.get(f"{PLAYERS_URL}?{query}")

    assert response.status_code == 400
    assert response.json()["message"]


@pytest.mark.parametrize(
    ("query", "message"),
    [
        (
            "min_age=30&max_age=20",
            "A idade mínima (min_age) não pode ser maior que a máxima (max_age).",
        ),
        (
            "min_value=20&max_value=10.5",
            "O valor mínimo (min_value) não pode ser maior que o máximo (max_value).",
        ),
        (
            "free=true&club_id=1",
            "free=true não pode ser combinado com club_id: jogador livre não tem clube.",
        ),
    ],
)
def test_contradictory_combination_is_refused_with_400(
    client: TestClient, query: str, message: str
) -> None:
    response = client.get(f"{PLAYERS_URL}?{query}")

    assert response.status_code == 400
    assert response.json() == {"message": message}


def test_page_beyond_the_last_is_empty_with_the_right_meta(client: TestClient) -> None:
    insert_player("Ana Lima")

    body = list_players(client, page=2147483647, limit=50)

    assert body == {
        "data": [],
        "meta": {"page": 2147483647, "limit": 50, "total_items": 1, "total_pages": 1},
    }
