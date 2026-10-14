from dataclasses import dataclass
from decimal import Decimal

import pytest

from app.domain.exceptions import InvalidInputError
from app.domain.player_listing import (
    PlayerListCriteria,
    PlayerSort,
    filter_by_search_and_value,
    sort_players,
    validate_criteria,
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
    criteria = PlayerListCriteria(min_value=Decimal(10), max_value=Decimal(20))

    assert names(filter_by_search_and_value(players, criteria)) == ["Bia Lima", "Caio Lima"]


@pytest.mark.parametrize(
    ("search", "expected"),
    [("JOAO", ["João Silva"]), ("lua", ["Meia Lua"]), (None, ["João Silva", "Meia Lua"])],
)
def test_search_ignores_case_and_accents(search: str | None, expected: list[str]) -> None:
    players = [StubPlayer(1, "João Silva"), StubPlayer(2, "Meia Lua")]

    assert names(filter_by_search_and_value(players, PlayerListCriteria(search=search))) == expected


def test_defaults_follow_rn07_and_ranges_go_to_their_extremes() -> None:
    criteria = PlayerListCriteria()

    assert (criteria.sort, criteria.page, criteria.limit) == ((PlayerSort.NAME,), 1, 10)
    assert (criteria.min_age, criteria.max_age) == (16, 45)
    assert (criteria.min_value, criteria.max_value) == (Decimal(0), Decimal(550))


@pytest.mark.parametrize(
    "criteria",
    [
        PlayerListCriteria(),
        PlayerListCriteria(min_age=45),
        PlayerListCriteria(max_age=16),
        PlayerListCriteria(min_age=30, max_age=30),
        PlayerListCriteria(min_value=Decimal(550)),
        PlayerListCriteria(min_value=Decimal("10.5"), max_value=Decimal("10.5")),
        PlayerListCriteria(free=False, club_id=1),
    ],
)
def test_consistent_criteria_are_accepted(criteria: PlayerListCriteria) -> None:
    validate_criteria(criteria)


@pytest.mark.parametrize(
    ("criteria", "reason"),
    [
        (PlayerListCriteria(min_age=31, max_age=30), "min_age"),
        (PlayerListCriteria(min_value=Decimal("10.01"), max_value=Decimal(10)), "min_value"),
        (PlayerListCriteria(free=True, club_id=1), "club_id"),
    ],
)
def test_contradictory_criteria_are_refused(criteria: PlayerListCriteria, reason: str) -> None:
    with pytest.raises(InvalidInputError, match=reason):
        validate_criteria(criteria)
