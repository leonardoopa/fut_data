from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from django.db import transaction

from app.core.clock import Clock
from app.domain.market import (
    SaleSettlement,
    TransactionAmounts,
    ensure_purchase_allowed,
    ensure_sellable,
    quote_purchase,
    settle_sale,
    validate_loyalty_until,
)
from app.domain.transaction_history import (
    TransactionSummary,
    summarize_transactions,
)
from app.dtos.market import PurchaseOrder, TransactionListCriteria
from app.models import Club, Contract, MarketTransaction, Player
from app.repositories.club_repository import ClubRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.transaction_repository import TransactionRepository
from app.services.lookups import (
    ensure_club_exists,
    ensure_club_found,
    ensure_player_found,
)


@dataclass(frozen=True)
class Purchase:
    transaction: MarketTransaction
    contract: Contract
    club_cash: Decimal


@dataclass(frozen=True)
class Sale:
    transaction: MarketTransaction
    settlement: SaleSettlement
    club_cash: Decimal


@dataclass(frozen=True)
class TransactionHistory:
    transactions: list[MarketTransaction]
    summary: TransactionSummary


class MarketService:
    """Buy and sell lock the player, then the club, always in that order."""

    def __init__(
        self,
        *,
        players: PlayerRepository,
        clubs: ClubRepository,
        contracts: ContractRepository,
        transactions: TransactionRepository,
        lineups: LineupRepository,
        clock: Clock,
    ) -> None:
        self._players = players
        self._clubs = clubs
        self._contracts = contracts
        self._transactions = transactions
        self._lineups = lineups
        self._clock = clock

    @transaction.atomic
    def buy(self, player_id: int, order: PurchaseOrder) -> Purchase:
        player = ensure_player_found(self._players.lock_active(player_id))
        club = ensure_club_found(self._clubs.lock(order.club_id))
        moment = self._clock()
        validate_loyalty_until(order.loyalty_until, moment)
        quote = quote_purchase(player.market_value)
        ensure_purchase_allowed(
            quote,
            player_is_free=not player.has_club,
            sold_by_buyer=self._transactions.has_sold(club.id, player.id),
            squad_size=self._players.count_in_club(club.id),
            cash=club.cash,
        )
        player.club = club
        self._players.save(player)
        contract = Contract.sign(player, club, quote.value, order.loyalty_until, moment)
        self._contracts.save(contract)
        market_transaction = self._record(club, player, quote.amounts, moment)
        return Purchase(
            transaction=market_transaction, contract=contract, club_cash=club.cash
        )

    @transaction.atomic
    def sell(self, player_id: int) -> Sale:
        player = ensure_player_found(self._players.lock_active(player_id))
        ensure_sellable(has_club=player.has_club)
        club = ensure_club_found(self._clubs.lock(player.club_id))
        contract = self._contracts.lock_active_of_player(player.id)
        moment = self._clock()
        settlement = settle_sale(
            player.market_value, contract.purchase_value, contract.loyalty_until, moment
        )
        contract.end(settlement.contract_status, moment)
        self._contracts.save(contract)
        self._lineups.remove_player(player.id)
        player.club = None
        self._players.save(player)
        market_transaction = self._record(club, player, settlement.amounts, moment)
        return Sale(
            transaction=market_transaction, settlement=settlement, club_cash=club.cash
        )

    def list_transactions(
        self, club_id: int, criteria: TransactionListCriteria
    ) -> TransactionHistory:
        transactions = self._filter_transactions(club_id, criteria)
        return TransactionHistory(
            transactions=transactions, summary=summarize_transactions(transactions)
        )

    def export_transactions(
        self, club_id: int, criteria: TransactionListCriteria
    ) -> list[MarketTransaction]:
        return self._filter_transactions(club_id, criteria)

    def _filter_transactions(
        self, club_id: int, criteria: TransactionListCriteria
    ) -> list[MarketTransaction]:
        ensure_club_exists(self._clubs, club_id)
        if criteria.player_id is not None:
            ensure_player_found(self._players.get_active(criteria.player_id))
        return self._transactions.list_of_club(club_id, criteria)

    def _record(
        self, club: Club, player: Player, amounts: TransactionAmounts, moment: datetime
    ) -> MarketTransaction:
        club.cash += amounts.cash_change
        self._clubs.save(club)
        market_transaction = MarketTransaction.record(club, player, amounts, moment)
        self._transactions.add(market_transaction)
        return market_transaction
