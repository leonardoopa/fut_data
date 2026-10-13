from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.enums import ContractStatus
from app.models.base import Base, UtcDateTime, enum_column, money


class Contract(Base):
    __tablename__ = "contratos"

    id: Mapped[int] = mapped_column(primary_key=True)
    player_id: Mapped[int] = mapped_column("jogador_id", ForeignKey("jogadores.id"), index=True)
    club_id: Mapped[int] = mapped_column("clube_id", ForeignKey("clubes.id"), index=True)
    purchase_value: Mapped[Decimal] = mapped_column("valor_compra", money(6))
    loyalty_until: Mapped[datetime] = mapped_column("fidelidade_ate", UtcDateTime)
    status: Mapped[ContractStatus] = mapped_column(
        "situacao", enum_column(ContractStatus, 12, "situacao"), default=ContractStatus.ATIVO
    )
    started_at: Mapped[datetime] = mapped_column("iniciado_em", UtcDateTime)
    ended_at: Mapped[datetime | None] = mapped_column("encerrado_em", UtcDateTime)
