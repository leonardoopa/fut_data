from django.db import models

from app.domain.club import ACRONYM_LENGTH, INITIAL_CASH, NAME_MAX_LENGTH
from app.domain.enums import Formation
from app.models.constraints import values_check
from app.models.fields import (
    BinaryCollationCharField,
    FixedCharField,
    enum_field,
    money_field,
)


class Club(models.Model):
    name = models.CharField(max_length=NAME_MAX_LENGTH, db_column="nome")
    name_key = BinaryCollationCharField(
        max_length=NAME_MAX_LENGTH, unique=True, db_column="nome_normalizado"
    )
    acronym = FixedCharField(max_length=ACRONYM_LENGTH, unique=True, db_column="sigla")
    cash = money_field(10, db_default=INITIAL_CASH, db_column="caixa")
    formation = enum_field(Formation, 5, null=True, db_column="formacao")
    created_at = models.DateTimeField(auto_now_add=True, db_column="criado_em")

    class Meta:
        db_table = "clubes"
        constraints = (
            models.CheckConstraint(condition=models.Q(cash__gte=0), name="ck_clubes_cash_positive"),
            values_check("clubes", "formation", Formation),
        )
