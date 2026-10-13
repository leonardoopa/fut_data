from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import TransactionType
from app.models.base import Base, UtcDateTime, enum_column, money


class MarketTransaction(Base):
    __tablename__ = "transacoes"
    __table_args__ = (Index("ix_transacoes_clube_id_criado_em", "clube_id", "criado_em"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    club_id: Mapped[int] = mapped_column("clube_id", ForeignKey("clubes.id"))
    player_id: Mapped[int] = mapped_column("jogador_id", ForeignKey("jogadores.id"), index=True)
    player_name: Mapped[str] = mapped_column("nome_jogador", String(100))
    type: Mapped[TransactionType] = mapped_column("tipo", enum_column(TransactionType, 6, "tipo"))
    value: Mapped[Decimal] = mapped_column("valor", money(6))
    fee: Mapped[Decimal] = mapped_column("taxa", money(6))
    penalty: Mapped[Decimal] = mapped_column("multa", money(6))
    profit: Mapped[Decimal | None] = mapped_column("lucro", money(7))
    cash_change: Mapped[Decimal] = mapped_column("variacao_caixa", money(8))
    created_at: Mapped[datetime] = mapped_column("criado_em", UtcDateTime)
