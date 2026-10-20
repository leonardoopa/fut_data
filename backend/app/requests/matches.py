from typing import Self

from pydantic import BaseModel, model_validator

from app.domain.match import ensure_distinct_clubs
from app.dtos.match import MatchFixture, MatchListCriteria
from app.requests.fields import PositiveId
from app.requests.query import QueryPositiveInteger


class MatchRequest(BaseModel):
    """Body of POST /matches; an unknown club is a 404 from the use case."""

    home_club_id: PositiveId
    away_club_id: PositiveId

    @model_validator(mode="after")
    def check_distinct_clubs(self) -> Self:
        ensure_distinct_clubs(self.home_club_id, self.away_club_id)
        return self

    def to_fixture(self) -> MatchFixture:
        return MatchFixture(home_club_id=self.home_club_id, away_club_id=self.away_club_id)


class MatchListQuery(BaseModel):
    """Query params of GET /matches; no club_id means all matches (RN21)."""

    club_id: QueryPositiveInteger = None

    def to_criteria(self) -> MatchListCriteria:
        return MatchListCriteria(club_id=self.club_id)
