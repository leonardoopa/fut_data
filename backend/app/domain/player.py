import string

from app.domain.attributes import PlayerAttributes
from app.domain.enums import Condition, Position
from app.domain.exceptions import (
    AgeDecreaseError,
    AgilityAboveCapError,
    AttributesTotalTooHighError,
    InvalidInputError,
    PlayerInClubDeletionError,
    PositionLockedError,
    PotentialBelowHighestAttributeError,
    PotentialNotAtPeakError,
    SickToFitError,
)
from app.domain.text import count_words

NAME_MIN_LENGTH = 3
NAME_MAX_LENGTH = 100
NAME_MIN_WORDS = 2

AGE_MIN = 16
AGE_MAX = 45

AGILITY_MIN = 1
AGILITY_MAX = 100
AGILITY_CAP_AGE = 35
AGILITY_CAP = 85

ATTRIBUTE_MIN = 1
ATTRIBUTE_MAX = 99
ATTRIBUTES_TOTAL_MAX = 480

POTENTIAL_MIN = 1
POTENTIAL_MAX = 99
POTENTIAL_PEAK_AGE = 33

INITIAL_CONDITION = Condition.APTO


def validate_name(name: str) -> str:
    """Nome do jogador já normalizado pela V4: tamanho, palavras e dígitos."""
    if not NAME_MIN_LENGTH <= len(name) <= NAME_MAX_LENGTH:
        raise InvalidInputError(f"deve ter de {NAME_MIN_LENGTH} a {NAME_MAX_LENGTH} caracteres.")
    if count_words(name) < NAME_MIN_WORDS:
        raise InvalidInputError(f"deve ter pelo menos {NAME_MIN_WORDS} palavras.")
    if any(character in string.digits for character in name):
        raise InvalidInputError("não pode conter dígitos.")
    return name


def validate_agility(agility: int, age: int) -> None:
    if age >= AGILITY_CAP_AGE and agility > AGILITY_CAP:
        raise AgilityAboveCapError(AGILITY_CAP_AGE, AGILITY_CAP)


def validate_attributes(attributes: PlayerAttributes) -> None:
    if attributes.total() > ATTRIBUTES_TOTAL_MAX:
        raise AttributesTotalTooHighError(ATTRIBUTES_TOTAL_MAX)


def validate_potential(
    potential: int, attributes: PlayerAttributes, *, registration_age: int
) -> None:
    """Só vale no cadastro: um PUT que leve a idade a 33 anos ou mais não muda o potencial."""
    highest = attributes.highest()
    if potential < highest:
        raise PotentialBelowHighestAttributeError(highest)
    if registration_age >= POTENTIAL_PEAK_AGE and potential != highest:
        raise PotentialNotAtPeakError(POTENTIAL_PEAK_AGE, highest)


def ensure_profile_change_allowed(
    *,
    current_position: Position,
    new_position: Position,
    current_age: int,
    new_age: int,
    has_club: bool,
) -> None:
    """Regras do PUT que dependem do estado atual do jogador (RN08)."""
    if has_club and new_position != current_position:
        raise PositionLockedError
    if new_age < current_age:
        raise AgeDecreaseError(current_age)


def ensure_condition_change_allowed(current: Condition, new: Condition) -> None:
    if current == Condition.DOENTE and new == Condition.APTO:
        raise SickToFitError


def leaves_lineup(condition: Condition) -> bool:
    """O titular que passa a DOENTE sai da escalação na mesma operação (RN19)."""
    return condition == Condition.DOENTE


def ensure_deletable(*, has_club: bool) -> None:
    """Só jogador livre pode ser excluído (RN09)."""
    if has_club:
        raise PlayerInClubDeletionError
