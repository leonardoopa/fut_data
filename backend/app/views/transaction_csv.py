"""Apresentação do histórico de transações em CSV (RN18)."""

import csv
import io
from collections.abc import Iterable
from decimal import Decimal

from fastapi import Response

from app.domain.brasilia_time import format_brasilia_datetime
from app.domain.money import format_money
from app.models import MarketTransaction

HEADER = (
    "data_hora",
    "tipo",
    "jogador",
    "valor",
    "taxa_ou_comissao",
    "multa",
    "lucro",
    "variacao_caixa",
)
SEPARATOR = ";"
LINE_END = "\n"
MISSING_VALUE = ""


class CsvResponse(Response):
    """Texto CSV em UTF-8, sem BOM."""

    media_type = "text/csv"


def format_csv_money(value: Decimal | None) -> str:
    """Valor em dinheiro no formato brasileiro; valor nulo fica vazio."""
    if value is None:
        return MISSING_VALUE
    return format_money(value)


def transaction_row(market_transaction: MarketTransaction) -> tuple[str, ...]:
    return (
        format_brasilia_datetime(market_transaction.created_at),
        market_transaction.type,
        market_transaction.player_name,
        format_csv_money(market_transaction.value),
        format_csv_money(market_transaction.fee),
        format_csv_money(market_transaction.penalty),
        format_csv_money(market_transaction.profit),
        format_csv_money(market_transaction.cash_change),
    )


def render_transactions_csv(transactions: Iterable[MarketTransaction]) -> str:
    """Cabeçalho e uma linha por transação, cada uma terminada em LF.

    Um campo com `;` ou aspas vai entre aspas duplas, com cada aspa interna duplicada.
    """
    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=SEPARATOR, lineterminator=LINE_END)
    writer.writerow(HEADER)
    writer.writerows(transaction_row(item) for item in transactions)
    return buffer.getvalue()


def transactions_csv_response(
    club_id: int, transactions: Iterable[MarketTransaction]
) -> CsvResponse:
    return CsvResponse(
        render_transactions_csv(transactions),
        headers={"Content-Disposition": f'attachment; filename="transacoes-clube-{club_id}.csv"'},
    )
