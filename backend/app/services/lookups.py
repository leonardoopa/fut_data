"""Busca de jogadores e clubes pelos casos de uso: inexistente vira 404 (V8)."""

from app.domain.exceptions import NotFoundError
from app.models import Club, Player
from app.repositories.club_repository import ClubRepository

PLAYER_NOT_FOUND = "Jogador não encontrado."
CLUB_NOT_FOUND = "Clube não encontrado."


def ensure_player_found(player: Player | None) -> Player:
    """O jogador excluído conta como inexistente (RN09)."""
    if player is None:
        raise NotFoundError(PLAYER_NOT_FOUND)
    return player


def ensure_club_found(club: Club | None) -> Club:
    if club is None:
        raise NotFoundError(CLUB_NOT_FOUND)
    return club


def ensure_club_exists(clubs: ClubRepository, club_id: int) -> None:
    if not clubs.exists(club_id):
        raise NotFoundError(CLUB_NOT_FOUND)
