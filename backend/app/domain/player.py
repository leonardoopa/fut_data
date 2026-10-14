import string
from dataclasses import dataclass
from decimal import Decimal

from app.domain.attributes import PlayerAttributes, calculate_overall
from app.domain.enums import Condition, Position
from app.domain.exceptions import BusinessRuleError, InvalidInputError
from app.domain.text import count_words
from app.domain.valuation import calculate_base_value

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


@dataclass(frozen=True)
class PlayerProfile:
    """Nome, posição, agilidade e idade: o que o cadastro informa e o PUT pode mudar (RN08)."""

    name: str
    position: Position
    agility: int
    age: int


@dataclass(frozen=True)
class PlayerRegistration:
    """Dados do cadastro; os atributos e o potencial não mudam depois (RN06)."""

    profile: PlayerProfile
    attributes: PlayerAttributes
    potential: int

    @property
    def base_value(self) -> Decimal:
        """Calculado uma única vez, com a posição, os atributos e a idade do cadastro (RN06)."""
        overall = calculate_overall(self.profile.position, self.attributes)
        return calculate_base_value(overall, self.potential, registration_age=self.profile.age)


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
        raise InvalidInputError(
            f"Com {AGILITY_CAP_AGE} anos ou mais, a agilidade (agility) deve ser no máximo "
            f"{AGILITY_CAP}."
        )


def validate_attributes(attributes: PlayerAttributes) -> None:
    if attributes.total() > ATTRIBUTES_TOTAL_MAX:
        raise InvalidInputError(
            f"A soma dos seis atributos técnicos não pode passar de {ATTRIBUTES_TOTAL_MAX}."
        )


def validate_potential(
    potential: int, attributes: PlayerAttributes, *, registration_age: int
) -> None:
    """Só vale no cadastro: um PUT que leve a idade a 33 anos ou mais não muda o potencial."""
    highest = attributes.highest()
    if potential < highest:
        raise InvalidInputError(
            "O potencial (potential) deve ser maior ou igual ao maior dos seis atributos "
            f"({highest})."
        )
    if registration_age >= POTENTIAL_PEAK_AGE and potential != highest:
        raise InvalidInputError(
            f"No cadastro com {POTENTIAL_PEAK_AGE} anos ou mais, o potencial (potential) deve ser "
            f"igual ao maior dos seis atributos ({highest})."
        )


def ensure_profile_change_allowed(
    current: PlayerProfile, new: PlayerProfile, *, has_club: bool
) -> None:
    """Regras do PUT que dependem do estado atual do jogador (RN08)."""
    if has_club and new.position != current.position:
        raise BusinessRuleError("Jogador com clube não pode mudar de posição.")
    if new.age < current.age:
        raise BusinessRuleError(f"A idade não pode ser menor que a atual ({current.age} anos).")


def ensure_condition_change_allowed(current: Condition, new: Condition) -> None:
    if current == Condition.DOENTE and new == Condition.APTO:
        raise BusinessRuleError(
            "Jogador DOENTE não pode passar direto para APTO; altere antes para MAL_CONDICIONADO."
        )


def leaves_lineup(condition: Condition) -> bool:
    """O titular que passa a DOENTE sai da escalação na mesma operação (RN19)."""
    return condition == Condition.DOENTE


def ensure_deletable(*, has_club: bool) -> None:
    """Só jogador livre pode ser excluído (RN09)."""
    if has_club:
        raise BusinessRuleError(
            "Só jogador livre pode ser excluído; este jogador está no elenco de um clube."
        )
