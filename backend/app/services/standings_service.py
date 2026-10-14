from app.domain.standings import Standing, compute_standings
from app.repositories.club_repository import ClubRepository
from app.repositories.match_repository import MatchRepository


class StandingsService:
    """Classificação da liga (RN21)."""

    def __init__(self, clubs: ClubRepository, matches: MatchRepository) -> None:
        self._clubs = clubs
        self._matches = matches

    def get_standings(self) -> list[Standing]:
        """Calculada a cada consulta, com todos os clubes; nunca é gravada."""
        return compute_standings(self._clubs.list_all(), self._matches.list_scores())
