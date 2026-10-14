"""Classificação da liga, calculada a cada consulta e nunca gravada (RN21)."""

from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import asdict, dataclass
from typing import Protocol

from app.domain.match import Outcome, outcome_for
from app.domain.text import alphabetical_key

POINTS: dict[Outcome, int] = {Outcome.WIN: 3, Outcome.DRAW: 1, Outcome.LOSS: 0}
FIRST_POSITION = 1


class LeagueClub(Protocol):
    @property
    def id(self) -> int: ...

    @property
    def name(self) -> str: ...


class PlayedMatch(Protocol):
    @property
    def home_club_id(self) -> int: ...

    @property
    def away_club_id(self) -> int: ...

    @property
    def home_goals(self) -> int: ...

    @property
    def away_goals(self) -> int: ...


@dataclass(frozen=True)
class ClubRecord:
    club_id: int
    club_name: str
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int

    @property
    def played(self) -> int:
        return self.wins + self.draws + self.losses

    @property
    def goal_difference(self) -> int:
        return self.goals_for - self.goals_against

    @property
    def points(self) -> int:
        return (
            self.wins * POINTS[Outcome.WIN]
            + self.draws * POINTS[Outcome.DRAW]
            + self.losses * POINTS[Outcome.LOSS]
        )


@dataclass(frozen=True)
class Standing(ClubRecord):
    position: int


def scores_of(club_id: int, matches: Iterable[PlayedMatch]) -> list[tuple[int, int]]:
    """Gols marcados e sofridos pelo clube em cada partida que jogou, como mandante ou visitante."""
    scores = []
    for match in matches:
        if match.home_club_id == club_id:
            scores.append((match.home_goals, match.away_goals))
        elif match.away_club_id == club_id:
            scores.append((match.away_goals, match.home_goals))
    return scores


def build_record(club: LeagueClub, matches: Sequence[PlayedMatch]) -> ClubRecord:
    scores = scores_of(club.id, matches)
    outcomes = Counter(outcome_for(scored, conceded) for scored, conceded in scores)
    return ClubRecord(
        club_id=club.id,
        club_name=club.name,
        wins=outcomes[Outcome.WIN],
        draws=outcomes[Outcome.DRAW],
        losses=outcomes[Outcome.LOSS],
        goals_for=sum(scored for scored, _ in scores),
        goals_against=sum(conceded for _, conceded in scores),
    )


def standing_key(record: ClubRecord) -> tuple[int, int, int, str, int]:
    """Mais pontos, maior saldo, mais gols marcados, depois o nome e o id."""
    return (
        -record.points,
        -record.goal_difference,
        -record.goals_for,
        alphabetical_key(record.club_name),
        record.club_id,
    )


def compute_standings(
    clubs: Iterable[LeagueClub], matches: Sequence[PlayedMatch]
) -> list[Standing]:
    """Todos os clubes, inclusive os que não jogaram; posições de 1 ao total, sem repetir."""
    records = sorted((build_record(club, matches) for club in clubs), key=standing_key)
    return [
        Standing(**asdict(record), position=position)
        for position, record in enumerate(records, start=FIRST_POSITION)
    ]
