from typing import Annotated

from fastapi import Depends

from app.core.database import DatabaseRouter
from app.repositories.club_repository import ClubRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.player_repository import PlayerRepository
from app.requests.lineup import LineupRequest
from app.requests.path import ResourceId
from app.services.lineup_service import LineupService
from app.views.lineup_view import LineupView

router = DatabaseRouter(prefix="/clubs/{club_id}/lineup", tags=["Escalação"])


def get_lineup_service() -> LineupService:
    return LineupService(
        players=PlayerRepository(), clubs=ClubRepository(), lineups=LineupRepository()
    )


LineupServiceDependency = Annotated[LineupService, Depends(get_lineup_service)]


@router.put("", summary="Substitui a escalação do clube (RN19)")
def replace_lineup(
    club_id: ResourceId, body: LineupRequest, service: LineupServiceDependency
) -> LineupView:
    return LineupView.from_lineup(service.replace(club_id, body.to_selection()))


@router.get("", summary="Consulta a escalação do clube (RN19)")
def get_lineup(club_id: ResourceId, service: LineupServiceDependency) -> LineupView:
    return LineupView.from_lineup(service.get(club_id))
