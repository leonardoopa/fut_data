import { useCallback, useMemo, useState } from 'react'
import { PLAYER_SORTS, type Player } from '../../api/types'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DataTable } from '../../components/DataTable'
import { SelectField } from '../../components/FormField'
import { Pagination } from '../../components/Pagination'
import { PLAYER_SORT_LABELS } from '../../format/labels'
import { useClubs } from '../../hooks/useClubs'
import { usePlayerActions } from '../../hooks/usePlayerActions'
import { usePlayers } from '../../hooks/usePlayers'
import { PlayerConditionDialog } from './PlayerConditionDialog'
import { PlayerCreateDialog } from './PlayerCreateDialog'
import { PlayerEditDialog } from './PlayerEditDialog'
import { PlayerFiltersForm } from './PlayerFiltersForm'
import { PlayerPurchaseDialog } from './PlayerPurchaseDialog'
import { buildPlayerColumns } from './playerColumns'

type PlayerDialog =
  { kind: 'create' } | { kind: 'buy' | 'edit' | 'condition' | 'delete'; player: Player }

const PLAYER_COUNT_LABEL = { one: 'jogador encontrado', other: 'jogadores encontrados' }

export function PlayersPage() {
  const players = usePlayers()
  const clubs = useClubs()
  const actions = usePlayerActions({
    onSaved: players.reload,
    onRemoved: players.reloadAfterRemoval,
  })
  const [dialog, setDialog] = useState<PlayerDialog>()
  const closeDialog = useCallback(() => setDialog(undefined), [])

  const clubsById = useMemo(
    () => new Map((clubs.data ?? []).map((club) => [club.id, club])),
    [clubs.data],
  )
  const columns = buildPlayerColumns({
    clubsById,
    onBuy: (player) => setDialog({ kind: 'buy', player }),
    onEdit: (player) => setDialog({ kind: 'edit', player }),
    onChangeCondition: (player) => setDialog({ kind: 'condition', player }),
    onDelete: (player) => setDialog({ kind: 'delete', player }),
  })
  const hasFilters = Object.values(players.filters).some((value) => value !== undefined)
  const meta = players.data?.meta

  function changeSort(value: string) {
    players.changeSort(PLAYER_SORTS.find((sort) => sort === value))
  }

  async function runAndClose(action: () => Promise<unknown>) {
    if (await action()) closeDialog()
  }

  function renderDialog() {
    if (!dialog) return null
    if (dialog.kind === 'create') {
      return (
        <PlayerCreateDialog
          isPending={actions.create.isPending}
          onCreate={actions.create.run}
          onClose={closeDialog}
        />
      )
    }
    const { player } = dialog
    if (dialog.kind === 'buy') {
      return (
        <PlayerPurchaseDialog
          player={player}
          clubs={clubs.data}
          clubsError={clubs.error}
          isPending={actions.buy.isPending}
          onBuy={(payload) => actions.buy.run(player.id, payload)}
          onClose={closeDialog}
        />
      )
    }
    if (dialog.kind === 'edit') {
      return (
        <PlayerEditDialog
          player={player}
          isPending={actions.update.isPending}
          onSave={(payload) => runAndClose(() => actions.update.run(player.id, payload))}
          onClose={closeDialog}
        />
      )
    }
    if (dialog.kind === 'condition') {
      return (
        <PlayerConditionDialog
          player={player}
          isPending={actions.changeCondition.isPending}
          onSave={(condition) =>
            runAndClose(() => actions.changeCondition.run(player.id, { condition }))
          }
          onClose={closeDialog}
        />
      )
    }
    return (
      <ConfirmDialog
        title="Excluir jogador"
        confirmLabel="Excluir"
        pendingLabel="Excluindo…"
        isPending={actions.remove.isPending}
        onConfirm={() => runAndClose(() => actions.remove.run(player))}
        onCancel={closeDialog}
      >
        <p>
          Excluir <strong>{player.name}</strong>? Esta ação não pode ser desfeita.
        </p>
      </ConfirmDialog>
    )
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Jogadores</h1>
        <Button onClick={() => setDialog({ kind: 'create' })}>Novo jogador</Button>
      </header>

      <PlayerFiltersForm
        clubs={clubs.data}
        clubsError={clubs.error}
        onApply={players.applyFilters}
      />

      <div className="toolbar">
        <SelectField
          label="Ordenar por"
          value={players.sort ?? ''}
          onChange={(event) => changeSort(event.target.value)}
        >
          <option value="">Padrão</option>
          {PLAYER_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {PLAYER_SORT_LABELS[sort]}
            </option>
          ))}
        </SelectField>
      </div>

      <DataTable
        caption="Jogadores"
        columns={columns}
        rows={players.data?.data}
        getRowKey={(player) => player.id}
        isLoading={players.isLoading}
        error={players.error}
        emptyMessage={
          hasFilters ? 'Nenhum jogador encontrado com esses filtros.' : 'Nenhum jogador cadastrado.'
        }
        onRetry={players.reload}
      />

      {meta && (
        <Pagination
          page={players.page}
          totalPages={meta.total_pages}
          totalItems={meta.total_items}
          itemLabel={PLAYER_COUNT_LABEL}
          disabled={players.isLoading}
          onPageChange={players.goToPage}
        />
      )}

      {renderDialog()}
    </section>
  )
}
