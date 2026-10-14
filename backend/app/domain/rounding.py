from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")
ZERO_MONEY = Decimal("0.00")


def round_money(value: Decimal) -> Decimal:
    """Arredonda para 2 casas; no meio, para longe do zero (14,775 vira 14,78)."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def round_to_integer(value: Decimal) -> int:
    """Arredonda para o inteiro mais próximo, com o meio para cima (72,5 vira 73)."""
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def percent_of(value: Decimal, percentage: Decimal | int) -> Decimal:
    return value * Decimal(percentage) / 100
