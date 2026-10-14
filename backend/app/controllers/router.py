from fastapi import APIRouter

from app.controllers import (
    club_controller,
    health_controller,
    lineup_controller,
    market_controller,
    match_controller,
    player_controller,
    standings_controller,
)

API_PREFIX = "/api/v1"

api_router = APIRouter(prefix=API_PREFIX)
api_router.include_router(health_controller.router)
api_router.include_router(player_controller.router)
api_router.include_router(club_controller.router)
api_router.include_router(market_controller.router)
api_router.include_router(lineup_controller.router)
api_router.include_router(match_controller.router)
api_router.include_router(standings_controller.router)
