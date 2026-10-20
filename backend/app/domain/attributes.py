from dataclasses import astuple, dataclass, fields
from decimal import Decimal

from app.domain.enums import Position
from app.domain.rounding import round_to_integer


@dataclass(frozen=True)
class PlayerAttributes:
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int

    def highest(self) -> int:
        return max(astuple(self))

    def total(self) -> int:
        return sum(astuple(self))


@dataclass(frozen=True)
class AttributeWeights:
    pace: int
    shooting: int
    passing: int
    dribbling: int
    defending: int
    physical: int


POSITION_WEIGHTS: dict[Position, AttributeWeights] = {
    Position.GOL: AttributeWeights(
        pace=10, shooting=0, passing=20, dribbling=0, defending=40, physical=30
    ),
    Position.ZAG: AttributeWeights(
        pace=10, shooting=0, passing=15, dribbling=0, defending=45, physical=30
    ),
    Position.LAT: AttributeWeights(
        pace=25, shooting=0, passing=20, dribbling=15, defending=25, physical=15
    ),
    Position.MEI: AttributeWeights(
        pace=10, shooting=15, passing=35, dribbling=25, defending=5, physical=10
    ),
    Position.ATA: AttributeWeights(
        pace=20, shooting=40, passing=10, dribbling=20, defending=0, physical=10
    ),
}


def calculate_overall(position: Position, attributes: PlayerAttributes) -> int:
    weights = POSITION_WEIGHTS[position]
    weighted_sum = sum(
        getattr(attributes, field.name) * getattr(weights, field.name)
        for field in fields(AttributeWeights)
    )
    return round_to_integer(Decimal(weighted_sum) / 100)
