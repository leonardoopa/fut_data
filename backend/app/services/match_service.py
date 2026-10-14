from dataclasses import dataclass

from django.db import transaction

from app.core.clock import Clock
from app.domain.lineup import ensure_lineup_complete
from app.domain.match import Team, play_match
from app.dtos.match import MatchFixture, MatchListCriteria
from app.models import Club, Match, MatchDuel
from app.repositories.club_repository import ClubRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.match_repository import MatchRepository
from app.services.lookups import ensure_club_exists, ensure_club_found, ensure_match_found


@dataclass(frozen=True)
class MatchReport:
    """Partida com os 6 duelos, na ordem da RN20."""

    match: Match
    duels: list[MatchDuel]


class MatchService:
    """Partidas e histórico de partidas (RN20 e RN21)."""

    def __init__(
        self,
        clubs: ClubRepository,
        lineups: LineupRepository,
        matches: MatchRepository,
        clock: Clock,
    ) -> None:
        self._clubs = clubs
        self._lineups = lineups
        self._matches = matches
        self._clock = clock

    @transaction.atomic
    def play(self, fixture: MatchFixture) -> MatchReport:
        """Joga a partida na hora e grava o placar e os 6 duelos, sem outros efeitos.

        Os dois clubes ficam travados até o fim, para que nenhuma escalação mude no meio.
        """
        clubs = self._clubs.lock_many((fixture.home_club_id, fixture.away_club_id))
        home = ensure_club_found(clubs.get(fixture.home_club_id))
        away = ensure_club_found(clubs.get(fixture.away_club_id))
        home_team, away_team = self._team_of(home), self._team_of(away)
        outcome = play_match(home_team, away_team)
        match = Match.record(home, away, outcome, self._clock())
        duels = [MatchDuel.record(match, duel) for duel in outcome.duels]
        self._matches.add(match, duels)
        return MatchReport(match=match, duels=duels)

    def list_matches(self, criteria: MatchListCriteria) -> list[Match]:
        if criteria.club_id is not None:
            ensure_club_exists(self._clubs, criteria.club_id)
        return self._matches.list_matches(criteria)

    def get(self, match_id: int) -> MatchReport:
        match = ensure_match_found(self._matches.get(match_id))
        return MatchReport(match=match, duels=self._matches.duels_of(match.id))

    def _team_of(self, club: Club) -> Team:
        """Só joga o clube com a escalação completa, com os 5 titulares (RN19)."""
        starters = self._lineups.starters_of(club.id)
        ensure_lineup_complete(club.name, len(starters))
        return Team(club_id=club.id, starters=starters)
