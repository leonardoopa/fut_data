from dataclasses import dataclass

from django.db import transaction

from app.domain.club import sort_squad
from app.domain.enums import Formation
from app.domain.lineup import ensure_lineup_allowed, is_lineup_complete
from app.dtos.lineup import LineupSelection
from app.models import Player
from app.repositories.club_repository import ClubRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.player_repository import PlayerRepository
from app.services.lookups import ensure_club_exists, ensure_club_found, ensure_players_found


@dataclass(frozen=True)
class Lineup:
    """Escalação do clube, com os titulares na ordem do elenco (RN11)."""

    club_id: int
    formation: Formation | None
    players: list[Player]

    @property
    def complete(self) -> bool:
        return is_lineup_complete(len(self.players))


class LineupService:
    """Escalação dos clubes (RN19).

    A substituição trava os jogadores e depois o clube, a mesma ordem da compra e da venda:
    as regras são conferidas e gravadas sobre o mesmo estado, e nada é gravado numa recusa.
    """

    def __init__(
        self, players: PlayerRepository, clubs: ClubRepository, lineups: LineupRepository
    ) -> None:
        self._players = players
        self._clubs = clubs
        self._lineups = lineups

    @transaction.atomic
    def replace(self, club_id: int, selection: LineupSelection) -> Lineup:
        """Substitui a escalação inteira e grava a formação numa única operação."""
        ensure_club_exists(self._clubs, club_id)
        starters = ensure_players_found(
            self._players.lock_active_many(selection.player_ids), selection.player_ids
        )
        club = ensure_club_found(self._clubs.lock(club_id))
        ensure_lineup_allowed(club.id, selection.formation, starters)
        self._lineups.replace(club.id, starters)
        club.formation = selection.formation
        self._clubs.save(club)
        return Lineup(club_id=club.id, formation=selection.formation, players=sort_squad(starters))

    def get(self, club_id: int) -> Lineup:
        """Sem escalação, a formação é nula; incompleta, mantém a formação salva."""
        club = ensure_club_found(self._clubs.get(club_id))
        starters = self._lineups.starters_of(club.id)
        return Lineup(club_id=club.id, formation=club.formation, players=sort_squad(starters))
