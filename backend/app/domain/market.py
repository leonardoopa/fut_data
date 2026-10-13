from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from app.domain.enums import ContractStatus
from app.domain.rounding import ZERO_MONEY, percent_of, round_money

PURCHASE_FEE_PERCENTAGE = 5
PURCHASE_FEE_THRESHOLD = Decimal("30.00")

PENALTY_PERCENTAGE_BY_MAX_DAYS = ((0, 0), (30, 5), (180, 10))
LONG_LOYALTY_PENALTY_PERCENTAGE = 20
MAXIMUM_PENALTY = Decimal("10.00")

COMMISSION_BRACKET_LIMIT = Decimal("10.00")
BASE_COMMISSION_PERCENTAGE = 10
EXCESS_COMMISSION_PERCENTAGE = 20

DAY = timedelta(days=1)


@dataclass(frozen=True)
class PurchaseQuote:
    """Preço de uma compra: valor de mercado e taxa (RN13)."""

    value: Decimal
    fee: Decimal

    @property
    def total_cost(self) -> Decimal:
        return self.value + self.fee


@dataclass(frozen=True)
class SaleSettlement:
    """Acerto de uma venda: multa, lucro, comissão e crédito no caixa (RN15 e RN16)."""

    value: Decimal
    purchase_value: Decimal
    profit: Decimal
    remaining_days: int
    penalty_percentage: int
    penalty: Decimal
    commission: Decimal

    @property
    def credit(self) -> Decimal:
        return self.value - self.penalty - self.commission

    @property
    def contract_status(self) -> ContractStatus:
        if self.penalty > 0:
            return ContractStatus.RESCINDIDO
        return ContractStatus.ENCERRADO


def quote_purchase(market_value: Decimal) -> PurchaseQuote:
    fee = ZERO_MONEY
    if market_value > PURCHASE_FEE_THRESHOLD:
        fee = round_money(percent_of(market_value, PURCHASE_FEE_PERCENTAGE))
    return PurchaseQuote(value=market_value, fee=fee)


def purchase_limit(cash: Decimal) -> Decimal:
    """Metade exata do caixa, sem arredondamento (RN13)."""
    return cash / 2


def remaining_loyalty_days(loyalty_until: datetime, moment: datetime) -> int:
    """Dias restantes de fidelidade, com a fração arredondada para cima (RN15)."""
    remaining = loyalty_until - moment
    if remaining <= timedelta(0):
        return 0
    whole_days, fraction = divmod(remaining, DAY)
    return whole_days + (1 if fraction else 0)


def penalty_percentage(remaining_days: int) -> int:
    for max_days, percentage in PENALTY_PERCENTAGE_BY_MAX_DAYS:
        if remaining_days <= max_days:
            return percentage
    return LONG_LOYALTY_PENALTY_PERCENTAGE


def calculate_penalty(market_value: Decimal, percentage: int) -> Decimal:
    return min(round_money(percent_of(market_value, percentage)), MAXIMUM_PENALTY)


def calculate_commission(profit: Decimal) -> Decimal:
    """Comissão progressiva sobre o lucro, arredondada uma única vez (RN16)."""
    if profit <= 0:
        return ZERO_MONEY
    base_part = min(profit, COMMISSION_BRACKET_LIMIT)
    excess_part = profit - base_part
    return round_money(
        percent_of(base_part, BASE_COMMISSION_PERCENTAGE)
        + percent_of(excess_part, EXCESS_COMMISSION_PERCENTAGE)
    )


def settle_sale(
    market_value: Decimal, purchase_value: Decimal, loyalty_until: datetime, sold_at: datetime
) -> SaleSettlement:
    profit = market_value - purchase_value
    remaining_days = remaining_loyalty_days(loyalty_until, sold_at)
    percentage = penalty_percentage(remaining_days)
    return SaleSettlement(
        value=market_value,
        purchase_value=purchase_value,
        profit=profit,
        remaining_days=remaining_days,
        penalty_percentage=percentage,
        penalty=calculate_penalty(market_value, percentage),
        commission=calculate_commission(profit),
    )
