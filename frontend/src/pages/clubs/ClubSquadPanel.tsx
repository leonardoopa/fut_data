import { useCallback, useState } from 'react'
import type { ClubDetails, Sale, SquadPlayer } from '../../api/types'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { MAX_SQUAD_SIZE } from '../../config/league'
import type { Action } from '../../hooks/useAction'
import { SaleConfirmDialog, SaleResultDialog } from './SaleDialog'
import { buildSquadColumns } from './squadColumns'

type SquadDialog = { kind: 'confirm'; player: SquadPlayer } | { kind: 'result'; sale: Sale }

interface ClubSquadPanelProps {
  club: ClubDetails
  isLoading: boolean
  starterIds: Set<number>
  sell: Action<[number], Sale>
  onShowHistory: () => void
  onBrowseFreePlayers: () => void
}

export function ClubSquadPanel({
  club,
  isLoading,
  starterIds,
  sell,
  onShowHistory,
  onBrowseFreePlayers,
}: ClubSquadPanelProps) {
  const [dialog, setDialog] = useState<SquadDialog>()
  const closeDialog = useCallback(() => setDialog(undefined), [])
  const columns = buildSquadColumns({
    onSell: (player) => {
      sell.clearError()
      setDialog({ kind: 'confirm', player })
    },
  })

  async function confirmSale(player: SquadPlayer) {
    const sale = await sell.run(player.id)
    if (sale) setDialog({ kind: 'result', sale })
  }

  function renderDialog() {
    if (!dialog) return null
    if (dialog.kind === 'confirm') {
      return (
        <SaleConfirmDialog
          player={dialog.player}
          club={club}
          isStarter={starterIds.has(dialog.player.id)}
          isPending={sell.isPending}
          error={sell.error}
          onConfirm={() => confirmSale(dialog.player)}
          onCancel={closeDialog}
        />
      )
    }
    return (
      <SaleResultDialog
        sale={dialog.sale}
        club={club}
        onShowHistory={() => {
          closeDialog()
          onShowHistory()
        }}
        onClose={closeDialog}
      />
    )
  }

  return (
    <Card
      title="Elenco"
      description="Ordem por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome. Contrato calculado para uma venda agora."
    >
      <DataTable
        caption="Elenco"
        columns={columns}
        rows={club.players}
        getRowKey={(player) => player.id}
        isLoading={isLoading}
        loadingLabel="Carregando elenco…"
        empty={{
          icon: 'shirt',
          title: 'Nenhum jogador no elenco',
          description: `Compre jogadores livres para montar o elenco. O limite é de ${MAX_SQUAD_SIZE} jogadores, e o custo de cada compra não pode passar de 50% do caixa.`,
          action: (
            <Button variant="secondary" size="sm" icon="users" onClick={onBrowseFreePlayers}>
              Ver jogadores livres
            </Button>
          ),
        }}
      />
      {renderDialog()}
    </Card>
  )
}
