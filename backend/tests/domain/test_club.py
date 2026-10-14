from dataclasses import dataclass
from decimal import Decimal

import pytest

from app.domain.club import (
    ClubRegistration,
    calculate_net_worth,
    calculate_squad_value,
    ensure_registration_allowed,
    validate_acronym_for_name,
)
from app.domain.club_listing import ClubSort, sort_clubs
from app.domain.exceptions import BusinessRuleError, InvalidInputError


@pytest.mark.parametrize(
    ("acronym", "name"),
    [
        ("AGU", "Águias FC"),
        ("AFC", "Águias FC"),
        ("AAS", "Águias FC"),
        ("SPF", "São-Paulo FC"),
        ("SAO", "São-Paulo FC"),
        ("CAF", "Çapa Azul FC"),
        ("SCR", "Santa Cruz Recife"),
        ("NCL", ".Net Club"),
        ("AGU", "ÁGUIAS FC"),
    ],
)
def test_acronym_letters_appear_in_the_name_in_order_ignoring_case_and_accents(
    acronym: str, name: str
) -> None:
    validate_acronym_for_name(acronym, name)


@pytest.mark.parametrize(
    ("acronym", "name"),
    [
        ("GAF", "Águias FC"),
        ("FCA", "Águias FC"),
        ("AUG", "Águias FC"),
        ("AGX", "Águias FC"),
        ("AFF", "Águias FC"),
        ("CFA", "Águias FC"),
        ("SFP", "São-Paulo FC"),
    ],
)
def test_acronym_that_does_not_match_the_name_is_refused(acronym: str, name: str) -> None:
    with pytest.raises(InvalidInputError, match="primeira letra do nome"):
        validate_acronym_for_name(acronym, name)


@pytest.mark.parametrize(
    ("first", "second", "same_key"),
    [
        ("Águias FC", "águias fc", True),
        ("Águias FC", "ÁGUIAS FC", True),
        ("Águias FC", "Aguias FC", False),
    ],
)
def test_name_key_ignores_case_but_keeps_accents(first: str, second: str, same_key: bool) -> None:
    keys = (ClubRegistration(first, "AGU").name_key, ClubRegistration(second, "AGU").name_key)

    assert (keys[0] == keys[1]) is same_key


def test_registration_is_allowed_up_to_the_twentieth_club() -> None:
    ensure_registration_allowed(club_count=19, name_taken=False, acronym_taken=False)


@pytest.mark.parametrize(
    ("club_count", "name_taken", "acronym_taken", "message"),
    [
        (1, True, False, "Já existe um clube com este nome."),
        (1, False, True, "Já existe um clube com esta sigla."),
        (20, False, False, "A liga já tem o máximo de 20 clubes."),
    ],
)
def test_registration_is_refused_by_the_league_state(
    club_count: int, name_taken: bool, acronym_taken: bool, message: str
) -> None:
    with pytest.raises(BusinessRuleError, match=message):
        ensure_registration_allowed(
            club_count=club_count, name_taken=name_taken, acronym_taken=acronym_taken
        )


def test_squad_value_sums_market_values_and_net_worth_adds_the_cash() -> None:
    squad_value = calculate_squad_value([Decimal("37.00"), Decimal("12.50")])

    assert squad_value == Decimal("49.50")
    assert calculate_squad_value([]) == Decimal("0.00")
    assert calculate_net_worth(Decimal("261.15"), squad_value) == Decimal("310.65")


@dataclass(frozen=True)
class ListedClub:
    id: int
    name: str
    net_worth: Decimal


CLUBS = (
    ListedClub(1, "Gama FC", Decimal("300.00")),
    ListedClub(2, "Épsilon FC", Decimal("310.00")),
    ListedClub(3, "Delta FC", Decimal("300.00")),
    ListedClub(4, "Delta FC", Decimal("290.00")),
)


@pytest.mark.parametrize(
    ("sort", "expected_ids"),
    [
        (ClubSort.NAME, [3, 4, 2, 1]),
        (ClubSort.NET_WORTH_ASC, [4, 3, 1, 2]),
        (ClubSort.NET_WORTH_DESC, [2, 3, 1, 4]),
    ],
)
def test_clubs_are_sorted_with_ties_broken_by_name_then_id(
    sort: ClubSort, expected_ids: list[int]
) -> None:
    assert [club.id for club in sort_clubs(CLUBS, sort)] == expected_ids
