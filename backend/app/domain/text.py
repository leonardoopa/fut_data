import re
import unicodedata

from app.domain.exceptions import InvalidInputError

SPACE = " "
REPEATED_SPACES = re.compile(" {2,}")
CONTROL_CATEGORY = "Cc"
ACCENT_CATEGORY = "Mn"
LETTER_CATEGORY_PREFIX = "L"


def normalize_text(text: str) -> str:
    if any(unicodedata.category(character) == CONTROL_CATEGORY for character in text):
        raise InvalidInputError("não pode conter caracteres de controle.")
    return REPEATED_SPACES.sub(SPACE, text.strip(SPACE))


def is_letter(character: str) -> bool:
    return unicodedata.category(character).startswith(LETTER_CATEGORY_PREFIX)


def count_words(text: str) -> int:
    return sum(1 for token in text.split(SPACE) if any(map(is_letter, token)))


def remove_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(
        character for character in decomposed if unicodedata.category(character) != ACCENT_CATEGORY
    )


def alphabetical_key(text: str) -> str:
    return remove_accents(text.lower())


def matches_search(text: str, search: str) -> bool:
    return alphabetical_key(search) in alphabetical_key(text)
