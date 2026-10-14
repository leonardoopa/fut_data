from django.db import models

from app.models.club import Club
from app.models.player import Player


class LineupSlot(models.Model):
    pk = models.CompositePrimaryKey("club_id", "player_id")
    club = models.ForeignKey(
        Club,
        on_delete=models.PROTECT,
        related_name="lineup_slots",
        db_column="clube_id",
    )
    player = models.OneToOneField(
        Player,
        on_delete=models.PROTECT,
        related_name="lineup_slot",
        db_column="jogador_id",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_column="criado_em")

    class Meta:
        db_table = "escalacoes"
