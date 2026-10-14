from dataclasses import dataclass
from datetime import datetime

from app.domain.enums import TransactionType


@dataclass(frozen=True)
class PurchaseOrder:
    """Pedido de compra: o clube comprador e o fim da fidelidade (RN12)."""

    club_id: int
    loyalty_until: datetime


@dataclass(frozen=True)
class TransactionListCriteria:
    type: tuple[TransactionType, ...] = tuple(TransactionType)
    player_id: int | None = None
