"""Query param types.

Fields always default to `None`: FastAPI validates non-None defaults, and these
validators only accept URL text. The real defaults come from the criteria DTOs.
"""

import re
from collections.abc import Callable, Hashable
from decimal import Decimal
from enum import StrEnum
from typing import Annotated

from pydantic import PlainValidator

from app.domain.exceptions import InvalidInputError
from app.domain.text import normalize_text

POSITIVE_INTEGER_PATTERN = re.compile("[1-9][0-9]*")
DECIMAL_PATTERN = re.compile(r"(0|[1-9][0-9]*)(\.[0-9]{1,2})?")
BOOLEANS = {"true": True, "false": False}
LIST_SEPARATOR = ","

SEARCH_MIN_LENGTH = 2
SEARCH_MAX_LENGTH = 100


def parse_positive_integer(raw: object) -> int:
    if not isinstance(raw, str) or POSITIVE_INTEGER_PATTERN.fullmatch(raw) is None:
        raise InvalidInputError(
            "deve ser um inteiro positivo, só com dígitos e sem zeros à esquerda."
        )
    return int(raw)


def parse_decimal(raw: object) -> Decimal:
    if not isinstance(raw, str) or DECIMAL_PATTERN.fullmatch(raw) is None:
        raise InvalidInputError("deve ser um decimal como 10, 10.5 ou 10.55.")
    return Decimal(raw)


def parse_boolean(raw: object) -> bool:
    if not isinstance(raw, str) or raw not in BOOLEANS:
        raise InvalidInputError("deve ser true ou false.")
    return BOOLEANS[raw]


def parse_search(raw: object) -> str:
    if not isinstance(raw, str):
        raise InvalidInputError("deve ser um texto.")
    search = normalize_text(raw)
    if not SEARCH_MIN_LENGTH <= len(search) <= SEARCH_MAX_LENGTH:
        raise InvalidInputError(
            f"deve ter de {SEARCH_MIN_LENGTH} a {SEARCH_MAX_LENGTH} caracteres."
        )
    return search


def single_occurrence(raw: object) -> object:
    """FastAPI hands over the list of occurrences; the values arrive in one, comma-separated."""
    if isinstance(raw, list) and len(raw) == 1:
        return raw[0]
    return raw


def choice_list[E: StrEnum](
    enum_type: type[E],
    *,
    max_items: int | None = None,
    group_of: Callable[[E], Hashable] = lambda option: option,
) -> PlainValidator:
    options = {member.value: member for member in enum_type}
    accepted = ", ".join(options)

    def parse(raw: object) -> tuple[E, ...]:
        text = single_occurrence(raw)
        tokens = text.split(LIST_SEPARATOR) if isinstance(text, str) else []
        if not tokens or any(token not in options for token in tokens):
            raise InvalidInputError(f"use valores entre {accepted}, separados por vírgula.")
        chosen = tuple(options[token] for token in tokens)
        if max_items is not None and len(chosen) > max_items:
            raise InvalidInputError(f"aceita no máximo {max_items} valores.")
        groups = [group_of(option) for option in chosen]
        if len(set(groups)) < len(groups):
            raise InvalidInputError("não pode repetir valores.")
        return chosen

    return PlainValidator(parse, json_schema_input_type=str)


QueryPositiveInteger = Annotated[
    int | None, PlainValidator(parse_positive_integer, json_schema_input_type=int)
]
QueryDecimal = Annotated[
    Decimal | None, PlainValidator(parse_decimal, json_schema_input_type=Decimal)
]
QueryBoolean = Annotated[bool | None, PlainValidator(parse_boolean, json_schema_input_type=bool)]
QuerySearch = Annotated[str | None, PlainValidator(parse_search, json_schema_input_type=str)]
