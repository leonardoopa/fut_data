from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")
ZERO_MONEY = Decimal("0.00")


def round_money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def round_to_integer(value: Decimal) -> int:
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def percent_of(value: Decimal, percentage: Decimal | int) -> Decimal:
    return value * Decimal(percentage) / 100
