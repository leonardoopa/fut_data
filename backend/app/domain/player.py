import string

from app.domain.exceptions import InvalidInputError
from app.domain.text import count_words

NAME_MIN_LENGTH = 3
NAME_MAX_LENGTH = 100
NAME_MIN_WORDS = 2


def validate_name(name: str) -> str:
    """Nome do jogador já normalizado pela V4: tamanho, palavras e dígitos."""
    if not NAME_MIN_LENGTH <= len(name) <= NAME_MAX_LENGTH:
        raise InvalidInputError(f"deve ter de {NAME_MIN_LENGTH} a {NAME_MAX_LENGTH} caracteres.")
    if count_words(name) < NAME_MIN_WORDS:
        raise InvalidInputError(f"deve ter pelo menos {NAME_MIN_WORDS} palavras.")
    if any(character in string.digits for character in name):
        raise InvalidInputError("não pode conter dígitos.")
    return name
