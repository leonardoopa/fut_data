from typing import Any, Self

from pydantic import BaseModel

from app.domain.pagination import Page


class PageMeta(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int

    @classmethod
    def from_page(cls, page: Page[Any]) -> Self:
        return cls(
            page=page.number,
            limit=page.limit,
            total_items=page.total_items,
            total_pages=page.total_pages,
        )
