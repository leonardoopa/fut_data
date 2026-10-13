from collections.abc import Iterable
from enum import StrEnum

from django.db.models import CheckConstraint, Q


def range_check(table: str, field: str, minimum: int, maximum: int) -> CheckConstraint:
    return CheckConstraint(
        condition=Q(**{f"{field}__range": (minimum, maximum)}),
        name=f"ck_{table}_{field}_range",
    )


def values_check(table: str, field: str, values: Iterable[StrEnum]) -> CheckConstraint:
    return CheckConstraint(
        condition=Q(**{f"{field}__in": [value.value for value in values]}),
        name=f"ck_{table}_{field}_values",
    )
