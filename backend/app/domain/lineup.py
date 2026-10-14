"""Escalação: formações, titulares aceitos e escalação completa (RN19)."""

from collections import Counter
from collections.abc import Sequence
from enum import StrEnum
from typing import Protocol

from app.domain.enums import Condition, Formation, Position
from app.domain.exceptions import (
    FormationMismatchError,
    IncompleteLineupError,
    RepeatedStartersError,
    SickStarterError,
    StarterNotInSquadError,
)
from app.domain.player import leaves_lineup

LINEUP_SIZE = 5


class Sector(StrEnum):
    GOAL = "GOAL"
    DEFENSE = "DEFENSE"
    MIDFIELD = "MIDFIELD"
    ATTACK = "ATTACK"


SECTOR_OF_POSITION: dict[Position, Sector] = {
    Position.GOL: Sector.GOAL,
    Position.ZAG: Sector.DEFENSE,
    Position.LAT: Sector.DEFENSE,
    Position.MEI: Sector.MIDFIELD,
    Position.ATA: Sector.ATTACK,
}


def formation_sectors(defense: int, midfield: int, attack: int) -> Counter[Sector]:
    """Titulares por setor: sempre 1 goleiro e os 4 de linha da formação."""
    return Counter(
        {Sector.GOAL: 1, Sector.DEFENSE: defense, Sector.MIDFIELD: midfield, Sector.ATTACK: attack}
    )


FORMATION_SECTORS: dict[Formation, Counter[Sector]] = {
    Formation.THREE_ONE: formation_sectors(defense=3, midfield=0, attack=1),
    Formation.TWO_TWO: formation_sectors(defense=2, midfield=0, attack=2),
    Formation.TWO_ONE_ONE: formation_sectors(defense=2, midfield=1, attack=1),
    Formation.ONE_TWO_ONE: formation_sectors(defense=1, midfield=2, attack=1),
}


class Starter(Protocol):
    """O que a escalação lê de cada titular."""

    @property
    def club_id(self) -> int | None: ...

    @property
    def position(self) -> str: ...

    @property
    def condition(self) -> str: ...


def ensure_distinct_starters(player_ids: Sequence[int]) -> None:
    if len(set(player_ids)) < len(player_ids):
        raise RepeatedStartersError


def ensure_lineup_allowed(club_id: int, formation: Formation, starters: Sequence[Starter]) -> None:
    """Titulares do elenco, nenhum DOENTE, e as posições fecham a formação."""
    if any(starter.club_id != club_id for starter in starters):
        raise StarterNotInSquadError
    if any(leaves_lineup(Condition(starter.condition)) for starter in starters):
        raise SickStarterError
    sectors = Counter(SECTOR_OF_POSITION[Position(starter.position)] for starter in starters)
    if sectors != FORMATION_SECTORS[formation]:
        raise FormationMismatchError(formation)


def is_lineup_complete(starter_count: int) -> bool:
    """O titular vendido ou DOENTE sai da escalação, que fica incompleta até escalar de novo."""
    return starter_count == LINEUP_SIZE


def ensure_lineup_complete(club_name: str, starter_count: int) -> None:
    if not is_lineup_complete(starter_count):
        raise IncompleteLineupError(club_name, LINEUP_SIZE)
