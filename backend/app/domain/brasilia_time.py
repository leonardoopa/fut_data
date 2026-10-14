import re
from datetime import datetime, timedelta, timezone

from app.domain.exceptions import InvalidInputError

BRASILIA = timezone(timedelta(hours=-3))
INPUT_FORMAT = "AAAA-MM-DDTHH:MM-03:00"
INPUT_PATTERN = re.compile(r"([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})-03:00")


def parse_brasilia_datetime(text: str) -> datetime:
    """Lê uma data e hora de Brasília no formato da RN01, sem ajustar valores inexistentes."""
    match = INPUT_PATTERN.fullmatch(text)
    if match is None:
        raise InvalidInputError(f"deve estar no formato {INPUT_FORMAT}.")
    year, month, day, hour, minute = (int(group) for group in match.groups())
    try:
        return datetime(year, month, day, hour, minute, tzinfo=BRASILIA)
    except ValueError as error:
        raise InvalidInputError("não é uma data e hora existente.") from error


def format_brasilia_datetime(moment: datetime) -> str:
    """Formato das respostas: AAAA-MM-DDTHH:MM:SS-03:00 (RN01)."""
    return moment.astimezone(BRASILIA).isoformat(timespec="seconds")
