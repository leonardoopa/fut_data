from typing import Self

from pydantic import BaseModel

from app.domain.enums import ContractStatus, TransactionType
from app.domain.transaction_history import TransactionSummary
from app.models import Contract, MarketTransaction
from app.services.market_service import Purchase, Sale, TransactionHistory
from app.views.fields import BrasiliaTimestamp, Money


class TransactionView(BaseModel):
    """Transação com os valores gravados no momento da compra ou da venda (RN17)."""

    id: int
    club_id: int
    player_id: int
    player_name: str
    type: TransactionType
    value: Money
    fee: Money
    penalty: Money
    profit: Money | None
    cash_change: Money
    created_at: BrasiliaTimestamp

    @classmethod
    def from_model(cls, market_transaction: MarketTransaction) -> Self:
        return cls.model_validate(market_transaction, from_attributes=True)


class PurchaseContractView(BaseModel):
    purchase_value: Money
    loyalty_until: BrasiliaTimestamp
    status: ContractStatus

    @classmethod
    def from_model(cls, contract: Contract) -> Self:
        return cls.model_validate(contract, from_attributes=True)


class PurchaseView(TransactionView):
    """Resposta da compra: a transação, o contrato criado e o novo caixa (RN12)."""

    contract: PurchaseContractView
    club_cash: Money

    @classmethod
    def from_purchase(cls, purchase: Purchase) -> Self:
        return cls(
            **TransactionView.from_model(purchase.transaction).model_dump(),
            contract=PurchaseContractView.from_model(purchase.contract),
            club_cash=purchase.club_cash,
        )


class SaleView(TransactionView):
    """Resposta da venda: a transação, o acerto da multa e o novo caixa (RN15 e RN16)."""

    purchase_value: Money
    remaining_days: int
    penalty_rate: int
    contract_status: ContractStatus
    club_cash: Money

    @classmethod
    def from_sale(cls, sale: Sale) -> Self:
        settlement = sale.settlement
        return cls(
            **TransactionView.from_model(sale.transaction).model_dump(),
            purchase_value=settlement.purchase_value,
            remaining_days=settlement.remaining_days,
            penalty_rate=settlement.penalty_percentage,
            contract_status=settlement.contract_status,
            club_cash=sale.club_cash,
        )


class TransactionSummaryView(BaseModel):
    total_spent: Money
    total_received: Money
    total_fees: Money
    total_penalties: Money
    total_profit: Money

    @classmethod
    def from_summary(cls, summary: TransactionSummary) -> Self:
        return cls.model_validate(summary, from_attributes=True)


class TransactionHistoryView(BaseModel):
    """Resposta de GET /clubs/{id}/transactions: as transações filtradas e os totais (RN17)."""

    data: list[TransactionView]
    summary: TransactionSummaryView

    @classmethod
    def from_history(cls, history: TransactionHistory) -> Self:
        return cls(
            data=[TransactionView.from_model(item) for item in history.transactions],
            summary=TransactionSummaryView.from_summary(history.summary),
        )
