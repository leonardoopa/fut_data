from decimal import Decimal

import pytest

from app.domain.enums import Condition
from app.domain.valuation import calculate_base_value, calculate_market_value


@pytest.mark.parametrize(
    ("overall", "potential", "registration_age", "expected"),
    [
        (75, 86, 25, "40.00"),
        (60, 70, 30, "10.00"),
        (61, 70, 30, "12.00"),
        (76, 80, 22, "46.00"),
        (85, 92, 27, "100.00"),
        (70, 84, 21, "34.20"),
        (70, 84, 22, "30.00"),
        (45, 90, 18, "3.63"),
        (40, 66, 36, "1.00"),
    ],
)
def test_base_value_follows_the_specification_examples(
    overall: int, potential: int, registration_age: int, expected: str
) -> None:
    assert calculate_base_value(overall, potential, registration_age) == Decimal(
        expected
    )


@pytest.mark.parametrize(
    ("base_value", "condition", "agility", "age", "expected"),
    [
        ("82.00", Condition.APTO, 20, 25, "82.00"),
        ("82.00", Condition.APTO, 50, 19, "90.20"),
        ("82.00", Condition.MAL_CONDICIONADO, 50, 25, "69.70"),
        ("82.00", Condition.MAL_CONDICIONADO, 80, 21, "84.05"),
        ("82.00", Condition.MAL_CONDICIONADO, 30, 33, "53.30"),
        ("82.00", Condition.DOENTE, 90, 25, "69.70"),
        ("82.00", Condition.DOENTE, 30, 25, "49.20"),
        ("82.00", Condition.DOENTE, 10, 40, "49.20"),
        ("9.50", Condition.MAL_CONDICIONADO, 85, 25, "8.79"),
        ("1.00", Condition.MAL_CONDICIONADO, 50, 35, "1.00"),
        ("40.00", Condition.MAL_CONDICIONADO, 85, 25, "37.00"),
    ],
)
def test_market_value_follows_the_specification_examples(
    base_value: str, condition: Condition, agility: int, age: int, expected: str
) -> None:
    market_value = calculate_market_value(Decimal(base_value), condition, agility, age)

    assert market_value == Decimal(expected)


@pytest.mark.parametrize(
    ("agility", "expected"),
    [(79, "69.70"), (80, "75.85"), (31, "69.70"), (30, "61.50")],
)
def test_agility_effect_changes_exactly_at_the_band_limits(
    agility: int, expected: str
) -> None:
    market_value = calculate_market_value(
        Decimal("82.00"), Condition.MAL_CONDICIONADO, agility, age=25
    )

    assert market_value == Decimal(expected)


@pytest.mark.parametrize(
    ("age", "expected"),
    [(21, "90.20"), (22, "82.00"), (31, "82.00"), (32, "73.80")],
)
def test_age_adjustment_changes_exactly_at_the_band_limits(
    age: int, expected: str
) -> None:
    assert calculate_market_value(Decimal("82.00"), Condition.APTO, 50, age) == Decimal(
        expected
    )
