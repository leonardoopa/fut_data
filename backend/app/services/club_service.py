from dataclasses import dataclass

from app.core.clock import Clock
from app.domain.club import ensure_registration_allowed, name_key, sort_squad
from app.domain.club_listing import sort_clubs
from app.domain.market import ContractTerms
from app.dtos.club import ClubListCriteria, ClubRegistration
from app.models import Club, Player
from app.repositories.club_repository import ClubRepository
from app.repositories.contract_repository import ContractRepository
from app.services.lookups import ensure_club_found


@dataclass(frozen=True)
class SquadMember:
    player: Player
    contract: ContractTerms


@dataclass(frozen=True)
class ClubDetails:
    club: Club
    squad: list[SquadMember]


class ClubService:
    """Casos de uso de clubes."""

    def __init__(self, clubs: ClubRepository, contracts: ContractRepository, clock: Clock) -> None:
        self._clubs = clubs
        self._contracts = contracts
        self._clock = clock

    def register(self, registration: ClubRegistration) -> Club:
        ensure_registration_allowed(
            club_count=self._clubs.count(),
            name_taken=self._clubs.is_name_taken(name_key(registration.name)),
            acronym_taken=self._clubs.is_acronym_taken(registration.acronym),
        )
        club = Club.from_registration(registration)
        self._clubs.add(club)
        # Recarrega com o elenco (vazio), para a resposta não consultar o banco fora do serviço.
        return ensure_club_found(self._clubs.get_with_squad(club.id))

    def list_clubs(self, criteria: ClubListCriteria) -> list[Club]:
        return sort_clubs(self._clubs.list_with_squads(), criteria.sort)

    def get_details(self, club_id: int) -> ClubDetails:
        """Elenco na ordem da RN11, com os dias restantes e a multa calculados agora."""
        club = ensure_club_found(self._clubs.get_with_squad(club_id))
        contracts = self._contracts.active_by_player(club.id)
        moment = self._clock()
        squad = [
            SquadMember(player=player, contract=contracts[player.id].terms_at(moment))
            for player in sort_squad(club.players.all())
        ]
        return ClubDetails(club=club, squad=squad)
