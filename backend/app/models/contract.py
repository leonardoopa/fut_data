from django.db import models

from app.domain.enums import ContractStatus
from app.models.club import Club
from app.models.constraints import values_check
from app.models.fields import enum_field, money_field
from app.models.player import Player


class Contract(models.Model):
    player = models.ForeignKey(
        Player, on_delete=models.PROTECT, related_name="contracts", db_column="jogador_id"
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
