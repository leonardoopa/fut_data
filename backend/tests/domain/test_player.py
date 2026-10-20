from itertools import product

import pytest

from app.domain.attributes import PlayerAttributes
from app.domain.enums import Condition, Position
from app.domain.exceptions import BusinessRuleError, InvalidInputError
from app.domain.player import (
    ensure_condition_change_allowed,
    ensure_deletable,
    ensure_profile_change_allowed,
    leaves_lineup,
    validate_agility,
    validate_attributes,
    validate_potential,
)

MEIA_LUA_ATTRIBUTES = PlayerAttributes(70, 68, 82, 79, 55, 64)


@pytest.mark.parametrize(("agility", "age"), [(100, 34), (85, 35), (85, 45), (1, 45)])
def test_agility_up_to_the_cap_of_its_age_is_accepted(agility: int, age: int) -> None:
    validate_agility(agility, age)


@pytest.mark.parametrize(("agility", "age"), [(86, 35), (100, 45)])
def test_agility_above_85_is_refused_from_35_years_on(agility: int, age: int) -> None:
    with pytest.raises(InvalidInputError, match="35 anos ou mais"):
        validate_agility(agility, age)


def test_attributes_adding_up_to_480_are_accepted() -> None:
    validate_attributes(PlayerAttributes(80, 80, 80, 80, 80, 80))


def test_attributes_adding_up_to_more_than_480_are_refused() -> None:
    with pytest.raises(InvalidInputError, match="480"):
        validate_attributes(PlayerAttributes(81, 80, 80, 80, 80, 80))


@pytest.mark.parametrize(
    ("potential", "registration_age"), [(82, 25), (99, 32), (82, 33), (82, 45)]
)
def test_potential_at_or_above_the_highest_attribute_is_accepted(
    potential: int, registration_age: int
) -> None:
    validate_potential(potential, MEIA_LUA_ATTRIBUTES, registration_age=registration_age)


@pytest.mark.parametrize(
    ("potential", "registration_age", "reason"),
    [
        (81, 25, "maior ou igual ao maior dos seis atributos \\(82\\)"),
        (81, 33, "maior ou igual ao maior dos seis atributos \\(82\\)"),
        (83, 33, "igual ao maior dos seis atributos \\(82\\)"),
        (99, 45, "igual ao maior dos seis atributos \\(82\\)"),
    ],
)
def test_potential_below_the_highest_attribute_or_above_it_from_33_years_is_refused(
    potential: int, registration_age: int, reason: str
) -> None:
    with pytest.raises(InvalidInputError, match=reason):
        validate_potential(potential, MEIA_LUA_ATTRIBUTES, registration_age=registration_age)


@pytest.mark.parametrize(
    ("new_position", "new_age", "has_club"),
    [
        (Position.ATA, 25, False),
        (Position.MEI, 26, True),
        (Position.MEI, 33, True),
        (Position.MEI, 25, True),
    ],
)
def test_profile_change_that_keeps_the_rules_is_allowed(
    new_position: Position, new_age: int, has_club: bool
) -> None:
    ensure_profile_change_allowed(
        current_position=Position.MEI,
        new_position=new_position,
        current_age=25,
        new_age=new_age,
        has_club=has_club,
    )


def test_player_with_club_cannot_change_position() -> None:
    with pytest.raises(BusinessRuleError, match="posição"):
        ensure_profile_change_allowed(
            current_position=Position.MEI,
            new_position=Position.ATA,
            current_age=25,
            new_age=25,
            has_club=True,
        )


@pytest.mark.parametrize("has_club", [False, True])
def test_age_cannot_decrease(has_club: bool) -> None:
    with pytest.raises(BusinessRuleError, match="idade"):
        ensure_profile_change_allowed(
            current_position=Position.MEI,
            new_position=Position.MEI,
            current_age=25,
            new_age=24,
            has_club=has_club,
        )


@pytest.mark.parametrize(
    ("current", "new"),
    [pair for pair in product(Condition, repeat=2) if pair != (Condition.DOENTE, Condition.APTO)],
)
def test_every_condition_change_but_sick_to_apt_is_allowed(
    current: Condition, new: Condition
) -> None:
    ensure_condition_change_allowed(current, new)


def test_sick_player_cannot_go_straight_to_apt() -> None:
    with pytest.raises(BusinessRuleError, match="MAL_CONDICIONADO"):
        ensure_condition_change_allowed(Condition.DOENTE, Condition.APTO)


@pytest.mark.parametrize(
    ("condition", "expected"),
    [(Condition.DOENTE, True), (Condition.MAL_CONDICIONADO, False), (Condition.APTO, False)],
)
def test_only_a_sick_starter_leaves_the_lineup(condition: Condition, expected: bool) -> None:
    assert leaves_lineup(condition) is expected


def test_free_player_can_be_deleted() -> None:
    ensure_deletable(has_club=False)


def test_player_with_club_cannot_be_deleted() -> None:
    with pytest.raises(BusinessRuleError, match="livre"):
        ensure_deletable(has_club=True)
