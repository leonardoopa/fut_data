from collections.abc import Iterable

from app.dtos.player import PlayerListCriteria
from app.models import Player


class PlayerRepository:
    def get_active(self, player_id: int) -> Player | None:
        return Player.objects.active().filter(pk=player_id).first()

    def lock_active(self, player_id: int) -> Player | None:
        return Player.objects.active().select_for_update().filter(pk=player_id).first()

    def lock_active_many(self, player_ids: Iterable[int]) -> list[Player]:
        """Ascending id order avoids deadlocks."""
        return list(
            Player.objects.active().select_for_update().filter(pk__in=player_ids).order_by("id")
        )

    def save(self, player: Player) -> None:
        player.save()

    def count_in_club(self, club_id: int) -> int:
        return Player.objects.filter(club_id=club_id).count()

    def list_active(self, criteria: PlayerListCriteria) -> list[Player]:
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
