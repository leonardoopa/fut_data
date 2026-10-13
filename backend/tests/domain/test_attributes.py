from dataclasses import astuple

import pytest

from app.domain.attributes import POSITION_WEIGHTS, PlayerAttributes, calculate_overall
from app.domain.enums import Position


@pytest.mark.parametrize(
    ("position", "attributes", "expected_overall"),
    [
        (Position.MEI, PlayerAttributes(68, 65, 80, 78, 52, 60), 73),
        (Position.ATA, PlayerAttributes(78, 75, 73, 82, 48, 68), 76),
        (Position.LAT, PlayerAttributes(72, 70, 78, 76, 70, 66), 72),
        (Position.ZAG, PlayerAttributes(50, 90, 60, 40, 80, 75), 73),
        (Position.GOL, PlayerAttributes(55, 30, 65, 40, 72, 68), 68),
        (Position.MEI, PlayerAttributes(70, 68, 82, 79, 55, 64), 75),
    ],
)
def test_overall_follows_the_specification_examples(
    position: Position, attributes: PlayerAttributes, expected_overall: int
) -> None:
    assert calculate_overall(position, attributes) == expected_overall


@pytest.mark.parametrize("position", list(Position))
def test_weights_of_each_position_sum_one_hundred(position: Position) -> None:
    assert sum(astuple(POSITION_WEIGHTS[position])) == 100
