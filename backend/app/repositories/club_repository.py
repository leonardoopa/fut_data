from collections.abc import Iterable

from django.db import IntegrityError

from app.domain.exceptions import ClubAlreadyRegisteredError
from app.models import Club


class ClubRepository:
    def exists(self, club_id: int) -> bool:
        return Club.objects.filter(pk=club_id).exists()

    def get(self, club_id: int) -> Club | None:
        return Club.objects.filter(pk=club_id).first()

    def list_all(self) -> list[Club]:
        return list(Club.objects.all())

    def count(self) -> int:
        return Club.objects.count()

    def is_name_taken(self, name_key: str) -> bool:
        return Club.objects.filter(name_key=name_key).exists()

    def is_acronym_taken(self, acronym: str) -> bool:
        return Club.objects.filter(acronym=acronym).exists()

    def add(self, club: Club) -> None:
        """As colunas UNIQUE do nome e da sigla barram também duas criações simultâneas (RN10)."""
        try:
            club.save()
        except IntegrityError as error:
            raise ClubAlreadyRegisteredError from error

    def save(self, club: Club) -> None:
        club.save()

    def get_with_squad(self, club_id: int) -> Club | None:
        return Club.objects.prefetch_related("players").filter(pk=club_id).first()

    def list_with_squads(self) -> list[Club]:
        return list(Club.objects.prefetch_related("players"))

    def lock(self, club_id: int) -> Club | None:
        """Trava a linha do clube até o fim da transação (SELECT ... FOR UPDATE)."""
        return Club.objects.select_for_update().filter(pk=club_id).first()

    def lock_many(self, club_ids: Iterable[int]) -> dict[int, Club]:
        """Trava os clubes sempre em ordem crescente de id, para não haver deadlock."""
        clubs = Club.objects.select_for_update().filter(pk__in=club_ids).order_by("id")
        return {club.id: club for club in clubs}
