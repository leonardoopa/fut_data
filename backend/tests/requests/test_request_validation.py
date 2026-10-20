from typing import Annotated, Self

import pytest
from fastapi import APIRouter, Query
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field, model_validator

from app.domain.enums import TransactionType
from app.domain.exceptions import InvalidInputError
from app.main import create_app
from app.requests.fields import StrictInteger
from app.requests.path import ResourceId
from app.requests.query import QueryPositiveInteger, choice_list

UNLUCKY_AMOUNT = 13


class ProbeBody(BaseModel):
    amount: Annotated[StrictInteger, Field(le=50)]

    @model_validator(mode="after")
    def reject_unlucky_amount(self) -> Self:
        if self.amount == UNLUCKY_AMOUNT:
            raise InvalidInputError("O valor 13 não é aceito.")
        return self


class ProbeFilters(BaseModel):
    types: Annotated[tuple[TransactionType, ...] | None, choice_list(TransactionType)] = None


probe_router = APIRouter(prefix="/probe")


@probe_router.post("/body")
def echo_body(body: ProbeBody) -> dict[str, int]:
    return {"amount": body.amount}


@probe_router.get("/query")
def echo_query(
    min_age: Annotated[QueryPositiveInteger, Field(ge=16, le=45)] = None,
) -> dict[str, int | None]:
    return {"min_age": min_age}


@probe_router.get("/filters")
def echo_filters(filters: Annotated[ProbeFilters, Query()]) -> dict[str, list[str] | None]:
    return {"types": None if filters.types is None else list(filters.types)}


@probe_router.get("/items/{item_id}")
def echo_item(item_id: ResourceId) -> dict[str, int]:
    return {"id": item_id}


@pytest.fixture
def probe_client() -> TestClient:
    app = create_app()
    app.include_router(probe_router)
    return TestClient(app)


def post_raw(client: TestClient, content: str) -> tuple[int, str]:
    response = client.post(
        "/probe/body", content=content, headers={"Content-Type": "application/json"}
    )
    return response.status_code, response.json()["message"]


@pytest.mark.parametrize(
    ("content", "message"),
    [
        ("[]", "O corpo da requisição deve ser um objeto JSON."),
        ('"x"', "O corpo da requisição deve ser um objeto JSON."),
        ("10", "O corpo da requisição deve ser um objeto JSON."),
        ('{"amount": ', "O corpo da requisição não é um JSON válido."),
        ("{}", "Campo amount: é obrigatório."),
        ('{"Amount": 10}', "Campo amount: é obrigatório."),
        ('{"amount": null}', "Campo amount: deve ser um número inteiro."),
        ('{"amount": "15"}', "Campo amount: deve ser um número inteiro."),
        ('{"amount": 15.5}', "Campo amount: deve ser um número inteiro."),
        ('{"amount": 51}', "Campo amount: deve ser menor ou igual a 50."),
        ('{"amount": 13}', "O valor 13 não é aceito."),
    ],
)
def test_invalid_body_is_refused_with_400_and_message(
    probe_client: TestClient, content: str, message: str
) -> None:
    assert post_raw(probe_client, content) == (400, message)


def test_missing_body_is_refused_with_400(probe_client: TestClient) -> None:
    response = probe_client.post("/probe/body")

    assert response.status_code == 400
    assert response.json() == {"message": "O corpo da requisição é obrigatório."}


def test_integer_with_zero_fraction_and_unknown_fields_are_accepted(
    probe_client: TestClient,
) -> None:
    response = probe_client.post("/probe/body", json={"amount": 15.0, "cash": 999})

    assert response.status_code == 200
    assert response.json() == {"amount": 15}


def test_json_body_without_content_type_is_still_read(probe_client: TestClient) -> None:
    response = probe_client.post("/probe/body", content='{"amount": 20}')

    assert response.json() == {"amount": 20}


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("", {"min_age": None}),
        ("?min_age=20", {"min_age": 20}),
        ("?min_age=20&unknown=x", {"min_age": 20}),
    ],
)
def test_absent_or_valid_query_params_are_accepted(
    probe_client: TestClient, query: str, expected: dict[str, int | None]
) -> None:
    response = probe_client.get(f"/probe/query{query}")

    assert response.status_code == 200
    assert response.json() == expected


@pytest.mark.parametrize(
    ("query", "message"),
    [
        ("?min_age=", "Campo min_age: deve ser um inteiro positivo"),
        ("?min_age=01", "Campo min_age: deve ser um inteiro positivo"),
        ("?min_age=50", "Campo min_age: deve ser menor ou igual a 45."),
    ],
)
def test_empty_or_malformed_query_params_are_refused_with_400(
    probe_client: TestClient, query: str, message: str
) -> None:
    response = probe_client.get(f"/probe/query{query}")

    assert response.status_code == 400
    assert response.json()["message"].startswith(message)


@pytest.mark.parametrize(
    ("query", "expected"), [("", None), ("?types=VENDA,COMPRA", ["VENDA", "COMPRA"])]
)
def test_list_query_param_of_a_query_model_is_read_from_one_occurrence(
    probe_client: TestClient, query: str, expected: list[str] | None
) -> None:
    response = probe_client.get(f"/probe/filters{query}")

    assert response.status_code == 200
    assert response.json() == {"types": expected}


@pytest.mark.parametrize("query", ["?types=", "?types=VENDA&types=COMPRA"])
def test_empty_or_repeated_list_query_param_is_refused_with_400(
    probe_client: TestClient, query: str
) -> None:
    response = probe_client.get(f"/probe/filters{query}")

    assert response.status_code == 400
    assert response.json()["message"].startswith("Campo types:")


@pytest.mark.parametrize("item_id", ["abc", "0", "-1", "1.5", "01", "2147483648"])
def test_malformed_url_id_counts_as_missing_resource(
    probe_client: TestClient, item_id: str
) -> None:
    response = probe_client.get(f"/probe/items/{item_id}")

    assert response.status_code == 404
    assert response.json()["message"]


def test_well_formed_url_id_is_accepted(probe_client: TestClient) -> None:
    assert probe_client.get("/probe/items/2147483647").json() == {"id": 2147483647}
