from collections.abc import Sequence
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import Protocol

from app.domain.attributes import PlayerAttributes
from app.domain.club import sort_squad
from app.domain.enums import Condition, DuelAttribute, MatchResult, Position
from app.domain.exceptions import SameClubMatchError
from app.domain.player_listing import ListedPlayer
from app.domain.rounding import round_to_integer

GOALKEEPER = 0
FIRST_ORDER = 1
DUEL_SLOTS: tuple[tuple[int, int], ...] = ((4, GOALKEEPER), (3, 1), (2, 2))
"""(attacker, defender) squad indexes of each attack: 0 is the goalkeeper, 1 to 4 outfield."""

ATTACKS_PER_TEAM = len(DUEL_SLOTS)

CONDITION_FACTORS: dict[Condition, Decimal] = {
    Condition.APTO: Decimal(1),
    Condition.MAL_CONDICIONADO: Decimal("0.85"),
}

ATTACK_ATTRIBUTES: dict[Position, DuelAttribute] = {
    Position.ATA: DuelAttribute.SHOOTING,
    Position.MEI: DuelAttribute.PASSING,
    Position.ZAG: DuelAttribute.DRIBBLING,
    Position.LAT: DuelAttribute.DRIBBLING,
}
DEFENSE_ATTRIBUTE = DuelAttribute.DEFENDING


class Outcome(StrEnum):
    WIN = "WIN"
    DRAW = "DRAW"
    LOSS = "LOSS"


HOME_RESULTS: dict[Outcome, MatchResult] = {
    Outcome.WIN: MatchResult.MANDANTE,
    Outcome.DRAW: MatchResult.EMPATE,
    Outcome.LOSS: MatchResult.VISITANTE,
}


class MatchPlayer(ListedPlayer, Protocol):
    @property
    def condition(self) -> str: ...

    @property
    def attributes(self) -> PlayerAttributes: ...


@dataclass(frozen=True)
class Team:
    club_id: int
    starters: Sequence[MatchPlayer]


@dataclass(frozen=True)
class DuelPlayer:
    player_id: int
    player_name: str
    position: Position
    condition: Condition
    attribute: DuelAttribute
    value: int


@dataclass(frozen=True)
class Duel:
    order: int
    attacking_club_id: int
    attacker: DuelPlayer
    defender: DuelPlayer

    @property
    def goal(self) -> bool:
        return self.attacker.value > self.defender.value


@dataclass(frozen=True)
class MatchOutcome:
    home_goals: int
    away_goals: int
    duels: tuple[Duel, ...]

    @property
    def result(self) -> MatchResult:
        return decide_result(self.home_goals, self.away_goals)


def ensure_distinct_clubs(home_club_id: int, away_club_id: int) -> None:
    if home_club_id == away_club_id:
        raise SameClubMatchError


def outcome_for(goals_for: int, goals_against: int) -> Outcome:
    if goals_for > goals_against:
        return Outcome.WIN
    if goals_for < goals_against:
        return Outcome.LOSS
    return Outcome.DRAW


def decide_result(home_goals: int, away_goals: int) -> MatchResult:
    return HOME_RESULTS[outcome_for(home_goals, away_goals)]


def effective_value(player: MatchPlayer, attribute: DuelAttribute) -> int:
    registered = getattr(player.attributes, attribute.value)
    return round_to_integer(registered * CONDITION_FACTORS[Condition(player.condition)])


def duel_player(player: MatchPlayer, attribute: DuelAttribute) -> DuelPlayer:
    return DuelPlayer(
        player_id=player.id,
        player_name=player.name,
        position=Position(player.position),
        condition=Condition(player.condition),
        attribute=attribute,
        value=effective_value(player, attribute),
    )


def attacks(attacking: Team, defending: Team, first_order: int) -> tuple[Duel, ...]:
    attackers = sort_squad(attacking.starters)
    defenders = sort_squad(defending.starters)
    return tuple(
        Duel(
            order=first_order + index,
            attacking_club_id=attacking.club_id,
            attacker=duel_player(
                attackers[attacker_slot],
                ATTACK_ATTRIBUTES[Position(attackers[attacker_slot].position)],
            ),
            defender=duel_player(defenders[defender_slot], DEFENSE_ATTRIBUTE),
        )
        for index, (attacker_slot, defender_slot) in enumerate(DUEL_SLOTS)
    )


def count_goals(duels: Sequence[Duel]) -> int:
    return sum(duel.goal for duel in duels)


def play_match(home: Team, away: Team) -> MatchOutcome:
    home_attacks = attacks(home, away, FIRST_ORDER)
    away_attacks = attacks(away, home, FIRST_ORDER + ATTACKS_PER_TEAM)
    return MatchOutcome(
        home_goals=count_goals(home_attacks),
        away_goals=count_goals(away_attacks),
        duels=(*home_attacks, *away_attacks),
    )
