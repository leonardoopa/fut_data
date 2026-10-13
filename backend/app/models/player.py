from django.db import models

from app.domain.enums import Condition, Position
from app.models.club import Club
from app.models.constraints import range_check, values_check
from app.models.fields import enum_field, money_field

ATTRIBUTE_FIELDS = ("pace", "shooting", "passing", "dribbling", "defending", "physical")


class Player(models.Model):
    name = models.CharField(max_length=100, db_column="nome")
    position = enum_field(Position, 3, db_column="posicao")
    agility = models.IntegerField(db_column="agilidade")
    age = models.IntegerField(db_column="idade")
    base_value = money_field(6, db_column="valor_base")
    condition = enum_field(Condition, 20, db_column="condicao")
    club = models.ForeignKey(
        Club,
        null=True,
        on_delete=models.PROTECT,
        related_name="players",
        db_column="clube_id",
    )
    pace = models.IntegerField(db_column="velocidade")
    shooting = models.IntegerField(db_column="finalizacao")
    passing = models.IntegerField(db_column="passe")
    dribbling = models.IntegerField(db_column="drible")
    defending = models.IntegerField(db_column="defesa")
    physical = models.IntegerField(db_column="fisico")
    potential = models.IntegerField(db_column="potencial")
    deleted_at = models.DateTimeField(null=True, db_column="excluido_em")
    created_at = models.DateTimeField(auto_now_add=True, db_column="criado_em")
    updated_at = models.DateTimeField(auto_now=True, db_column="atualizado_em")

    class Meta:
        db_table = "jogadores"
        constraints = (
            range_check("jogadores", "agility", 1, 100),
            range_check("jogadores", "age", 16, 45),
            range_check("jogadores", "potential", 1, 99),
            *(range_check("jogadores", field, 1, 99) for field in ATTRIBUTE_FIELDS),
            models.CheckConstraint(
                condition=models.Q(base_value__gte=1),
                name="ck_jogadores_base_value_minimum",
            ),
            values_check("jogadores", "position", Position),
            values_check("jogadores", "condition", Condition),
        )
