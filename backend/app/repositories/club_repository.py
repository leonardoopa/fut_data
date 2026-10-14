from app.models import Club


class ClubRepository:
    def exists(self, club_id: int) -> bool:
        return Club.objects.filter(pk=club_id).exists()
