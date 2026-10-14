from decimal import Decimal
from typing import Self

from django.db import models

from app.domain.club import (
    ACRONYM_LENGTH,
    INITIAL_CASH,
    NAME_MAX_LENGTH,
    ClubRegistration,
    calculate_net_worth,
    calculate_squad_value,
)
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

    @classmethod
    def from_registration(cls, registration: ClubRegistration) -> Self:
        """Clube recém-criado: caixa inicial e sem jogadores (RN10)."""
        return cls(
            name=registration.name,
            name_key=registration.name_key,
            acronym=registration.acronym,
            cash=INITIAL_CASH,
        )

    @property
    def squad_value(self) -> Decimal:
        """Calculado a cada consulta, nunca gravado (RN11)."""
        return calculate_squad_value(player.market_value for player in self.players.all())

    @property
    def net_worth(self) -> Decimal:
        return calculate_net_worth(self.cash, self.squad_value)
