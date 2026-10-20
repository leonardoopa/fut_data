from http import HTTPStatus
from typing import Annotated

from fastapi import Depends, Query, Request, Response

from app.core.clock import Clock, get_clock
from app.core.database import DatabaseRouter
from app.repositories.club_repository import ClubRepository
from app.repositories.contract_repository import ContractRepository
from app.requests.clubs import ClubListQuery, ClubRegistrationRequest
from app.requests.path import ResourceId
from app.services.club_service import ClubService
from app.views.club_view import ClubDetailsView, ClubView

router = DatabaseRouter(prefix="/clubs", tags=["Clubs"])


def get_club_service(clock: Annotated[Clock, Depends(get_clock)]) -> ClubService:
    return ClubService(clubs=ClubRepository(), contracts=ContractRepository(), clock=clock)


ClubServiceDependency = Annotated[ClubService, Depends(get_club_service)]


@router.get("", summary="List clubs by name or net worth (RN11)")
def list_clubs(
    query: Annotated[ClubListQuery, Query()], service: ClubServiceDependency
) -> list[ClubView]:
    return [ClubView.from_model(club) for club in service.list_clubs(query.to_criteria())]


@router.get("/{club_id}", summary="Get a club with its squad and contracts (RN11)")
def get_club(club_id: ResourceId, service: ClubServiceDependency) -> ClubDetailsView:
    return ClubDetailsView.from_details(service.get_details(club_id))


@router.post("", status_code=HTTPStatus.CREATED, summary="Create a club (RN10)")
def create_club(
    body: ClubRegistrationRequest,
    request: Request,
    response: Response,
    service: ClubServiceDependency,
) -> ClubView:
    club = service.register(body.to_registration())
    response.headers["Location"] = request.app.url_path_for(get_club.__name__, club_id=club.id)
    return ClubView.from_model(club)
