from typing import Annotated

from fastapi import Depends

from app.core.database import DatabaseRouter
from app.repositories.club_repository import ClubRepository
from app.repositories.match_repository import MatchRepository
from app.services.standings_service import StandingsService
from app.views.standing_view import StandingView

router = DatabaseRouter(prefix="/standings", tags=["Standings"])


def get_standings_service() -> StandingsService:
    return StandingsService(clubs=ClubRepository(), matches=MatchRepository())


StandingsServiceDependency = Annotated[StandingsService, Depends(get_standings_service)]


@router.get("", summary="League standings, computed on every read (RN21)")
def get_standings(service: StandingsServiceDependency) -> list[StandingView]:
    return [StandingView.from_standing(standing) for standing in service.get_standings()]
