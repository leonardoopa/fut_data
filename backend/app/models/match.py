from django.db import models

from app.domain.enums import Condition, DuelAttribute, Formation, Position
from app.models.club import Club
from app.models.constraints import range_check, values_check
from app.models.fields import enum_field
from app.models.player import Player

PLAYABLE_CONDITIONS = (Condition.APTO, Condition.MAL_CONDICIONADO)


class Match(models.Model):
    home_club = models.ForeignKey(
        Club,
        on_delete=models.PROTECT,
        related_name="home_matches",
        db_column="mandante_id",
    )
    away_club = models.ForeignKey(
        Club,
        on_delete=models.PROTECT,
        related_name="away_matches",
        db_column="visitante_id",
    )
    home_goals = models.IntegerField(db_column="gols_mandante")
    away_goals = models.IntegerField(db_column="gols_visitante")
    home_formation = enum_field(Formation, 5, db_column="formacao_mandante")
    away_formation = enum_field(Formation, 5, db_column="formacao_visitante")
    played_at = models.DateTimeField(db_column="jogada_em")

    class Meta:
        db_table = "partidas"
        constraints = (
            models.CheckConstraint(
                condition=~models.Q(home_club=models.F("away_club")),
                name="ck_partidas_distinct_clubs",
            ),
            range_check("partidas", "home_goals", 0, 3),
            range_check("partidas", "away_goals", 0, 3),
            values_check("partidas", "home_formation", Formation),
            values_check("partidas", "away_formation", Formation),
        )


class MatchDuel(models.Model):
    match = models.ForeignKey(
        Match, on_delete=models.PROTECT, related_name="duels", db_column="partida_id"
    )
    order = models.IntegerField(db_column="ordem")
    attacking_club = models.ForeignKey(
        Club, on_delete=models.PROTECT, related_name="+", db_column="clube_atacante_id"
    )
    attacker = models.ForeignKey(
        Player, on_delete=models.PROTECT, related_name="+", db_column="atacante_id"
    )
    defender = models.ForeignKey(
        Player, on_delete=models.PROTECT, related_name="+", db_column="defensor_id"
    )
    attacker_name = models.CharField(max_length=100, db_column="nome_atacante")
    defender_name = models.CharField(max_length=100, db_column="nome_defensor")
    attacker_position = enum_field(Position, 3, db_column="posicao_atacante")
    defender_position = enum_field(Position, 3, db_column="posicao_defensor")
    attacker_condition = enum_field(Condition, 20, db_column="condicao_atacante")
    defender_condition = enum_field(Condition, 20, db_column="condicao_defensor")
    attack_attribute = enum_field(DuelAttribute, 10, db_column="atributo_ataque")
    defense_attribute = enum_field(DuelAttribute, 10, db_column="atributo_defesa")
    attack_value = models.IntegerField(db_column="valor_ataque")
    defense_value = models.IntegerField(db_column="valor_defesa")
    goal = models.BooleanField(db_column="gol")

    class Meta:
        db_table = "duelos_partida"
        constraints = (
            models.UniqueConstraint(
                fields=("match", "order"), name="uq_duelos_partida_match_order"
            ),
            range_check("duelos_partida", "order", 1, 6),
            values_check("duelos_partida", "attacker_position", Position),
            values_check("duelos_partida", "defender_position", Position),
            values_check("duelos_partida", "attacker_condition", PLAYABLE_CONDITIONS),
            values_check("duelos_partida", "defender_condition", PLAYABLE_CONDITIONS),
            values_check("duelos_partida", "attack_attribute", DuelAttribute),
            values_check("duelos_partida", "defense_attribute", DuelAttribute),
        )
