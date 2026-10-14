from typing import Self

from pydantic import BaseModel

from app.domain.enums import Condition, Position
from app.domain.pagination import Page
from app.models import Player
from app.views.fields import Money
from app.views.page_view import PageMeta


class PlayerView(BaseModel):
    """Jogador nas respostas; o overall e o valor de mercado vêm calculados na hora (RN06)."""

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
    """Resposta de GET /players: os jogadores da página e o meta da paginação (RN07)."""

    data: list[PlayerView]
    meta: PageMeta

    @classmethod
    def from_page(cls, page: Page[Player]) -> Self:
        return cls(
            data=[PlayerView.from_model(player) for player in page.items],
            meta=PageMeta.from_page(page),
        )
