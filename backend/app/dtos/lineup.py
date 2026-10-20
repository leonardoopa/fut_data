from dataclasses import dataclass

from app.domain.enums import Formation


@dataclass(frozen=True)
class LineupSelection:
    formation: Formation
    player_ids: tuple[int, ...]
