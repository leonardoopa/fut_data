from collections.abc import Callable
from datetime import datetime

from django.utils import timezone

Clock = Callable[[], datetime]

system_clock: Clock = timezone.now


def get_clock() -> Clock:
    """Relógio dos casos de uso; os testes o trocam por um relógio fixo."""
    return system_clock
