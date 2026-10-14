"""Busca, filtros, ordenação e valores padrão da listagem de jogadores (RN07)."""

from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import Protocol

from app.domain.enums import Condition, Position
from app.domain.exceptions import InvalidInputError
from app.domain.player import AGE_MAX, AGE_MIN
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


@dataclass(frozen=True)
class SortCriterion:
    """Campo ordenado e chave de ordenação; num critério decrescente, a chave vem negada."""

    field: str
    key: Callable[[ListedPlayer], SortValue]


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
        return SORT_CRITERIA[self].field


def name_key(player: ListedPlayer) -> str:
    return alphabetical_key(player.name)


SORT_CRITERIA: dict[PlayerSort, SortCriterion] = {
    PlayerSort.NAME: SortCriterion("name", name_key),
    PlayerSort.VALUE_ASC: SortCriterion("value", lambda player: player.market_value),
    PlayerSort.VALUE_DESC: SortCriterion("value", lambda player: -player.market_value),
    PlayerSort.AGE_ASC: SortCriterion("age", lambda player: player.age),
    PlayerSort.AGE_DESC: SortCriterion("age", lambda player: -player.age),
    PlayerSort.POSITION: SortCriterion(
        "position", lambda player: POSITION_RANK[Position(player.position)]
    ),
}

DEFAULT_SORT = (PlayerSort.NAME,)


@dataclass(frozen=True)
class PlayerListCriteria:
    """Consulta de GET /players com os valores padrão da RN07.

    Numa faixa de idade ou de valor que vem com só um dos limites, o outro assume o
    extremo da faixa.
    """

    search: str | None = None
    position: Position | None = None
    condition: Condition | None = None
    free: bool | None = None
    club_id: int | None = None
    min_age: int = AGE_MIN
    max_age: int = AGE_MAX
    min_value: Decimal = VALUE_FILTER_MIN
    max_value: Decimal = VALUE_FILTER_MAX
    sort: tuple[PlayerSort, ...] = DEFAULT_SORT
    page: int = DEFAULT_PAGE
    limit: int = DEFAULT_LIMIT


def validate_criteria(criteria: PlayerListCriteria) -> None:
    """Recusa as combinações contraditórias de filtros."""
    if criteria.min_age > criteria.max_age:
        raise InvalidInputError(
            "A idade mínima (min_age) não pode ser maior que a máxima (max_age)."
        )
    if criteria.min_value > criteria.max_value:
        raise InvalidInputError(
            "O valor mínimo (min_value) não pode ser maior que o máximo (max_value)."
        )
    if criteria.free and criteria.club_id is not None:
        raise InvalidInputError(
            "free=true não pode ser combinado com club_id: jogador livre não tem clube."
        )


def filter_by_search_and_value[P: ListedPlayer](
    players: Iterable[P], criteria: PlayerListCriteria
) -> list[P]:
    """Filtros que não viram consulta ao banco.

    O valor de mercado é calculado a cada consulta e não é coluna, e a busca ignora
    acentos pela decomposição NFD do enunciado, que as collations do banco não reproduzem.
    """
    return [
        player
        for player in players
        if criteria.min_value <= player.market_value <= criteria.max_value
        and (criteria.search is None or matches_search(player.name, criteria.search))
    ]


def sort_players[P: ListedPlayer](players: Iterable[P], criteria: Sequence[PlayerSort]) -> list[P]:
    """Ordena pelos critérios pedidos; o empate é desfeito pelo nome e depois pelo id."""
    keys = [SORT_CRITERIA[criterion].key for criterion in criteria]
    return sorted(
        players,
        key=lambda player: (*(key(player) for key in keys), name_key(player), player.id),
    )
