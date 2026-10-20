from dataclasses import dataclass
from decimal import Decimal

from app.domain.enums import TransactionType
from app.domain.transaction_history import TransactionSummary, summarize_transactions


@dataclass(frozen=True)
class RecordedTransaction:
    type: TransactionType
    value: Decimal
    fee: Decimal
    penalty: Decimal
    profit: Decimal | None
    cash_change: Decimal


PURCHASE = RecordedTransaction(
    TransactionType.COMPRA,
    Decimal("37.00"),
    Decimal("1.85"),
    Decimal("0.00"),
    None,
    Decimal("-38.85"),
)
SALE = RecordedTransaction(
    TransactionType.VENDA,
    Decimal("40.00"),
    Decimal("0.30"),
    Decimal("4.00"),
    Decimal("3.00"),
    Decimal("35.70"),
)
LOSING_SALE = RecordedTransaction(
    TransactionType.VENDA,
    Decimal("42.50"),
    Decimal("0.00"),
    Decimal("8.50"),
    Decimal("-7.50"),
    Decimal("34.00"),
)


def money_summary(*totals: str) -> TransactionSummary:
    return TransactionSummary(*(Decimal(value) for value in totals))


def test_summary_of_the_documented_purchase_and_sale() -> None:
    assert summarize_transactions([SALE, PURCHASE]) == money_summary(
        "38.85", "35.70", "2.15", "4.00", "3.00"
    )


def test_summary_of_sales_only_has_nothing_spent() -> None:
    assert summarize_transactions([SALE]) == money_summary(
        "0", "35.70", "0.30", "4.00", "3.00"
    )


def test_total_profit_keeps_the_sign_of_losses() -> None:
    summary = summarize_transactions([SALE, LOSING_SALE])

    assert summary.total_profit == Decimal("-4.50")
    assert summary.total_received == Decimal("69.70")


def test_summary_without_transactions_is_all_zero() -> None:
    assert summarize_transactions([]) == money_summary("0", "0", "0", "0", "0")
