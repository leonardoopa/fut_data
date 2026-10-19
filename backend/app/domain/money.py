"""Formato brasileiro dos valores em dinheiro, usado nas mensagens de erro e no CSV."""

from decimal import Decimal

DECIMAL_POINT = "."
DECIMAL_COMMA = ","


def format_money(value: Decimal) -> str:
    """Duas casas com vírgula decimal e `-` no negativo (149.1 vira 149,10)."""
    return f"{value:.2f}".replace(DECIMAL_POINT, DECIMAL_COMMA)
