from typing import Annotated, Self

from pydantic import BaseModel, Field, model_validator

from app.domain.enums import Formation
from app.domain.lineup import LINEUP_SIZE, ensure_distinct_starters
from app.dtos.lineup import LineupSelection
from app.requests.fields import PositiveId

StarterIds = Annotated[
    tuple[PositiveId, ...], Field(min_length=LINEUP_SIZE, max_length=LINEUP_SIZE)
]


class LineupRequest(BaseModel):
    """Starters belong to the squad and fit the formation: checked by the use case."""

    formation: Formation
    player_ids: StarterIds

    @model_validator(mode="after")
    def check_distinct_starters(self) -> Self:
        ensure_distinct_starters(self.player_ids)
        return self

    def to_selection(self) -> LineupSelection:
        return LineupSelection(formation=self.formation, player_ids=self.player_ids)
