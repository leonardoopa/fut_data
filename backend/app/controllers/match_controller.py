from http import HTTPStatus
from typing import Annotated

from fastapi import Depends, Query, Request, Response

from app.core.clock import Clock, get_clock
from app.core.database import DatabaseRouter
from app.repositories.club_repository import ClubRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.match_repository import MatchRepository
from app.requests.matches import MatchListQuery, MatchRequest
from app.requests.path import ResourceId
from app.services.match_service import MatchService
from app.views.match_view import MatchDetailsView, MatchView

router = DatabaseRouter(prefix="/matches", tags=["Matches"])


def get_match_service(clock: Annotated[Clock, Depends(get_clock)]) -> MatchService:
    return MatchService(
        clubs=ClubRepository(),
        lineups=LineupRepository(),
        matches=MatchRepository(),
        clock=clock,
    )


MatchServiceDependency = Annotated[MatchService, Depends(get_match_service)]


@router.get("", summary="List matches, newest first (RN21)")
def list_matches(
    query: Annotated[MatchListQuery, Query()], service: MatchServiceDependency
) -> list[MatchView]:
    return [MatchView.from_model(match) for match in service.list_matches(query.to_criteria())]


@router.get("/{match_id}", summary="Get a match with its 6 duels (RN21)")
def get_match(match_id: ResourceId, service: MatchServiceDependency) -> MatchDetailsView:
    return MatchDetailsView.from_report(service.get(match_id))


@router.post("", status_code=HTTPStatus.CREATED, summary="Play a match (RN20)")
def play_match(
    body: MatchRequest,
    request: Request,
    response: Response,
    service: MatchServiceDependency,
) -> MatchDetailsView:
    report = service.play(body.to_fixture())
    response.headers["Location"] = request.app.url_path_for(
        get_match.__name__, match_id=report.match.id
    )
    return MatchDetailsView.from_report(report)
