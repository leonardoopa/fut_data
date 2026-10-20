from fastapi.testclient import TestClient

from tests.api.factories import STANDINGS_URL, create_club, insert_match

LEAGUE = (
    ("AGU", "Águias FC"),
    ("DEL", "Delta FC"),
    ("GAM", "Gama SC"),
    ("EPS", "Épsilon EC"),
    ("MAN", "Mangue FC"),
    ("TUB", "Tubarões EC"),
)


def standings(client: TestClient) -> list[dict[str, object]]:
    response = client.get(STANDINGS_URL)
    assert response.status_code == 200, response.text
    return response.json()


def test_documented_standings_after_four_matches(client: TestClient) -> None:
    clubs = {name: create_club(acronym, name=name) for acronym, name in LEAGUE}
    for home, away, home_goals, away_goals in (
        ("Águias FC", "Delta FC", 1, 2),
        ("Gama SC", "Épsilon EC", 2, 1),
        ("Épsilon EC", "Águias FC", 3, 2),
        ("Delta FC", "Gama SC", 0, 1),
    ):
        insert_match(clubs[home], clubs[away], home_goals, away_goals)

    rows = standings(client)

    summary = [
        (
            row["position"],
            row["club_name"],
            row["points"],
            row["goal_difference"],
            row["goals_for"],
        )
        for row in rows
    ]
    assert summary == [
        (1, "Gama SC", 6, 2, 3),
        (2, "Épsilon EC", 3, 0, 4),
        (3, "Delta FC", 3, 0, 2),
        (4, "Mangue FC", 0, 0, 0),
        (5, "Tubarões EC", 0, 0, 0),
        (6, "Águias FC", 0, -2, 3),
    ]
    assert rows[0] == {
        "position": 1,
        "club_id": clubs["Gama SC"].id,
        "club_name": "Gama SC",
        "played": 2,
        "wins": 2,
        "draws": 0,
        "losses": 0,
        "goals_for": 3,
        "goals_against": 1,
        "goal_difference": 2,
        "points": 6,
    }


def test_standings_are_computed_on_each_request(client: TestClient) -> None:
    home, away = create_club("AGU", name="Águias FC"), create_club(
        "DEL", name="Delta FC"
    )
    before = standings(client)
    insert_match(home, away, 2, 2)

    after = standings(client)

    assert [row["points"] for row in before] == [0, 0]
    assert [(row["club_name"], row["draws"], row["points"]) for row in after] == [
        ("Águias FC", 1, 1),
        ("Delta FC", 1, 1),
    ]


def test_league_without_clubs_has_empty_standings(client: TestClient) -> None:
    assert standings(client) == []
