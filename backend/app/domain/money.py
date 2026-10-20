from decimal import Decimal

DECIMAL_POINT = "."
DECIMAL_COMMA = ","


def format_money(value: Decimal) -> str:
    return f"{value:.2f}".replace(DECIMAL_POINT, DECIMAL_COMMA)
