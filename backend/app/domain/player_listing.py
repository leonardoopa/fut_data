"""Busca, filtros, ordenação e valores padrão da listagem de jogadores (RN07)."""

from collections.abc import Callable, Iterable, Sequence
from decimal import Decimal
from enum import StrEnum
from typing import Protocol

from app.domain.enums import Position
from app.domain.exceptions import (
    AgeRangeInvertedError,
    FreeWithClubFilterError,
    ValueRangeInvertedError,
)
from app.domain.text import alphabetical_key, matches_search

VALUE_FILTER_MIN = Decimal(0)
VALUE_FILTER_MAX = Decimal(550)

DEFAULT_PAGE = 1
DEFAULT_LIMIT = 10
MAX_LIMIT = 50
MAX_SORT_CRITERIA = 2

POSITION_ORDER = (Position.GOL, Position.ZAG, Position.LAT, Position.MEI, Position.ATA)
POSITION_RANK = {position: rank for rank, position in enumerate(POSITION_ORDER)}


class ListedPlayer(Protocol):
    """O que a listagem lê de cada jogador."""

    @property
    def id(self) -> int: ...

    @property
    def name(self) -> str: ...

    @property
    def age(self) -> int: ...

    @property
    def position(self) -> str: ...

    @property
    def market_value(self) -> Decimal: ...


SortValue = str | int | Decimal
SORT_DIRECTION_SUFFIXES = ("_asc", "_desc")


class PlayerSort(StrEnum):
    NAME = "name"
    VALUE_ASC = "value_asc"
    VALUE_DESC = "value_desc"
    AGE_ASC = "age_asc"
    AGE_DESC = "age_desc"
    POSITION = "position"

    @property
    def field(self) -> str:
        """Campo ordenado: os dois sentidos de um campo não se combinam (value_asc,value_desc)."""
        field = self.value
        for suffix in SORT_DIRECTION_SUFFIXES:
            field = field.removesuffix(suffix)
        return field


def name_key(player: ListedPlayer) -> str:
    return alphabetical_key(player.name)


SORT_KEYS: dict[PlayerSort, Callable[[ListedPlayer], SortValue]] = {
    PlayerSort.NAME: name_key,
    PlayerSort.VALUE_ASC: lambda player: player.market_value,
    PlayerSort.VALUE_DESC: lambda player: -player.market_value,
    PlayerSort.AGE_ASC: lambda player: player.age,
    PlayerSort.AGE_DESC: lambda player: -player.age,
    PlayerSort.POSITION: lambda player: POSITION_RANK[Position(player.position)],
}

DEFAULT_SORT = (PlayerSort.NAME,)


def validate_age_range(min_age: int, max_age: int) -> None:
    if min_age > max_age:
        raise AgeRangeInvertedError


def validate_value_range(min_value: Decimal, max_value: Decimal) -> None:
    if min_value > max_value:
        raise ValueRangeInvertedError


def validate_club_filter(free: bool | None, club_id: int | None) -> None:
    """Jogador livre não tem clube: free=true com club_id é contraditório."""
    if free and club_id is not None:
        raise FreeWithClubFilterError


def filter_by_search_and_value[P: ListedPlayer](
    players: Iterable[P], *, search: str | None, min_value: Decimal, max_value: Decimal
) -> list[P]:
    """Filtros que não viram consulta ao banco.

    O valor de mercado é calculado a cada consulta e não é coluna, e a busca ignora
    acentos pela decomposição NFD do enunciado, que as collations do banco não reproduzem.
    """
    return [
        player
        for player in players
        if min_value <= player.market_value <= max_value
        and (search is None or matches_search(player.name, search))
    ]


def sort_players[P: ListedPlayer](players: Iterable[P], criteria: Sequence[PlayerSort]) -> list[P]:
    """Ordena pelos critérios pedidos; o empate é desfeito pelo nome e depois pelo id."""
    keys = [SORT_KEYS[criterion] for criterion in criteria]
    return sorted(
        players,
        key=lambda player: (*(key(player) for key in keys), name_key(player), player.id),
    )
