from app.dtos.player import PlayerListCriteria
from app.models import Player


class PlayerRepository:
    def get_active(self, player_id: int) -> Player | None:
        return Player.objects.active().filter(pk=player_id).first()

    def lock_active(self, player_id: int) -> Player | None:
        """Como get_active, mas trava a linha até o fim da transação (SELECT ... FOR UPDATE)."""
        return Player.objects.active().select_for_update().filter(pk=player_id).first()

    def save(self, player: Player) -> None:
        player.save()

    def count_in_club(self, club_id: int) -> int:
        return Player.objects.filter(club_id=club_id).count()

    def list_active(self, criteria: PlayerListCriteria) -> list[Player]:
        """Aplica no banco só os filtros que são colunas; a busca e o valor ficam de fora."""
        column_filters = {
            "position": criteria.position,
            "condition": criteria.condition,
            "club__isnull": criteria.free,
            "club_id": criteria.club_id,
        }
        return list(
            Player.objects.active().filter(
                age__range=(criteria.min_age, criteria.max_age),
                **{lookup: value for lookup, value in column_filters.items() if value is not None},
            )
        )
