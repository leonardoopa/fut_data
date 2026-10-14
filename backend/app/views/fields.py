from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

from app.domain.brasilia_time import format_brasilia_datetime

Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
"""Valor em moedas como número JSON: o Pydantic serializaria um Decimal como texto."""

BrasiliaTimestamp = Annotated[
    datetime, PlainSerializer(format_brasilia_datetime, return_type=str, when_used="json")
]
"""Data e hora das respostas no formato da RN01: AAAA-MM-DDTHH:MM:SS-03:00."""
