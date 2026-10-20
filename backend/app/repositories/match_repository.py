from collections.abc import Iterable

from django.db.models import Q

from app.dtos.match import MatchListCriteria
from app.models import Match, MatchDuel


class MatchRepository:
    def add(self, match: Match, duels: Iterable[MatchDuel]) -> None:
        match.save()
        MatchDuel.objects.bulk_create(duels)

    def get(self, match_id: int) -> Match | None:
        return (
            Match.objects.select_related("home_club", "away_club")
            .filter(pk=match_id)
            .first()
        )

    def duels_of(self, match_id: int) -> list[MatchDuel]:
        return list(MatchDuel.objects.filter(match_id=match_id).order_by("order"))

    def list_matches(self, criteria: MatchListCriteria) -> list[Match]:
        matches = Match.objects.select_related("home_club", "away_club")
        if criteria.club_id is not None:
            matches = matches.filter(
                Q(home_club_id=criteria.club_id) | Q(away_club_id=criteria.club_id)
            )
        return list(matches.order_by("-played_at", "-id"))

    def list_scores(self) -> list[Match]:
        return list(
            Match.objects.only(
                "home_club_id", "away_club_id", "home_goals", "away_goals"
            )
        )
