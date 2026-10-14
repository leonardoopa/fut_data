import math
from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class Page[T]:
    """Itens de uma página e a contagem de todos os itens que atendem à consulta."""

    items: tuple[T, ...]
    number: int
    limit: int
    total_items: int

    @property
    def total_pages(self) -> int:
        """total_items ÷ limit, arredondado para cima; 0 quando não há itens (RN07)."""
        return math.ceil(self.total_items / self.limit)


def paginate[T](items: Sequence[T], number: int, limit: int) -> Page[T]:
    """Recorta a página `number` (a partir de 1); além da última, a página vem vazia."""
    start = (number - 1) * limit
    return Page(
        items=tuple(items[start : start + limit]),
        number=number,
        limit=limit,
        total_items=len(items),
    )
