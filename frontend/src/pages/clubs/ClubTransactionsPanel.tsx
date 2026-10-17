import { TRANSACTION_TYPES, type TransactionSummary, type TransactionType } from '../../api/types'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { CheckboxChip, SelectField } from '../../components/FormField'
import { SignedMoney } from '../../components/Money'
import { Notice } from '../../components/Notice'
import { StatGrid, type StatItem } from '../../components/StatGrid'
import { TRANSACTION_TYPE_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import type { ClubTransactions } from '../../hooks/useClubTransactions'
import { TRANSACTION_COLUMNS } from './transactionColumns'

function summaryItems(summary: TransactionSummary): StatItem[] {
  return [
    {
      label: 'Total pago em compras',
      icon: 'cart',
      value: formatMoney(summary.total_spent),
      caption: 'Valor + taxa',
    },
    {
      label: 'Total recebido em vendas',
      icon: 'swap',
      value: formatMoney(summary.total_received),
      caption: 'Crédito líquido',
    },
    {
      label: 'Taxas e comissões',
      icon: 'coins',
      value: formatMoney(summary.total_fees),
      caption: 'Somadas',
    },
    {
      label: 'Multas',
      icon: 'alertTriangle',
      value: formatMoney(summary.total_penalties),
      caption: 'Por fidelidade',
    },
    {
      label: 'Lucro total',
      icon: 'trendingUp',
      value: <SignedMoney value={summary.total_profit} />,
      caption: 'Soma dos lucros, com sinal',
    },
  ]
}

function toggleType(types: TransactionType[], type: TransactionType): TransactionType[] {
  return types.includes(type) ? types.filter((current) => current !== type) : [...types, type]
}

export function ClubTransactionsPanel({ history }: { history: ClubTransactions }) {
  const { filters, exportCsv } = history
  const summary = history.isLoading || history.error ? undefined : history.data?.summary
  const isFilterRefused = Boolean(history.error) && !history.isDefaultFilters

  return (
    <Card
      title="Histórico de transações"
      description="Da mais recente para a mais antiga, com o nome e os valores do momento de cada operação."
      actions={
        <Button
          variant="secondary"
          icon="download"
          isPending={exportCsv.isPending}
          onClick={() => exportCsv.run()}
        >
          {exportCsv.isPending ? 'Exportando…' : 'Exportar CSV'}
        </Button>
      }
    >
      <div
        className="table-toolbar table-toolbar--start"
        role="group"
        aria-label="Filtros do histórico"
      >
        <span className="section-label">Tipo</span>
        {TRANSACTION_TYPES.map((type) => {
          const isChecked = filters.types.includes(type)
          return (
            <CheckboxChip
              key={type}
              label={TRANSACTION_TYPE_LABELS[type]}
              checked={isChecked}
              disabled={isChecked && filters.types.length === 1}
              onChange={() =>
                history.applyFilters({ ...filters, types: toggleType(filters.types, type) })
              }
            />
          )
        })}
        <div className="inline-field">
          <SelectField
            label="Jogador"
            icon="user"
            value={filters.player_id ?? ''}
            onChange={(event) =>
              history.applyFilters({
                ...filters,
                player_id: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          >
            <option value="">Todos</option>
            {history.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </SelectField>
        </div>
        {!history.isDefaultFilters && (
          <Button variant="link" size="sm" onClick={history.resetFilters}>
            Limpar filtros
          </Button>
        )}
      </div>

      {isFilterRefused ? (
        <div className="card__body">
          <Notice tone="danger" role="alert" title="O filtro foi recusado">
            {history.error}
          </Notice>
        </div>
      ) : (
        <DataTable
          caption="Histórico de transações"
          columns={TRANSACTION_COLUMNS}
          rows={history.data?.data}
          getRowKey={(transaction) => transaction.id}
          isLoading={history.isLoading}
          loadingLabel="Carregando histórico…"
          error={history.error}
          errorTitle="Não foi possível carregar o histórico"
          onRetry={history.reload}
          empty={
            history.isDefaultFilters
              ? {
                  icon: 'history',
                  title: 'Nenhuma transação ainda',
                  description:
                    'As compras e vendas do clube aparecem aqui, com os totais logo abaixo.',
                }
              : {
                  icon: 'searchX',
                  title: 'Nenhuma transação com esses filtros',
                  action: (
                    <Button variant="secondary" size="sm" icon="x" onClick={history.resetFilters}>
                      Limpar filtros
                    </Button>
                  ),
                }
          }
        />
      )}

      {summary && (
        <StatGrid label="Totais do histórico" variant="strip" items={summaryItems(summary)} />
      )}
    </Card>
  )
}
