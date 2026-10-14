from dataclasses import dataclass
from decimal import Decimal

from app.domain.attributes import PlayerAttributes
from app.domain.enums import Condition, Position
from app.domain.player import AGE_MAX, AGE_MIN
from app.domain.player_listing import (
    DEFAULT_LIMIT,
    DEFAULT_PAGE,
    DEFAULT_SORT,
    VALUE_FILTER_MAX,
    VALUE_FILTER_MIN,
    PlayerSort,
)


@dataclass(frozen=True)
class PlayerProfile:
    """Nome, posição, agilidade e idade: o que o cadastro informa e o PUT pode mudar (RN08)."""

    name: str
    position: Position
    agility: int
    age: int


@dataclass(frozen=True)
class PlayerRegistration:
    """Dados do cadastro; os atributos e o potencial não mudam depois (RN06)."""

    profile: PlayerProfile
    attributes: PlayerAttributes
    potential: int


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
