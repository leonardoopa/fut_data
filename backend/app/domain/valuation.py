from dataclasses import dataclass
from decimal import Decimal

from app.domain.enums import Condition
from app.domain.rounding import percent_of, round_money

MINIMUM_VALUE = Decimal("1.00")
YOUNG_PROSPECT_MAX_AGE = 21


@dataclass(frozen=True)
class OverallBand:
    first: int
    last: int
    value_per_point: Decimal

    def value_for(self, overall: int) -> Decimal:
        points_in_band = max(0, min(overall, self.last) - self.first + 1)
        return points_in_band * self.value_per_point


OVERALL_BANDS = (
    OverallBand(first=41, last=60, value_per_point=Decimal("0.50")),
    OverallBand(first=61, last=75, value_per_point=Decimal("2.00")),
    OverallBand(first=76, last=99, value_per_point=Decimal("6.00")),
)

CONDITION_DISCOUNTS: dict[Condition, Decimal] = {
    Condition.APTO: Decimal(0),
    Condition.MAL_CONDICIONADO: Decimal(15),
    Condition.DOENTE: Decimal(30),
}
HIGH_AGILITY_MIN = 80
LOW_AGILITY_MAX = 30
LOW_AGILITY_EXTRA_DISCOUNT = Decimal(10)

AGE_ADJUSTMENT = Decimal(10)
VETERAN_MIN_AGE = 32
MAXIMUM_DISCOUNT = Decimal(-40)


def calculate_base_value(overall: int, potential: int, registration_age: int) -> Decimal:
    overall_part = sum((band.value_for(overall) for band in OVERALL_BANDS), Decimal(0))
    if registration_age <= YOUNG_PROSPECT_MAX_AGE:
        overall_part = percent_of(overall_part, 100 + potential - overall)
    return max(round_money(overall_part), MINIMUM_VALUE)


def condition_discount(condition: Condition, agility: int) -> Decimal:
    discount = CONDITION_DISCOUNTS[condition]
    if condition == Condition.APTO:
        return discount
    if agility >= HIGH_AGILITY_MIN:
        return discount / 2
    if agility <= LOW_AGILITY_MAX:
        return discount + LOW_AGILITY_EXTRA_DISCOUNT
    return discount


def age_adjustment(age: int) -> Decimal:
    if age <= YOUNG_PROSPECT_MAX_AGE:
        return AGE_ADJUSTMENT
    if age >= VETERAN_MIN_AGE:
        return -AGE_ADJUSTMENT
    return Decimal(0)


def calculate_market_value(
    base_value: Decimal, condition: Condition, agility: int, age: int
) -> Decimal:
    total_percentage = max(
        age_adjustment(age) - condition_discount(condition, agility), MAXIMUM_DISCOUNT
    )
    market_value = round_money(percent_of(base_value, 100 + total_percentage))
    return max(market_value, MINIMUM_VALUE)
