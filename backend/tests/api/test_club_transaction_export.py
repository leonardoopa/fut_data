import pytest
from django.utils import timezone
from fastapi.testclient import TestClient

from tests.api.conftest import FixedClock
from tests.api.factories import (
    SOLD_AT,
    buy,
    buy_documented_example,
    export_url,
    insert_player,
    recover_and_sell,
    register_club,
)

pytestmark = pytest.mark.usefixtures("clock")

HEADER = b"data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n"
DOCUMENTED_SALE_ROW = (
    b"2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n"
)
DOCUMENTED_PURCHASE_ROW = (
    b"2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n"
)


@pytest.fixture
def documented_club_id(client: TestClient, clock: FixedClock) -> int:
    player_id, club_id = buy_documented_example(client)
    clock.moment = SOLD_AT
    recover_and_sell(client, player_id)
    return club_id


def export(client: TestClient, club_id: int, **params: str) -> bytes:
    response = client.get(export_url(club_id), params=params)
    assert response.status_code == 200, response.text
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    return response.content


def test_documented_history_is_exported_most_recent_first(
    client: TestClient, documented_club_id: int
) -> None:
    assert export(client, documented_club_id) == (
        HEADER + DOCUMENTED_SALE_ROW + DOCUMENTED_PURCHASE_ROW
    )


@pytest.mark.parametrize(
    ("params", "rows"),
    [
        ({"type": "COMPRA"}, DOCUMENTED_PURCHASE_ROW),
        ({"type": "VENDA"}, DOCUMENTED_SALE_ROW),
        ({"type": "VENDA,COMPRA"}, DOCUMENTED_SALE_ROW + DOCUMENTED_PURCHASE_ROW),
    ],
)
def test_export_uses_the_history_filters(
    client: TestClient, documented_club_id: int, params: dict[str, str], rows: bytes
) -> None:
    assert export(client, documented_club_id, **params) == HEADER + rows


def test_club_without_transactions_exports_only_the_header(client: TestClient) -> None:
    club_id = register_club(client)["id"]

    assert export(client, club_id) == HEADER


def test_export_is_utf8_without_bom(client: TestClient) -> None:
    club_id = register_club(client)["id"]
    buy(client, insert_player("Zé Cação").id, club_id)

    content = export(client, club_id)

    assert not content.startswith(b"\xef\xbb\xbf")
    assert ";Zé Cação;".encode() in content


def test_player_id_filter_keeps_only_that_player(client: TestClient) -> None:
    club_id = register_club(client)["id"]
    followed, other = (
        insert_player(name) for name in ("Seguido Aqui", "Outro Jogador")
    )
    for player in (followed, other):
        buy(client, player.id, club_id)

    lines = export(client, club_id, player_id=str(followed.id)).decode().splitlines()

    assert [line.split(";")[2] for line in lines[1:]] == ["Seguido Aqui"]


@pytest.mark.parametrize(
    ("name", "csv_field"),
    [
        ('Zé "Foguete" Lima', b'"Z\xc3\xa9 ""Foguete"" Lima"'),
        ("Ana;Maria Lima", b'"Ana;Maria Lima"'),
    ],
)
def test_name_with_separator_or_quotes_is_quoted(
    client: TestClient, name: str, csv_field: bytes
) -> None:
    club_id = register_club(client)["id"]
    buy(client, insert_player(name).id, club_id)

    rows = export(client, club_id).split(b"\n")

    assert (
        rows[1]
        == b"2026-11-02T10:15:00-03:00;COMPRA;"
        + csv_field
        + b";10,00;0,00;0,00;;-10,00"
    )


@pytest.mark.parametrize(
    "params", [{"type": "compra"}, {"type": ""}, {"player_id": "0"}]
)
def test_invalid_filter_is_a_json_400(
    client: TestClient, params: dict[str, str]
) -> None:
    club_id = register_club(client)["id"]

    response = client.get(export_url(club_id), params=params)

    assert response.status_code == 400
    assert response.headers["content-type"] == "application/json"
    assert response.json()["message"]


def test_missing_club_or_player_is_a_json_404(client: TestClient) -> None:
    club_id = register_club(client)["id"]
    deleted = insert_player("Fora Daqui", deleted_at=timezone.now())

    responses = [
        client.get(export_url(999999)),
        client.get(export_url("abc")),
        client.get(export_url(club_id), params={"player_id": "999999"}),
        client.get(export_url(club_id), params={"player_id": str(deleted.id)}),
    ]

    assert [response.status_code for response in responses] == [404] * 4
    assert all(response.json()["message"] for response in responses)
