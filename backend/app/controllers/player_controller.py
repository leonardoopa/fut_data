from http import HTTPStatus
from typing import Annotated

from fastapi import Depends, Query, Request, Response

from app.core.clock import system_clock
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

router = DatabaseRouter(prefix="/players", tags=["Jogadores"])


def get_player_service() -> PlayerService:
    return PlayerService(
        players=PlayerRepository(),
        clubs=ClubRepository(),
        lineups=LineupRepository(),
        clock=system_clock,
    )


PlayerServiceDependency = Annotated[PlayerService, Depends(get_player_service)]


@router.get("", summary="Lista os jogadores com busca, filtros, ordenação e paginação (RN07)")
def list_players(
    query: Annotated[PlayerListQuery, Query()], service: PlayerServiceDependency
) -> PlayerPageView:
    return PlayerPageView.from_page(service.list_players(query.to_criteria()))


@router.get("/{player_id}", summary="Consulta um jogador")
def get_player(player_id: ResourceId, service: PlayerServiceDependency) -> PlayerView:
    return PlayerView.from_model(service.get(player_id))


@router.post("", status_code=HTTPStatus.CREATED, summary="Cadastra um jogador")
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


@router.put("/{player_id}", summary="Edita nome, posição, agilidade e idade (RN08)")
def update_player(
    player_id: ResourceId, body: PlayerProfileRequest, service: PlayerServiceDependency
) -> PlayerView:
    return PlayerView.from_model(service.update(player_id, body.to_profile()))


@router.patch("/{player_id}/condition", summary="Altera a condição física")
def change_player_condition(
    player_id: ResourceId, body: PlayerConditionRequest, service: PlayerServiceDependency
) -> PlayerView:
    return PlayerView.from_model(service.change_condition(player_id, body.condition))


@router.delete(
    "/{player_id}",
    status_code=HTTPStatus.NO_CONTENT,
    response_class=Response,
    summary="Exclui logicamente um jogador livre (RN09)",
)
def delete_player(player_id: ResourceId, service: PlayerServiceDependency) -> None:
    service.delete(player_id)
