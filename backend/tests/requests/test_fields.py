from datetime import UTC, datetime
from typing import Any

import pytest
from pydantic import TypeAdapter, ValidationError

from app.domain.enums import Position
from app.requests.fields import (
    Acronym,
    BrasiliaDateTime,
    ClubName,
    PlayerName,
    StrictInteger,
)


def validate_json(annotation: Any, raw_json: str) -> Any:
    return TypeAdapter(annotation).validate_json(raw_json)


@pytest.mark.parametrize(
    ("raw_json", "expected"), [("15", 15), ("15.0", 15), ("-3", -3)]
)
def test_strict_integer_accepts_json_integers(raw_json: str, expected: int) -> None:
    assert validate_json(StrictInteger, raw_json) == expected


@pytest.mark.parametrize("raw_json", ['"15"', "true", "15.5", "null", "[15]"])
def test_strict_integer_rejects_anything_else(raw_json: str) -> None:
    with pytest.raises(ValidationError, match="número inteiro"):
        validate_json(StrictInteger, raw_json)


def test_list_values_are_case_sensitive() -> None:
    assert validate_json(Position, '"ATA"') == Position.ATA
    with pytest.raises(ValidationError):
        validate_json(Position, '"ata"')


@pytest.mark.parametrize(
    ("raw_json", "expected"),
    [
        ('"  Meia   Zeta "', "Meia Zeta"),
        ('"A B"', "A B"),
        ('"Zé Lima-Sá"', "Zé Lima-Sá"),
        (f'"Ana {"a" * 96}"', f"Ana {'a' * 96}"),
    ],
)
def test_player_name_is_normalized_and_accepted(raw_json: str, expected: str) -> None:
    assert validate_json(PlayerName, raw_json) == expected


@pytest.mark.parametrize(
    ("raw_json", "reason"),
    [
        ('"   "', "obrigatório"),
        ('"Ab"', "de 3 a 100 caracteres"),
        (f'"Ana {"a" * 97}"', "de 3 a 100 caracteres"),
        ('"Pelé"', "2 palavras"),
        ('"Ronaldo 9 Lima"', "dígitos"),
        ('"Ana\\tLima"', "controle"),
        ("15", "texto"),
    ],
)
def test_player_name_rejects_invalid_values(raw_json: str, reason: str) -> None:
    with pytest.raises(ValidationError, match=reason):
        validate_json(PlayerName, raw_json)


@pytest.mark.parametrize(
    "raw_json",
    ['"Águias FC"', '"Santa-Cruz F.C."', '"  Sport   Club do Recife "', '"A B C D E"'],
)
def test_club_name_accepts_letters_spaces_hyphen_and_period(raw_json: str) -> None:
    assert validate_json(ClubName, raw_json)


@pytest.mark.parametrize(
    ("raw_json", "reason"),
    [
        ('"Flamengo"', "de 2 a 5 palavras"),
        ('"A B C D E F"', "de 2 a 5 palavras"),
        ('"Clube 1"', "só pode conter"),
        ('"Águias_FC Recife"', "só pode conter"),
        (f'"Clube {"a" * 55}"', "de 3 a 60 caracteres"),
    ],
)
def test_club_name_rejects_invalid_values(raw_json: str, reason: str) -> None:
    with pytest.raises(ValidationError, match=reason):
        validate_json(ClubName, raw_json)


def test_acronym_accepts_three_uppercase_letters() -> None:
    assert validate_json(Acronym, '"AGU"') == "AGU"


@pytest.mark.parametrize(
    ("raw_json", "reason"),
    [
        ('"agu"', "maiúsculas"),
        ('"AG"', "maiúsculas"),
        ('"AGUA"', "maiúsculas"),
        ('"ÁGU"', "maiúsculas"),
        ('" AGU"', "maiúsculas"),
        ('"AAA"', "iguais"),
    ],
)
def test_acronym_rejects_invalid_values(raw_json: str, reason: str) -> None:
    with pytest.raises(ValidationError, match=reason):
        validate_json(Acronym, raw_json)


def test_brasilia_datetime_field_reads_the_rn01_format() -> None:
    parsed = validate_json(BrasiliaDateTime, '"2027-03-02T10:15-03:00"')

    assert parsed == datetime(2027, 3, 2, 13, 15, tzinfo=UTC)


@pytest.mark.parametrize("raw_json", ['"2027-03-02T10:15"', "20270302", "null"])
def test_brasilia_datetime_field_rejects_other_formats(raw_json: str) -> None:
    with pytest.raises(ValidationError):
        validate_json(BrasiliaDateTime, raw_json)
