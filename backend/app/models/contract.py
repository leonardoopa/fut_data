from datetime import datetime
from decimal import Decimal
from typing import Self

from django.db import models

from app.domain.enums import ContractStatus
from app.domain.market import ContractTerms, contract_terms
from app.models.club import Club
from app.models.constraints import values_check
from app.models.fields import enum_field, money_field
from app.models.player import Player


class Contract(models.Model):
    player = models.ForeignKey(
        Player,
        on_delete=models.PROTECT,
        related_name="contracts",
        db_column="jogador_id",
    )
    club = models.ForeignKey(
        Club, on_delete=models.PROTECT, related_name="contracts", db_column="clube_id"
    )
    purchase_value = money_field(6, db_column="valor_compra")
    loyalty_until = models.DateTimeField(db_column="fidelidade_ate")
    status = enum_field(ContractStatus, 12, db_column="situacao")
    started_at = models.DateTimeField(db_column="iniciado_em")
    ended_at = models.DateTimeField(null=True, db_column="encerrado_em")

    class Meta:
        db_table = "contratos"
        constraints = (values_check("contratos", "status", ContractStatus),)

    @classmethod
    def sign(
        cls,
        player: Player,
        club: Club,
        purchase_value: Decimal,
        loyalty_until: datetime,
        moment: datetime,
    ) -> Self:
        """Contrato ATIVO criado pela compra (RN12)."""
        return cls(
            player=player,
            club=club,
            purchase_value=purchase_value,
            loyalty_until=loyalty_until,
            status=ContractStatus.ATIVO,
            started_at=moment,
        )

    def terms_at(self, moment: datetime) -> ContractTerms:
        return contract_terms(self.purchase_value, self.loyalty_until, moment)

    def end(self, status: ContractStatus, moment: datetime) -> None:
        """A venda encerra ou rescinde o contrato, que não muda depois (RN15)."""
        self.status = status
        self.ended_at = moment
