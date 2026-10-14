from decimal import Decimal
from typing import Annotated

from pydantic import PlainSerializer

Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
"""Valor em moedas como número JSON: o Pydantic serializaria um Decimal como texto."""
