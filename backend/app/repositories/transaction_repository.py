from app.domain.enums import TransactionType
from app.dtos.market import TransactionListCriteria
from app.models import MarketTransaction


class TransactionRepository:
    def add(self, market_transaction: MarketTransaction) -> None:
        market_transaction.save()

    def has_sold(self, club_id: int, player_id: int) -> bool:
        return MarketTransaction.objects.filter(
            club_id=club_id, player_id=player_id, type=TransactionType.VENDA
        ).exists()

    def list_of_club(
        self, club_id: int, criteria: TransactionListCriteria
    ) -> list[MarketTransaction]:
        """Da mais recente para a mais antiga; no empate de data e hora, id decrescente (RN17)."""
        transactions = MarketTransaction.objects.filter(club_id=club_id, type__in=criteria.type)
        if criteria.player_id is not None:
            transactions = transactions.filter(player_id=criteria.player_id)
        return list(transactions.order_by("-created_at", "-id"))
