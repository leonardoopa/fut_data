from dataclasses import dataclass
from datetime import datetime

from app.domain.enums import TransactionType


@dataclass(frozen=True)
class PurchaseOrder:
    club_id: int
    loyalty_until: datetime


@dataclass(frozen=True)
class TransactionListCriteria:
    type: tuple[TransactionType, ...] = tuple(TransactionType)
    player_id: int | None = None
