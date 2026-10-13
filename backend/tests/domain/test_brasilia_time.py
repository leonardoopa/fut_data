from datetime import UTC, datetime

import pytest

from app.domain.brasilia_time import format_brasilia_datetime, parse_brasilia_datetime
from app.domain.exceptions import InvalidInputError


def test_parse_reads_brasilia_time_as_utc_minus_three() -> None:
    parsed = parse_brasilia_datetime("2027-03-02T10:15-03:00")

    assert parsed == datetime(2027, 3, 2, 13, 15, tzinfo=UTC)


@pytest.mark.parametrize(
    "raw",
    [
        "2027-03-02T10:15",
        "2027-03-02T10:15:00-03:00",
        "2027-03-02T10:15Z",
        "2027-03-02T10:15+00:00",
        "2027-03-02T10:15-0300",
        "2027-03-02 10:15-03:00",
        "2027-3-2T10:15-03:00",
        " 2027-03-02T10:15-03:00",
        "\uff12\uff10\uff12\uff17-03-02T10:15-03:00",
    ],
)
def test_parse_rejects_any_other_format(raw: str) -> None:
    with pytest.raises(InvalidInputError, match="formato"):
        parse_brasilia_datetime(raw)


@pytest.mark.parametrize(
    "raw",
    [
        "2027-02-30T10:15-03:00",
        "2027-03-02T24:00-03:00",
        "2027-13-01T10:15-03:00",
        "2027-03-02T10:60-03:00",
        "0000-03-02T10:15-03:00",
    ],
)
def test_parse_rejects_nonexistent_dates_without_adjusting(raw: str) -> None:
    with pytest.raises(InvalidInputError, match="existente"):
        parse_brasilia_datetime(raw)


def test_format_uses_brasilia_offset_and_drops_fractions_of_second() -> None:
    moment = datetime(2026, 11, 5, 19, 40, 30, 987654, tzinfo=UTC)

    assert format_brasilia_datetime(moment) == "2026-11-05T16:40:30-03:00"
