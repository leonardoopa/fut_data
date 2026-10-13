import re
from decimal import Decimal

from app.domain.exceptions import InvalidInputError
from app.domain.text import count_words, is_letter

INITIAL_CASH = Decimal("300.00")

NAME_MIN_LENGTH = 3
NAME_MAX_LENGTH = 60
NAME_MIN_WORDS = 2
NAME_MAX_WORDS = 5
NAME_SYMBOLS = frozenset(" -.")

ACRONYM_LENGTH = 3
ACRONYM_PATTERN = re.compile(f"[A-Z]{{{ACRONYM_LENGTH}}}")


def validate_name(name: str) -> str:
    """Nome do clube já normalizado pela V4: tamanho, caracteres e palavras."""
    if not NAME_MIN_LENGTH <= len(name) <= NAME_MAX_LENGTH:
        raise InvalidInputError(f"deve ter de {NAME_MIN_LENGTH} a {NAME_MAX_LENGTH} caracteres.")
    if not all(is_letter(character) or character in NAME_SYMBOLS for character in name):
        raise InvalidInputError("só pode conter letras, espaços, hífen e ponto.")
    if not NAME_MIN_WORDS <= count_words(name) <= NAME_MAX_WORDS:
        raise InvalidInputError(f"deve ter de {NAME_MIN_WORDS} a {NAME_MAX_WORDS} palavras.")
    return name


def validate_acronym(acronym: str) -> str:
    """Formato da sigla; a relação com o nome é conferida junto com o nome do clube."""
    if ACRONYM_PATTERN.fullmatch(acronym) is None:
        raise InvalidInputError(
            f"deve ter exatamente {ACRONYM_LENGTH} letras maiúsculas de A a Z, sem acento."
        )
    if len(set(acronym)) == 1:
        raise InvalidInputError("não pode ter as três letras iguais.")
    return acronym
