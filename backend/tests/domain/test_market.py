from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.domain.enums import ContractStatus
from app.domain.market import (
    calculate_commission,
    penalty_percentage,
    purchase_limit,
    quote_purchase,
    remaining_loyalty_days,
    settle_sale,
)

SOLD_AT = datetime(2026, 11, 5, 19, 40, tzinfo=UTC)


@pytest.mark.parametrize(
    ("cash", "market_value", "fee", "total_cost", "accepted"),
    [
        ("300.00", "28.00", "0.00", "28.00", True),
        ("300.00", "30.00", "0.00", "30.00", True),
        ("300.00", "30.01", "1.50", "31.51", True),
        ("100.00", "47.62", "2.38", "50.00", True),
        ("100.00", "48.00", "2.40", "50.40", False),
    ],
)
def test_purchase_quote_follows_the_specification_examples(
    cash: str, market_value: str, fee: str, total_cost: str, accepted: bool
) -> None:
    quote = quote_purchase(Decimal(market_value))

    assert quote.fee == Decimal(fee)
    assert quote.total_cost == Decimal(total_cost)
    assert (quote.total_cost <= purchase_limit(Decimal(cash))) is accepted


def test_purchase_limit_is_exactly_half_of_the_cash_without_rounding() -> None:
    limit = purchase_limit(Decimal("261.15"))

    assert limit == Decimal("130.575")
    assert Decimal("130.58") > limit


@pytest.mark.parametrize(
    ("time_left", "expected_days"),
    [
        (-timedelta(days=1), 0),
        (timedelta(0), 0),
        (timedelta(days=10, hours=2), 11),
        (timedelta(days=30), 30),
        (timedelta(days=30, minutes=1), 31),
        (timedelta(days=180), 180),
        (timedelta(days=180, minutes=1), 181),
        (timedelta(days=200), 200),
        (timedelta(days=116, hours=17, minutes=35), 117),
    ],
)
def test_remaining_days_round_any_fraction_up(time_left: timedelta, expected_days: int) -> None:
    assert remaining_loyalty_days(SOLD_AT + time_left, SOLD_AT) == expected_days


@pytest.mark.parametrize(
    ("remaining_days", "expected_percentage"),
    [(0, 0), (1, 5), (30, 5), (31, 10), (180, 10), (181, 20), (1095, 20)],
)
def test_penalty_percentage_by_remaining_days(
    remaining_days: int, expected_percentage: int
) -> None:
    assert penalty_percentage(remaining_days) == expected_percentage


@pytest.mark.parametrize(
    ("profit", "expected_commission"),
    [
        ("3.00", "0.30"),
        ("3.85", "0.39"),
        ("10.00", "1.00"),
        ("10.01", "1.00"),
        ("15.00", "2.00"),
        ("0.00", "0.00"),
        ("-7.50", "0.00"),
    ],
)
def test_commission_follows_the_specification_examples(
    profit: str, expected_commission: str
) -> None:
    assert calculate_commission(Decimal(profit)) == Decimal(expected_commission)


@pytest.mark.parametrize(
    ("purchase_value", "sale_value", "time_left", "penalty", "profit", "commission", "credit"),
    [
        ("37.00", "40.00", timedelta(days=100), "4.00", "3.00", "0.30", "35.70"),
        ("50.00", "42.50", timedelta(days=200), "8.50", "-7.50", "0.00", "34.00"),
        ("26.15", "30.00", timedelta(days=10), "1.50", "3.85", "0.39", "28.11"),
        ("25.00", "25.00", -timedelta(days=1), "0.00", "0.00", "0.00", "25.00"),
        ("60.00", "75.00", timedelta(days=200), "10.00", "15.00", "2.00", "63.00"),
    ],
)
def test_sale_settlement_follows_the_specification_examples(
    purchase_value: str,
    sale_value: str,
    time_left: timedelta,
    penalty: str,
    profit: str,
    commission: str,
    credit: str,
) -> None:
    settlement = settle_sale(
        Decimal(sale_value), Decimal(purchase_value), SOLD_AT + time_left, SOLD_AT
    )

    assert settlement.penalty == Decimal(penalty)
    assert settlement.profit == Decimal(profit)
    assert settlement.commission == Decimal(commission)
    assert settlement.credit == Decimal(credit)


def test_sale_of_the_documented_example_rescinds_the_contract() -> None:
    loyalty_until = datetime(2027, 3, 2, 13, 15, tzinfo=UTC)

    settlement = settle_sale(Decimal("40.00"), Decimal("37.00"), loyalty_until, SOLD_AT)

    assert settlement.remaining_days == 117
    assert settlement.penalty_percentage == 10
    assert settlement.credit == Decimal("35.70")
    assert settlement.contract_status == ContractStatus.RESCINDIDO


def test_sale_after_the_loyalty_period_ends_the_contract_without_penalty() -> None:
    settlement = settle_sale(Decimal("25.00"), Decimal("25.00"), SOLD_AT, SOLD_AT)

    assert settlement.penalty == Decimal("0.00")
    assert settlement.contract_status == ContractStatus.ENCERRADO
