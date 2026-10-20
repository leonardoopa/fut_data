from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

from app.domain.brasilia_time import format_brasilia_datetime

Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
"""Money as a JSON number: Pydantic would serialize a Decimal as text."""

BrasiliaTimestamp = Annotated[
    datetime,
    PlainSerializer(format_brasilia_datetime, return_type=str, when_used="json"),
]
"""Response timestamp in the RN01 format: YYYY-MM-DDTHH:MM:SS-03:00."""
