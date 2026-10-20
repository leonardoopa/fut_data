from decimal import Decimal
from typing import Any

import pytest
from pydantic import BaseModel, ValidationError

from app.domain.attributes import PlayerAttributes
from app.domain.enums import Condition, Position
from app.domain.player_listing import PlayerSort
from app.dtos.player import PlayerListCriteria, PlayerProfile, PlayerRegistration
from app.requests.players import (
    PlayerConditionRequest,
    PlayerListQuery,
    PlayerProfileRequest,
    PlayerRegistrationRequest,
)

PROFILE_BODY: dict[str, Any] = {
    "name": "Meia Lua",
    "position": "MEI",
    "agility": 85,
    "age": 25,
}
REGISTRATION_BODY: dict[str, Any] = {
    **PROFILE_BODY,
    "pace": 70,
    "shooting": 68,
    "passing": 82,
    "dribbling": 79,
    "defending": 55,
    "physical": 64,
    "potential": 86,
}
MEIA_LUA_PROFILE = PlayerProfile(
    name="Meia Lua", position=Position.MEI, agility=85, age=25
)
MEIA_LUA_REGISTRATION = PlayerRegistration(
    MEIA_LUA_PROFILE, PlayerAttributes(70, 68, 82, 79, 55, 64), potential=86
)


def first_error(model: type[BaseModel], data: dict[str, Any]) -> dict[str, Any]:
    with pytest.raises(ValidationError) as caught:
        model.model_validate(data)
    return dict(caught.value.errors()[0])


def test_registration_request_becomes_the_domain_registration() -> None:
    request = PlayerRegistrationRequest.model_validate(
        {**REGISTRATION_BODY, "name": "  Meia   Lua "}
    )

    assert request.to_registration() == MEIA_LUA_REGISTRATION


def test_registration_request_ignores_fields_controlled_by_the_system() -> None:
    controlled = {
        "id": 9,
        "condition": "DOENTE",
        "club_id": 3,
        "base_value": 99,
        "market_value": 99,
        "overall": 1,
    }

    request = PlayerRegistrationRequest.model_validate(
        {**REGISTRATION_BODY, **controlled}
    )

    assert request.to_registration() == MEIA_LUA_REGISTRATION


@pytest.mark.parametrize(
    ("changes", "field", "error_type"),
    [
        ({"agility": 0}, "agility", "greater_than_equal"),
        ({"agility": 101}, "agility", "less_than_equal"),
        ({"age": 15}, "age", "greater_than_equal"),
        ({"age": 46}, "age", "less_than_equal"),
        ({"defending": 0}, "defending", "greater_than_equal"),
        ({"dribbling": 100}, "dribbling", "less_than_equal"),
        ({"potential": 0}, "potential", "greater_than_equal"),
        ({"potential": 100}, "potential", "less_than_equal"),
        ({"position": "mei"}, "position", "enum"),
        ({"pace": "70"}, "pace", "value_error"),
    ],
)
def test_registration_field_outside_its_limits_is_refused(
    changes: dict[str, Any], field: str, error_type: str
) -> None:
    error = first_error(PlayerRegistrationRequest, {**REGISTRATION_BODY, **changes})

    assert (error["loc"], error["type"]) == ((field,), error_type)


@pytest.mark.parametrize(
    ("changes", "reason"),
    [
        ({"age": 35, "agility": 86, "potential": 82}, "agilidade"),
        ({"pace": 99, "shooting": 99, "physical": 67, "potential": 99}, "soma"),
        ({"potential": 81}, "maior ou igual"),
        ({"age": 33}, "igual ao maior"),
    ],
)
def test_registration_rule_between_fields_is_refused(
    changes: dict[str, Any], reason: str
) -> None:
    error = first_error(PlayerRegistrationRequest, {**REGISTRATION_BODY, **changes})

    assert error["loc"] == ()
    assert reason in error["msg"]


def test_profile_request_ignores_the_fields_of_the_registration() -> None:
    request = PlayerProfileRequest.model_validate(
        {**REGISTRATION_BODY, "pace": 1, "potential": 1}
    )

    assert request.to_profile() == MEIA_LUA_PROFILE


def test_profile_request_caps_the_agility_but_never_checks_the_potential() -> None:
    capped = first_error(
        PlayerProfileRequest, {**PROFILE_BODY, "agility": 86, "age": 35}
    )
    request = PlayerProfileRequest.model_validate({**PROFILE_BODY, "age": 40})

    assert "agilidade" in capped["msg"]
    assert request.to_profile().age == 40


@pytest.mark.parametrize("field", list(PROFILE_BODY))
def test_profile_request_requires_the_four_fields(field: str) -> None:
    body = {name: value for name, value in PROFILE_BODY.items() if name != field}

    error = first_error(PlayerProfileRequest, body)

    assert (error["loc"], error["type"]) == ((field,), "missing")


def test_condition_request_reads_the_condition_and_ignores_other_fields() -> None:
    request = PlayerConditionRequest.model_validate(
        {"condition": "DOENTE", "name": "Outro"}
    )

    assert request.condition == Condition.DOENTE


@pytest.mark.parametrize(
    "body",
    [{}, {"condition": None}, {"condition": "doente"}, {"condition": "LESIONADO"}],
)
def test_condition_request_refuses_missing_null_or_unlisted_values(
    body: dict[str, Any],
) -> None:
    assert first_error(PlayerConditionRequest, body)["loc"] == ("condition",)


def test_list_query_without_params_uses_the_rn07_defaults() -> None:
    assert PlayerListQuery().to_criteria() == PlayerListCriteria()


def test_list_query_reads_every_param() -> None:
    query = PlayerListQuery.model_validate(
        {
            "search": "  Meia   Lua ",
            "position": "MEI",
            "condition": "MAL_CONDICIONADO",
            "free": "false",
            "club_id": "3",
            "min_age": "20",
            "max_age": "30",
            "min_value": "10.5",
            "max_value": "40",
            "sort": "position,value_desc",
            "page": "2",
            "limit": "50",
        }
    )

    assert query.to_criteria() == PlayerListCriteria(
        search="Meia Lua",
        position=Position.MEI,
        condition=Condition.MAL_CONDICIONADO,
        free=False,
        club_id=3,
        min_age=20,
        max_age=30,
        min_value=Decimal("10.5"),
        max_value=Decimal(40),
        sort=(PlayerSort.POSITION, PlayerSort.VALUE_DESC),
        page=2,
        limit=50,
    )


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"min_age": "30"}, PlayerListCriteria(min_age=30, max_age=45)),
        ({"max_age": "30"}, PlayerListCriteria(min_age=16, max_age=30)),
        (
            {"min_value": "20"},
            PlayerListCriteria(min_value=Decimal(20), max_value=Decimal(550)),
        ),
        (
            {"max_value": "20"},
            PlayerListCriteria(min_value=Decimal(0), max_value=Decimal(20)),
        ),
    ],
)
def test_list_query_range_with_one_bound_takes_the_other_extreme(
    params: dict[str, str], expected: PlayerListCriteria
) -> None:
    assert PlayerListQuery.model_validate(params).to_criteria() == expected


@pytest.mark.parametrize(
    ("params", "field"),
    [
        ({"position": ""}, "position"),
        ({"condition": "apto"}, "condition"),
        ({"sort": "value_asc,value_desc"}, "sort"),
        ({"sort": "name,value_asc,age_asc"}, "sort"),
        ({"limit": "51"}, "limit"),
        ({"page": "0"}, "page"),
        ({"min_value": "550.01"}, "min_value"),
        ({"max_age": "46"}, "max_age"),
        ({"club_id": "01"}, "club_id"),
    ],
)
def test_list_query_param_outside_the_accepted_values_is_refused(
    params: dict[str, str], field: str
) -> None:
    assert first_error(PlayerListQuery, params)["loc"] == (field,)


@pytest.mark.parametrize(
    "params",
    [
        {"min_age": "31", "max_age": "30"},
        {"min_value": "10.01", "max_value": "10"},
        {"free": "true", "club_id": "1"},
    ],
)
def test_list_query_contradictory_combination_is_refused(
    params: dict[str, str],
) -> None:
    assert first_error(PlayerListQuery, params)["loc"] == ()


def test_list_query_accepts_free_false_with_club_id() -> None:
    criteria = PlayerListQuery.model_validate(
        {"free": "false", "club_id": "1"}
    ).to_criteria()

    assert (criteria.free, criteria.club_id) == (False, 1)
