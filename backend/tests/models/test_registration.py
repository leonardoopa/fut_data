from decimal import Decimal

import pytest

from app.domain.attributes import PlayerAttributes
from app.domain.enums import Condition, Position
from app.dtos.club import ClubRegistration
from app.dtos.player import PlayerProfile, PlayerRegistration
from app.models import Club, Player

MEIA_LUA_REGISTRATION = PlayerRegistration(
    PlayerProfile(name="Meia Lua", position=Position.MEI, agility=85, age=25),
    PlayerAttributes(70, 68, 82, 79, 55, 64),
    potential=86,
)


def test_registered_player_gets_the_base_value_of_the_registration_data() -> None:
    player = Player.from_registration(MEIA_LUA_REGISTRATION)

    assert (player.base_value, player.condition, player.club_id) == (
        Decimal("40.00"),
        Condition.APTO,
        None,
    )


@pytest.mark.parametrize(
    ("name", "key"), [("Águias FC", "águias fc"), ("ÁGUIAS FC", "águias fc")]
)
def test_registered_club_keeps_the_name_key_for_uniqueness(name: str, key: str) -> None:
    club = Club.from_registration(ClubRegistration(name=name, acronym="AGU"))

    assert (club.name, club.name_key) == (name, key)
