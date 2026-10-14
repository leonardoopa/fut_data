from dataclasses import dataclass

import pytest

from app.domain.enums import Formation
from app.domain.exceptions import (
    FormationMismatchError,
    IncompleteLineupError,
    RepeatedStartersError,
    SickStarterError,
    StarterNotInSquadError,
)
from app.domain.lineup import (
    ensure_distinct_starters,
    ensure_lineup_allowed,
    ensure_lineup_complete,
    is_lineup_complete,
)

CLUB_ID = 7


@dataclass(frozen=True)
class FakeStarter:
    position: str
    condition: str = "APTO"
    club_id: int | None = CLUB_ID


def starters(*positions: str) -> list[FakeStarter]:
    return [FakeStarter(position) for position in positions]


@pytest.mark.parametrize(
    ("formation", "positions"),
    [
        (Formation.THREE_ONE, ("GOL", "ZAG", "ZAG", "LAT", "ATA")),
        (Formation.THREE_ONE, ("ATA", "LAT", "LAT", "LAT", "GOL")),
        (Formation.TWO_TWO, ("GOL", "ZAG", "LAT", "ATA", "ATA")),
        (Formation.TWO_ONE_ONE, ("MEI", "GOL", "ZAG", "ATA", "LAT")),
        (Formation.ONE_TWO_ONE, ("GOL", "ZAG", "MEI", "MEI", "ATA")),
    ],
)
def test_positions_that_close_the_formation_are_accepted(
    formation: Formation, positions: tuple[str, ...]
) -> None:
    ensure_lineup_allowed(CLUB_ID, formation, starters(*positions))


@pytest.mark.parametrize(
    ("formation", "positions"),
    [
        (Formation.THREE_ONE, ("GOL", "ZAG", "ZAG", "MEI", "ATA")),
        (Formation.TWO_TWO, ("GOL", "ZAG", "LAT", "MEI", "ATA")),
        (Formation.TWO_ONE_ONE, ("GOL", "ZAG", "ZAG", "LAT", "ATA")),
        (Formation.ONE_TWO_ONE, ("GOL", "ZAG", "MEI", "ATA", "ATA")),
        (Formation.TWO_ONE_ONE, ("GOL", "GOL", "ZAG", "MEI", "ATA")),
        (Formation.TWO_TWO, ("ZAG", "LAT", "MEI", "ATA", "ATA")),
    ],
)
def test_positions_that_do_not_close_the_formation_are_refused(
    formation: Formation, positions: tuple[str, ...]
) -> None:
    with pytest.raises(FormationMismatchError, match=formation.value):
        ensure_lineup_allowed(CLUB_ID, formation, starters(*positions))


@pytest.mark.parametrize("club_id", [None, CLUB_ID + 1])
def test_player_outside_the_squad_is_refused(club_id: int | None) -> None:
    lineup = [*starters("GOL", "ZAG", "LAT", "ATA"), FakeStarter("ATA", club_id=club_id)]

    with pytest.raises(StarterNotInSquadError):
        ensure_lineup_allowed(CLUB_ID, Formation.TWO_TWO, lineup)


def test_sick_player_is_refused() -> None:
    lineup = [*starters("GOL", "ZAG", "LAT", "ATA"), FakeStarter("ATA", condition="DOENTE")]

    with pytest.raises(SickStarterError):
        ensure_lineup_allowed(CLUB_ID, Formation.TWO_TWO, lineup)


def test_unfit_player_can_start() -> None:
    lineup = [*starters("GOL", "ZAG", "LAT", "ATA"), FakeStarter("ATA", "MAL_CONDICIONADO")]

    ensure_lineup_allowed(CLUB_ID, Formation.TWO_TWO, lineup)


def test_repeated_starters_are_refused() -> None:
    ensure_distinct_starters([1, 2, 3, 4, 5])

    with pytest.raises(RepeatedStartersError):
        ensure_distinct_starters([1, 2, 3, 4, 1])


@pytest.mark.parametrize(("starter_count", "complete"), [(5, True), (4, False), (0, False)])
def test_lineup_is_complete_only_with_the_five_starters(starter_count: int, complete: bool) -> None:
    assert is_lineup_complete(starter_count) is complete


def test_incomplete_lineup_names_the_club() -> None:
    ensure_lineup_complete("Águias FC", 5)

    with pytest.raises(IncompleteLineupError, match="Águias FC"):
        ensure_lineup_complete("Águias FC", 4)
