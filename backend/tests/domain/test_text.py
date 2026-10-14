import pytest

from app.domain.exceptions import InvalidInputError
from app.domain.text import alphabetical_key, count_words, matches_search, normalize_text


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("  Meia   Zeta ", "Meia Zeta"),
        ("Meia Zeta", "Meia Zeta"),
        ("   ", ""),
        ("Ana\u00a0Lima", "Ana\u00a0Lima"),
    ],
)
def test_normalize_text_trims_and_collapses_only_regular_spaces(raw: str, expected: str) -> None:
    assert normalize_text(raw) == expected


@pytest.mark.parametrize("raw", ["Ana\tLima", "Ana\nLima", "Ana Lima\r", "Ana\x00Lima"])
def test_normalize_text_rejects_control_characters(raw: str) -> None:
    with pytest.raises(InvalidInputError):
        normalize_text(raw)


@pytest.mark.parametrize(
    ("text", "expected_words"),
    [("Meia Lua", 2), ("Águias - FC", 2), ("Santa-Cruz F.C.", 2), ("Pelé", 1)],
)
def test_words_are_space_separated_tokens_with_a_letter(text: str, expected_words: int) -> None:
    assert count_words(text) == expected_words


@pytest.mark.parametrize(
    ("names", "expected_order"),
    [
        (["Gama", "Épsilon", "Delta"], ["Delta", "Épsilon", "Gama"]),
        (["Ana-Maria", "Ana Lima"], ["Ana Lima", "Ana-Maria"]),
        (["Zeca", "álvaro", "Bruno"], ["álvaro", "Bruno", "Zeca"]),
    ],
)
def test_alphabetical_order_ignores_case_and_accents(
    names: list[str], expected_order: list[str]
) -> None:
    assert sorted(names, key=alphabetical_key) == expected_order


def test_names_differing_only_by_accent_tie_in_alphabetical_order() -> None:
    assert alphabetical_key("Águias FC") == alphabetical_key("Aguias FC")


@pytest.mark.parametrize(
    ("name", "search", "expected"),
    [
        ("João Silva", "joao", True),
        ("Meia Lua", "LUA", True),
        ("Conceição Dias", "conceicao", True),
        ("Meia Lua", "sol", False),
    ],
)
def test_search_ignores_case_and_accents(name: str, search: str, expected: bool) -> None:
    assert matches_search(name, search) is expected
