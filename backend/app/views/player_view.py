from typing import Self

from pydantic import BaseModel

from app.domain.enums import Condition, Position
from app.domain.pagination import Page
from app.models import Player
from app.views.fields import Money
from app.views.page_view import PageMeta


class PlayerView(BaseModel):
    """Player in responses; overall and market value are computed on every read (RN06)."""

    id: int
    name: str
    position: Position
    agility: int
    age: int
    condition: Condition
    base_value: Money
    market_value: Money
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int
    potential: int
    overall: int
    club_id: int | None

    @classmethod
    def from_model(cls, player: Player) -> Self:
        return cls.model_validate(player, from_attributes=True)


class PlayerPageView(BaseModel):
    """Response of GET /players: the page of players and the pagination meta (RN07)."""

    data: list[PlayerView]
    meta: PageMeta

    @classmethod
    def from_page(cls, page: Page[Player]) -> Self:
        return cls(
            data=[PlayerView.from_model(player) for player in page.items],
            meta=PageMeta.from_page(page),
        )
