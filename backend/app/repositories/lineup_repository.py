from app.models import LineupSlot


class LineupRepository:
    def remove_player(self, player_id: int) -> None:
        """Tira o titular da escalação; a formação do clube continua a mesma (RN19)."""
        LineupSlot.objects.filter(player_id=player_id).delete()
