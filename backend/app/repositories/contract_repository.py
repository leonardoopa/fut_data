from app.domain.enums import ContractStatus
from app.models import Contract


class ContractRepository:
    def save(self, contract: Contract) -> None:
        contract.save()

    def lock_active_of_player(self, player_id: int) -> Contract:
        """O jogador com clube tem exatamente um contrato ATIVO, criado pela compra (RN12)."""
        return Contract.objects.select_for_update().get(
            player_id=player_id, status=ContractStatus.ATIVO
        )

    def active_by_player(self, club_id: int) -> dict[int, Contract]:
        contracts = Contract.objects.filter(club_id=club_id, status=ContractStatus.ATIVO)
        return {contract.player_id: contract for contract in contracts}
