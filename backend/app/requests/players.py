from typing import Annotated, Self

from pydantic import BaseModel, Field, WithJsonSchema, model_validator

from app.domain.attributes import PlayerAttributes
from app.domain.enums import Condition, Position
from app.domain.player import (
    AGE_MAX,
    AGE_MIN,
    AGILITY_MAX,
    AGILITY_MIN,
    ATTRIBUTE_MAX,
    ATTRIBUTE_MIN,
    POTENTIAL_MAX,
    POTENTIAL_MIN,
    validate_agility,
    validate_attributes,
    validate_potential,
)
from app.domain.player_listing import (
    MAX_LIMIT,
    MAX_SORT_CRITERIA,
    VALUE_FILTER_MAX,
    VALUE_FILTER_MIN,
    PlayerSort,
    validate_age_range,
    validate_club_filter,
    validate_value_range,
)
from app.dtos.player import PlayerListCriteria, PlayerProfile, PlayerRegistration
from app.requests.fields import PlayerName, StrictInteger
from app.requests.query import (
    QueryBoolean,
    QueryDecimal,
    QueryPositiveInteger,
    QuerySearch,
    choice_list,
)

Agility = Annotated[StrictInteger, Field(ge=AGILITY_MIN, le=AGILITY_MAX)]
Age = Annotated[StrictInteger, Field(ge=AGE_MIN, le=AGE_MAX)]
Attribute = Annotated[StrictInteger, Field(ge=ATTRIBUTE_MIN, le=ATTRIBUTE_MAX)]
Potential = Annotated[StrictInteger, Field(ge=POTENTIAL_MIN, le=POTENTIAL_MAX)]

QueryAge = Annotated[QueryPositiveInteger, Field(ge=AGE_MIN, le=AGE_MAX)]
QueryMarketValue = Annotated[
    QueryDecimal,
    Field(ge=VALUE_FILTER_MIN, le=VALUE_FILTER_MAX),
    WithJsonSchema(
        {"type": "number", "minimum": int(VALUE_FILTER_MIN), "maximum": int(VALUE_FILTER_MAX)}
    ),
]
QueryLimit = Annotated[QueryPositiveInteger, Field(le=MAX_LIMIT)]
QueryPlayerSort = Annotated[
    tuple[PlayerSort, ...] | None,
    choice_list(PlayerSort, max_items=MAX_SORT_CRITERIA, group_of=lambda sort: sort.field),
]


class PlayerProfileRequest(BaseModel):
    """Body of PUT /players/{id}: all four fields are required (RN08)."""

    name: PlayerName
    position: Position
    agility: Agility
    age: Age

    @model_validator(mode="after")
    def check_agility_for_age(self) -> Self:
        validate_agility(self.agility, self.age)
        return self

    def to_profile(self) -> PlayerProfile:
        return PlayerProfile(
            name=self.name, position=self.position, agility=self.agility, age=self.age
        )


class PlayerRegistrationRequest(PlayerProfileRequest):
    """Body of POST /players: the profile fields, six attributes and the potential (RN06)."""

    pace: Attribute
    shooting: Attribute
    passing: Attribute
    dribbling: Attribute
    defending: Attribute
    physical: Attribute
    potential: Potential

    @model_validator(mode="after")
    def check_attributes_and_potential(self) -> Self:
        validate_attributes(self.attributes)
        validate_potential(self.potential, self.attributes, registration_age=self.age)
        return self

    @property
    def attributes(self) -> PlayerAttributes:
        return PlayerAttributes(
            pace=self.pace,
            shooting=self.shooting,
            passing=self.passing,
            dribbling=self.dribbling,
            defending=self.defending,
            physical=self.physical,
        )

    def to_registration(self) -> PlayerRegistration:
        return PlayerRegistration(
            profile=self.to_profile(), attributes=self.attributes, potential=self.potential
        )


class PlayerConditionRequest(BaseModel):
    """Body of PATCH /players/{id}/condition."""

    condition: Condition


class PlayerListQuery(BaseModel):
    """Query params of GET /players; absent ones take the PlayerListCriteria defaults."""

    search: QuerySearch = None
    position: Position | None = None
    condition: Condition | None = None
    free: QueryBoolean = None
    club_id: QueryPositiveInteger = None
    min_age: QueryAge = None
    max_age: QueryAge = None
    min_value: QueryMarketValue = None
    max_value: QueryMarketValue = None
    sort: QueryPlayerSort = None
    page: QueryPositiveInteger = None
    limit: QueryLimit = None

    @model_validator(mode="after")
    def reject_contradictory_filters(self) -> Self:
        criteria = self.to_criteria()
        validate_age_range(criteria.min_age, criteria.max_age)
        validate_value_range(criteria.min_value, criteria.max_value)
        validate_club_filter(criteria.free, criteria.club_id)
        return self

    def to_criteria(self) -> PlayerListCriteria:
        return PlayerListCriteria(**self.model_dump(exclude_none=True))
