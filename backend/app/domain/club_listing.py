"""Ordenação da listagem de clubes (RN11)."""

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import Protocol

from app.domain.text import alphabetical_key


class ListedClub(Protocol):
    """O que a listagem lê de cada clube."""

    @property
    def id(self) -> int: ...

    @property
    def name(self) -> str: ...

    @property
    def net_worth(self) -> Decimal: ...


class ClubSort(StrEnum):
    NAME = "name"
    NET_WORTH_ASC = "net_worth_asc"
    NET_WORTH_DESC = "net_worth_desc"


SORT_KEYS: dict[ClubSort, Callable[[ListedClub], tuple[Decimal, ...]]] = {
    ClubSort.NAME: lambda _: (),
    ClubSort.NET_WORTH_ASC: lambda club: (club.net_worth,),
    ClubSort.NET_WORTH_DESC: lambda club: (-club.net_worth,),
}


@dataclass(frozen=True)
class ClubListCriteria:
    sort: ClubSort = ClubSort.NAME


def sort_clubs[C: ListedClub](clubs: Iterable[C], sort: ClubSort) -> list[C]:
    """Ordena pelo critério pedido; o empate é desfeito pelo nome e depois pelo id."""
    key = SORT_KEYS[sort]
    return sorted(clubs, key=lambda club: (*key(club), alphabetical_key(club.name), club.id))
