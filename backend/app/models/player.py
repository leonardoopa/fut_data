from dataclasses import asdict, fields
from decimal import Decimal
from typing import Self

from django.db import models

from app.domain.attributes import PlayerAttributes, calculate_overall
from app.domain.enums import Condition, Position
from app.domain.player import (
    AGE_MAX,
    AGE_MIN,
    AGILITY_MAX,
    AGILITY_MIN,
    ATTRIBUTE_MAX,
    ATTRIBUTE_MIN,
    INITIAL_CONDITION,
    NAME_MAX_LENGTH,
    POTENTIAL_MAX,
    POTENTIAL_MIN,
)
from app.domain.valuation import calculate_base_value, calculate_market_value
from app.dtos.player import PlayerProfile, PlayerRegistration
from app.models.club import Club
from app.models.constraints import range_check, values_check
from app.models.fields import enum_field, money_field

ATTRIBUTE_FIELDS = tuple(field.name for field in fields(PlayerAttributes))


class PlayerQuerySet(models.QuerySet["Player"]):
    def active(self) -> Self:
        return self.filter(deleted_at__isnull=True)


class Player(models.Model):
    name = models.CharField(max_length=NAME_MAX_LENGTH, db_column="nome")
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

    objects = PlayerQuerySet.as_manager()

    class Meta:
        db_table = "jogadores"
        constraints = (
            range_check("jogadores", "agility", AGILITY_MIN, AGILITY_MAX),
            range_check("jogadores", "age", AGE_MIN, AGE_MAX),
            range_check("jogadores", "potential", POTENTIAL_MIN, POTENTIAL_MAX),
            *(
                range_check("jogadores", field, ATTRIBUTE_MIN, ATTRIBUTE_MAX)
                for field in ATTRIBUTE_FIELDS
            ),
            models.CheckConstraint(
                condition=models.Q(base_value__gte=1),
                name="ck_jogadores_base_value_minimum",
            ),
            values_check("jogadores", "position", Position),
            values_check("jogadores", "condition", Condition),
        )

    @classmethod
    def from_registration(cls, registration: PlayerRegistration) -> Self:
        profile = registration.profile
        overall = calculate_overall(profile.position, registration.attributes)
        return cls(
            **asdict(profile),
            **asdict(registration.attributes),
            potential=registration.potential,
            base_value=calculate_base_value(
                overall, registration.potential, registration_age=profile.age
            ),
            condition=INITIAL_CONDITION,
        )

    @property
    def attributes(self) -> PlayerAttributes:
        return PlayerAttributes(
            **{field: getattr(self, field) for field in ATTRIBUTE_FIELDS}
        )

    @property
    def overall(self) -> int:
        return calculate_overall(Position(self.position), self.attributes)

    @property
    def market_value(self) -> Decimal:
        return calculate_market_value(
            self.base_value, Condition(self.condition), self.agility, self.age
        )

    @property
    def has_club(self) -> bool:
        return self.club_id is not None

    def change_profile(self, profile: PlayerProfile) -> None:
        self.name = profile.name
        self.position = profile.position
        self.agility = profile.agility
        self.age = profile.age
