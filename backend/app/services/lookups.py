from collections.abc import Collection

from app.domain.exceptions import (
    ClubNotFoundError,
    MatchNotFoundError,
    PlayerNotFoundError,
)
from app.models import Club, Match, Player
from app.repositories.club_repository import ClubRepository


def ensure_player_found(player: Player | None) -> Player:
    if player is None:
        raise PlayerNotFoundError
    return player


def ensure_players_found(
    players: list[Player], player_ids: Collection[int]
) -> list[Player]:
    if len(players) < len(player_ids):
        raise PlayerNotFoundError
    return players


def ensure_club_found(club: Club | None) -> Club:
    if club is None:
        raise ClubNotFoundError
    return club


def ensure_club_exists(clubs: ClubRepository, club_id: int) -> None:
    if not clubs.exists(club_id):
        raise ClubNotFoundError


def ensure_match_found(match: Match | None) -> Match:
    if match is None:
        raise MatchNotFoundError
    return match
