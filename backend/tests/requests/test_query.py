from decimal import Decimal
from enum import StrEnum
from typing import Annotated

import pytest
from pydantic import TypeAdapter, ValidationError

from app.domain.enums import TransactionType
from app.domain.exceptions import InvalidInputError
from app.requests.query import (
    choice_list,
    parse_boolean,
    parse_decimal,
    parse_positive_integer,
    parse_search,
)


class SortOption(StrEnum):
    NAME = "name"
    VALUE_ASC = "value_asc"
    VALUE_DESC = "value_desc"
    AGE_ASC = "age_asc"

    @property
    def field(self) -> str:
        return self.value.split("_")[0]


TransactionTypes = TypeAdapter(
    Annotated[tuple[TransactionType, ...] | None, choice_list(TransactionType)]
)
SortOptions = TypeAdapter(
    Annotated[
        tuple[SortOption, ...] | None,
        choice_list(SortOption, max_items=2, group_of=lambda option: option.field),
    ]
)


@pytest.mark.parametrize(
    ("raw", "expected"), [("1", 1), ("25", 25), ("2147483647", 2147483647)]
)
def test_positive_integer_accepts_plain_digits(raw: str, expected: int) -> None:
    assert parse_positive_integer(raw) == expected


@pytest.mark.parametrize(
    "raw", ["", "0", "01", "-1", "+1", "1.0", "1e3", " 1", "\uff11"]
)
def test_positive_integer_rejects_any_other_form(raw: str) -> None:
    with pytest.raises(InvalidInputError):
        parse_positive_integer(raw)


@pytest.mark.parametrize("raw", ["0", "10", "10.5", "10.55", "0.5", "550"])
def test_decimal_accepts_up_to_two_places(raw: str) -> None:
    assert parse_decimal(raw) == Decimal(raw)


@pytest.mark.parametrize(
    "raw", ["", "010", "00.5", "10.", ".5", "10.555", "-1", "1e2", "10,5"]
)
def test_decimal_rejects_any_other_form(raw: str) -> None:
    with pytest.raises(InvalidInputError):
        parse_decimal(raw)


@pytest.mark.parametrize(("raw", "expected"), [("true", True), ("false", False)])
def test_boolean_accepts_lowercase_words(raw: str, expected: bool) -> None:
    assert parse_boolean(raw) is expected


@pytest.mark.parametrize("raw", ["True", "TRUE", "1", "yes", ""])
def test_boolean_rejects_any_other_spelling(raw: str) -> None:
    with pytest.raises(InvalidInputError):
        parse_boolean(raw)


@pytest.mark.parametrize(
    ("raw", "expected"), [("  lua  ", "lua"), ("meia   lua", "meia lua")]
)
def test_search_is_normalized(raw: str, expected: str) -> None:
    assert parse_search(raw) == expected


@pytest.mark.parametrize("raw", ["", "   ", "a", "lu\ta", "a" * 101])
def test_search_rejects_empty_short_long_or_control_text(raw: str) -> None:
    with pytest.raises(InvalidInputError):
        parse_search(raw)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("COMPRA", (TransactionType.COMPRA,)),
        ("VENDA,COMPRA", (TransactionType.VENDA, TransactionType.COMPRA)),
    ],
)
def test_choice_list_accepts_comma_separated_values(
    raw: str, expected: tuple[TransactionType, ...]
) -> None:
    assert TransactionTypes.validate_python(raw) == expected


@pytest.mark.parametrize(
    "raw", ["", "compra", "COMPRA,venda", "COMPRA, VENDA", "COMPRA,COMPRA", "COMPRA,"]
)
def test_choice_list_rejects_invalid_or_repeated_values(raw: str) -> None:
    with pytest.raises(ValidationError):
        TransactionTypes.validate_python(raw)


def test_choice_list_reads_the_single_occurrence_that_fastapi_delivers() -> None:
    assert TransactionTypes.validate_python(["VENDA,COMPRA"]) == (
        TransactionType.VENDA,
        TransactionType.COMPRA,
    )


def test_choice_list_rejects_a_repeated_parameter() -> None:
    with pytest.raises(ValidationError):
        TransactionTypes.validate_python(["VENDA", "COMPRA"])


def test_choice_list_accepts_two_criteria_of_different_fields() -> None:
    assert SortOptions.validate_python("value_desc,age_asc") == (
        SortOption.VALUE_DESC,
        SortOption.AGE_ASC,
    )


@pytest.mark.parametrize("raw", ["value_asc,value_desc", "name,value_asc,age_asc"])
def test_choice_list_rejects_repeated_field_or_too_many_criteria(raw: str) -> None:
    with pytest.raises(ValidationError):
        SortOptions.validate_python(raw)
