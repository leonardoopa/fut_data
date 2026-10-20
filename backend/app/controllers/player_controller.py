from http import HTTPStatus
from typing import Annotated

from fastapi import Depends, Query, Request, Response

from app.core.clock import Clock, get_clock
from app.core.database import DatabaseRouter
from app.repositories.club_repository import ClubRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.player_repository import PlayerRepository
from app.requests.path import ResourceId
from app.requests.players import (
    PlayerConditionRequest,
    PlayerListQuery,
    PlayerProfileRequest,
    PlayerRegistrationRequest,
)
from app.services.player_service import PlayerService
from app.views.player_view import PlayerPageView, PlayerView

router = DatabaseRouter(prefix="/players", tags=["Players"])


def get_player_service(clock: Annotated[Clock, Depends(get_clock)]) -> PlayerService:
    return PlayerService(
        players=PlayerRepository(),
        clubs=ClubRepository(),
        lineups=LineupRepository(),
        clock=clock,
    )


PlayerServiceDependency = Annotated[PlayerService, Depends(get_player_service)]


@router.get(
    "", summary="List players with search, filters, sorting and pagination (RN07)"
)
def list_players(
    query: Annotated[PlayerListQuery, Query()], service: PlayerServiceDependency
) -> PlayerPageView:
    return PlayerPageView.from_page(service.list_players(query.to_criteria()))


@router.get("/{player_id}", summary="Get a player")
def get_player(player_id: ResourceId, service: PlayerServiceDependency) -> PlayerView:
    return PlayerView.from_model(service.get(player_id))


@router.post("", status_code=HTTPStatus.CREATED, summary="Register a player")
def create_player(
    body: PlayerRegistrationRequest,
    request: Request,
    response: Response,
    service: PlayerServiceDependency,
) -> PlayerView:
    player = service.register(body.to_registration())
    response.headers["Location"] = request.app.url_path_for(
        get_player.__name__, player_id=player.id
    )
    return PlayerView.from_model(player)


@router.put("/{player_id}", summary="Edit name, position, agility and age (RN08)")
def update_player(
    player_id: ResourceId, body: PlayerProfileRequest, service: PlayerServiceDependency
) -> PlayerView:
    return PlayerView.from_model(service.update(player_id, body.to_profile()))


@router.patch("/{player_id}/condition", summary="Change the physical condition")
def change_player_condition(
    player_id: ResourceId,
    body: PlayerConditionRequest,
    service: PlayerServiceDependency,
) -> PlayerView:
    return PlayerView.from_model(service.change_condition(player_id, body.condition))


@router.delete(
    "/{player_id}",
    status_code=HTTPStatus.NO_CONTENT,
    response_class=Response,
    summary="Soft-delete a free player (RN09)",
)
def delete_player(player_id: ResourceId, service: PlayerServiceDependency) -> None:
    service.delete(player_id)
