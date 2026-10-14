from collections.abc import Iterable

from app.models import LineupSlot, Player


class LineupRepository:
    def remove_player(self, player_id: int) -> None:
        """Tira o titular da escalação; a formação do clube continua a mesma (RN19)."""
        LineupSlot.objects.filter(player_id=player_id).delete()

    def replace(self, club_id: int, players: Iterable[Player]) -> None:
        """Substitui a escalação inteira do clube pelos titulares informados."""
        LineupSlot.objects.filter(club_id=club_id).delete()
        LineupSlot.objects.bulk_create(
            LineupSlot(club_id=club_id, player=player) for player in players
        )

    def starters_of(self, club_id: int) -> list[Player]:
        return list(Player.objects.filter(lineup_slot__club_id=club_id))
