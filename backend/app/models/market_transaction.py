from django.db import models

from app.domain.enums import TransactionType
from app.domain.player import NAME_MAX_LENGTH
from app.models.club import Club
from app.models.constraints import values_check
from app.models.fields import enum_field, money_field
from app.models.player import Player


class MarketTransaction(models.Model):
    club = models.ForeignKey(
        Club,
        on_delete=models.PROTECT,
        related_name="transactions",
        db_column="clube_id",
    )
    player = models.ForeignKey(
        Player,
        on_delete=models.PROTECT,
        related_name="transactions",
        db_column="jogador_id",
    )
    player_name = models.CharField(max_length=NAME_MAX_LENGTH, db_column="nome_jogador")
    type = enum_field(TransactionType, 6, db_column="tipo")
    value = money_field(6, db_column="valor")
    fee = money_field(6, db_column="taxa")
    penalty = money_field(6, db_column="multa")
    profit = money_field(7, null=True, db_column="lucro")
    cash_change = money_field(8, db_column="variacao_caixa")
    created_at = models.DateTimeField(db_column="criado_em")

    class Meta:
        db_table = "transacoes"
        indexes = (
            models.Index(fields=("club", "created_at"), name="ix_transacoes_club_created_at"),
        )
        constraints = (values_check("transacoes", "type", TransactionType),)
