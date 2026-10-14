from typing import Self

from pydantic import BaseModel

from app.domain.market import ContractTerms
from app.models import Club
from app.services.club_service import ClubDetails, SquadMember
from app.views.fields import BrasiliaTimestamp, Money
from app.views.player_view import PlayerView


class ClubView(BaseModel):
    """Clube nas respostas; o valor do elenco e o patrimônio vêm calculados na hora (RN11)."""

    id: int
    name: str
    acronym: str
    cash: Money
    squad_value: Money
    net_worth: Money

    @classmethod
    def from_model(cls, club: Club) -> Self:
        return cls.model_validate(club, from_attributes=True)


class ContractTermsView(BaseModel):
    purchase_value: Money
    loyalty_until: BrasiliaTimestamp
    remaining_days: int
    penalty_rate: int

    @classmethod
    def from_terms(cls, terms: ContractTerms) -> Self:
        return cls(
            purchase_value=terms.purchase_value,
            loyalty_until=terms.loyalty_until,
            remaining_days=terms.remaining_days,
            penalty_rate=terms.penalty_percentage,
        )


class SquadPlayerView(PlayerView):
    contract: ContractTermsView

    @classmethod
    def from_member(cls, member: SquadMember) -> Self:
        return cls(
            **PlayerView.from_model(member.player).model_dump(),
            contract=ContractTermsView.from_terms(member.contract),
        )


class ClubDetailsView(ClubView):
    """Resposta de GET /clubs/{id}: o clube e o elenco na ordem da RN11."""

    players: list[SquadPlayerView]

    @classmethod
    def from_details(cls, details: ClubDetails) -> Self:
        return cls(
            **ClubView.from_model(details.club).model_dump(),
            players=[SquadPlayerView.from_member(member) for member in details.squad],
        )
