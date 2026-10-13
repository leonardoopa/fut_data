"""Tipos dos campos do corpo das requisições, com a validação estrita de V2 e V4.

Campos de lista usam os próprios enums do domínio: o Pydantic já os compara com
maiúsculas e minúsculas exatas, como pede a V5.
"""

from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, PlainValidator

from app.domain import club, player
from app.domain.brasilia_time import parse_brasilia_datetime
from app.domain.exceptions import InvalidInputError
from app.domain.text import normalize_text


def parse_strict_integer(value: object) -> int:
    """Aceita só números JSON inteiros: 15 e 15.0 valem; "15", true e 15.5 não (V2)."""
    is_number = isinstance(value, int | float) and not isinstance(value, bool)
    if not is_number or (isinstance(value, float) and not value.is_integer()):
        raise InvalidInputError("deve ser um número inteiro.")
    return int(value)


def parse_string(value: object) -> str:
    if not isinstance(value, str):
        raise InvalidInputError("deve ser um texto.")
    return value


def parse_normalized_text(value: object) -> str:
    """Texto pela regra V4; o que fica vazio conta como ausente."""
    text = normalize_text(parse_string(value))
    if not text:
        raise InvalidInputError("é obrigatório.")
    return text


def parse_datetime(value: object) -> datetime:
    return parse_brasilia_datetime(parse_string(value))


StrictInteger = Annotated[int, PlainValidator(parse_strict_integer, json_schema_input_type=int)]
NormalizedText = Annotated[str, PlainValidator(parse_normalized_text, json_schema_input_type=str)]
PlayerName = Annotated[NormalizedText, AfterValidator(player.validate_name)]
ClubName = Annotated[NormalizedText, AfterValidator(club.validate_name)]
Acronym = Annotated[
    str,
    PlainValidator(parse_string, json_schema_input_type=str),
    AfterValidator(club.validate_acronym),
]
BrasiliaDateTime = Annotated[datetime, PlainValidator(parse_datetime, json_schema_input_type=str)]
