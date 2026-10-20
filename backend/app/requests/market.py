from typing import Annotated

from pydantic import BaseModel

from app.domain.enums import TransactionType
from app.dtos.market import PurchaseOrder, TransactionListCriteria
from app.requests.fields import BrasiliaDateTime, PositiveId
from app.requests.query import QueryPositiveInteger, choice_list

QueryTransactionTypes = Annotated[
    tuple[TransactionType, ...] | None, choice_list(TransactionType)
]


class PurchaseRequest(BaseModel):
    """Body of POST /players/{id}/buy; an unknown club is a 404 from the use case."""

    club_id: PositiveId
    loyalty_until: BrasiliaDateTime

    def to_order(self) -> PurchaseOrder:
        return PurchaseOrder(club_id=self.club_id, loyalty_until=self.loyalty_until)


class TransactionListQuery(BaseModel):
    """Query params of GET /clubs/{id}/transactions; no type means both (RN17)."""

    type: QueryTransactionTypes = None
    player_id: QueryPositiveInteger = None

    def to_criteria(self) -> TransactionListCriteria:
        return TransactionListCriteria(**self.model_dump(exclude_none=True))
