from typing import Self

from pydantic import BaseModel

from app.domain.enums import Condition, DuelAttribute, Formation, MatchResult, Position
from app.models import Club, Match, MatchDuel
from app.services.match_service import MatchReport
from app.views.fields import BrasiliaTimestamp


class MatchSideView(BaseModel):
    club_id: int
    club_name: str
    formation: Formation
    goals: int

    @classmethod
    def of(cls, club: Club, formation: str, goals: int) -> Self:
        return cls(
            club_id=club.id, club_name=club.name, formation=formation, goals=goals
        )


class MatchView(BaseModel):
    """Match without duels, as in GET /matches (RN21)."""

    id: int
    played_at: BrasiliaTimestamp
    home: MatchSideView
    away: MatchSideView
    result: MatchResult

    @classmethod
    def from_model(cls, match: Match) -> Self:
        return cls(
            id=match.id,
            played_at=match.played_at,
            home=MatchSideView.of(
                match.home_club, match.home_formation, match.home_goals
            ),
            away=MatchSideView.of(
                match.away_club, match.away_formation, match.away_goals
            ),
            result=match.result,
        )


class DuelPlayerView(BaseModel):
    player_id: int
    player_name: str
    position: Position
    condition: Condition
    attribute: DuelAttribute
    value: int


class DuelView(BaseModel):
    """Duel with the data stored at match time (RN20)."""

    order: int
    attacking_club_id: int
    attacker: DuelPlayerView
    defender: DuelPlayerView
    goal: bool

    @classmethod
    def from_model(cls, duel: MatchDuel) -> Self:
        return cls(
            order=duel.order,
            attacking_club_id=duel.attacking_club_id,
            attacker=DuelPlayerView(
                player_id=duel.attacker_id,
                player_name=duel.attacker_name,
                position=duel.attacker_position,
                condition=duel.attacker_condition,
                attribute=duel.attack_attribute,
                value=duel.attack_value,
            ),
            defender=DuelPlayerView(
                player_id=duel.defender_id,
                player_name=duel.defender_name,
                position=duel.defender_position,
                condition=duel.defender_condition,
                attribute=duel.defense_attribute,
                value=duel.defense_value,
            ),
            goal=duel.goal,
        )


class MatchDetailsView(MatchView):
    """Response of POST /matches and GET /matches/{id}: the match and its 6 duels (RN20)."""

    duels: list[DuelView]

    @classmethod
    def from_report(cls, report: MatchReport) -> Self:
        return cls(
            **MatchView.from_model(report.match).model_dump(),
            duels=[DuelView.from_model(duel) for duel in report.duels],
        )
