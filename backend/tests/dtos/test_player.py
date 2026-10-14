from decimal import Decimal

from app.domain.player_listing import PlayerSort
from app.dtos.player import PlayerListCriteria


def test_defaults_follow_rn07_and_ranges_go_to_their_extremes() -> None:
    criteria = PlayerListCriteria()

    assert (criteria.sort, criteria.page, criteria.limit) == ((PlayerSort.NAME,), 1, 10)
    assert (criteria.min_age, criteria.max_age) == (16, 45)
    assert (criteria.min_value, criteria.max_value) == (Decimal(0), Decimal(550))
