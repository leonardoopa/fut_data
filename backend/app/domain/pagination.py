import math
from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class Page[T]:
    items: tuple[T, ...]
    number: int
    limit: int
    total_items: int

    @property
    def total_pages(self) -> int:
        return math.ceil(self.total_items / self.limit)


def paginate[T](items: Sequence[T], number: int, limit: int) -> Page[T]:
    start = (number - 1) * limit
    return Page(
        items=tuple(items[start : start + limit]),
        number=number,
        limit=limit,
        total_items=len(items),
    )
