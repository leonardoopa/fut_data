from dataclasses import dataclass

from app.domain.enums import Formation


@dataclass(frozen=True)
class LineupSelection:
    """Formação e os 5 titulares, em qualquer ordem (RN19)."""

    formation: Formation
    player_ids: tuple[int, ...]
