from enum import StrEnum
from typing import Any

from django.db import models
from django.db.backends.base.base import BaseDatabaseWrapper

MONEY_DECIMAL_PLACES = 2

BINARY_COLLATIONS = {"mysql": "utf8mb4_0900_bin", "sqlite": "BINARY"}


class FixedCharField(models.CharField):
    """Texto de tamanho fixo, gravado como CHAR(n)."""

    def db_type(self, connection: BaseDatabaseWrapper) -> str:
        return f"char({self.max_length})"


class BinaryCollationCharField(models.CharField):
    """Texto comparado byte a byte pelo banco: diferencia acentos, maiúsculas e minúsculas."""

    def db_parameters(self, connection: BaseDatabaseWrapper) -> dict[str, Any]:
        parameters = super().db_parameters(connection)
        parameters["collation"] = BINARY_COLLATIONS[connection.vendor]
        return parameters


def enum_field(
    enum_type: type[StrEnum], max_length: int, **options: Any
) -> models.CharField:
    choices = [(member.value, member.value) for member in enum_type]
    return models.CharField(max_length=max_length, choices=choices, **options)


def money_field(max_digits: int, **options: Any) -> models.DecimalField:
    return models.DecimalField(
        max_digits=max_digits, decimal_places=MONEY_DECIMAL_PLACES, **options
    )
