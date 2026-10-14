"""Corpo da compra e query params do histórico de transações."""

from typing import Annotated

from pydantic import BaseModel, Field

from app.domain.enums import TransactionType
from app.dtos.market import PurchaseOrder, TransactionListCriteria
from app.requests.fields import BrasiliaDateTime, StrictInteger
from app.requests.query import QueryPositiveInteger, choice_list

PositiveId = Annotated[StrictInteger, Field(ge=1)]
QueryTransactionTypes = Annotated[tuple[TransactionType, ...] | None, choice_list(TransactionType)]


class PurchaseRequest(BaseModel):
    """Corpo de POST /players/{id}/buy; um clube inexistente é conferido pelo caso de uso (404)."""

    club_id: PositiveId
    loyalty_until: BrasiliaDateTime

    def to_order(self) -> PurchaseOrder:
        return PurchaseOrder(club_id=self.club_id, loyalty_until=self.loyalty_until)


class TransactionListQuery(BaseModel):
    """Query params de GET /clubs/{id}/transactions; sem type, vêm os dois tipos (RN17)."""

    type: QueryTransactionTypes = None
    player_id: QueryPositiveInteger = None

    def to_criteria(self) -> TransactionListCriteria:
        return TransactionListCriteria(**self.model_dump(exclude_none=True))
