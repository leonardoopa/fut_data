from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from app.domain.enums import ContractStatus, TransactionType
from app.domain.exceptions import BusinessRuleError, InvalidInputError
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
class PurchaseOrder:
    """Pedido de compra: o clube comprador e o fim da fidelidade (RN12)."""

    club_id: int
    loyalty_until: datetime


@dataclass(frozen=True)
class TransactionAmounts:
    """Valores gravados na transação, com o efeito no caixa do clube (RN17)."""

    type: TransactionType
    value: Decimal
    fee: Decimal
    penalty: Decimal
    profit: Decimal | None
    cash_change: Decimal


@dataclass(frozen=True)
class PurchaseQuote:
    """Preço de uma compra: valor de mercado e taxa (RN13)."""

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

    @property
    def amounts(self) -> TransactionAmounts:
        """Na venda, a taxa gravada é a comissão (RN17)."""
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
    """Situação de um contrato ATIVO num instante: dias restantes e multa se vendido (RN11)."""

    purchase_value: Decimal
    loyalty_until: datetime
    remaining_days: int
    penalty_percentage: int


def validate_loyalty_until(loyalty_until: datetime, moment: datetime) -> None:
    """O fim da fidelidade fica depois do momento da compra e até 1.095 dias depois dele."""
    if loyalty_until <= moment:
        raise InvalidInputError(
            "O fim da fidelidade (loyalty_until) deve ser posterior ao momento da compra."
        )
    if loyalty_until > moment + MAX_LOYALTY_DAYS * DAY:
        raise InvalidInputError(
            f"O fim da fidelidade (loyalty_until) pode ser no máximo {MAX_LOYALTY_DAYS} dias "
            "depois do momento da compra."
        )


def ensure_purchase_allowed(
    quote: PurchaseQuote,
    *,
    player_is_free: bool,
    sold_by_buyer: bool,
    squad_size: int,
    cash: Decimal,
) -> None:
    """Regras da compra que dependem do estado atual do jogador e do clube (RN12 a RN14)."""
    if not player_is_free:
        raise BusinessRuleError("O jogador não está livre: já pertence a um clube.")
    if sold_by_buyer:
        raise BusinessRuleError("O clube não pode comprar um jogador que ele mesmo já vendeu.")
    if squad_size >= MAX_SQUAD_SIZE:
        raise BusinessRuleError(f"O elenco já tem o máximo de {MAX_SQUAD_SIZE} jogadores.")
    if quote.total_cost > purchase_limit(cash):
        raise BusinessRuleError(
            f"O custo total ({quote.total_cost}) passa de 50% do caixa do clube ({cash})."
        )


def ensure_sellable(*, has_club: bool) -> None:
    if not has_club:
        raise BusinessRuleError("Jogador livre não pode ser vendido.")


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
