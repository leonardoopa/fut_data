from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.domain.enums import ContractStatus, TransactionType
from app.domain.exceptions import BusinessRuleError, InvalidInputError
from app.domain.market import (
    TransactionAmounts,
    calculate_commission,
    contract_terms,
    ensure_purchase_allowed,
    ensure_sellable,
    penalty_percentage,
    purchase_limit,
    quote_purchase,
    remaining_loyalty_days,
    settle_sale,
    validate_loyalty_until,
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


BOUGHT_AT = datetime(2026, 11, 2, 13, 15, tzinfo=UTC)


@pytest.mark.parametrize(
    "time_ahead",
    [timedelta(minutes=1), timedelta(days=120), timedelta(days=1095)],
)
def test_loyalty_until_after_the_purchase_and_within_1095_days_is_accepted(
    time_ahead: timedelta,
) -> None:
    validate_loyalty_until(BOUGHT_AT + time_ahead, BOUGHT_AT)


@pytest.mark.parametrize(
    ("time_ahead", "reason"),
    [
        (-timedelta(days=1), "posterior ao momento da compra"),
        (timedelta(0), "posterior ao momento da compra"),
        (timedelta(days=1095, minutes=1), "no máximo 1095 dias"),
    ],
)
def test_loyalty_until_outside_the_window_is_refused(time_ahead: timedelta, reason: str) -> None:
    with pytest.raises(InvalidInputError, match=reason):
        validate_loyalty_until(BOUGHT_AT + time_ahead, BOUGHT_AT)


def allowed_purchase(**changes: object) -> dict[str, object]:
    return {
        "player_is_free": True,
        "sold_by_buyer": False,
        "squad_size": 11,
        "cash": Decimal("300.00"),
        **changes,
    }


def test_purchase_is_allowed_up_to_half_of_the_cash_and_the_twelfth_player() -> None:
    quote = quote_purchase(Decimal("47.62"))

    ensure_purchase_allowed(quote, **allowed_purchase(cash=Decimal("100.00")))


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        ({"player_is_free": False}, "não está livre"),
        ({"sold_by_buyer": True}, "já vendeu"),
        ({"squad_size": 12}, "máximo de 12 jogadores"),
        ({"cash": Decimal("76.00")}, "passa de 50% do caixa"),
    ],
)
def test_purchase_is_refused_by_the_state_of_the_player_and_the_club(
    changes: dict[str, object], message: str
) -> None:
    with pytest.raises(BusinessRuleError, match=message):
        ensure_purchase_allowed(quote_purchase(Decimal("37.00")), **allowed_purchase(**changes))


def test_free_player_cannot_be_sold() -> None:
    ensure_sellable(has_club=True)
    with pytest.raises(BusinessRuleError, match="livre"):
        ensure_sellable(has_club=False)


def test_purchase_amounts_take_the_total_cost_from_the_cash() -> None:
    amounts = quote_purchase(Decimal("37.00")).amounts

    assert amounts == TransactionAmounts(
        type=TransactionType.COMPRA,
        value=Decimal("37.00"),
        fee=Decimal("1.85"),
        penalty=Decimal("0.00"),
        profit=None,
        cash_change=Decimal("-38.85"),
    )


def test_sale_amounts_record_the_commission_as_fee_and_credit_the_cash() -> None:
    loyalty_until = datetime(2027, 3, 2, 13, 15, tzinfo=UTC)

    amounts = settle_sale(Decimal("40.00"), Decimal("37.00"), loyalty_until, SOLD_AT).amounts

    assert amounts == TransactionAmounts(
        type=TransactionType.VENDA,
        value=Decimal("40.00"),
        fee=Decimal("0.30"),
        penalty=Decimal("4.00"),
        profit=Decimal("3.00"),
        cash_change=Decimal("35.70"),
    )


def test_contract_terms_show_the_remaining_days_and_the_penalty_rate() -> None:
    loyalty_until = datetime(2027, 3, 2, 13, 15, tzinfo=UTC)

    terms = contract_terms(Decimal("37.00"), loyalty_until, BOUGHT_AT)

    assert (terms.remaining_days, terms.penalty_percentage) == (120, 10)
