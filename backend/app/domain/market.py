from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from app.domain.enums import ContractStatus, TransactionType
from app.domain.exceptions import (
    CashLimitExceededError,
    FreePlayerSaleError,
    LoyaltyNotInFutureError,
    LoyaltyTooLongError,
    PlayerNotFreeError,
    RepurchaseError,
    SquadFullError,
)
from app.domain.rounding import ZERO_MONEY, percent_of, round_money

PURCHASE_FEE_PERCENTAGE = 5
PURCHASE_FEE_THRESHOLD = Decimal("30.00")

PENALTY_PERCENTAGE_BY_MAX_DAYS = ((0, 0), (30, 5), (180, 10))
LONG_LOYALTY_PENALTY_PERCENTAGE = 20
MAXIMUM_PENALTY = Decimal("10.00")

COMMISSION_BRACKET_LIMIT = Decimal("10.00")
BASE_COMMISSION_PERCENTAGE = 10
EXCESS_COMMISSION_PERCENTAGE = 20

MAX_LOYALTY_DAYS = 1095
MAX_SQUAD_SIZE = 12

DAY = timedelta(days=1)


@dataclass(frozen=True)
class TransactionAmounts:
    type: TransactionType
    value: Decimal
    fee: Decimal
    penalty: Decimal
    profit: Decimal | None
    cash_change: Decimal


@dataclass(frozen=True)
class PurchaseQuote:
    value: Decimal
    fee: Decimal

    @property
    def total_cost(self) -> Decimal:
        return self.value + self.fee

    @property
    def amounts(self) -> TransactionAmounts:
        return TransactionAmounts(
            type=TransactionType.COMPRA,
            value=self.value,
            fee=self.fee,
            penalty=ZERO_MONEY,
            profit=None,
            cash_change=-self.total_cost,
        )


@dataclass(frozen=True)
class SaleSettlement:
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

    @property
    def amounts(self) -> TransactionAmounts:
        return TransactionAmounts(
            type=TransactionType.VENDA,
            value=self.value,
            fee=self.commission,
            penalty=self.penalty,
            profit=self.profit,
            cash_change=self.credit,
        )


@dataclass(frozen=True)
class ContractTerms:
    purchase_value: Decimal
    loyalty_until: datetime
    remaining_days: int
    penalty_percentage: int


def validate_loyalty_until(loyalty_until: datetime, moment: datetime) -> None:
    if loyalty_until <= moment:
        raise LoyaltyNotInFutureError
    if loyalty_until > moment + MAX_LOYALTY_DAYS * DAY:
        raise LoyaltyTooLongError(MAX_LOYALTY_DAYS)


def ensure_purchase_allowed(
    quote: PurchaseQuote,
    *,
    player_is_free: bool,
    sold_by_buyer: bool,
    squad_size: int,
    cash: Decimal,
) -> None:
    if not player_is_free:
        raise PlayerNotFreeError
    if sold_by_buyer:
        raise RepurchaseError
    if squad_size >= MAX_SQUAD_SIZE:
        raise SquadFullError(MAX_SQUAD_SIZE)
    if quote.total_cost > purchase_limit(cash):
        raise CashLimitExceededError(quote.total_cost, cash)


def ensure_sellable(*, has_club: bool) -> None:
    if not has_club:
        raise FreePlayerSaleError


def quote_purchase(market_value: Decimal) -> PurchaseQuote:
    fee = ZERO_MONEY
    if market_value > PURCHASE_FEE_THRESHOLD:
        fee = round_money(percent_of(market_value, PURCHASE_FEE_PERCENTAGE))
    return PurchaseQuote(value=market_value, fee=fee)


def purchase_limit(cash: Decimal) -> Decimal:
    return cash / 2


def remaining_loyalty_days(loyalty_until: datetime, moment: datetime) -> int:
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
    if profit <= 0:
        return ZERO_MONEY
    base_part = min(profit, COMMISSION_BRACKET_LIMIT)
    excess_part = profit - base_part
    return round_money(
        percent_of(base_part, BASE_COMMISSION_PERCENTAGE)
        + percent_of(excess_part, EXCESS_COMMISSION_PERCENTAGE)
    )


def settle_sale(
    market_value: Decimal,
    purchase_value: Decimal,
    loyalty_until: datetime,
    sold_at: datetime,
) -> SaleSettlement:
    profit = market_value - purchase_value
    terms = contract_terms(purchase_value, loyalty_until, sold_at)
    return SaleSettlement(
        value=market_value,
        purchase_value=purchase_value,
        profit=profit,
        remaining_days=terms.remaining_days,
        penalty_percentage=terms.penalty_percentage,
        penalty=calculate_penalty(market_value, terms.penalty_percentage),
        commission=calculate_commission(profit),
    )


def contract_terms(
    purchase_value: Decimal, loyalty_until: datetime, moment: datetime
) -> ContractTerms:
    remaining_days = remaining_loyalty_days(loyalty_until, moment)
    return ContractTerms(
        purchase_value=purchase_value,
        loyalty_until=loyalty_until,
        remaining_days=remaining_days,
        penalty_percentage=penalty_percentage(remaining_days),
    )
