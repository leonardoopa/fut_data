from dataclasses import dataclass
from decimal import Decimal

import pytest

from app.domain.attributes import PlayerAttributes
from app.domain.enums import Condition, DuelAttribute, MatchResult, Position
from app.domain.exceptions import SameClubMatchError
from app.domain.match import (
    DuelPlayer,
    Team,
    decide_result,
    effective_value,
    ensure_distinct_clubs,
    play_match,
)

HOME_ID, AWAY_ID = 1, 2
DEFAULT_ATTRIBUTE = 50


@dataclass(frozen=True)
class FakeStarter:
    id: int
    name: str
    position: str
    condition: str
    attributes: PlayerAttributes
    age: int = 25
    market_value: Decimal = Decimal("10.00")


def starter(
    player_id: int, name: str, position: str, condition: str = "APTO", **attributes: int
) -> FakeStarter:
    registered = dict.fromkeys(
        ("pace", "shooting", "passing", "dribbling", "defending", "physical"),
        DEFAULT_ATTRIBUTE,
    )
    return FakeStarter(
        id=player_id,
        name=name,
        position=position,
        condition=condition,
        attributes=PlayerAttributes(**(registered | attributes)),
    )


def side(
    player: FakeStarter, attribute: DuelAttribute, value: int, condition: str = "APTO"
) -> DuelPlayer:
    return DuelPlayer(
        player_id=player.id,
        player_name=player.name,
        position=Position(player.position),
        condition=Condition(condition),
        attribute=attribute,
        value=value,
    )


RUI = starter(30, "Rui Prado", "GOL", defending=77)
TEO = starter(32, "Téo Brandão", "ZAG", defending=84)
DAVI = starter(31, "Davi Lins", "LAT", "MAL_CONDICIONADO", dribbling=74, defending=66)
LAURO = starter(33, "Lauro Neves", "MEI", passing=82)
OTTO = starter(34, "Otto Rangel", "ATA", shooting=75)
IVO = starter(40, "Ivo Teles", "GOL", defending=72)
HUGO = starter(41, "Hugo Vaz", "ZAG", defending=84)
LINO = starter(42, "Lino Matos", "LAT", dribbling=79, defending=63)
NEI = starter(43, "Nei Soares", "MEI", passing=70)
UGO = starter(44, "Ugo Falcão", "ATA", shooting=81)

AGUIAS = Team(club_id=HOME_ID, starters=(OTTO, DAVI, RUI, LAURO, TEO))
DELTA = Team(club_id=AWAY_ID, starters=(UGO, NEI, LINO, HUGO, IVO))

SHOOTING, PASSING = DuelAttribute.SHOOTING, DuelAttribute.PASSING
DRIBBLING, DEFENDING = DuelAttribute.DRIBBLING, DuelAttribute.DEFENDING
UNFIT = "MAL_CONDICIONADO"


def test_documented_match_plays_the_six_duels_of_the_statement() -> None:
    outcome = play_match(AGUIAS, DELTA)

    duels = [
        (duel.order, duel.attacking_club_id, duel.attacker, duel.defender, duel.goal)
        for duel in outcome.duels
    ]
    assert duels == [
        (1, HOME_ID, side(OTTO, SHOOTING, 75), side(IVO, DEFENDING, 72), True),
        (2, HOME_ID, side(LAURO, PASSING, 82), side(HUGO, DEFENDING, 84), False),
        (
            3,
            HOME_ID,
            side(DAVI, DRIBBLING, 63, UNFIT),
            side(LINO, DEFENDING, 63),
            False,
        ),
        (4, AWAY_ID, side(UGO, SHOOTING, 81), side(RUI, DEFENDING, 77), True),
        (5, AWAY_ID, side(NEI, PASSING, 70), side(TEO, DEFENDING, 84), False),
        (6, AWAY_ID, side(LINO, DRIBBLING, 79), side(DAVI, DEFENDING, 56, UNFIT), True),
    ]
    assert (outcome.home_goals, outcome.away_goals, outcome.result) == (
        1,
        2,
        MatchResult.VISITANTE,
    )


def test_two_starters_in_the_same_position_follow_the_name_then_the_id() -> None:
    home = Team(
        club_id=HOME_ID,
        starters=(
            starter(5, "Zeca Alves", "MEI", passing=90),
            starter(4, "Ana Lima", "MEI", passing=60),
            starter(3, "Beto Lima", "LAT"),
            starter(2, "Caio Reis", "ATA"),
            starter(1, "Gil Souza", "GOL"),
        ),
    )

    duels = play_match(home, DELTA).duels

    assert [duel.attacker.player_name for duel in duels[:3]] == [
        "Caio Reis",
        "Zeca Alves",
        "Ana Lima",
    ]
    assert [duel.defender.player_name for duel in duels[3:]] == [
        "Gil Souza",
        "Beto Lima",
        "Ana Lima",
    ]


def test_same_name_in_the_same_position_follows_the_id() -> None:
    home = Team(
        club_id=HOME_ID,
        starters=(
            starter(9, "Ana Lima", "ATA"),
            starter(8, "Ana Lima", "ATA"),
            starter(3, "Beto Lima", "ZAG"),
            starter(2, "Caio Reis", "ZAG"),
            starter(1, "Gil Souza", "GOL"),
        ),
    )

    duels = play_match(home, DELTA).duels

    assert [duel.attacker.player_id for duel in duels[:2]] == [9, 8]


@pytest.mark.parametrize(
    ("registered", "condition", "expected"),
    [
        (74, "MAL_CONDICIONADO", 63),
        (66, "MAL_CONDICIONADO", 56),
        (50, "MAL_CONDICIONADO", 43),
        (1, "MAL_CONDICIONADO", 1),
        (99, "MAL_CONDICIONADO", 84),
        (74, "APTO", 74),
    ],
)
def test_condition_effect_rounds_half_up_to_an_integer(
    registered: int, condition: str, expected: int
) -> None:
    player = starter(1, "Ana Lima", "ATA", condition, shooting=registered)

    assert effective_value(player, SHOOTING) == expected


@pytest.mark.parametrize(
    ("position", "attribute"),
    [("ATA", SHOOTING), ("MEI", PASSING), ("ZAG", DRIBBLING), ("LAT", DRIBBLING)],
)
def test_attacker_uses_the_attribute_of_its_position(
    position: str, attribute: DuelAttribute
) -> None:
    attackers = (
        starter(1, "Gil Souza", "GOL"),
        starter(2, "Beto Lima", "ZAG"),
        starter(3, "Caio Reis", "ZAG"),
        starter(4, "Davi Melo", "ZAG"),
        starter(5, "Zico Lima", position, shooting=91, passing=92, dribbling=93),
    )

    first_duel = play_match(Team(HOME_ID, attackers), DELTA).duels[0]

    assert first_duel.attacker.attribute == attribute
    assert first_duel.defender.attribute == DEFENDING


def test_equal_values_are_not_a_goal() -> None:
    home = Team(
        club_id=HOME_ID,
        starters=(
            RUI,
            TEO,
            DAVI,
            LAURO,
            starter(35, "Otto Rangel", "ATA", shooting=72),
        ),
    )

    first_duel = play_match(home, DELTA).duels[0]

    assert (first_duel.attacker.value, first_duel.defender.value) == (72, 72)
    assert first_duel.goal is False


@pytest.mark.parametrize(
    ("home_goals", "away_goals", "result"),
    [
        (1, 0, MatchResult.MANDANTE),
        (3, 2, MatchResult.MANDANTE),
        (1, 2, MatchResult.VISITANTE),
        (0, 0, MatchResult.EMPATE),
        (3, 3, MatchResult.EMPATE),
    ],
)
def test_result_follows_the_score(
    home_goals: int, away_goals: int, result: MatchResult
) -> None:
    assert decide_result(home_goals, away_goals) == result


def test_home_and_away_must_be_different_clubs() -> None:
    ensure_distinct_clubs(1, 2)

    with pytest.raises(SameClubMatchError):
        ensure_distinct_clubs(1, 1)
