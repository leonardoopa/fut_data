from datetime import datetime
from decimal import Decimal

from sqlalchemy import CHAR, CheckConstraint, String
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import Mapped, mapped_column

from app.core.clock import utc_now
from app.domain.enums import Formation
from app.models.base import Base, UtcDateTime, enum_column, money

CLUB_NAME_MAX_LENGTH = 60
INITIAL_CASH = Decimal("300.00")

CaseFoldedName = String(CLUB_NAME_MAX_LENGTH).with_variant(
    mysql.VARCHAR(CLUB_NAME_MAX_LENGTH, collation="utf8mb4_bin"), "mysql"
)


class Club(Base):
    __tablename__ = "clubes"
    __table_args__ = (CheckConstraint("caixa >= 0", name="caixa_nao_negativo"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column("nome", String(CLUB_NAME_MAX_LENGTH))
    name_key: Mapped[str] = mapped_column("nome_normalizado", CaseFoldedName, unique=True)
    acronym: Mapped[str] = mapped_column("sigla", CHAR(3), unique=True)
    cash: Mapped[Decimal] = mapped_column(
        "caixa", money(10), default=INITIAL_CASH, server_default=str(INITIAL_CASH)
    )
    formation: Mapped[Formation | None] = mapped_column(
        "formacao", enum_column(Formation, 5, "formacao")
    )
    created_at: Mapped[datetime] = mapped_column("criado_em", UtcDateTime, default=utc_now)
