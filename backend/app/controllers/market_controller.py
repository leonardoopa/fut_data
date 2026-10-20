from typing import Annotated

from fastapi import Depends, Query

from app.core.clock import Clock, get_clock
from app.core.database import DatabaseRouter
from app.repositories.club_repository import ClubRepository
from app.repositories.contract_repository import ContractRepository
from app.repositories.lineup_repository import LineupRepository
from app.repositories.player_repository import PlayerRepository
from app.repositories.transaction_repository import TransactionRepository
from app.requests.market import PurchaseRequest, TransactionListQuery
from app.requests.path import ResourceId
from app.services.market_service import MarketService
from app.views.transaction_csv import CsvResponse, transactions_csv_response
from app.views.transaction_view import PurchaseView, SaleView, TransactionHistoryView

router = DatabaseRouter(tags=["Market"])


def get_market_service(clock: Annotated[Clock, Depends(get_clock)]) -> MarketService:
    return MarketService(
        players=PlayerRepository(),
        clubs=ClubRepository(),
        contracts=ContractRepository(),
        transactions=TransactionRepository(),
        lineups=LineupRepository(),
        clock=clock,
    )


MarketServiceDependency = Annotated[MarketService, Depends(get_market_service)]


@router.post("/players/{player_id}/buy", summary="Buy a free player (RN12 to RN14)")
def buy_player(
    player_id: ResourceId, body: PurchaseRequest, service: MarketServiceDependency
) -> PurchaseView:
    return PurchaseView.from_purchase(service.buy(player_id, body.to_order()))


@router.post("/players/{player_id}/sell", summary="Sell a squad player (RN15 and RN16)")
def sell_player(player_id: ResourceId, service: MarketServiceDependency) -> SaleView:
    return SaleView.from_sale(service.sell(player_id))


@router.get("/clubs/{club_id}/transactions", summary="Club transaction history (RN17)")
def list_transactions(
    club_id: ResourceId,
    query: Annotated[TransactionListQuery, Query()],
    service: MarketServiceDependency,
) -> TransactionHistoryView:
    return TransactionHistoryView.from_history(
        service.list_transactions(club_id, query.to_criteria())
    )


@router.get(
    "/clubs/{club_id}/transactions/export",
    response_class=CsvResponse,
    summary="Export the club transaction history as CSV (RN18)",
)
def export_transactions(
    club_id: ResourceId,
    query: Annotated[TransactionListQuery, Query()],
    service: MarketServiceDependency,
) -> CsvResponse:
    return transactions_csv_response(
        club_id, service.export_transactions(club_id, query.to_criteria())
    )
