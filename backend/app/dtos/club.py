from dataclasses import dataclass

from app.domain.club_listing import ClubSort


@dataclass(frozen=True)
class ClubRegistration:
    name: str
    acronym: str


@dataclass(frozen=True)
class ClubListCriteria:
    sort: ClubSort = ClubSort.NAME
