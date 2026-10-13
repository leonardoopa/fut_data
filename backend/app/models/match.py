from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums import Condition, DuelAttribute, Formation, Position
from app.models.base import Base, UtcDateTime, enum_column


class Match(Base):
    __tablename__ = "partidas"
    __table_args__ = (
        CheckConstraint("mandante_id <> visitante_id", name="clubes_distintos"),
        CheckConstraint("gols_mandante BETWEEN 0 AND 3", name="gols_mandante_entre_0_e_3"),
        CheckConstraint("gols_visitante BETWEEN 0 AND 3", name="gols_visitante_entre_0_e_3"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    home_club_id: Mapped[int] = mapped_column("mandante_id", ForeignKey("clubes.id"), index=True)
    away_club_id: Mapped[int] = mapped_column("visitante_id", ForeignKey("clubes.id"), index=True)
    home_goals: Mapped[int] = mapped_column("gols_mandante")
    away_goals: Mapped[int] = mapped_column("gols_visitante")
    home_formation: Mapped[Formation] = mapped_column(
        "formacao_mandante", enum_column(Formation, 5, "formacao_mandante")
    )
    away_formation: Mapped[Formation] = mapped_column(
        "formacao_visitante", enum_column(Formation, 5, "formacao_visitante")
    )
    played_at: Mapped[datetime] = mapped_column("jogada_em", UtcDateTime)

    duels: Mapped[list["MatchDuel"]] = relationship(order_by="MatchDuel.order")


class MatchDuel(Base):
    __tablename__ = "duelos_partida"
    __table_args__ = (
        UniqueConstraint("partida_id", "ordem"),
        CheckConstraint("ordem BETWEEN 1 AND 6", name="ordem_entre_1_e_6"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[int] = mapped_column("partida_id", ForeignKey("partidas.id"))
    order: Mapped[int] = mapped_column("ordem")
    attacking_club_id: Mapped[int] = mapped_column("clube_atacante_id", ForeignKey("clubes.id"))
    attacker_id: Mapped[int] = mapped_column("atacante_id", ForeignKey("jogadores.id"))
    defender_id: Mapped[int] = mapped_column("defensor_id", ForeignKey("jogadores.id"))
    attacker_name: Mapped[str] = mapped_column("nome_atacante", String(100))
    defender_name: Mapped[str] = mapped_column("nome_defensor", String(100))
    attacker_position: Mapped[Position] = mapped_column(
        "posicao_atacante", enum_column(Position, 3, "posicao_atacante")
    )
    defender_position: Mapped[Position] = mapped_column(
        "posicao_defensor", enum_column(Position, 3, "posicao_defensor")
    )
    attacker_condition: Mapped[Condition] = mapped_column(
        "condicao_atacante", enum_column(Condition, 20, "condicao_atacante")
    )
    defender_condition: Mapped[Condition] = mapped_column(
        "condicao_defensor", enum_column(Condition, 20, "condicao_defensor")
    )
    attack_attribute: Mapped[DuelAttribute] = mapped_column(
        "atributo_ataque", enum_column(DuelAttribute, 10, "atributo_ataque")
    )
    defense_attribute: Mapped[DuelAttribute] = mapped_column(
        "atributo_defesa", enum_column(DuelAttribute, 10, "atributo_defesa")
    )
    attack_value: Mapped[int] = mapped_column("valor_ataque")
    defense_value: Mapped[int] = mapped_column("valor_defesa")
    goal: Mapped[bool] = mapped_column("gol", Boolean)
