from typing import Self

from pydantic import BaseModel

from app.domain.enums import Formation
from app.services.lineup_service import Lineup
from app.views.player_view import PlayerView


class LineupView(BaseModel):
    """Response of GET and PUT /clubs/{id}/lineup: starters in squad order (RN19)."""

    club_id: int
    formation: Formation | None
    complete: bool
    players: list[PlayerView]

    @classmethod
    def from_lineup(cls, lineup: Lineup) -> Self:
        return cls(
            club_id=lineup.club_id,
            formation=lineup.formation,
            complete=lineup.complete,
            players=[PlayerView.from_model(player) for player in lineup.players],
        )
