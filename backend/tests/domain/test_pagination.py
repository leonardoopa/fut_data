import pytest

from app.domain.pagination import paginate


@pytest.mark.parametrize(
    ("total_items", "limit", "number", "expected_items", "total_pages"),
    [
        (23, 10, 1, list(range(1, 11)), 3),
        (23, 10, 3, [21, 22, 23], 3),
        (23, 10, 4, [], 3),
        (23, 50, 1, list(range(1, 24)), 1),
        (0, 10, 1, [], 0),
    ],
)
def test_pagination_follows_the_specification_table(
    total_items: int, limit: int, number: int, expected_items: list[int], total_pages: int
) -> None:
    page = paginate(range(1, total_items + 1), number, limit)

    assert list(page.items) == expected_items
    assert (page.number, page.limit) == (number, limit)
    assert (page.total_items, page.total_pages) == (total_items, total_pages)


@pytest.mark.parametrize(
    ("total_items", "limit", "total_pages"), [(20, 10, 2), (21, 10, 3), (50, 50, 1), (51, 50, 2)]
)
def test_total_pages_is_rounded_up(total_items: int, limit: int, total_pages: int) -> None:
    assert paginate(range(total_items), 1, limit).total_pages == total_pages
