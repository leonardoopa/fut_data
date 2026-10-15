import type { TransactionSummary } from '../../api/types'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import { SummaryList, type SummaryItem } from '../../components/SummaryList'
import { formatMoney, formatSignedMoney } from '../../format/money'
import type { ClubTransactions } from '../../hooks/useClubTransactions'
import { TransactionFiltersForm } from './TransactionFiltersForm'
import { TRANSACTION_COLUMNS } from './transactionColumns'

function summaryItems(summary: TransactionSummary): SummaryItem[] {
  return [
    { label: 'Total pago em compras', value: formatMoney(summary.total_spent) },
    { label: 'Total recebido em vendas', value: formatMoney(summary.total_received) },
    { label: 'Total de taxas e comissões', value: formatMoney(summary.total_fees) },
    { label: 'Total de multas', value: formatMoney(summary.total_penalties) },
    { label: 'Lucro total', value: formatSignedMoney(summary.total_profit) },
  ]
}

interface ClubTransactionsPanelProps {
  history: ClubTransactions
}

export function ClubTransactionsPanel({ history }: ClubTransactionsPanelProps) {
  const { filters, exportCsv } = history
  const hasFilters = filters.types.length > 0 || filters.player_id !== undefined
  const summary = history.isLoading ? undefined : history.data?.summary

  return (
    <>
      <TransactionFiltersForm players={history.players} onApply={history.applyFilters} />

      <div className="section-header">
        <h2>Transações</h2>
        <Button variant="secondary" isPending={exportCsv.isPending} onClick={() => exportCsv.run()}>
          {exportCsv.isPending ? 'Exportando…' : 'Exportar CSV'}
        </Button>
      </div>

      <DataTable
        caption="Histórico de transações"
        columns={TRANSACTION_COLUMNS}
        rows={history.data?.data}
        getRowKey={(transaction) => transaction.id}
        isLoading={history.isLoading}
        error={history.error}
        emptyMessage={
          hasFilters ? 'Nenhuma transação com esses filtros.' : 'Nenhuma transação registrada.'
        }
        onRetry={history.reload}
      />

      {summary && <SummaryList label="Totais do histórico" items={summaryItems(summary)} />}
    </>
  )
}
