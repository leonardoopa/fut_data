from collections.abc import Callable
from datetime import datetime

from django.utils import timezone

Clock = Callable[[], datetime]

system_clock: Clock = timezone.now
