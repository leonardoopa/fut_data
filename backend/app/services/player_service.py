from django.db import transaction

from app.core.clock import Clock
from app.domain.enums import Condition
from app.domain.pagination import Page, paginate
from app.domain.player import (
    PlayerProfile,
    PlayerRegistration,
    ensure_condition_change_allowed,
    ensure_deletable,
    ensure_profile_change_allowed,
    leaves_lineup,
)
from app.domain.player_listing import (
    PlayerListCriteria,
    filter_by_search_and_value,
    sort_players,
)
from app.models import Player
from app.repositories.club_repository import ClubRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.player_repository import PlayerRepository
from app.services.lookups import ensure_club_exists, ensure_player_found


class PlayerService:
    """Casos de uso de jogadores.

    As alterações travam a linha do jogador até o fim da transação, para que a conferência
    das regras e a gravação vejam o mesmo estado.
    """

    def __init__(
        self,
        players: PlayerRepository,
        clubs: ClubRepository,
        lineups: LineupRepository,
        clock: Clock,
    ) -> None:
        self._players = players
        self._clubs = clubs
        self._lineups = lineups
        self._clock = clock

    def register(self, registration: PlayerRegistration) -> Player:
        player = Player.from_registration(registration)
        self._players.save(player)
        return player

    def get(self, player_id: int) -> Player:
        return ensure_player_found(self._players.get_active(player_id))

    @transaction.atomic
    def update(self, player_id: int, profile: PlayerProfile) -> Player:
        player = ensure_player_found(self._players.lock_active(player_id))
        ensure_profile_change_allowed(player.profile, profile, has_club=player.has_club)
        player.change_profile(profile)
        self._players.save(player)
        return player

    @transaction.atomic
    def change_condition(self, player_id: int, condition: Condition) -> Player:
        """Enviar a condição atual é aceito, sem mudança; o titular DOENTE sai da escalação."""
        player = ensure_player_found(self._players.lock_active(player_id))
        current = Condition(player.condition)
        if condition == current:
            return player
        ensure_condition_change_allowed(current, condition)
        player.condition = condition
        self._players.save(player)
        if leaves_lineup(condition):
            self._lineups.remove_player(player.id)
        return player

    @transaction.atomic
    def delete(self, player_id: int) -> None:
        """Exclusão lógica: grava o momento em excluido_em e não apaga nada (RN09)."""
        player = ensure_player_found(self._players.lock_active(player_id))
        ensure_deletable(has_club=player.has_club)
        player.deleted_at = self._clock()
        self._players.save(player)

    def list_players(self, criteria: PlayerListCriteria) -> Page[Player]:
        """A paginação vem depois da busca, dos filtros e da ordenação (RN07)."""
        if criteria.club_id is not None:
            ensure_club_exists(self._clubs, criteria.club_id)
        candidates = self._players.list_active(criteria)
        selected = filter_by_search_and_value(candidates, criteria)
        return paginate(sort_players(selected, criteria.sort), criteria.page, criteria.limit)
