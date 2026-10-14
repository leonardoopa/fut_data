from dataclasses import dataclass
from decimal import Decimal

import pytest

from app.domain.exceptions import InvalidInputError
from app.domain.player_listing import (
    VALUE_FILTER_MAX,
    VALUE_FILTER_MIN,
    PlayerSort,
    filter_by_search_and_value,
    sort_players,
    validate_age_range,
    validate_club_filter,
    validate_value_range,
)


@dataclass(frozen=True)
class StubPlayer:
    id: int
    name: str
    age: int = 25
    position: str = "MEI"
    market_value: Decimal = Decimal("10.00")


SQUAD_IN_REVERSE_ID_ORDER = (
    StubPlayer(6, "Bruno Dias", age=30, position="ATA", market_value=Decimal("20.00")),
    StubPlayer(5, "Ana Lima", age=30, position="GOL", market_value=Decimal("20.00")),
    StubPlayer(4, "Caio Nunes", age=22, position="LAT", market_value=Decimal("35.50")),
    StubPlayer(3, "Ana Lima", age=35, position="ZAG", market_value=Decimal("20.00")),
    StubPlayer(2, "Davi Rocha", age=22, position="MEI", market_value=Decimal("8.79")),
    StubPlayer(1, "Edu Prado", age=30, position="GOL", market_value=Decimal("35.50")),
)


def names(players: list[StubPlayer]) -> list[str]:
    return [player.name for player in players]


@pytest.mark.parametrize(
    ("criteria", "expected_ids"),
    [
        ((PlayerSort.NAME,), [3, 5, 6, 4, 2, 1]),
        ((PlayerSort.VALUE_ASC,), [2, 3, 5, 6, 4, 1]),
        ((PlayerSort.VALUE_DESC,), [4, 1, 3, 5, 6, 2]),
        ((PlayerSort.AGE_ASC,), [4, 2, 5, 6, 1, 3]),
        ((PlayerSort.AGE_DESC,), [3, 5, 6, 1, 4, 2]),
        ((PlayerSort.POSITION,), [5, 1, 3, 4, 2, 6]),
        ((PlayerSort.POSITION, PlayerSort.VALUE_DESC), [1, 5, 3, 4, 2, 6]),
        ((PlayerSort.VALUE_DESC, PlayerSort.AGE_ASC), [4, 1, 5, 6, 3, 2]),
    ],
)
def test_criteria_are_applied_in_order_then_name_then_id(
    criteria: tuple[PlayerSort, ...], expected_ids: list[int]
) -> None:
    ordered = sort_players(SQUAD_IN_REVERSE_ID_ORDER, criteria)

    assert [player.id for player in ordered] == expected_ids


def test_name_order_ignores_case_and_accents_and_puts_space_before_hyphen() -> None:
    players = [
        StubPlayer(1, "Gama Reis"),
        StubPlayer(2, "Épsilon Dias"),
        StubPlayer(3, "Delta Melo"),
        StubPlayer(4, "Ana-Maria Lima"),
        StubPlayer(5, "Ana Lima"),
    ]

    assert names(sort_players(players, (PlayerSort.NAME,))) == [
        "Ana Lima",
        "Ana-Maria Lima",
        "Delta Melo",
        "Épsilon Dias",
        "Gama Reis",
    ]


def test_names_equal_in_the_alphabetical_comparison_are_ordered_by_id() -> None:
    players = [StubPlayer(3, "Ana Lima"), StubPlayer(1, "ana lima"), StubPlayer(2, "Âna Lima")]

    assert [player.id for player in sort_players(players, (PlayerSort.NAME,))] == [1, 2, 3]


@pytest.mark.parametrize(
    ("sort", "field"),
    [
        (PlayerSort.NAME, "name"),
        (PlayerSort.VALUE_ASC, "value"),
        (PlayerSort.VALUE_DESC, "value"),
        (PlayerSort.AGE_ASC, "age"),
        (PlayerSort.AGE_DESC, "age"),
        (PlayerSort.POSITION, "position"),
    ],
)
def test_both_directions_of_a_criterion_sort_the_same_field(sort: PlayerSort, field: str) -> None:
    assert sort.field == field


def test_value_filter_uses_the_market_value_and_includes_both_bounds() -> None:
    players = [
        StubPlayer(1, "Ana Lima", market_value=Decimal("9.99")),
        StubPlayer(2, "Bia Lima", market_value=Decimal("10.00")),
        StubPlayer(3, "Caio Lima", market_value=Decimal("20.00")),
        StubPlayer(4, "Davi Lima", market_value=Decimal("20.01")),
    ]
    selected = filter_by_search_and_value(
        players, search=None, min_value=Decimal(10), max_value=Decimal(20)
    )

    assert names(selected) == ["Bia Lima", "Caio Lima"]


@pytest.mark.parametrize(
    ("search", "expected"),
    [("JOAO", ["João Silva"]), ("lua", ["Meia Lua"]), (None, ["João Silva", "Meia Lua"])],
)
def test_search_ignores_case_and_accents(search: str | None, expected: list[str]) -> None:
    players = [StubPlayer(1, "João Silva"), StubPlayer(2, "Meia Lua")]

    selected = filter_by_search_and_value(
        players, search=search, min_value=VALUE_FILTER_MIN, max_value=VALUE_FILTER_MAX
    )

    assert names(selected) == expected


@pytest.mark.parametrize(("min_age", "max_age"), [(16, 45), (45, 45), (16, 16), (30, 30)])
def test_age_range_with_min_up_to_max_is_accepted(min_age: int, max_age: int) -> None:
    validate_age_range(min_age, max_age)


def test_age_range_with_min_above_max_is_refused() -> None:
    with pytest.raises(InvalidInputError, match="min_age"):
        validate_age_range(31, 30)


@pytest.mark.parametrize(
    ("min_value", "max_value"),
    [(Decimal(0), Decimal(550)), (Decimal(550), Decimal(550)), (Decimal("10.5"), Decimal("10.5"))],
)
def test_value_range_with_min_up_to_max_is_accepted(min_value: Decimal, max_value: Decimal) -> None:
    validate_value_range(min_value, max_value)


def test_value_range_with_min_above_max_is_refused() -> None:
    with pytest.raises(InvalidInputError, match="min_value"):
        validate_value_range(Decimal("10.01"), Decimal(10))


@pytest.mark.parametrize(("free", "club_id"), [(None, None), (True, None), (False, 1), (None, 1)])
def test_club_filter_without_free_true_and_club_id_together_is_accepted(
    free: bool | None, club_id: int | None
) -> None:
    validate_club_filter(free, club_id)


def test_free_true_with_club_id_is_refused() -> None:
    with pytest.raises(InvalidInputError, match="club_id"):
        validate_club_filter(True, 1)
