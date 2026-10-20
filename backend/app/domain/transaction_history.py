from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol

from app.domain.enums import TransactionType
from app.domain.rounding import ZERO_MONEY, round_money


class RecordedTransaction(Protocol):
    @property
    def type(self) -> str: ...

    @property
    def value(self) -> Decimal: ...

    @property
    def fee(self) -> Decimal: ...

    @property
    def penalty(self) -> Decimal: ...

    @property
    def profit(self) -> Decimal | None: ...

    @property
    def cash_change(self) -> Decimal: ...


@dataclass(frozen=True)
class TransactionSummary:
    total_spent: Decimal
    total_received: Decimal
    total_fees: Decimal
    total_penalties: Decimal
    total_profit: Decimal


def total(amounts: Iterable[Decimal]) -> Decimal:
    return round_money(sum(amounts, ZERO_MONEY))


def summarize_transactions(
    transactions: Sequence[RecordedTransaction],
) -> TransactionSummary:
    purchases = [item for item in transactions if item.type == TransactionType.COMPRA]
    sales = [item for item in transactions if item.type == TransactionType.VENDA]
    return TransactionSummary(
        total_spent=total(item.value + item.fee for item in purchases),
        total_received=total(item.cash_change for item in sales),
        total_fees=total(item.fee for item in transactions),
        total_penalties=total(item.penalty for item in sales),
        total_profit=total(item.profit or ZERO_MONEY for item in sales),
    )
