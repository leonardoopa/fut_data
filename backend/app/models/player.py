from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.clock import utc_now
from app.domain.enums import Condition, Position
from app.models.base import Base, UtcDateTime, enum_column, money

COLUMNS_FROM_1_TO_99 = (
    "velocidade",
    "finalizacao",
    "passe",
    "drible",
    "defesa",
    "fisico",
    "potencial",
)


def attribute_range_check(column: str) -> CheckConstraint:
    return CheckConstraint(f"{column} BETWEEN 1 AND 99", name=f"{column}_entre_1_e_99")


class Player(Base):
    __tablename__ = "jogadores"
    __table_args__ = (
        CheckConstraint("agilidade BETWEEN 1 AND 100", name="agilidade_entre_1_e_100"),
        CheckConstraint("idade BETWEEN 16 AND 45", name="idade_entre_16_e_45"),
        CheckConstraint("valor_base >= 1", name="valor_base_minimo"),
        *(attribute_range_check(column) for column in COLUMNS_FROM_1_TO_99),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column("nome", String(100))
    position: Mapped[Position] = mapped_column("posicao", enum_column(Position, 3, "posicao"))
    agility: Mapped[int] = mapped_column("agilidade")
    age: Mapped[int] = mapped_column("idade")
    base_value: Mapped[Decimal] = mapped_column("valor_base", money(6))
    condition: Mapped[Condition] = mapped_column(
        "condicao", enum_column(Condition, 20, "condicao"), default=Condition.APTO
    )
    club_id: Mapped[int | None] = mapped_column("clube_id", ForeignKey("clubes.id"), index=True)
    pace: Mapped[int] = mapped_column("velocidade")
    shooting: Mapped[int] = mapped_column("finalizacao")
    passing: Mapped[int] = mapped_column("passe")
    dribbling: Mapped[int] = mapped_column("drible")
    defending: Mapped[int] = mapped_column("defesa")
    physical: Mapped[int] = mapped_column("fisico")
    potential: Mapped[int] = mapped_column("potencial")
    deleted_at: Mapped[datetime | None] = mapped_column("excluido_em", UtcDateTime)
    created_at: Mapped[datetime] = mapped_column("criado_em", UtcDateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        "atualizado_em", UtcDateTime, default=utc_now, onupdate=utc_now
    )
