from typing import Self

from pydantic import BaseModel

from app.domain.standings import Standing


class StandingView(BaseModel):
    """Linha da classificação, calculada na hora (RN21)."""

    position: int
    club_id: int
    club_name: str
    played: int
    wins: int
    draws: int
    losses: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int

    @classmethod
    def from_standing(cls, standing: Standing) -> Self:
        return cls.model_validate(standing, from_attributes=True)
