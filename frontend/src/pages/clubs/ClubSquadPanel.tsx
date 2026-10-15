import { useCallback, useState } from 'react'
import type { Sale, SquadPlayer } from '../../api/types'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DataTable } from '../../components/DataTable'
import { ResultDialog } from '../../components/ResultDialog'
import { SummaryList } from '../../components/SummaryList'
import { formatMoney, formatSignedMoney } from '../../format/money'
import { formatPercent } from '../../format/percent'
import { buildSquadColumns } from './squadColumns'

type SquadDialog = { kind: 'confirm'; player: SquadPlayer } | { kind: 'result'; sale: Sale }

interface ClubSquadPanelProps {
  players: SquadPlayer[]
  isLoading: boolean
  isSelling: boolean
  onSell: (player: SquadPlayer) => Promise<Sale | undefined>
}

export function ClubSquadPanel({ players, isLoading, isSelling, onSell }: ClubSquadPanelProps) {
  const [dialog, setDialog] = useState<SquadDialog>()
  const closeDialog = useCallback(() => setDialog(undefined), [])
  const columns = buildSquadColumns({ onSell: (player) => setDialog({ kind: 'confirm', player }) })

  async function sell(player: SquadPlayer) {
    const sale = await onSell(player)
    if (sale) setDialog({ kind: 'result', sale })
  }

  function renderDialog() {
    if (!dialog) return null
    if (dialog.kind === 'confirm') {
      const { player } = dialog
      return (
        <ConfirmDialog
          title="Vender jogador"
          confirmLabel="Vender"
          pendingLabel="Vendendo…"
          isPending={isSelling}
          onConfirm={() => sell(player)}
          onCancel={closeDialog}
        >
          <p>
            Vender <strong>{player.name}</strong>? A API calcula o valor de venda, a multa e a
            comissão no momento da venda.
          </p>
          <SummaryList
            items={[
              { label: 'Valor de mercado', value: formatMoney(player.market_value) },
              { label: 'Dias restantes', value: player.contract.remaining_days },
              {
                label: 'Multa se vendido agora',
                value: formatPercent(player.contract.penalty_rate),
              },
            ]}
          />
        </ConfirmDialog>
      )
    }
    const { sale } = dialog
    return (
      <ResultDialog
        title="Venda concluída"
        description={
          <>
            <strong>{sale.player_name}</strong> foi vendido. Valores calculados pela API:
          </>
        }
        items={[
          { label: 'Valor de compra', value: formatMoney(sale.purchase_value) },
          { label: 'Valor de venda', value: formatMoney(sale.value) },
          { label: 'Dias restantes', value: sale.remaining_days },
          {
            label: 'Multa',
            value: `${formatMoney(sale.penalty)} (${formatPercent(sale.penalty_rate)})`,
          },
          { label: 'Lucro', value: formatSignedMoney(sale.profit) },
          { label: 'Comissão', value: formatMoney(sale.fee) },
          { label: 'Crédito', value: formatSignedMoney(sale.cash_change) },
          { label: 'Novo caixa', value: formatMoney(sale.club_cash) },
        ]}
        onClose={closeDialog}
      />
    )
  }

  return (
    <>
      <DataTable
        caption="Elenco"
        columns={columns}
        rows={players}
        getRowKey={(player) => player.id}
        isLoading={isLoading}
        emptyMessage="Elenco vazio. Compre jogadores livres na tela de jogadores."
      />
      {renderDialog()}
    </>
  )
}
