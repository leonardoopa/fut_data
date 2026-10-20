from dataclasses import dataclass


@dataclass(frozen=True)
class MatchFixture:
    home_club_id: int
    away_club_id: int


@dataclass(frozen=True)
class MatchListCriteria:
    club_id: int | None = None
