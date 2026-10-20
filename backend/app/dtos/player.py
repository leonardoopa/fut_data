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
    name: str
    position: Position
    agility: int
    age: int


@dataclass(frozen=True)
class PlayerRegistration:
    profile: PlayerProfile
    attributes: PlayerAttributes
    potential: int


@dataclass(frozen=True)
class PlayerListCriteria:
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
