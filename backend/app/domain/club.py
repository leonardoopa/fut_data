import re
from collections.abc import Iterable
from dataclasses import dataclass
from decimal import Decimal

from app.domain.exceptions import BusinessRuleError, InvalidInputError
from app.domain.player_listing import ListedPlayer, PlayerSort, sort_players
from app.domain.rounding import ZERO_MONEY
from app.domain.text import alphabetical_key, count_words, is_letter

INITIAL_CASH = Decimal("300.00")
MAX_CLUBS = 20

NAME_MIN_LENGTH = 3
NAME_MAX_LENGTH = 60
NAME_MIN_WORDS = 2
NAME_MAX_WORDS = 5
NAME_SYMBOLS = frozenset(" -.")

SQUAD_ORDER = (PlayerSort.POSITION,)

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


def validate_acronym_for_name(acronym: str, name: str) -> None:
    """As letras da sigla aparecem no nome nessa ordem, a primeira sendo a primeira letra do nome.

    A comparação ignora maiúsculas, minúsculas e acentos.
    """
    name_letters = [character for character in alphabetical_key(name) if is_letter(character)]
    first, *others = alphabetical_key(acronym)
    following_letters = iter(name_letters[1:])
    starts_with_first_letter = bool(name_letters) and name_letters[0] == first
    if not starts_with_first_letter or not all(letter in following_letters for letter in others):
        raise InvalidInputError(
            "A sigla (acronym) deve começar pela primeira letra do nome e ter as outras duas "
            "letras na ordem em que aparecem no nome."
        )


def name_key(name: str) -> str:
    """Chave da unicidade do nome (RN10): ignora maiúsculas e minúsculas, mas não os acentos."""
    return name.lower()


@dataclass(frozen=True)
class ClubRegistration:
    name: str
    acronym: str

    @property
    def name_key(self) -> str:
        return name_key(self.name)


def ensure_registration_allowed(*, club_count: int, name_taken: bool, acronym_taken: bool) -> None:
    if name_taken:
        raise BusinessRuleError("Já existe um clube com este nome.")
    if acronym_taken:
        raise BusinessRuleError("Já existe um clube com esta sigla.")
    if club_count >= MAX_CLUBS:
        raise BusinessRuleError(f"A liga já tem o máximo de {MAX_CLUBS} clubes.")


def calculate_squad_value(market_values: Iterable[Decimal]) -> Decimal:
    """Soma dos valores de mercado do elenco, calculada a cada consulta (RN11)."""
    return sum(market_values, ZERO_MONEY)


def calculate_net_worth(cash: Decimal, squad_value: Decimal) -> Decimal:
    return cash + squad_value


def sort_squad[P: ListedPlayer](players: Iterable[P]) -> list[P]:
    """Elenco por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome e pelo id (RN11)."""
    return sort_players(players, SQUAD_ORDER)
