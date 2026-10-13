from enum import StrEnum

from sqlalchemy import DateTime, Enum, MetaData, Numeric
from sqlalchemy.dialects import mysql
from sqlalchemy.orm import DeclarativeBase

NAMING_CONVENTION = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

UtcDateTime = DateTime().with_variant(mysql.DATETIME(fsp=6), "mysql")


def money(precision: int) -> Numeric:
    return Numeric(precision, 2)


def enum_column[E: StrEnum](enum_type: type[E], length: int, name: str) -> Enum:
    return Enum(
        enum_type,
        name=name,
        native_enum=False,
        length=length,
        create_constraint=True,
        validate_strings=True,
        values_callable=lambda members: [member.value for member in members],
    )


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
