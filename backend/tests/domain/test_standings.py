from dataclasses import dataclass

from app.domain.standings import Standing, compute_standings


@dataclass(frozen=True)
class FakeClub:
    id: int
    name: str


@dataclass(frozen=True)
class FakeMatch:
    home_club_id: int
    away_club_id: int
    home_goals: int
    away_goals: int


AGUIAS, DELTA, GAMA, EPSILON, MANGUE, TUBAROES = (
    FakeClub(1, "Águias FC"),
    FakeClub(2, "Delta FC"),
    FakeClub(3, "Gama SC"),
    FakeClub(4, "Épsilon EC"),
    FakeClub(5, "Mangue FC"),
    FakeClub(6, "Tubarões EC"),
)
LEAGUE = (AGUIAS, DELTA, GAMA, EPSILON, MANGUE, TUBAROES)


def table(standings: list[Standing]) -> list[tuple[int | str, ...]]:
    return [
        (
            row.position,
            row.club_name,
            row.played,
            row.wins,
            row.draws,
            row.losses,
            row.goals_for,
            row.goals_against,
            row.goal_difference,
            row.points,
        )
        for row in standings
    ]


def test_documented_standings_after_four_matches() -> None:
    matches = [
        FakeMatch(AGUIAS.id, DELTA.id, 1, 2),
        FakeMatch(GAMA.id, EPSILON.id, 2, 1),
        FakeMatch(EPSILON.id, AGUIAS.id, 3, 2),
        FakeMatch(DELTA.id, GAMA.id, 0, 1),
    ]

    assert table(compute_standings(LEAGUE, matches)) == [
        (1, "Gama SC", 2, 2, 0, 0, 3, 1, 2, 6),
        (2, "Épsilon EC", 2, 1, 0, 1, 4, 4, 0, 3),
        (3, "Delta FC", 2, 1, 0, 1, 2, 2, 0, 3),
        (4, "Mangue FC", 0, 0, 0, 0, 0, 0, 0, 0),
        (5, "Tubarões EC", 0, 0, 0, 0, 0, 0, 0, 0),
        (6, "Águias FC", 2, 0, 0, 2, 3, 5, -2, 0),
    ]


def test_draw_gives_one_point_to_each_club() -> None:
    standings = compute_standings((AGUIAS, DELTA), [FakeMatch(AGUIAS.id, DELTA.id, 2, 2)])

    assert [(row.club_name, row.draws, row.points) for row in standings] == [
        ("Águias FC", 1, 1),
        ("Delta FC", 1, 1),
    ]


def test_full_tie_follows_the_alphabetical_name_then_the_id() -> None:
    clubs = (FakeClub(9, "Gama SC"), FakeClub(3, "Épsilon EC"), FakeClub(8, "Delta FC"))
    twins = (FakeClub(5, "Delta FC"), *clubs)

    standings = compute_standings(twins, [])

    assert [(row.position, row.club_id) for row in standings] == [(1, 5), (2, 8), (3, 3), (4, 9)]


def test_league_without_clubs_has_empty_standings() -> None:
    assert compute_standings((), []) == []
